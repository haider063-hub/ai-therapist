import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { requireAdminPermission } from "auth/permissions";
import { pgDb } from "lib/db/pg/db.pg";
import { MoodTrackingSchema } from "lib/db/pg/schema.pg";
import { sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Check if user is authenticated
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or viewing their own data
    if (session.user.id !== userId) {
      try {
        await requireAdminPermission();
      } catch (_error) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get mood data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const moodData = await pgDb
      .select({
        date: MoodTrackingSchema.date,
        avgScore: sql<number>`AVG(${MoodTrackingSchema.moodScore})`,
      })
      .from(MoodTrackingSchema)
      .where(
        sql`${MoodTrackingSchema.userId} = ${userId} AND ${MoodTrackingSchema.date} >= ${sevenDaysAgoStr}`,
      )
      .groupBy(MoodTrackingSchema.date)
      .orderBy(MoodTrackingSchema.date);

    // Format for last 7 days with day names
    const weeklyData: { day: string; date: string; score: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      const dayData = moodData.find((m) => m.date === dateStr);

      weeklyData.push({
        day: dayName,
        date: dateStr,
        score: dayData ? Math.round(Number(dayData.avgScore)) : 0,
      });
    }

    return NextResponse.json({ weeklyMoodData: weeklyData });
  } catch (error) {
    console.error("❌ Error fetching weekly mood:", error);
    return NextResponse.json(
      { error: "Failed to fetch mood data" },
      { status: 500 },
    );
  }
}
