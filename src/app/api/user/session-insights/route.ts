import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgDb } from "lib/db/pg/db.pg";
import {
  ChatThreadSchema,
  ChatMessageSchema,
  MoodTrackingSchema,
} from "lib/db/pg/schema.pg";
import { sql, eq, desc } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "🔍 [DEBUG] Fetching session insights for user:",
      session.user.id,
    );

    // Get last chat session - find the most recent message across all user's threads
    // Exclude any threads that have voice session mood tracking data
    const lastChatSession = await pgDb
      .select({
        threadId: ChatMessageSchema.threadId,
        lastMessageAt: ChatMessageSchema.createdAt,
      })
      .from(ChatMessageSchema)
      .innerJoin(
        ChatThreadSchema,
        eq(ChatMessageSchema.threadId, ChatThreadSchema.id),
      )
      .leftJoin(
        MoodTrackingSchema,
        sql`${ChatMessageSchema.threadId} = ${MoodTrackingSchema.threadId} AND ${MoodTrackingSchema.sessionType} = 'voice'`,
      )
      .where(
        sql`${ChatThreadSchema.userId} = ${session.user.id} AND ${MoodTrackingSchema.threadId} IS NULL`,
      )
      .orderBy(desc(ChatMessageSchema.createdAt))
      .limit(1);

    // Get last voice session from mood tracking
    const lastVoiceSession = await pgDb
      .select({
        threadId: MoodTrackingSchema.threadId,
        createdAt: MoodTrackingSchema.createdAt,
        moodScore: MoodTrackingSchema.moodScore,
      })
      .from(MoodTrackingSchema)
      .where(
        sql`${MoodTrackingSchema.userId} = ${session.user.id} AND ${MoodTrackingSchema.sessionType} = 'voice' AND ${MoodTrackingSchema.threadId} IS NOT NULL`,
      )
      .orderBy(desc(MoodTrackingSchema.createdAt))
      .limit(1);

    console.log("🔍 [DEBUG] Last chat session query result:", lastChatSession);
    console.log(
      "🔍 [DEBUG] Last voice session query result:",
      lastVoiceSession,
    );

    // Voice sessions should only come from mood tracking data
    // No fallback needed since voice sessions are tracked differently
    console.log(
      "🔍 [DEBUG] Voice session fallback not needed - voice sessions only tracked via mood tracking",
    );

    // Helper function to format time ago
    const formatTimeAgo = (date: Date | null): string => {
      if (!date) return "Never";

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffDays > 0) {
        return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
      } else if (diffHours > 0) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
      } else if (diffMinutes > 0) {
        return diffMinutes === 1
          ? "1 minute ago"
          : `${diffMinutes} minutes ago`;
      } else {
        return "Just now";
      }
    };

    const insights = {
      lastChatSession: formatTimeAgo(
        lastChatSession.length > 0 ? lastChatSession[0].lastMessageAt : null,
      ),
      lastVoiceSession: formatTimeAgo(
        lastVoiceSession.length > 0 ? lastVoiceSession[0].createdAt : null,
      ),
      mostActiveDay: "Tuesday", // TODO: Calculate from actual data
      averageSessionDuration: 18, // TODO: Calculate from actual data
    };

    console.log("🔍 [DEBUG] Session insights:", insights);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("❌ Error fetching session insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch session insights", details: error },
      { status: 500 },
    );
  }
}
