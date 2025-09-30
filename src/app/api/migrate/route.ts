import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Only allow this in production or with a secret key
    const authHeader = request.headers.get("authorization");
    const secret = process.env.MIGRATION_SECRET || "dev-secret";

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting database migration...");

    // Import and run the migration
    const { runMigrate } = await import("lib/db/pg/migrate.pg");
    await runMigrate();

    console.log("Database migration completed successfully");

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully",
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: "Migration endpoint ready. Use POST with authorization header.",
  });
}
