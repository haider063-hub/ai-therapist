import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";

import { customModelProvider, isToolCallUnsupportedModel } from "lib/ai/models";

import { chatRepository } from "lib/db/repository";
import globalLogger from "logger";
import {
  buildUserSystemPrompt,
  buildToolCallUnsupportedModelSystemPrompt,
} from "lib/ai/prompts";
import { chatApiSchemaRequestBodySchema, ChatMetadata } from "app-types/chat";

import { errorIf, safe } from "ts-safe";

import {
  excludeToolExecution,
  handleError,
  manualToolExecuteByLastMessage,
  mergeSystemPrompt,
  extractInProgressToolPart,
  loadAppDefaultTools,
  convertToSavePart,
} from "./shared.chat";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { generateUUID } from "lib/utils";
import { creditService } from "lib/services/credit-service";
import { moodTrackingService } from "lib/services/mood-tracking-service";
import { checkUserHistoryAction } from "./actions";
import { subscriptionRepository } from "lib/db/pg/repositories/subscription-repository.pg";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Chat API: `),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check if user can use chat feature
    const creditCheck = await creditService.canUseFeature(
      session.user.id,
      "chat",
    );
    if (!creditCheck.canUse) {
      return new Response(
        JSON.stringify({
          error: "Insufficient credits or subscription limits reached",
          reason: creditCheck.reason,
          creditsNeeded: creditCheck.creditsNeeded,
        }),
        {
          status: 402, // Payment Required
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const {
      id,
      message,
      chatModel,
      toolChoice,
      allowedAppDefaultToolkit,
      mentions = [],
    } = chatApiSchemaRequestBodySchema.parse(json);

    // Deduct credits BEFORE starting the chat response
    try {
      const deductionResult = await creditService.deductCreditsForUsage(
        session.user.id,
        "chat",
        id, // Use the thread ID
      );
      if (!deductionResult.success) {
        logger.error(`Failed to deduct credits: ${deductionResult.reason}`);
        return new Response(
          JSON.stringify({
            error: "Credit deduction failed",
            reason: deductionResult.reason,
          }),
          {
            status: 402, // Payment Required
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      logger.info(
        `✅ Credits deducted successfully. Remaining: ${deductionResult.remainingCredits}`,
      );
    } catch (error) {
      logger.error("Failed to deduct credits:", error);
      return new Response(
        JSON.stringify({
          error: "Credit deduction failed",
          reason: "Internal server error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if message contains images
    const hasImages = message.parts?.some((part: any) => part.type === "image");
    let actualChatModel = chatModel;

    if (hasImages) {
      logger.info("Message contains images, checking upload permission");
      logger.info(
        `Image parts found: ${message.parts?.filter((part: any) => part.type === "image").length}`,
      );

      // Check if user can upload images
      const uploadCheck = await subscriptionRepository.canUploadImage(
        session.user.id,
      );

      if (!uploadCheck.canUpload) {
        return new Response(
          JSON.stringify({
            error: "Image upload not allowed",
            reason: uploadCheck.reason,
            imagesUsed: uploadCheck.imagesUsed,
            imagesRemaining: uploadCheck.imagesRemaining,
          }),
          {
            status: 403, // Forbidden
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Switch to GPT-4 Vision model for image processing
      actualChatModel = {
        provider: "openai",
        model: "gpt-4o", // gpt-4o supports vision
      };

      logger.info(
        `Switching to vision model: ${actualChatModel.provider}/${actualChatModel.model}`,
      );
      logger.info("Image will be analyzed by GPT-4 Vision model");
    }

    const model = customModelProvider.getModel(actualChatModel);

    let thread = await chatRepository.selectThreadDetails(id);

    if (!thread) {
      logger.info(`create chat thread: ${id}`);
      const newThread = await chatRepository.insertThread({
        id,
        title: "",
        userId: session.user.id,
      });
      thread = await chatRepository.selectThreadDetails(newThread.id);

      // Increment chat session count
      await chatRepository.incrementUserChatSessions(session.user.id);
    }

    if (thread!.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // Check user history for continuity
    let historyContext = "";
    try {
      const historyResult = await checkUserHistoryAction(id);
      if (
        historyResult?.isReturningUser &&
        historyResult.lastMessages &&
        historyResult.lastMessages.length > 0
      ) {
        historyContext = `\n\nPREVIOUS CONVERSATION CONTEXT: The user previously discussed: ${historyResult.lastMessages.join(", ")}. Reference this context when appropriate to maintain conversation continuity.`;
      }
    } catch (error) {
      logger.error("Failed to check user history:", error);
    }

    const messages: UIMessage[] = (thread?.messages ?? []).map((m) => {
      return {
        id: m.id,
        role: m.role,
        parts: m.parts,
        metadata: m.metadata,
      };
    });

    if (messages.at(-1)?.id == message.id) {
      messages.pop();
    }
    messages.push(message);

    const supportToolCall = !isToolCallUnsupportedModel(model);

    const isToolCallAllowed =
      supportToolCall && (toolChoice != "none" || mentions.length > 0);

    const metadata: ChatMetadata = {
      toolChoice: toolChoice,
      toolCount: 0,
      chatModel: chatModel,
    };

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const APP_DEFAULT_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadAppDefaultTools({
              mentions,
              allowedAppDefaultToolkit,
            }),
          )
          .orElse({});
        const inProgressToolParts = extractInProgressToolPart(message);
        if (inProgressToolParts.length) {
          await Promise.all(
            inProgressToolParts.map(async (part) => {
              const output = await manualToolExecuteByLastMessage(
                part,
                { ...APP_DEFAULT_TOOLS },
                request.signal,
              );
              part.output = output;

              dataStream.write({
                type: "tool-output-available",
                toolCallId: part.toolCallId,
                output,
              });
            }),
          );
        }

        // Add image analysis instructions if message contains images
        let imageAnalysisPrompt = "";
        if (hasImages) {
          imageAnalysisPrompt = `

