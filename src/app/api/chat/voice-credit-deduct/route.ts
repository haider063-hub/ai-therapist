import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { creditService } from "lib/services/credit-service";
import { pgChatRepository } from "lib/db/pg/repositories/chat-repository.pg";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = await request.json();

    // SECURITY: Validate that the session is still active
    if (threadId) {
      try {
        const thread = await pgChatRepository.selectThread(threadId);
        if (!thread) {
          logger.warn(`Credit deduction blocked: Thread ${threadId} not found`);
          return NextResponse.json(
            { error: "Session not found or expired" },
            { status: 404 },
          );
        }

        // Check if thread belongs to the current user
        if (thread.userId !== session.user.id) {
          logger.warn(
            `Credit deduction blocked: Thread ${threadId} belongs to different user`,
          );
          return NextResponse.json(
            { error: "Unauthorized session access" },
            { status: 403 },
          );
        }
      } catch (error) {
        logger.error("Session validation error:", error);
        return NextResponse.json(
          { error: "Session validation failed" },
          { status: 500 },
        );
      }
    }

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
