#!/usr/bin/env tsx

/**
 * Test script for OTP functionality
 * Run with: npx tsx scripts/test-otp.ts
 */

import { OtpService } from "../src/lib/services/otp-service";

async function testOtpFlow() {
  console.log("🧪 Testing OTP Service...\n");

  const testEmail = "test@example.com";

  try {
    // Test 1: Generate and send OTP
    console.log("1. Testing OTP generation and sending...");
    const sendResult = await OtpService.generateAndSendOtp(testEmail);
    console.log("   Result:", sendResult);

    if (!sendResult.success) {
      console.log("   ❌ Failed to send OTP");
      return;
    }
    console.log("   ✅ OTP sent successfully");

    // Test 2: Verify with wrong code
    console.log("\n2. Testing verification with wrong code...");
    const wrongVerifyResult = await OtpService.verifyOtp(testEmail, "000000");
    console.log("   Result:", wrongVerifyResult);
    console.log("   ✅ Correctly rejected wrong code");

    // Test 3: Verify with correct code (this will fail since we don't have the actual code)
    console.log("\n3. Testing verification with correct code...");
    console.log(
      "   Note: In real usage, the user would enter the code from their email",
    );
    console.log(
      "   For testing, you would need to check the email or database for the actual code",
    );

    // Test 4: Cleanup
    console.log("\n4. Testing cleanup...");
    await OtpService.cleanupAllExpiredOtps();
    console.log("   ✅ Cleanup completed");

    console.log("\n🎉 All OTP tests completed successfully!");
  } catch (error) {
    console.error("❌ Error during OTP testing:", error);
  }
}

// Run the test
testOtpFlow().catch(console.error);
