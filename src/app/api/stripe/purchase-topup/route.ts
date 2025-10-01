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

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const user = await subscriptionRepository.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    // Calculate credits based on amount (assuming $15 = 1000 credits)
    const creditsToAdd = Math.floor((amount / 15) * 1000);

    // Create payment intent for top-up
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "usd",
      customer: customerId,
      metadata: {
        userId: user.id,
        type: "voice_topup",
        creditsToAdd: creditsToAdd.toString(),
      },
    });

    // Create pending transaction record
    await subscriptionRepository.createTransaction({
      userId: user.id,
      type: "topup",
      amount: amount.toString(),
      creditsAdded: creditsToAdd,
      stripePaymentId: paymentIntent.id,
      stripeSubscriptionId: null, // Top-ups don't have subscriptions
      status: "pending",
      metadata: {
        type: "voice_topup",
        creditsToAdd,
        paymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      creditsToAdd,
      amount,
    });
  } catch (error) {
    logger.error("Error creating top-up payment:", error);
    return NextResponse.json(
      { error: "Failed to create top-up payment" },
      { status: 500 },
    );
  }
}
