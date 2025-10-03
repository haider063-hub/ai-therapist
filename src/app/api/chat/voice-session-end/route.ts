import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgChatRepository } from "lib/db/pg/repositories/chat-repository.pg";
import { moodTrackingService } from "lib/services/mood-tracking-service";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId, messages } = await request.json().catch(() => ({
      threadId: null,
      messages: null,
    }));

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
        .trackConversationMood(session.user.id, threadId, messages, "voice")
        .catch((err) => logger.error("Voice mood tracking failed:", err));
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
