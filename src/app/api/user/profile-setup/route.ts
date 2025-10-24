import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgDb } from "lib/db/pg/db.pg";
import { UserSchema } from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate therapy needs (required field) - now a single string value
    if (
      !data.therapyNeeds ||
      typeof data.therapyNeeds !== "string" ||
      data.therapyNeeds.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Please select a therapy need" },
        { status: 400 },
      );
    }

    // Validate and sanitize data
    const profileData: any = {
      profileCompleted: true,
      profileLastUpdated: new Date(),
      updatedAt: new Date(), // Force update timestamp
    };

    // Always update all fields (even if empty, to allow clearing)
    profileData.dateOfBirth = data.dateOfBirth || null;
    profileData.gender = data.gender || null;
    profileData.country = data.country?.trim() || null;
    profileData.religion = data.religion || null;
    profileData.preferredTherapyStyle = data.preferredTherapyStyle || null;
    profileData.specificConcerns = data.specificConcerns?.trim() || null;

    // Therapy needs is now a single string value
    if (data.therapyNeeds && typeof data.therapyNeeds === "string") {
      profileData.therapyNeeds = data.therapyNeeds.trim();
    }

    // Update user profile
    await pgDb
      .update(UserSchema)
      .set(profileData)
      .where(eq(UserSchema.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 },
    );
  }
}
