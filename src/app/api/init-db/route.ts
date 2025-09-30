import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    console.log("Starting database initialization...");

    // Import and run the migration directly
    const { runMigrate } = await import("lib/db/pg/migrate.pg");
    await runMigrate();

    console.log("Database initialization completed successfully");

    return NextResponse.json({
      success: true,
      message: "Database initialization completed successfully",
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
    return NextResponse.json(
      {
        error: "Database initialization failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message:
      "Database initialization endpoint ready. Use POST to initialize the database.",
  });
}
