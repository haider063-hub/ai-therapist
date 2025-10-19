import { NextRequest, NextResponse } from "next/server";
import { OtpService } from "lib/services/otp-service";
import { z } from "zod";

const VerifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otpCode } = VerifyOtpSchema.parse(body);

    const result = await OtpService.verifyOtp(email, otpCode);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in verify-otp route:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid input data" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
