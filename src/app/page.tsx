import { getSession } from "auth/server";
import { redirect } from "next/navigation";
import { pgDb } from "lib/db/pg/db.pg";
import { UserSchema } from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user has selected a therapist
  try {
    const [user] = await pgDb
      .select({ selectedTherapistId: UserSchema.selectedTherapistId })
      .from(UserSchema)
      .where(eq(UserSchema.id, session.user.id));

    if (user?.selectedTherapistId) {
      // User has selected a therapist → go to voice-chat (returning user)
      redirect("/voice-chat");
    } else {
      // User hasn't selected a therapist → go to therapists page (new user)
      redirect("/therapists");
    }
  } catch (error) {
    console.error("Error checking therapist selection:", error);
    // If error, default to therapists page for safety
    redirect("/therapists");
  }
}
