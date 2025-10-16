import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgChatRepository } from "lib/db/pg/repositories/chat-repository.pg";
import { moodTrackingService } from "lib/services/mood-tracking-service";
import { creditService } from "lib/services/credit-service";
import { getCurrentUTCTime } from "lib/utils/timezone-utils";
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
      let creditRetryCount = 0;
      const maxCreditRetries = 3;
      const creditRetryDelay = 1000; // 1 second
      let creditDeductionSuccess = false;

      while (creditRetryCount < maxCreditRetries && !creditDeductionSuccess) {
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
          creditDeductionSuccess = true;
        } catch (creditError) {
          creditRetryCount++;

          if (creditRetryCount >= maxCreditRetries) {
            logger.error(
              "Failed to deduct voice session credits after retries:",
              creditError,
            );
            return NextResponse.json(
              { error: "Insufficient credits" },
              { status: 402 },
            );
          }

          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, creditRetryDelay * creditRetryCount),
          );
        }
      }
    }

    // Increment voice session count with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    while (retryCount < maxRetries) {
      try {
        await pgChatRepository.incrementUserVoiceSessions(session.user.id);
        break; // Success, exit retry loop
      } catch (error: any) {
        retryCount++;

        if (retryCount >= maxRetries) {
          console.error(
            `❌ Failed to increment voice session count after ${maxRetries} attempts:`,
            error,
          );
          // Don't throw - this shouldn't break the main flow
          break;
        }

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * retryCount),
        );
      }
    }

    // Track mood from voice conversation (non-blocking)
    if (
      threadId &&
      messages &&
      Array.isArray(messages) &&
      messages.length > 0
    ) {
      // Use EXACT same UTC method as chat messages for consistency
      const utcTimestamp = getCurrentUTCTime(); // Same as chat messages
      const actualSessionEndTime = new Date(utcTimestamp);

      // Track mood with better error handling
      try {
        console.log(
          "🔍 [DEBUG] Tracking voice conversation mood - Thread:",
          threadId,
          "Time:",
          actualSessionEndTime.toISOString(),
        );

        await moodTrackingService.trackConversationMood(
          session.user.id,
          threadId,
          messages,
          "voice",
          actualSessionEndTime,
        );

        console.log("🔍 [DEBUG] Voice conversation mood tracking completed");
      } catch (err) {
        console.error("❌ Voice mood tracking failed:", err);
        logger.error("Voice mood tracking failed:", err);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in voice session end:", error);
    logger.error("Voice session end tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track session" },
      { status: 500 },
    );
  }
}
