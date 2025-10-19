import { randomBytes } from "crypto";
import { pgDb } from "lib/db/pg/db.pg";
import { OtpVerificationSchema } from "lib/db/pg/schema.pg";
import { eq, and, gt, desc, lt } from "drizzle-orm";
import { Resend } from "resend";

export class OtpService {
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * Generate a random 6-digit OTP code
   */
  private static generateOtpCode(): string {
    const buffer = randomBytes(3); // 3 bytes = 6 hex digits
    const otp = parseInt(buffer.toString("hex"), 16) % 1000000;
    return otp.toString().padStart(6, "0");
  }

  /**
   * Send OTP code via email
   */
  private static async sendOtpEmail(
    email: string,
    otpCode: string,
  ): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
      console.log("=".repeat(60));
      console.log("⚠️  RESEND_API_KEY not configured - OTP email not sent");
      console.log("OTP Code for", email, ":", otpCode);
      console.log("=".repeat(60));
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      const result = await resend.emails.send({
        from: "EchoNest AI Therapy <noreply@echonest.co.uk>",
        to: email,
        subject: "Your EchoNest AI Therapy Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c60eb; margin: 0;">EchoNest AI Therapy</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Your compassionate AI therapist</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
              <h2 style="color: #333; margin: 0 0 20px 0;">Email Verification</h2>
              <p style="color: #666; margin: 0 0 30px 0;">
                Thank you for signing up! Please use the verification code below to complete your account setup:
              </p>
              
              <div style="background: #2c60eb; color: white; font-size: 32px; font-weight: bold; 
                          padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                ${otpCode}
              </div>
              
              <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">
                This code will expire in ${this.OTP_EXPIRY_MINUTES} minutes.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                If you didn't request this verification code, please ignore this email.
              </p>
            </div>
          </div>
        `,
      });

      if (result.error) {
        console.error("❌ Failed to send OTP email:", result.error);
        throw new Error("Failed to send verification email");
      }

      console.log("✅ OTP email sent successfully:", result.data?.id);
    } catch (error) {
      console.error("❌ Error sending OTP email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  /**
   * Generate and send OTP code to email
   */
  static async generateAndSendOtp(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Clean up any existing unused OTPs for this email
      await this.cleanupExpiredOtps(email);

      // Check if there are too many recent attempts
      const recentAttempts = await pgDb
        .select()
        .from(OtpVerificationSchema)
        .where(
          and(
            eq(OtpVerificationSchema.email, email),
            gt(
              OtpVerificationSchema.createdAt,
              new Date(Date.now() - 60 * 1000),
            ), // Last minute
          ),
        );

      if (recentAttempts.length >= this.MAX_ATTEMPTS) {
        return {
          success: false,
          message:
            "Too many verification attempts. Please wait a moment before trying again.",
        };
      }

      // Generate new OTP
      const otpCode = this.generateOtpCode();
      const expiresAt = new Date(
        Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000,
      );

      // Store OTP in database
      await pgDb.insert(OtpVerificationSchema).values({
        id: crypto.randomUUID(),
        email,
        otpCode,
        expiresAt,
        isUsed: false,
      });

      // Send OTP via email
      await this.sendOtpEmail(email, otpCode);

      return {
        success: true,
        message: "Verification code sent to your email",
      };
    } catch (error) {
      console.error("Error generating and sending OTP:", error);
      return {
        success: false,
        message: "Failed to send verification code. Please try again.",
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOtp(
    email: string,
    otpCode: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find the most recent unused OTP for this email
      const otpRecord = await pgDb
        .select()
        .from(OtpVerificationSchema)
        .where(
          and(
            eq(OtpVerificationSchema.email, email),
            eq(OtpVerificationSchema.otpCode, otpCode),
            eq(OtpVerificationSchema.isUsed, false),
            gt(OtpVerificationSchema.expiresAt, new Date()),
          ),
        )
        .orderBy(desc(OtpVerificationSchema.createdAt))
        .limit(1);

      if (otpRecord.length === 0) {
        return {
          success: false,
          message: "Invalid or expired verification code",
        };
      }

      // Mark OTP as used
      await pgDb
        .update(OtpVerificationSchema)
        .set({ isUsed: true })
        .where(eq(OtpVerificationSchema.id, otpRecord[0].id));

      return {
        success: true,
        message: "Email verified successfully",
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        success: false,
        message: "Failed to verify code. Please try again.",
      };
    }
  }

  /**
   * Clean up expired OTPs for an email
   */
  private static async cleanupExpiredOtps(email: string): Promise<void> {
    try {
      await pgDb
        .delete(OtpVerificationSchema)
        .where(
          and(
            eq(OtpVerificationSchema.email, email),
            lt(OtpVerificationSchema.expiresAt, new Date()),
          ),
        );
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
    }
  }

  /**
   * Clean up all expired OTPs (can be run as a cron job)
   */
  static async cleanupAllExpiredOtps(): Promise<void> {
    try {
      await pgDb
        .delete(OtpVerificationSchema)
        .where(lt(OtpVerificationSchema.expiresAt, new Date()));
    } catch (error) {
      console.error("Error cleaning up all expired OTPs:", error);
    }
  }
}
