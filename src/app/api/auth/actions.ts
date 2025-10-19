"use server";

import { auth } from "@/lib/auth/server";
import { BasicUser, UserZodSchema } from "app-types/user";
import { userRepository } from "lib/db/repository";
import { ActionState } from "lib/action-utils";
import { headers } from "next/headers";
import { OtpService } from "lib/services/otp-service";

export async function existsByEmailAction(email: string) {
  const exists = await userRepository.existsByEmail(email);
  return exists;
}

type SignUpActionResponse = ActionState & {
  user?: BasicUser;
};

export async function signUpAction(data: {
  email: string;
  name: string;
  password: string;
}): Promise<SignUpActionResponse> {
  const { success, data: parsedData } = UserZodSchema.safeParse(data);
  if (!success) {
    return {
      success: false,
      message: "Invalid data",
    };
  }
  try {
    const { user } = await auth.api.signUpEmail({
      body: {
        email: parsedData.email,
        password: parsedData.password,
        name: parsedData.name,
      },
      headers: await headers(),
    });
    return {
      user,
      success: true,
      message: "Successfully signed up",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to sign up",
    };
  }
}

export async function sendOtpAction(email: string): Promise<ActionState> {
  try {
    const result = await OtpService.generateAndSendOtp(email);
    return result;
  } catch (_error) {
    return {
      success: false,
      message: "Failed to send verification code",
    };
  }
}

export async function verifyOtpAction(
  email: string,
  otpCode: string,
): Promise<ActionState> {
  try {
    const result = await OtpService.verifyOtp(email, otpCode);
    return result;
  } catch (_error) {
    return {
      success: false,
      message: "Failed to verify code",
    };
  }
}
