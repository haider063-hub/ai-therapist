import { NextRequest, NextResponse } from "next/server";
import { pgUserRepository } from "lib/db/pg/repositories/user-repository.pg";
import { pgDb } from "lib/db/pg/db.pg";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { Resend } from "resend";

// Create a simple password reset tokens table schema
// You'll need to run a migration to create this table
const PASSWORD_RESET_TOKEN_EXPIRY = 1000 * 60 * 60; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await pgUserRepository.findByEmail(email);

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { message: "If the email exists, a reset link has been sent" },
        { status: 200 },
      );
    }

    // Check if user has a password account (not OAuth only)
    const hasPasswordAccount = await pgDb.execute(sql`
      SELECT 1 FROM account 
      WHERE user_id = ${user.id} 
      AND provider_id = 'credential'
      LIMIT 1
    `);

    if (hasPasswordAccount.rows.length === 0) {
      // User only has OAuth accounts, cannot reset password
      return NextResponse.json(
        { message: "If the email exists, a reset link has been sent" },
        { status: 200 },
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY);

    // Store token in verification table
    // First, delete any existing reset tokens for this email
    await pgDb.execute(sql`
      DELETE FROM verification 
      WHERE identifier = ${`password_reset:${user.email}`}
    `);

    // Then insert the new token
    await pgDb.execute(sql`
      INSERT INTO verification (id, identifier, value, expires_at, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${`password_reset:${user.email}`},
        ${hashedToken},
        ${expiresAt.toISOString()},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `);

    // Create reset link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email (you'll need to implement email sending)
    await sendPasswordResetEmail(user.email, resetLink, user.name || "User");

    return NextResponse.json(
      { message: "If the email exists, a reset link has been sent" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}

// Email sending function using Resend
async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  name: string,
) {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log("=".repeat(60));
    console.log("⚠️  RESEND_API_KEY not configured - Email will be logged only");
    console.log("=".repeat(60));
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log("=".repeat(60));
    console.log("Add RESEND_API_KEY to your .env file to send real emails");
    console.log("=".repeat(60));
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Acme <onboarding@resend.dev>", // Simplified from address for testing
      to: email,
      subject: "Reset Your Password - EchoNest AI Therapy",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">EchoNest AI Therapy</h1>
          </div>
          
          <h2 style="color: #333;">Hello ${name || "there"},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            You requested to reset your password for your EchoNest AI Therapy account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; 
                      background-color: #0070f3; 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;
                      font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #0070f3; font-size: 14px; background: #f5f5f5; padding: 12px; border-radius: 4px;">
            ${resetLink}
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⏰ This link will expire in 1 hour.</strong>
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you didn't request this password reset, you can safely ignore this email. 
            Your password will not be changed.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated email from EchoNest AI Therapy.<br>
            Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log(`✅ Password reset email sent successfully to ${email}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error; // Re-throw to handle in the main route
  }
}
