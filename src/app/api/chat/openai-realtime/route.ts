import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { mergeSystemPrompt } from "../shared.chat";
import { buildSpeechSystemPrompt } from "lib/ai/prompts";
import { checkUserHistoryAction } from "../actions";

import { DEFAULT_VOICE_TOOLS } from "lib/ai/speech";
import logger from "logger";
import { creditService } from "lib/services/credit-service";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not set" }),
        {
          status: 500,
        },
      );
    }

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check if user can use voice feature
    const creditCheck = await creditService.canUseFeature(
      session.user.id,
      "voice",
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

    const { voice, currentThreadId, therapist } = (await request.json()) as {
      model: string;
      voice: string;
      currentThreadId?: string;
      therapist?: {
        name: string;
        language: string;
        languageCode: string;
        specialization: string;
        focus: string[];
        description: string;
      };
    };

    // Generate AI-powered dynamic greeting
    let greeting = "Hello! How are you feeling today?";
    let historyContext = "";

    try {
      const historyResult = await checkUserHistoryAction(currentThreadId);

      // Generate dynamic AI greeting using GPT
      if (therapist) {
        const greetingPrompt = `You are ${therapist.name}, an AI therapist from EcoNest specializing in ${therapist.specialization}.
Generate a warm, natural, and personalized greeting for a therapy session.

IMPORTANT INSTRUCTIONS:
- Speak EXCLUSIVELY in ${therapist.language} language
- Include your name: "${therapist.name}"
- Mention you're from "EcoNest"
- Make it feel natural and conversational, not robotic
- Keep it brief (2-3 sentences max)
${
  historyResult &&
  historyResult.isReturningUser &&
  historyResult.lastMessages &&
  historyResult.lastMessages.length > 0
    ? `- This is a RETURNING user. Briefly reference their previous conversation topics: ${historyResult.lastMessages.join(", ")}`
    : "- This is a NEW user. Welcome them warmly"
}

Generate ONLY the greeting message, nothing else.`;

        try {
          const greetingResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful assistant that generates therapy session greetings.",
                  },
                  {
                    role: "user",
                    content: greetingPrompt,
                  },
                ],
                temperature: 0.8,
                max_tokens: 150,
              }),
            },
          );

          if (greetingResponse.ok) {
            const greetingData = await greetingResponse.json();
            greeting =
              greetingData.choices[0]?.message?.content?.trim() || greeting;
          }
        } catch (error) {
          logger.error(
            "Failed to generate AI greeting, using fallback:",
            error,
          );
          // Fallback to simple greeting with therapist name
          greeting = `Hello, I'm ${therapist.name} from EcoNest. How are you feeling today?`;
        }
      }

      // Add history context to system prompt for voice chat
      if (
        historyResult &&
        historyResult.isReturningUser &&
        historyResult.lastMessages &&
        historyResult.lastMessages.length > 0
      ) {
        historyContext = `\n\nPREVIOUS CONVERSATION CONTEXT: The user previously discussed: ${historyResult.lastMessages.join(", ")}. Reference this context when appropriate to maintain conversation continuity.`;
      }
    } catch (error) {
      logger.error(`Voice session greeting error:`, error);
      // Use fallback greeting on error
      if (therapist) {
        greeting = `Hello, I'm ${therapist.name} from EcoNest. How are you feeling today?`;
      }
    }

    // Build therapist-specific system prompt
    let therapistContext = "";
    if (therapist) {
      therapistContext = `

THERAPIST IDENTITY:
You are ${therapist.name}, an AI therapist specializing in ${therapist.specialization}.
You speak fluently in ${therapist.language} and communicate EXCLUSIVELY in this language throughout the entire conversation.
Your personality: ${therapist.description}

SPECIALIZATION AREAS:
${therapist.focus.map((f, i) => `${i + 1}. ${f}`).join("\n")}

IMPORTANT INSTRUCTIONS:
1. ALWAYS respond in ${therapist.language} language
2. Use ${therapist.language} cultural context and expressions
3. Focus your therapeutic approach on ${therapist.specialization}
4. Embody the personality described: ${therapist.description}
5. Reference your specialization areas when relevant
6. Maintain a warm, professional therapeutic presence`;
    }

    const systemPrompt = mergeSystemPrompt(
      buildSpeechSystemPrompt(session.user),
      historyContext, // Add history context to voice chat system prompt
      therapistContext, // Add therapist-specific context
    );

    const bindingTools = [...DEFAULT_VOICE_TOOLS];

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice: voice || "alloy",
        input_audio_transcription: {
          model: "whisper-1",
        },
        instructions: systemPrompt,
        tools: bindingTools,
      }),
    });

    const sessionData = await r.json();

    // Credits will be deducted per message exchange (not per session)
    // See: /api/chat/voice-credit-deduct

    // Add greeting to response
    return new Response(
      JSON.stringify({
        ...sessionData,
        greeting: greeting, // Include greeting in response
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
