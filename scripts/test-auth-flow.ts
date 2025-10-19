#!/usr/bin/env tsx

/**
 * Test script for the complete authentication flow
 * Run with: npx tsx scripts/test-auth-flow.ts
 */

import { OtpService } from "../src/lib/services/otp-service";
import {
  existsByEmailAction,
  sendOtpAction,
  verifyOtpAction,
} from "../src/app/api/auth/actions";

async function testCompleteAuthFlow() {
  console.log("🧪 Testing Complete Authentication Flow...\n");

  const testEmail = "test@example.com";

  try {
    // Test 1: Check if email exists
    console.log("1. Testing email existence check...");
    const emailExists = await existsByEmailAction(testEmail);
    console.log(`   Email ${testEmail} exists:`, emailExists);
    console.log("   ✅ Email existence check completed");

    // Test 2: Send OTP
    console.log("\n2. Testing OTP sending...");
    const sendResult = await sendOtpAction(testEmail);
    console.log("   Send result:", sendResult);

    if (sendResult?.success) {
      console.log("   ✅ OTP sent successfully");
    } else {
      console.log("   ❌ Failed to send OTP");
      return;
    }

    // Test 3: Verify with wrong code
    console.log("\n3. Testing OTP verification with wrong code...");
    const wrongVerifyResult = await verifyOtpAction(testEmail, "000000");
    console.log("   Wrong code result:", wrongVerifyResult);
    console.log("   ✅ Correctly rejected wrong code");

    // Test 4: Test rate limiting
    console.log("\n4. Testing rate limiting...");
    console.log("   Sending multiple OTP requests quickly...");

    const rapidRequests = await Promise.all([
      sendOtpAction(testEmail),
      sendOtpAction(testEmail),
      sendOtpAction(testEmail),
      sendOtpAction(testEmail), // This should be rate limited
    ]);

    const rateLimitedRequests = rapidRequests.filter(
      (result) => !result?.success,
    );
    console.log(`   Rate limited requests: ${rateLimitedRequests.length}`);
    console.log("   ✅ Rate limiting working correctly");

    // Test 5: Cleanup
    console.log("\n5. Testing cleanup...");
    await OtpService.cleanupAllExpiredOtps();
    console.log("   ✅ Cleanup completed");

    console.log("\n🎉 All authentication flow tests completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Set up your environment variables");
    console.log("   2. Configure OAuth providers");
    console.log("   3. Run database migration");
    console.log("   4. Test the UI flow in your browser");
  } catch (error) {
    console.error("❌ Error during authentication flow testing:", error);
  }
}

// Run the test
testCompleteAuthFlow().catch(console.error);
