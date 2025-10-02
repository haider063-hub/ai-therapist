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
      from: "EchoNest AI Therapy <noreply@echonest.co.uk>", // Using your verified domain
      to: email,
      subject: "Reset Your Password - EchoNest AI Therapy",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            @media only screen and (max-width: 600px) {
              .email-container {
                margin: 20px 10px !important;
                border-radius: 12px !important;
              }
              .header {
                padding: 30px 15px !important;
              }
              .header-title {
                font-size: 22px !important;
              }
              .content {
                padding: 30px 20px !important;
              }
              .greeting {
                font-size: 16px !important;
              }
              .description {
                font-size: 14px !important;
              }
              .cta-button {
                padding: 14px 32px !important;
                font-size: 15px !important;
              }
              .link-box {
                padding: 15px !important;
              }
              .warning-box, .security-box {
                padding: 14px 16px !important;
              }
              .footer {
                padding: 25px 20px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div class="email-container" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
            
            <!-- Header -->
            <div class="header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 20px;">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 50%; text-align: center; vertical-align: middle;">
                    <!-- Heart Icon -->
                    <svg width="40" height="40" viewBox="0 0 24 24" 
                         fill="none" stroke="white" stroke-width="2" 
                         stroke-linecap="round" stroke-linejoin="round" 
                         xmlns="http://www.w3.org/2000/svg"
                         style="display: inline-block; vertical-align: middle;">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </td>
                </tr>
              </table>
              <h1 class="header-title" style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Password Reset Request</h1>
            </div>
            
            <!-- Content -->
            <div class="content" style="padding: 40px 30px;">
              <p class="greeting" style="color: #1a1a1a; font-size: 18px; margin: 0 0 10px 0; font-weight: 500;">
                Hello ${name || "there"},
              </p>
              
              <p class="description" style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset the password for your EchoNest AI Therapy account. Click the button below to create a new password.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${resetLink}" 
                   class="cta-button"
                   style="display: inline-block; 
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: #ffffff; 
                          padding: 16px 48px; 
                          text-decoration: none; 
                          border-radius: 50px; 
                          font-weight: 600;
                          font-size: 16px;
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  Reset My Password
                </a>
              </div>
              
              <!-- Alternative Link -->
              <div class="link-box" style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0; font-weight: 500;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="word-break: break-all; color: #667eea; font-size: 13px; margin: 0; line-height: 1.5;">
                  ${resetLink}
                </p>
              </div>
              
              <!-- Expiry Warning -->
              <div class="warning-box" style="background-color: #fef3e7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 25px 0;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="width: 32px; vertical-align: top; padding-right: 12px;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="#f59e0b"/>
                      </svg>
                    </td>
                    <td style="vertical-align: top;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                        This link will expire in 1 hour
                      </p>
                      <p style="margin: 5px 0 0 0; color: #b45309; font-size: 13px;">
                        For security reasons, please reset your password as soon as possible.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Security Notice -->
              <div class="security-box" style="background-color: #f0f4f8; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="width: 32px; vertical-align: top; padding-right: 12px;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="#3b82f6"/>
                      </svg>
                    </td>
                    <td style="vertical-align: top;">
                      <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.5;">
                        <strong>Didn't request this?</strong><br>
                        If you didn't request a password reset, you can safely ignore this email. Your account remains secure and your password won't be changed.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer" style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 5px 0;">
                This is an automated message from <strong>EchoNest AI Therapy</strong>
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Please do not reply to this email.
              </p>
            </div>
            
          </div>
          
          <!-- Bottom Spacing -->
          <div style="text-align: center; padding: 20px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} EchoNest AI Therapy. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Password reset email sent successfully to ${email}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error; // Re-throw to handle in the main route
  }
}
