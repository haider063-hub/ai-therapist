import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { pgDb } from "lib/db/pg/db.pg";
import { UserSchema } from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { therapistId } = await request.json();

    if (!therapistId) {
      return NextResponse.json(
        { error: "Therapist ID is required" },
        { status: 400 },
      );
    }

    // Update user's selected therapist
    await pgDb
      .update(UserSchema)
      .set({
        selectedTherapistId: therapistId,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, session.user.id));

    logger.info(`User ${session.user.id} selected therapist: ${therapistId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error saving therapist selection:", error);
    return NextResponse.json(
      { error: "Failed to save therapist" },
      { status: 500 },
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await pgDb
      .select({ selectedTherapistId: UserSchema.selectedTherapistId })
      .from(UserSchema)
      .where(eq(UserSchema.id, session.user.id));

    return NextResponse.json({
      selectedTherapistId: user?.selectedTherapistId || null,
    });
  } catch (error) {
    logger.error("Error getting therapist selection:", error);
    return NextResponse.json(
      { error: "Failed to get therapist" },
      { status: 500 },
    );
  }
}
