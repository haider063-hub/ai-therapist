import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgDb as db } from "lib/db/pg/db.pg";
import { UserSchema } from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { language } = await request.json();

    if (!language || typeof language !== "string") {
      return NextResponse.json(
        { error: "Invalid language code" },
        { status: 400 },
      );
    }

    // Validate language code
    const validLanguages = ["en", "es", "ja", "ar", "fr", "de", "hi", "ru"];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        { error: "Invalid language code" },
        { status: 400 },
      );
    }

    // Update user's preferred language
    await db
      .update(UserSchema)
      .set({
        preferredLanguage: language,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, session.user.id));

    return NextResponse.json({ success: true, language });
  } catch (error) {
    console.error("Error updating preferred language:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's preferred language
    const user = await db
      .select({ preferredLanguage: UserSchema.preferredLanguage })
      .from(UserSchema)
      .where(eq(UserSchema.id, session.user.id))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ language: user[0].preferredLanguage });
  } catch (error) {
    console.error("Error getting preferred language:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
