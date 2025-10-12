"use server";

import {
  generateObject,
  generateText,
  LanguageModel,
  type UIMessage,
} from "ai";

import { CREATE_THREAD_TITLE_PROMPT } from "lib/ai/prompts";

import type { ChatModel, ChatThread, ChatMessage } from "app-types/chat";

import { chatRepository } from "lib/db/repository";
import { customModelProvider } from "lib/ai/models";
import { toAny } from "lib/utils";
import { getSession } from "auth/server";
import logger from "logger";

import { JSONSchema7 } from "json-schema";
import { ObjectJsonSchema7 } from "app-types/util";
import { jsonSchemaToZod } from "lib/json-schema-to-zod";

export async function getUserId() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User not found");
  }
  return userId;
}

export async function generateTitleFromUserMessageAction({
  message,
  model,
}: { message: UIMessage; model: LanguageModel }) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const prompt = toAny(message.parts?.at(-1))?.text || "unknown";

  const { text: title } = await generateText({
    model,
    system: CREATE_THREAD_TITLE_PROMPT,
    prompt,
  });

  return title.trim();
}

export async function selectThreadWithMessagesAction(threadId: string) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const thread = await chatRepository.selectThread(threadId);

    if (!thread) {
      logger.error("Thread not found", threadId);
      return null;
    }
    if (thread.userId !== session?.user.id) {
      return null;
    }

    const messages = await chatRepository.selectMessagesByThreadId(threadId);

    return { ...thread, messages: messages ?? [] };
  } catch (error) {
    logger.error("Error in selectThreadWithMessagesAction:", error);
    console.error("selectThreadWithMessagesAction error:", error);
    throw error; // Re-throw to see the actual error
  }
}

export async function deleteMessageAction(messageId: string) {
  await chatRepository.deleteChatMessage(messageId);
}

/**
 * Check if user has any previous conversation history (both chat and voice)
 * Returns null if new user, or last messages if returning user
 * @param currentThreadId - The current thread ID to exclude from history check
 */
export async function checkUserHistoryAction(
  currentThreadId?: string,
): Promise<{
  isReturningUser: boolean;
  lastMessages?: string[];
  lastSessionType?: "chat" | "voice";
} | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  try {
    // Get all user threads (chat conversations)
    const allThreads = await chatRepository.selectThreadsByUserId(
      session.user.id,
    );

    // Filter to find previous chat threads with actual messages
    const previousChatThreadsWithMessages: Array<{
      thread: ChatThread & { lastMessageAt: number };
      messages: ChatMessage[];
      sessionType: "chat";
    }> = [];

    for (const thread of allThreads) {
      // Skip current thread
      if (currentThreadId && thread.id === currentThreadId) {
        continue;
      }

      // Check if thread actually has messages by fetching them
      const messages = await chatRepository.selectMessagesByThreadId(thread.id);
      const userMessages = messages.filter(
        (m) => m.role === "user" || m.role === "assistant",
      );

      if (userMessages.length > 0) {
        previousChatThreadsWithMessages.push({
          thread,
          messages: userMessages,
          sessionType: "chat",
        });
      }
    }

    // Get voice conversation history from mood tracking
    const voiceConversations =
      await chatRepository.selectVoiceConversationsByUserId(session.user.id);

    // Combine chat and voice conversations
    const allConversations: Array<{
      thread: ChatThread & { lastMessageAt: number };
      messages: ChatMessage[];
      sessionType: "chat" | "voice";
      lastMessageTime: number;
    }> = [];

    // Add chat conversations
    for (const chatConv of previousChatThreadsWithMessages) {
      // If lastMessageAt is 0 (Unix epoch), calculate from actual messages
      let lastMessageTime = chatConv.thread.lastMessageAt;
      if (lastMessageTime === 0 && chatConv.messages.length > 0) {
        // Get the actual latest message timestamp
        const sortedMessages = [...chatConv.messages].sort(
          (a, b) =>
            (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0),
        );
        lastMessageTime = sortedMessages[0]?.createdAt?.getTime() || 0;
      }

      allConversations.push({
        ...chatConv,
        lastMessageTime: lastMessageTime,
      });
    }

    // Add voice conversations (they don't have individual messages, use mood tracking data)
    for (const voiceConv of voiceConversations) {
      // For voice conversations, we don't have individual messages stored
      // Instead, we use the mood tracking notes as a proxy for conversation content
      const mockMessages: ChatMessage[] = [];

      if (voiceConv.notes) {
        // Create a mock user message from the mood tracking notes
        mockMessages.push({
          id: `voice-${voiceConv.threadId}`,
          threadId: voiceConv.threadId,
          role: "user",
          parts: [
            {
              type: "text",
              text: voiceConv.notes.substring(0, 100) + "...", // Truncate for context
            },
          ],
          createdAt: new Date(voiceConv.lastMessageTime),
          updatedAt: new Date(voiceConv.lastMessageTime),
          metadata: {},
        } as ChatMessage);
      }

      allConversations.push({
        thread: {
          id: voiceConv.threadId,
          lastMessageAt: voiceConv.lastMessageTime,
        } as ChatThread & { lastMessageAt: number },
        messages: mockMessages,
        sessionType: "voice",
        lastMessageTime: voiceConv.lastMessageTime,
      });
    }

    if (allConversations.length === 0) {
      return { isReturningUser: false };
    }

    // Sort by most recent message across both chat and voice
    allConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    const mostRecentConversation = allConversations[0];

    // Get last 2-3 user messages for better context
    const userMessages = mostRecentConversation.messages
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => {
        const textPart = m.parts.find((p) => p.type === "text");
        return textPart ? (textPart as any).text : "";
      })
      .filter((text) => text.length > 0);

    return {
      isReturningUser: userMessages.length > 0,
      lastMessages: userMessages,
      lastSessionType: mostRecentConversation.sessionType,
    };
  } catch (error) {
    logger.error("Error checking user history:", error);
    return null;
  }
}

