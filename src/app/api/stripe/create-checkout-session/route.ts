import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { stripe, SUBSCRIPTION_PLANS } from "lib/stripe/server";
import { subscriptionRepository } from "lib/db/pg/repositories/subscription-repository.pg";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planType } = await request.json();

    if (
      !planType ||
      !SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]
    ) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    const plan =
      SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
    const user = await subscriptionRepository.getUserById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent duplicate subscription purchases (but allow multiple top-ups)
    if (
      planType !== "VOICE_TOPUP" &&
      user.subscriptionType === plan.name &&
      user.subscriptionStatus === "active"
    ) {
      return NextResponse.json(
        { error: "You already have an active subscription to this plan" },
        { status: 400 },
      );
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update user with customer ID
      await subscriptionRepository.updateUserSubscription(user.id, {
        stripeCustomerId: customerId,
      });
    }

    // Get base URL from request headers or environment variable
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // Create checkout session
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ["card"],
      mode: planType === "VOICE_TOPUP" ? "payment" : "subscription",
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription/cancel`,
      metadata: {
        userId: user.id,
        planType,
      },
    };

    if (planType === "VOICE_TOPUP") {
      // One-time payment for voice top-ups
      sessionParams.line_items = [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ];
    } else {
      // Subscription for plans
      sessionParams.line_items = [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ];
    }

    const checkoutSession =
      await stripe.checkout.sessions.create(sessionParams);

    // Create pending transaction record
    await subscriptionRepository.createTransaction({
      userId: user.id,
      type: planType === "VOICE_TOPUP" ? "topup" : "subscription",
      amount: plan.price.toString(),
      creditsAdded:
        planType === "VOICE_TOPUP" ? (plan as any).creditsAdded || 0 : 0,
      stripePaymentId: checkoutSession.id,
      stripeSubscriptionId: planType === "VOICE_TOPUP" ? null : null, // Will be set when subscription is created
      status: "pending",
      metadata: {
        planType,
        checkoutSessionId: checkoutSession.id,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    logger.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
