import { NextRequest, NextResponse } from "next/server";
import { pgUserRepository } from "lib/db/pg/repositories/user-repository.pg";
import { pgDb } from "lib/db/pg/db.pg";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { auth } from "auth/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    // Validate password requirements
    if (password.length < 8 || password.length > 20) {
      return NextResponse.json(
        { error: "Password must be between 8 and 20 characters" },
        { status: 400 },
      );
    }

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the reset token
    const result = await pgDb.execute(sql`
      SELECT identifier, expires_at 
      FROM verification 
      WHERE value = ${hashedToken}
      AND identifier LIKE 'password_reset:%'
      AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const tokenData = result.rows[0] as {
      identifier: string;
      expires_at: Date;
    };
    const email = tokenData.identifier.replace("password_reset:", "");

    // Find user by email
    const user = await pgUserRepository.findByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update password using better-auth
    await auth.api.setUserPassword({
      body: { userId: user.id, newPassword: password },
      headers: await headers(),
    });

    // Revoke all user sessions for security
    await auth.api.revokeUserSessions({
      body: { userId: user.id },
      headers: await headers(),
    });

    // Delete the used token
    await pgDb.execute(sql`
      DELETE FROM verification 
      WHERE value = ${hashedToken}
    `);

    // Clean up expired tokens while we're at it
    await pgDb.execute(sql`
      DELETE FROM verification 
      WHERE expires_at < CURRENT_TIMESTAMP
    `);

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}
