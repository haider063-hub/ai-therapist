import { pgDb } from "../src/lib/db/pg/db.pg";
import { sql } from "drizzle-orm";

/**
 * Migration: Separate Chat & Voice Credits System
 *
 * This migration:
 * 1. Adds new columns for separate chat/voice credits
 * 2. Resets all existing user credits (testing phase)
 * 3. Sets up credit breakdown tracking
 */

async function migrateSeparateCredits() {
  console.log("🚀 Starting migration to separate chat/voice credits...\n");

  try {
    // Step 1: Add new columns
    console.log("📝 Adding new credit columns...");

    await pgDb.execute(sql`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS chat_credits INTEGER DEFAULT 250,
      ADD COLUMN IF NOT EXISTS voice_credits INTEGER DEFAULT 250,
      ADD COLUMN IF NOT EXISTS chat_credits_from_topup INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS voice_credits_from_topup INTEGER DEFAULT 0;
    `);

    console.log("✅ New columns added successfully\n");

    // Step 2: Reset all user credits (testing phase)
    console.log("🔄 Resetting all user credits to initial values...");

    await pgDb.execute(sql`
      UPDATE "user" SET
        credits = 500,
        chat_credits = 250,
        voice_credits = 250,
        chat_credits_from_topup = 0,
        voice_credits_from_topup = 0,
        voice_credits_used_today = 0,
        voice_credits_used_this_month = 0,
        last_daily_reset = CURRENT_TIMESTAMP,
        last_monthly_reset = CURRENT_TIMESTAMP
      WHERE subscription_type = 'free_trial';
    `);

    console.log("✅ Free trial users reset: 250 chat + 250 voice credits\n");

    // Reset other plans
    await pgDb.execute(sql`
      UPDATE "user" SET
        credits = 0,
        chat_credits = 0,
        voice_credits = 0,
        chat_credits_from_topup = 0,
        voice_credits_from_topup = 0
      WHERE subscription_type IN ('chat_only', 'voice_only', 'premium');
    `);

    console.log(
      "✅ Paid plan users reset (unlimited access, no credits needed)\n",
    );

    // Step 3: Verify migration
    const result = await pgDb.execute(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN subscription_type = 'free_trial' THEN 1 ELSE 0 END) as free_trial_users,
        SUM(CASE WHEN chat_credits = 250 THEN 1 ELSE 0 END) as users_with_chat_credits,
        SUM(CASE WHEN voice_credits = 250 THEN 1 ELSE 0 END) as users_with_voice_credits
      FROM "user";
    `);

    console.log("📊 Migration Summary:");
    console.log(result.rows[0]);
    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
migrateSeparateCredits()
  .then(() => {
    console.log("\n🎉 All done! Your credit system is now separated.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration error:", error);
    process.exit(1);
  });