<image_analysis_instructions>
You are now analyzing an image that the user has uploaded. Please:
1. Carefully examine the image and describe what you see
2. If it's a photo, document, screenshot, or any visual content, provide a detailed analysis
3. If the user asks questions about the image, answer them based on what you can see
4. Be thorough and accurate in your visual analysis
5. If the image contains text, read and interpret it
6. If the image shows people, objects, or scenes, describe them in detail
7. Always acknowledge that you can see and analyze the image
</image_analysis_instructions>`;
        }

        const systemPrompt = mergeSystemPrompt(
          buildUserSystemPrompt(session.user),
          !supportToolCall && buildToolCallUnsupportedModelSystemPrompt(),
          historyContext, // Add previous conversation context
          imageAnalysisPrompt,
        );

        // Log system prompt info for debugging
        if (hasImages) {
          logger.info(
            `System prompt includes image analysis instructions: ${imageAnalysisPrompt.length > 0}`,
          );
          logger.info(
            `Total system prompt length: ${systemPrompt.length} characters`,
          );
        }

        const vercelAITooles = safe({ ...APP_DEFAULT_TOOLS })
          .map((t) => {
            const bindingTools =
              toolChoice === "manual" ||
              (message.metadata as ChatMetadata)?.toolChoice === "manual"
                ? excludeToolExecution(t)
                : t;
            return {
              ...bindingTools,
            };
          })
          .unwrap();
        metadata.toolCount = Object.keys(vercelAITooles).length;

        logger.info(`tool mode: ${toolChoice}, mentions: ${mentions.length}`);

        logger.info(
          `allowedAppDefaultToolkit: ${allowedAppDefaultToolkit?.length ?? 0}`,
        );
        logger.info(
          `binding tool count APP_DEFAULT: ${Object.keys(APP_DEFAULT_TOOLS ?? {}).length}`,
        );
        logger.info(
          `model: ${actualChatModel?.provider}/${actualChatModel?.model}`,
        );

        // Convert messages for vision model (AI SDK doesn't handle custom image parts)
        let convertedMessages;
        if (hasImages) {
          logger.info(
            "Converting messages with custom transformer for vision model",
          );
          convertedMessages = messages.map((msg, index) => {
            if (msg.role === "user" && msg.parts) {
              // Convert user message with image parts to vision model format
              const content = msg.parts.map((part: any) => {
                if (part.type === "image") {
                  // Vision model expects image in this format
                  return {
                    type: "image",
                    image: part.image, // Base64 image data
                  };
                } else if (part.type === "text") {
                  return {
                    type: "text",
                    text: part.text,
                  };
                }
                return part;
              });

              logger.info(`User message content parts: ${content.length}`);
              content.forEach((part: any, partIndex: number) => {
                logger.info(
                  `Part ${partIndex}: type=${part.type}, hasData=${!!part.image || !!part.text}`,
                );
              });

              return {
                role: msg.role,
                content: content,
              };
            } else {
              // For assistant messages, use standard text conversion
              return {
                role: msg.role,
                content: msg.parts?.map((part: any) => ({
                  type: "text",
                  text: part.text || "",
                })) || [{ type: "text", text: "" }],
              };
            }
          });

          logger.info(
            `Custom conversion complete. Total messages: ${convertedMessages.length}`,
          );
        } else {
          // Use standard conversion for non-vision messages
          convertedMessages = convertToModelMessages(messages);
        }

        const result = streamText({
          model,
          system: systemPrompt,
          messages: convertedMessages,
          experimental_transform: smoothStream({ chunking: "word" }),
          maxRetries: 2,
          tools: vercelAITooles,
          stopWhen: stepCountIs(10),
          toolChoice: "auto",
          abortSignal: request.signal,
        });
        result.consumeStream();
        dataStream.merge(
          result.toUIMessageStream({
            messageMetadata: ({ part }) => {
              if (part.type == "finish") {
                metadata.usage = part.totalUsage;
                return metadata;
              }
            },
          }),
        );
      },

      generateId: generateUUID,
      onFinish: async ({ responseMessage }) => {
        const convertedParts = responseMessage.parts.map(convertToSavePart);

        // Credits already deducted before streaming started
        logger.info("Chat response completed successfully");

        // Increment image usage counter if message contained images
        if (hasImages) {
          try {
            await subscriptionRepository.incrementImageUsage(session.user.id);
            logger.info("Incremented image usage counter for user");
          } catch (error) {
            logger.error("Failed to increment image usage:", error);
            // Don't block the response, just log the error
          }
        }

        if (responseMessage.id == message.id) {
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            ...responseMessage,
            parts: convertedParts,
            metadata,
          });
        } else {
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: message.role,
            parts: message.parts.map(convertToSavePart),
            id: message.id,
          });
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: responseMessage.role,
            id: responseMessage.id,
            parts: convertedParts,
            metadata,
          });
        }

        // Track mood from conversation (non-blocking)
        try {
          const conversationMessages = messages.map((m) => {
            const textPart = m.parts.find((p) => p.type === "text");
            return {
              role: m.role,
              content: textPart ? (textPart as any).text || "" : "",
            };
          });

          // Add the assistant's response
          const responseText = convertedParts
            .filter((p) => p.type === "text")
            .map((p) => (p as any).text || "")
            .join(" ");

          if (responseText) {
            conversationMessages.push({
              role: "assistant",
              content: responseText,
            });
          }

          moodTrackingService
            .trackConversationMood(
              session.user.id,
              thread!.id,
              conversationMessages,
              "chat",
            )
            .catch((err) => logger.error("Mood tracking failed:", err));
        } catch (error) {
          logger.error("Error preparing mood tracking:", error);
        }
      },
      onError: handleError,
      originalMessages: messages,
    });

    return createUIMessageStreamResponse({
      stream,
    });
  } catch (error: any) {
    logger.error(error);
    return Response.json({ message: error.message }, { status: 500 });
  }
}
