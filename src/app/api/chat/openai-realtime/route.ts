import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { mergeSystemPrompt } from "../shared.chat";
import { buildSpeechSystemPrompt } from "lib/ai/prompts";
import { checkUserHistoryAction } from "../actions";

import { DEFAULT_VOICE_TOOLS } from "lib/ai/speech";
import logger from "logger";
import { creditService } from "lib/services/credit-service";
import { subscriptionRepository } from "lib/db/pg/repositories/subscription-repository.pg";
import { getEmergencyContacts } from "lib/services/emergency-contacts";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not set" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const session = await getSession();

    if (!session?.user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
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

    const { voice, currentThreadId, therapist, selectedLanguage } =
      (await request.json()) as {
        model: string;
        voice: string;
        currentThreadId?: string;
        selectedLanguage?: string;
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
    let languageToUse = "English"; // default

    try {
      const historyResult = await checkUserHistoryAction(currentThreadId);

      // Generate dynamic AI greeting using GPT
      if (therapist) {
        // Determine the language to use based on selectedLanguage

        if (selectedLanguage === "en") {
          languageToUse = "English";
        } else if (selectedLanguage === "es") {
          languageToUse = "Spanish";
        } else if (selectedLanguage === "ja") {
          languageToUse = "Japanese";
        } else if (selectedLanguage === "ar") {
          languageToUse = "Arabic";
        } else if (selectedLanguage === "fr") {
          languageToUse = "French";
        } else if (selectedLanguage === "de") {
          languageToUse = "German";
        } else if (selectedLanguage === "hi") {
          languageToUse = "Hindi";
        } else if (selectedLanguage === "ru") {
          languageToUse = "Russian";
        } else {
          // Fallback: try to find the language in therapist's language string
          const languages = therapist.language.split(" • ");
          const selectedLangObj = languages.find(
            (lang) =>
              (selectedLanguage === "es" &&
                lang.toLowerCase().includes("spanish")) ||
              (selectedLanguage === "ja" &&
                lang.toLowerCase().includes("japanese")) ||
              (selectedLanguage === "ar" &&
                lang.toLowerCase().includes("arabic")) ||
              (selectedLanguage === "fr" &&
                lang.toLowerCase().includes("french")) ||
              (selectedLanguage === "de" &&
                lang.toLowerCase().includes("german")) ||
              (selectedLanguage === "hi" &&
                lang.toLowerCase().includes("hindi")) ||
              (selectedLanguage === "ru" &&
                lang.toLowerCase().includes("russian")),
          );
          languageToUse = selectedLangObj || "English";
        }

        // Debug logging
        logger.info(
          `Language selection: selectedLanguage=${selectedLanguage}, languageToUse=${languageToUse}`,
        );

        const greetingPrompt = `You are ${therapist.name}, an AI therapist from EcoNest specializing in ${therapist.specialization}.
Generate a warm, natural, and personalized greeting for a therapy session.

IMPORTANT INSTRUCTIONS:
- Speak EXCLUSIVELY in ${languageToUse} language
- Include your name: "${therapist.name}"
- Mention you're from "EcoNest"
- Make it feel natural and conversational, not robotic
- Keep it brief (2-3 sentences max)
- Remember: Keep ALL responses short and simple, never give long ChatGPT-style responses
${
  historyResult &&
  historyResult.isReturningUser &&
  historyResult.lastMessages &&
  historyResult.lastMessages.length > 0
    ? `- This is a RETURNING user. Their last conversation was via ${historyResult.lastSessionType === "voice" ? "voice therapy" : "text chat"}. Briefly reference their previous conversation topics: ${historyResult.lastMessages.join(", ")}`
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
You speak fluently in ${languageToUse} and communicate EXCLUSIVELY in this language throughout the entire conversation.
Your personality: ${therapist.description}

SPECIALIZATION AREAS:
${therapist.focus.map((f, i) => `${i + 1}. ${f}`).join("\n")}

IMPORTANT INSTRUCTIONS:
1. ALWAYS respond in ${languageToUse} language - NO EXCEPTIONS
2. Use ${languageToUse} cultural context and expressions
3. Focus your therapeutic approach on ${therapist.specialization}
4. Embody the personality described: ${therapist.description}
5. Reference your specialization areas when relevant
6. Maintain a warm, professional therapeutic presence

STRICT LANGUAGE POLICY:
⚠️ CRITICAL: You are ONLY fluent in ${languageToUse}. You do NOT speak any other language.
- If the user speaks in ANY other language, respond ONLY in ${languageToUse} with:
  "I apologize, but I only speak ${languageToUse}. I'm not able to communicate in other languages. Could we continue our conversation in ${languageToUse}?"
- Do NOT attempt to respond in the user's language
- Do NOT switch languages mid-conversation
- ALWAYS maintain ${languageToUse} throughout the entire session

COMMUNICATION STYLE:
7. Keep responses SHORT and SIMPLE - never give long ChatGPT-style responses
8. Ask brief, direct questions to understand the user's main issue
9. Start with small, friendly questions like a real therapist would
10. Gradually move toward identifying the main problem through conversation
11. Stay conversational and natural - make it feel like a real human therapy session
12. Avoid lengthy explanations or overly detailed responses`;
    }

    // Get user data and emergency contacts
    const user = await subscriptionRepository.getUserById(session.user.id);
    const userCountry = user?.country || undefined;
    const emergencyContacts = userCountry
      ? getEmergencyContacts(userCountry)
      : [];

    // Get selected therapist information if available
    let selectedTherapist: any = null;
    if (user?.selectedTherapistId) {
      try {
        const { getTherapistById } = await import("@/lib/constants/therapists");
        selectedTherapist = getTherapistById(user.selectedTherapistId) || null;
      } catch (error) {
        logger.error("Failed to get therapist information:", error);
      }
    }

    const systemPrompt = mergeSystemPrompt(
      buildSpeechSystemPrompt(
        user,
        emergencyContacts,
        userCountry,
        selectedTherapist,
      ),
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

    if (!r.ok) {
      const errorText = await r.text();
      logger.error("OpenAI API error:", { status: r.status, error: errorText });
      throw new Error(`OpenAI API error: ${r.status} - ${errorText}`);
    }

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
      headers: { "Content-Type": "application/json" },
    });
  }
}