/**
 * Generate a personalized greeting for returning users (chat message)
 */
export async function generateReturningUserGreetingAction(
  lastMessages: string[],
  modelId: ChatModel,
): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Get the model instance on the server side
  const model = customModelProvider.getModel(modelId);

  const systemPrompt = `You are Econest, a professional AI therapist.
Generate a warm, empathetic greeting for a returning user.
Reference their last conversation topic in a natural way, without repeating their words verbatim.
Keep the tone supportive and professional.
The greeting should be 1-2 sentences maximum.

COMMUNICATION STYLE:
- Keep responses SHORT and SIMPLE - never give long ChatGPT-style responses
- Ask brief, direct questions to understand the user's main issue
- Start with small, friendly questions like a real therapist would
- Gradually move toward identifying the main problem through conversation
- Stay conversational and natural - make it feel like a real human therapy session
- Avoid lengthy explanations or overly detailed responses

Examples:
- "Welcome back. Last time we were talking about your sleep patterns. How have things been since then?"
- "It's nice to see you again. We left off discussing your stress at work. How are you feeling about that today?"
- "Hello again. I remember you mentioned feeling anxious about your upcoming presentation. How did that go?"`;

  const context =
    lastMessages.length > 0
      ? `Last conversation topics:\n${lastMessages.map((msg, i) => `${i + 1}. ${msg}`).join("\n")}`
      : "No specific topics from last conversation";

  const { text: greeting } = await generateText({
    model,
    system: systemPrompt,
    prompt: context,
  });

  return greeting.trim();
}

/**
 * Generate dynamic header greeting for new users (true first-time users)
 */
export async function generateNewUserHeaderGreetingAction(): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Use default OpenAI model for header greetings
  const model = customModelProvider.getModel({
    provider: "openai",
    model: "gpt-4o",
  });

  const systemPrompt = `You are Econest, a professional AI therapist.
Generate a warm, empathetic first-time greeting that introduces yourself and invites the user to share.
Keep it natural, supportive, and professional.
CRITICAL: Keep the greeting concise - ideally 1 line, maximum 2 lines if needed.
Vary the phrasing slightly each time to avoid repetition.

COMMUNICATION STYLE:
- Keep responses SHORT and SIMPLE - never give long ChatGPT-style responses
- Ask brief, direct questions to understand the user's main issue
- Start with small, friendly questions like a real therapist would
- Gradually move toward identifying the main problem through conversation
- Stay conversational and natural - make it feel like a real human therapy session
- Avoid lengthy explanations or overly detailed responses

Examples:
- "Hello, I'm Econest, your AI therapist. How are you feeling today?"
- "Welcome, I'm Econest, here to support you. What's on your mind?"
- "Hi, I'm Econest. I'm here to listen and help you work through what you're feeling. How can I support you today?"`;

  const { text: greeting } = await generateText({
    model,
    system: systemPrompt,
    prompt: "Generate a welcoming first-time greeting (concise, 1-2 lines).",
  });

  return greeting.trim();
}

/**
 * Validate that the greeting actually references the last conversation
 */
function validateGreetingReferencesLastChat(
  greeting: string,
  lastMessages: string[],
): boolean {
  if (lastMessages.length === 0) return true; // No context to check

  const greetingLower = greeting.toLowerCase();

  // Check if greeting mentions common therapeutic references
  const hasReference =
    greetingLower.includes("last time") ||
    greetingLower.includes("we discussed") ||
    greetingLower.includes("we talked") ||
    greetingLower.includes("you mentioned") ||
    greetingLower.includes("you shared") ||
    greetingLower.includes("you told me") ||
    greetingLower.includes("we explored");

  return hasReference;
}

