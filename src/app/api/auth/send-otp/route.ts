import { NextRequest, NextResponse } from "next/server";
import { OtpService } from "lib/services/otp-service";
import { z } from "zod";

const SendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = SendOtpSchema.parse(body);

    const result = await OtpService.generateAndSendOtp(email);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in send-otp route:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
