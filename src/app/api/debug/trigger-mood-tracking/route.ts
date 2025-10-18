import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgDb } from "lib/db/pg/db.pg";
import { ChatThreadSchema, ChatMessageSchema } from "lib/db/pg/schema.pg";
import { moodTrackingService } from "lib/services/mood-tracking-service";
import { eq } from "drizzle-orm";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = await request.json();

    console.log(
      "🔍 [DEBUG] Manually triggering mood tracking for thread:",
      threadId,
    );

    // Get the thread
    const thread = await pgDb
      .select()
      .from(ChatThreadSchema)
      .where(eq(ChatThreadSchema.id, threadId))
      .limit(1);

    if (thread.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Get all messages for this thread
    const messages = await pgDb
      .select()
      .from(ChatMessageSchema)
      .where(eq(ChatMessageSchema.threadId, threadId))
      .orderBy(ChatMessageSchema.createdAt);

    console.log("🔍 [DEBUG] Found messages:", messages.length);

    // Convert to mood tracking format
    const conversationMessages = messages
      .map((m) => {
        const textPart = m.parts?.find((p: any) => p.type === "text");
        return {
          role: m.role,
          content: textPart ? (textPart as any).text || "" : "",
        };
      })
      .filter((m) => m.content.trim().length > 0);

    console.log("🔍 [DEBUG] Converted messages:", conversationMessages);

    if (conversationMessages.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No valid messages found in thread",
      });
    }

    // Trigger mood tracking
    await moodTrackingService.trackConversationMood(
      session.user.id,
      threadId,
      conversationMessages,
      "chat",
      new Date(),
    );

    return NextResponse.json({
      success: true,
      message: "Mood tracking triggered successfully",
      threadId,
      messageCount: conversationMessages.length,
    });
  } catch (error) {
    console.error("❌ Error triggering mood tracking:", error);
    logger.error("Error triggering mood tracking:", error);
    return NextResponse.json(
      { error: "Failed to trigger mood tracking", details: error },
      { status: 500 },
    );
  }
}
