import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgChatRepository } from "lib/db/pg/repositories/chat-repository.pg";
import logger from "logger";

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Increment voice session count
    await pgChatRepository.incrementUserVoiceSessions(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Voice session end tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track session" },
      { status: 500 },
    );
  }
}
