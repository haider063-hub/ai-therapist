#!/usr/bin/env tsx

/**
 * Test script for OAuth callback handler
 * Run with: npx tsx scripts/test-oauth-callback.ts
 */

import { pgDb } from "../src/lib/db/pg/db.pg";
import { UserSchema } from "../src/lib/db/pg/schema.pg";

async function testCallbackHandler() {
  console.log("🧪 Testing OAuth Callback Handler Logic...\n");

  try {
    // Test 1: Check if we can query users
    console.log("1️⃣ Testing database connection...");
    const users = await pgDb.select().from(UserSchema).limit(5);
    console.log(`✅ Found ${users.length} users in database`);

    // Test 2: Check profile completion status
    console.log("\n2️⃣ Checking profile completion status...");
    for (const user of users) {
      const status = user.profileCompleted
        ? "✅ Completed"
        : "❌ Not completed";
      console.log(`   User ${user.email}: ${status}`);
    }

    // Test 3: Simulate callback handler logic
    console.log("\n3️⃣ Simulating callback handler logic...");
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`   Testing with user: ${testUser.email}`);

      if (!testUser.profileCompleted) {
        console.log("   → Would redirect to: /profile-setup");
      } else {
        console.log("   → Would redirect to: /");
      }
    }

    console.log("\n✅ OAuth callback handler test completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Test Google OAuth sign-up flow");
    console.log("   2. Verify new users are redirected to profile setup");
    console.log(
      "   3. Verify existing users with completed profiles go to home page",
    );
    console.log(
      "   4. Verify existing users with incomplete profiles go to profile setup",
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testCallbackHandler().catch(console.error);
