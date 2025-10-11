import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { subscriptionRepository } from "lib/db/pg/repositories/subscription-repository.pg";
import { getEmergencyContacts } from "lib/services/emergency-contacts";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data including country
    const user = await subscriptionRepository.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get emergency contacts based on user's country
    const emergencyContacts = getEmergencyContacts(user.country);

    return NextResponse.json({
      country: user.country,
      emergencyContacts,
      hasContacts: emergencyContacts.length > 0,
    });
  } catch (error) {
    console.error("Error fetching emergency contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch emergency contacts" },
      { status: 500 },
    );
  }
}
