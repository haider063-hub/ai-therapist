/**
 * Database Reset Script
 * WARNING: This will DELETE ALL DATA in the database!
 * Only use during development/testing phase.
 */

import { pgDb } from "../src/lib/db/pg/db.pg";
import { sql } from "drizzle-orm";
import logger from "../src/lib/logger";
import "load-env";

async function resetDatabase() {
  console.log("\n⚠️  DATABASE RESET WARNING ⚠️");
  console.log("═══════════════════════════════════════════════════════");
  console.log("This script will DELETE ALL DATA from your database!");
  console.log("This includes:");
  console.log("  - All users and their profiles");
  console.log("  - All chat threads and messages");
  console.log("  - All subscriptions and transactions");
  console.log("  - All therapist selections");
  console.log("  - All mood tracking data");
  console.log("═══════════════════════════════════════════════════════\n");

  // Check if running in production
  if (process.env.NODE_ENV === "production") {
    console.error("❌ BLOCKED: Cannot run database reset in production!");
    console.error("Set NODE_ENV to 'development' or 'test' to proceed.\n");
    process.exit(1);
  }

  console.log("Starting database reset in 3 seconds...");
  console.log("Press Ctrl+C to cancel...\n");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    logger.info("🗑️  Dropping all existing tables...");

    // Drop all tables in correct order (respecting foreign keys)
    await pgDb.execute(sql`DROP TABLE IF EXISTS "mood_tracking" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "usage_log" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "transaction" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "subscription_plan" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "bookmark" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "archive_item" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "archive" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "chat_message" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "chat_thread" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "verification" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "account" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "session" CASCADE;`);
    await pgDb.execute(sql`DROP TABLE IF EXISTS "user" CASCADE;`);

    logger.info("✅ All tables dropped successfully");

    logger.info("🔄 Running migrations to recreate schema...");

    // Import and run migrations
    const { runMigrate } = await import("../src/lib/db/pg/migrate.pg");
    await runMigrate();

    logger.info("✅ Database schema recreated successfully");

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ DATABASE RESET COMPLETE!");
    console.log("═══════════════════════════════════════════════════════");
    console.log("The database is now fresh with:");
    console.log("  ✓ New schema with 200 credits default");
    console.log("  ✓ All subscription tables created");
    console.log("  ✓ All indexes and constraints in place");
    console.log("  ✓ Zero users - ready for testing");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("Next steps:");
    console.log("  1. Create a new test account");
    console.log("  2. Verify credits show 200 for chat and voice");
    console.log("  3. Test voice chat therapist selection flow");
    console.log("  4. Initialize subscription plans (if needed):\n");
    console.log("     npm run init-subscription-plans\n");

    process.exit(0);
  } catch (error) {
    logger.error("❌ Database reset failed:", error);
    console.error("\nError details:", error);
    console.error("\nTroubleshooting:");
    console.error("  1. Check your database connection in .env");
    console.error("  2. Ensure PostgreSQL is running");
    console.error("  3. Verify database user has DROP privileges");
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
