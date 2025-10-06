/**
 * Initialize Database - Run all migrations from scratch
 * Use this when database is empty or you need to set up fresh
 */

import logger from "../src/lib/logger";
import "load-env";

async function initDatabase() {
  console.log("\n🚀 DATABASE INITIALIZATION");
  console.log("═══════════════════════════════════════════════════════");
  console.log("This will create all database tables and schema.");
  console.log("Safe to run on empty database or with existing schema.");
  console.log("═══════════════════════════════════════════════════════\n");

  try {
    logger.info("📋 Running database migrations...");

    // Import and run migrations
    const { runMigrate } = await import("../src/lib/db/pg/migrate.pg");
    await runMigrate();

    logger.info("✅ Database migrations completed successfully");

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ DATABASE INITIALIZATION COMPLETE!");
    console.log("═══════════════════════════════════════════════════════");
    console.log("Database is ready with:");
    console.log("  ✓ All tables created");
    console.log("  ✓ All indexes created");
    console.log("  ✓ All constraints created");
    console.log("  ✓ Credit system configured (200 defaults)");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("Next steps:");
    console.log("  1. Start your dev server: npm run dev");
    console.log("  2. Create a new account by signing up");
    console.log("  3. Verify 200 credits for both chat and voice");
    console.log("  4. Test voice chat therapist selection\n");

    process.exit(0);
  } catch (error) {
    logger.error("❌ Database initialization failed:", error);
    console.error("\nError details:", error);
    console.error("\nTroubleshooting:");
    console.error("  1. Check your database connection in .env");
    console.error("  2. Ensure PostgreSQL is running");
    console.error("  3. Verify database exists and is accessible");
    console.error("  4. Check database user has CREATE privileges\n");
    process.exit(1);
  }
}

// Run the initialization
initDatabase();
