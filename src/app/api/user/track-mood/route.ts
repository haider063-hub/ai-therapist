import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgDb } from "lib/db/pg/db.pg";
import { MoodTrackingSchema } from "lib/db/pg/schema.pg";
import { generateUUID } from "lib/utils";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moodScore, sentiment, notes } = await request.json();

    // Validate input
    if (!moodScore || moodScore < 1 || moodScore > 10) {
      return NextResponse.json(
        { error: "Invalid mood score. Must be between 1 and 10." },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Save mood entry
    await pgDb.insert(MoodTrackingSchema).values({
      id: generateUUID(),
      userId: session.user.id,
      date: today,
      moodScore: Math.round(moodScore),
      sentiment: sentiment || "neutral",
      threadId: null, // Manual entry, not from a conversation
      sessionType: null,
      notes: notes || "Manual mood entry",
      createdAt: new Date(),
    });

    logger.info(
      `Manual mood tracked for user ${session.user.id}: ${moodScore}/10`,
    );

    return NextResponse.json({
      success: true,
      message: "Mood tracked successfully",
    });
  } catch (error) {
    logger.error("Error tracking mood:", error);
    return NextResponse.json(
      { error: "Failed to track mood" },
      { status: 500 },
    );
  }
}
