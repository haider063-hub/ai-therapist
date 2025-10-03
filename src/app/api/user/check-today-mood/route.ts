import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgDb } from "lib/db/pg/db.pg";
import { MoodTrackingSchema } from "lib/db/pg/schema.pg";
import { eq, and, sql } from "drizzle-orm";
import logger from "logger";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if user has already tracked mood today (manual entry only)
    const [todayMood] = await pgDb
      .select()
      .from(MoodTrackingSchema)
      .where(
        and(
          eq(MoodTrackingSchema.userId, session.user.id),
          eq(MoodTrackingSchema.date, today),
          sql`${MoodTrackingSchema.threadId} IS NULL`, // Only manual entries
        ),
      )
      .limit(1);

    if (todayMood) {
      // Get the emoji based on mood score
      const getMoodEmoji = (score: number) => {
        if (score >= 9) return "😊";
        if (score >= 8) return "😌";
        if (score === 5) return "😐";
        if (score === 3) return "😔";
        if (score === 4)
          return score === 4 && todayMood.notes?.includes("Anxious")
            ? "😰"
            : "😓";
        if (score === 2) return "😢";
        return "😡";
      };

      return NextResponse.json({
        trackedToday: true,
        moodScore: todayMood.moodScore,
        moodEmoji: getMoodEmoji(todayMood.moodScore),
      });
    }

    return NextResponse.json({ trackedToday: false });
  } catch (error) {
    logger.error("Error checking today's mood:", error);
    return NextResponse.json(
      { error: "Failed to check mood" },
      { status: 500 },
    );
  }
}
