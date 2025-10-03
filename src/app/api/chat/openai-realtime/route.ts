import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { mergeSystemPrompt } from "../shared.chat";
import { buildSpeechSystemPrompt } from "lib/ai/prompts";
import {
  checkUserHistoryAction,
  generateNewUserHeaderGreetingAction,
  generateReturningUserHeaderGreetingAction,
} from "../actions";

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

    // Generate greeting based on user history
    let greeting =
      "Hello, I'm Econest, your AI therapist. How are you feeling today?";
    let historyContext = "";

    try {
      const historyResult = await checkUserHistoryAction(currentThreadId);

      if (
        historyResult &&
        historyResult.isReturningUser &&
        historyResult.lastMessages &&
        historyResult.lastMessages.length > 0
      ) {
        // Returning user - generate personalized greeting
        greeting = await generateReturningUserHeaderGreetingAction(
          historyResult.lastMessages,
        );
        // Add history context to system prompt for voice chat
        historyContext = `\n\nPREVIOUS CONVERSATION CONTEXT: The user previously discussed: ${historyResult.lastMessages.join(", ")}. Reference this context when appropriate to maintain conversation continuity.`;
      } else {
        // New user - generate first-time greeting
        greeting = await generateNewUserHeaderGreetingAction();
      }
    } catch (error) {
      logger.error(`Voice session greeting error:`, error);
      // Use fallback greeting on error
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
