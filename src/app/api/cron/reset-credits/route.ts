import { NextRequest, NextResponse } from "next/server";
import { creditService } from "lib/services/credit-service";
import logger from "logger";

// Simple authentication for cron jobs
function authenticateCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.warn("CRON_SECRET not set - cron jobs disabled");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    if (!authenticateCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();

    if (type === "daily") {
      await creditService.resetAllUsersDailyVoiceCredits();
      return NextResponse.json({
        success: true,
        message: "Daily voice credits reset successfully",
      });
    } else if (type === "monthly") {
      await creditService.resetAllUsersMonthlyVoiceCredits();
      return NextResponse.json({
        success: true,
        message: "Monthly voice credits reset successfully",
      });
    } else {
      return NextResponse.json(
        {
          error: 'Invalid reset type. Use "daily" or "monthly"',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    logger.error("Error in cron job:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    message: "Credit reset cron endpoint is running",
  });
}
