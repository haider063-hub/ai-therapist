import { NextRequest, NextResponse } from "next/server";
import { pgUserRepository } from "lib/db/pg/repositories/user-repository.pg";
import { pgDb } from "lib/db/pg/db.pg";
import { sql } from "drizzle-orm";
import crypto from "crypto";

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
      ON CONFLICT (identifier) 
      DO UPDATE SET 
        value = ${hashedToken},
        expires_at = ${expiresAt.toISOString()},
        updated_at = CURRENT_TIMESTAMP
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

// Email sending function - implement based on your email provider
async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  name: string,
) {
  // TODO: Implement email sending with your preferred email service
  // Options: Resend, SendGrid, Nodemailer, AWS SES, etc.

  console.log("=".repeat(60));
  console.log("PASSWORD RESET EMAIL");
  console.log("=".repeat(60));
  console.log(`To: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Reset Link: ${resetLink}`);
  console.log("=".repeat(60));
  console.log("\nNOTE: Email sending is not configured.");
  console.log("For production, implement sendPasswordResetEmail() function");
  console.log("with your email provider (Resend, SendGrid, etc.)");
  console.log("=".repeat(60));

  // Example with Resend (uncomment and configure):
  /*
  const { Resend } = require("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "noreply@yourdomain.com",
    to: email,
    subject: "Reset Your Password",
    html: `
      <h2>Hello ${name},</h2>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
  */
}
