import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgDb } from "lib/db/pg/db.pg";
import {
  ChatThreadSchema,
  ChatMessageSchema,
  MoodTrackingSchema,
} from "lib/db/pg/schema.pg";
import { sql, eq, desc, gte } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "🔍 [DEBUG] Comprehensive mood investigation for user:",
      session.user.id,
    );

    // Get recent chat threads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const recentThreads = await pgDb
      .select()
      .from(ChatThreadSchema)
      .where(
        sql`${ChatThreadSchema.userId} = ${session.user.id} AND ${ChatThreadSchema.createdAt} >= ${sevenDaysAgoStr}`,
      )
      .orderBy(desc(ChatThreadSchema.createdAt));

    console.log("🔍 [DEBUG] Recent chat threads:", recentThreads.length);

    // Get recent chat messages
    const recentMessages = await pgDb
      .select()
      .from(ChatMessageSchema)
      .where(
        sql`${ChatMessageSchema.threadId} IN (${recentThreads.map((t) => t.id).join(",")}) AND ${ChatMessageSchema.createdAt} >= ${sevenDaysAgoStr}`,
      )
      .orderBy(desc(ChatMessageSchema.createdAt));

    console.log("🔍 [DEBUG] Recent chat messages:", recentMessages.length);

    // Get all mood tracking data
    const allMoodData = await pgDb
      .select()
      .from(MoodTrackingSchema)
      .where(eq(MoodTrackingSchema.userId, session.user.id))
      .orderBy(desc(MoodTrackingSchema.createdAt));

    console.log("🔍 [DEBUG] All mood tracking data:", allMoodData.length);

    // Get recent mood data (last 7 days)
    const recentMoodData = await pgDb
      .select()
      .from(MoodTrackingSchema)
      .where(
        sql`${MoodTrackingSchema.userId} = ${session.user.id} AND ${MoodTrackingSchema.date} >= ${sevenDaysAgoStr}`,
      )
      .orderBy(desc(MoodTrackingSchema.createdAt));

    console.log("🔍 [DEBUG] Recent mood data:", recentMoodData.length);

    // Check if there are conversations without mood tracking
    const conversationsWithoutMood = recentThreads.filter(
      (thread) => !allMoodData.some((mood) => mood.threadId === thread.id),
    );

    console.log(
      "🔍 [DEBUG] Conversations without mood tracking:",
      conversationsWithoutMood.length,
    );

    return NextResponse.json({
      userId: session.user.id,
      investigationDate: new Date().toISOString(),
      recentThreads: {
        count: recentThreads.length,
        threads: recentThreads.map((t) => ({
          id: t.id,
          createdAt: t.createdAt,
          type: t.type || "chat",
        })),
      },
      recentMessages: {
        count: recentMessages.length,
        messages: recentMessages.slice(0, 5).map((m) => ({
          id: m.id,
          threadId: m.threadId,
          role: m.role,
          createdAt: m.createdAt,
          hasTextContent: m.parts?.some((p: any) => p.type === "text"),
        })),
      },
      moodTracking: {
        total: allMoodData.length,
        recent: recentMoodData.length,
        data: recentMoodData.map((m) => ({
          id: m.id,
          date: m.date,
          moodScore: m.moodScore,
          sentiment: m.sentiment,
          threadId: m.threadId,
          sessionType: m.sessionType,
          notes: m.notes?.substring(0, 100),
          createdAt: m.createdAt,
        })),
      },
      conversationsWithoutMood: {
        count: conversationsWithoutMood.length,
        threads: conversationsWithoutMood.map((t) => ({
          id: t.id,
          createdAt: t.createdAt,
          type: t.type || "chat",
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error in comprehensive mood investigation:", error);
    return NextResponse.json(
      { error: "Failed to investigate mood tracking", details: error },
      { status: 500 },
    );
  }
}
