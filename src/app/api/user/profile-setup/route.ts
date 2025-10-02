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

    // If user skipped, just mark as completed (they can fill it later)
    if (data.skipped) {
      await pgDb
        .update(UserSchema)
        .set({
          profileCompleted: true,
          profileLastUpdated: new Date(),
        })
        .where(eq(UserSchema.id, session.user.id));

      return NextResponse.json({ success: true, skipped: true });
    }

    // Validate and sanitize data
    const profileData: any = {
      profileCompleted: true,
      profileLastUpdated: new Date(),
    };

    if (data.dateOfBirth) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(data.dateOfBirth)) {
        profileData.dateOfBirth = data.dateOfBirth;
      }
    }

    if (data.gender) {
      profileData.gender = data.gender;
    }

    if (data.country) {
      profileData.country = data.country.trim();
    }

    if (data.location) {
      profileData.location = data.location.trim();
    }

    if (data.religion) {
      profileData.religion = data.religion.trim();
    }

    if (data.therapyNeeds && Array.isArray(data.therapyNeeds)) {
      // Store as JSON string
      profileData.therapyNeeds = JSON.stringify(data.therapyNeeds);
    }

    if (data.preferredTherapyStyle) {
      profileData.preferredTherapyStyle = data.preferredTherapyStyle;
    }

    if (data.specificConcerns) {
      profileData.specificConcerns = data.specificConcerns.trim();
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
