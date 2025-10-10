import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { subscriptionRepository } from "lib/db/pg/repositories/subscription-repository.pg";

/**
 * API endpoint to check if user can upload images
 * Returns upload permission and usage stats
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user can upload images
    const uploadCheck = await subscriptionRepository.canUploadImage(
      session.user.id,
    );

    // Get detailed stats
    const stats = await subscriptionRepository.getImageUsageStats(
      session.user.id,
    );

    // Get user subscription info
    const user = await subscriptionRepository.getUserById(session.user.id);

    return new Response(
      JSON.stringify({
        canUpload: uploadCheck.canUpload,
        reason: uploadCheck.reason,
        imagesUsed: uploadCheck.imagesUsed || 0,
        imagesRemaining: uploadCheck.imagesRemaining || 0,
        monthlyLimit: 50,
        subscriptionType: user?.subscriptionType,
        resetDate: stats?.resetDate,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error checking image upload permission:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
