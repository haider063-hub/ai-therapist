import { pgDb } from "../src/lib/db/pg/db.pg";
import { sql } from "drizzle-orm";
import logger from "../src/lib/logger";

async function deleteAllUsers() {
  console.log("\n⚠️  USER DATA DELETION WARNING ⚠️");
  console.log("═══════════════════════════════════════════════════════");
  console.log("This will DELETE all users and their associated data:");
  console.log("  - All user accounts");
  console.log("  - All chat threads and messages");
  console.log("  - All subscriptions and transactions");
  console.log("  - All mood tracking data");
  console.log("  - All sessions and authentication data");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("Starting deletion in 3 seconds...");
  console.log("Press Ctrl+C to cancel...\n");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    logger.info("🗑️ Starting to delete all users and related data...");

    // Delete all user-related data using CASCADE
    // This is faster and respects all foreign key relationships
    console.log("Deleting all user data (this may take a moment)...");

    await pgDb.execute(sql`DELETE FROM "user"`);

    logger.info("✅ All user data deleted successfully");

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ USER DATA DELETION COMPLETE!");
    console.log("═══════════════════════════════════════════════════════");
    console.log("All users and associated data have been removed:");
    console.log("  ✓ Users deleted");
    console.log("  ✓ Chat threads deleted (CASCADE)");
    console.log("  ✓ Chat messages deleted (CASCADE)");
    console.log("  ✓ Transactions deleted (CASCADE)");
    console.log("  ✓ Usage logs deleted (CASCADE)");
    console.log("  ✓ Mood tracking deleted (CASCADE)");
    console.log("  ✓ Sessions deleted (CASCADE)");
    console.log("  ✓ Accounts deleted (CASCADE)");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("Next steps:");
    console.log("  1. Create a new account by signing up");
    console.log("  2. New users will get 200 credits for chat and voice");
    console.log("  3. Test the voice chat therapist selection flow\n");
  } catch (error) {
    logger.error("❌ Error deleting users:", error);
    console.error("\nError details:", error);
    console.error("\nTroubleshooting:");
    console.error("  1. Check your database connection in .env");
    console.error("  2. Ensure PostgreSQL is running");
    console.error("  3. Verify CASCADE constraints are set up properly");
    throw error;
  }
}

// Run the deletion
deleteAllUsers()
  .then(() => {
    console.log("✅ Database cleanup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Database cleanup failed:", error);
    process.exit(1);
  });
