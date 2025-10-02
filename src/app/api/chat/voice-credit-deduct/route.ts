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

    const { threadId } = await request.json();

    // Deduct credits for this voice message exchange
    const result = await creditService.deductCreditsForUsage(
      session.user.id,
      "voice",
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
    });
  } catch (error) {
    logger.error("Voice credit deduction error:", error);
    return NextResponse.json(
      { error: "Failed to deduct credits" },
      { status: 500 },
    );
  }
}
