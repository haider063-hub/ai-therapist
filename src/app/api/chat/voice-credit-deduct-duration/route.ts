import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { creditService } from "lib/services/credit-service";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId, userAudioDuration, botAudioDuration } =
      await request.json();

    // Validate required parameters
    if (
      typeof userAudioDuration !== "number" ||
      typeof botAudioDuration !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "userAudioDuration and botAudioDuration are required and must be numbers",
        },
        { status: 400 },
      );
    }

    // Deduct credits based on actual audio duration
    const result = await creditService.deductVoiceCreditsByDuration(
      session.user.id,
      userAudioDuration,
      botAudioDuration,
      threadId,
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.reason,
          insufficientCredits: true,
        },
        { status: 402 },
      );
    }

    // Dispatch event to update UI credits
    return NextResponse.json({
      success: true,
      remainingCredits: result.remainingCredits,
      creditsUsed: result.creditsUsed,
      minutesUsed: result.minutesUsed,
    });
  } catch (error) {
    logger.error("Voice credit deduction by duration error:", error);
    return NextResponse.json(
      { error: "Failed to deduct credits" },
      { status: 500 },
    );
  }
}
