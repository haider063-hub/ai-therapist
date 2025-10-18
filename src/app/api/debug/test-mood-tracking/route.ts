import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { moodTrackingService } from "lib/services/mood-tracking-service";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testMessages, sessionType = "chat" } = await request.json();

    console.log(
      "🔍 [DEBUG] Testing mood tracking with messages:",
      testMessages,
    );

    // Test mood analysis
    const moodAnalysis = await moodTrackingService.analyzeMood(testMessages);

    console.log("🔍 [DEBUG] Mood analysis result:", moodAnalysis);

    if (moodAnalysis) {
      // Test saving mood tracking
      await moodTrackingService.saveMoodTracking(
        session.user.id,
        "test-thread-" + Date.now(),
        sessionType,
        moodAnalysis,
        new Date(),
      );

      console.log("✅ Mood tracking test completed successfully");

      return NextResponse.json({
        success: true,
        moodAnalysis,
        message: "Mood tracking test completed",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Mood analysis returned null",
      });
    }
  } catch (error) {
    console.error("❌ Error testing mood tracking:", error);
    logger.error("Error testing mood tracking:", error);
    return NextResponse.json(
      { error: "Failed to test mood tracking", details: error },
      { status: 500 },
    );
  }
}
