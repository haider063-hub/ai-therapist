import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-instance";
import { pgDb } from "@/lib/db/pg/db.pg";
import { UserSchema } from "@/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get the session to check if user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      // If no session, redirect to sign-in
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Check if user has completed profile setup
    const user = await pgDb
      .select()
      .from(UserSchema)
      .where(eq(UserSchema.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      // User not found, redirect to sign-in
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const userData = user[0];

    // If profile is not completed, redirect to profile setup
    if (!userData.profileCompleted) {
      return NextResponse.redirect(new URL("/profile-setup", request.url));
    }

    // If profile is completed, redirect to home page
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Callback handler error:", error);
    // On error, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}
