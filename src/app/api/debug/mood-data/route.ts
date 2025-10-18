import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgDb } from "lib/db/pg/db.pg";
import { MoodTrackingSchema } from "lib/db/pg/schema.pg";
import { sql } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 [DEBUG] Checking mood data for user:", session.user.id);

    // Get all mood data for this user
    const allMoodData = await pgDb
      .select()
      .from(MoodTrackingSchema)
      .where(sql`${MoodTrackingSchema.userId} = ${session.user.id}`)
      .orderBy(MoodTrackingSchema.createdAt);

    console.log("🔍 [DEBUG] All mood data found:", allMoodData);

    // Get mood data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const recentMoodData = await pgDb
      .select()
      .from(MoodTrackingSchema)
      .where(
        sql`${MoodTrackingSchema.userId} = ${session.user.id} AND ${MoodTrackingSchema.date} >= ${sevenDaysAgoStr}`,
      )
      .orderBy(MoodTrackingSchema.date);

    console.log("🔍 [DEBUG] Recent mood data (last 7 days):", recentMoodData);

    return NextResponse.json({
      userId: session.user.id,
      totalMoodEntries: allMoodData.length,
      recentMoodEntries: recentMoodData.length,
      allMoodData: allMoodData,
      recentMoodData: recentMoodData,
    });
  } catch (error) {
    console.error("❌ Error checking mood data:", error);
    return NextResponse.json(
      { error: "Failed to check mood data", details: error },
      { status: 500 },
    );
  }
}