/**
 * Generate dynamic header greeting with mandatory last conversation reference
 */
export async function generateReturningUserHeaderGreetingAction(
  lastMessages: string[],
  lastSessionType?: "chat" | "voice",
): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Use default OpenAI model for header greetings
  const model = customModelProvider.getModel({
    provider: "openai",
    model: "gpt-4o",
  });

  if (lastMessages.length === 0) {
    // No previous conversation context - treat as new user
    return generateNewUserHeaderGreetingAction();
  }

  const sessionTypeContext =
    lastSessionType === "voice"
      ? "Their last conversation was via voice therapy"
      : "Their last conversation was via text chat";

  const systemPrompt = `You are Econest, a professional AI therapist.
Generate a warm, empathetic greeting for a returning user.

CRITICAL REQUIREMENTS:
1. ALWAYS reference their last conversation naturally and specifically
2. Keep it SHORT - maximum 1.5 lines (around 15-20 words)
3. Be concise but specific about what they discussed
4. MUST use phrases like "last time", "we discussed", "you shared", "you mentioned"
5. Keep tone warm, supportive, and professional
6. DO NOT be vague - reference the actual topic briefly
7. ${sessionTypeContext}

COMMUNICATION STYLE:
- Keep responses SHORT and SIMPLE - never give long ChatGPT-style responses
- Ask brief, direct questions to understand the user's main issue
- Start with small, friendly questions like a real therapist would
- Gradually move toward identifying the main problem through conversation
- Stay conversational and natural - make it feel like a real human therapy session
- Avoid lengthy explanations or overly detailed responses

Examples (note the brevity):
- "Welcome back. Last time you shared about your country losing the match. How are you feeling?"
- "It's good to see you again. Last time we discussed your sleep concerns. How have things been?"
- "Hello again. You mentioned feeling anxious about work. How are you doing?"`;

  const context = `User's last conversation message(s):\n${lastMessages.map((msg, i) => `Message ${i + 1}: ${msg}`).join("\n\n")}\n\nIMPORTANT: Generate a SHORT greeting (max 1.5 lines, around 15-20 words) that references what they discussed above. Be specific but concise.`;

  let greeting = "";
  let attempts = 0;
  const maxAttempts = 3;

  // Try up to 3 times to get a greeting that properly references the last chat
  while (attempts < maxAttempts) {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt:
        attempts === 0
          ? context
          : `${context}\n\nPREVIOUS ATTEMPT FAILED - it did not reference the last conversation. Please generate a new greeting that MUST include a reference to what the user discussed last time (mentioned in the context above).`,
    });

    greeting = text.trim();

    // Validate that the greeting references the last conversation
    if (validateGreetingReferencesLastChat(greeting, lastMessages)) {
      break;
    }

    attempts++;
  }

  // If validation still fails after retries, use a template-based fallback
  if (
    !validateGreetingReferencesLastChat(greeting, lastMessages) &&
    lastMessages.length > 0
  ) {
    const lastTopic = lastMessages[0].slice(0, 80); // Get first 80 chars
    greeting = `Welcome back. Last time you shared about ${lastTopic}. How are you feeling today?`;
  }

  return greeting;
}

export async function deleteThreadAction(threadId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // First verify the user owns this thread
  const thread = await chatRepository.selectThread(threadId);
  if (!thread) {
    return;
  }

  if (thread.userId !== session.user.id) {
    throw new Error("Unauthorized to delete this thread");
  }

  await chatRepository.deleteThread(threadId);
}

export async function deleteMessagesByChatIdAfterTimestampAction(
  messageId: string,
) {
  "use server";
  await chatRepository.deleteMessagesByChatIdAfterTimestamp(messageId);
}

export async function updateThreadAction(
  id: string,
  thread: Partial<Omit<ChatThread, "createdAt" | "updatedAt" | "userId">>,
) {
  const userId = await getUserId();
  await chatRepository.updateThread(id, { ...thread, userId });
}

export async function deleteThreadsAction() {
  const userId = await getUserId();
  await chatRepository.deleteAllThreads(userId);
}

export async function deleteUnarchivedThreadsAction() {
  const userId = await getUserId();
  await chatRepository.deleteUnarchivedThreads(userId);
}

export async function generateObjectAction({
  model,
  prompt,
  schema,
}: {
  model?: ChatModel;
  prompt: {
    system?: string;
    user?: string;
  };
  schema: JSONSchema7 | ObjectJsonSchema7;
}) {
  const result = await generateObject({
    model: customModelProvider.getModel(model),
    system: prompt.system,
    prompt: prompt.user || "",
    schema: jsonSchemaToZod(schema),
  });
  return result.object;
}
