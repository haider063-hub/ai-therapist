import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { stripe } from "lib/stripe/server";
import { subscriptionRepository } from "lib/db/pg/repositories/subscription-repository.pg";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await subscriptionRepository.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 },
      );
    }

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    // Update user subscription status
    await subscriptionRepository.updateUserSubscription(user.id, {
      subscriptionStatus: "canceled",
      subscriptionEndDate: new Date(
        canceledSubscription.current_period_end * 1000,
      ),
    });

    logger.info(
      `Subscription canceled for user ${user.id}: ${user.stripeSubscriptionId}`,
    );

    return NextResponse.json({
      success: true,
      message:
        "Subscription will be canceled at the end of the current billing period",
      cancelAt: new Date(canceledSubscription.current_period_end * 1000),
    });
  } catch (error) {
    logger.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
