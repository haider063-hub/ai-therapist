import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgChatRepository } from "lib/db/pg/repositories/chat-repository.pg";
import { moodTrackingService } from "lib/services/mood-tracking-service";
import { creditService } from "lib/services/credit-service";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      requestBody = {
        threadId: null,
        messages: null,
        userAudioDuration: 0,
        botAudioDuration: 0,
      };
    }

    const { threadId, messages, userAudioDuration, botAudioDuration } =
      requestBody;

    // Deduct credits based on actual audio duration if provided
    if (userAudioDuration > 0 || botAudioDuration > 0) {
      try {
        const result = await creditService.deductVoiceCreditsByDuration(
          session.user.id,
          userAudioDuration || 0,
          botAudioDuration || 0,
          threadId,
        );

        if (!result.success) {
          logger.error(
            "Failed to deduct voice session credits:",
            result.reason,
          );
          return NextResponse.json({ error: result.reason }, { status: 402 });
        }

        logger.info(
          `Voice session credits deducted: ${result.creditsUsed} credits for ${result.minutesUsed} minutes`,
        );
      } catch (creditError) {
        logger.error("Failed to deduct voice session credits:", creditError);
        return NextResponse.json(
          { error: "Insufficient credits" },
          { status: 402 },
        );
      }
    }

    // Increment voice session count
    await pgChatRepository.incrementUserVoiceSessions(session.user.id);

    // Track mood from voice conversation (non-blocking)
    if (
      threadId &&
      messages &&
      Array.isArray(messages) &&
      messages.length > 0
    ) {
      moodTrackingService
        .trackConversationMood(
          session.user.id,
          threadId,
          messages,
          "voice",
          new Date(),
        )
        .catch((err) => {
          logger.error("Voice mood tracking failed:", err);
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Voice session end tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track session" },
      { status: 500 },
    );
  }
}
