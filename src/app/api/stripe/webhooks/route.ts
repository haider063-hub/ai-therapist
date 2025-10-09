import { NextRequest, NextResponse } from "next/server";
import { stripe } from "lib/stripe/server";
import { subscriptionRepository } from "lib/db/pg/repositories/subscription-repository.pg";
import { SUBSCRIPTION_PLANS } from "lib/stripe/server";
import logger from "logger";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logger.error("Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    logger.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as any;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType;

  if (!userId || !planType) {
    logger.error("Missing metadata in checkout session:", session.id);
    return;
  }

  const user = await subscriptionRepository.getUserById(userId);
  if (!user) {
    logger.error("User not found for checkout session:", userId);
    return;
  }

  // Update transaction status
  const transaction =
    await subscriptionRepository.getTransactionByStripePaymentId(session.id);
  if (transaction) {
    await subscriptionRepository.createTransaction({
      ...transaction,
      status: "succeeded",
      stripePaymentId: session.payment_intent,
    });
  }

  if (planType === "VOICE_TOPUP") {
    // Handle voice top-up
    const plan = SUBSCRIPTION_PLANS.VOICE_TOPUP;
    const creditsToAdd = (plan as any).creditsAdded || 1000; // Default 1000 credits

    await subscriptionRepository.addVoiceTopupCredits(userId, creditsToAdd);
  } else {
    // Handle subscription plan
    const subscriptionId = session.subscription;
    if (subscriptionId) {
      const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
      const plan =
        SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];

      await subscriptionRepository.updateUserSubscription(userId, {
        subscriptionType: plan.name,
        subscriptionStatus: "active",
        stripeSubscriptionId: subscriptionId,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        voiceCredits: plan.monthlyVoiceCredits, // Update voice credits to plan amount
      });
    }
  }
}

async function handleSubscriptionCreated(subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    logger.error("Missing userId in subscription metadata:", subscription.id);
    return;
  }

  const planType = subscription.metadata?.planType;
  if (!planType) {
    logger.error("Missing planType in subscription metadata:", subscription.id);
    return;
  }

  const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
  if (!plan) {
    logger.error("Invalid plan type in subscription:", planType);
    return;
  }

  // Update user subscription - NO CREDITS YET (waiting for payment confirmation)
  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionType: plan.name,
    subscriptionStatus: "incomplete", // Payment not confirmed yet
    stripeSubscriptionId: subscription.id,
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    // DO NOT set voiceCredits here - waiting for invoice.payment_succeeded
  });

  logger.info(
    `Subscription created for user ${userId}: ${plan.displayName}. Waiting for payment confirmation to grant ${plan.monthlyVoiceCredits} credits.`,
  );
}

async function handleSubscriptionUpdated(subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    logger.error("Missing userId in subscription update:", subscription.id);
    return;
  }

  const status = subscription.status;
  let subscriptionStatus = "active";

  // Check if subscription is scheduled to cancel
  if (subscription.cancel_at_period_end) {
    subscriptionStatus = "canceled"; // Show as canceled even though still active
  } else {
    switch (status) {
      case "active":
        subscriptionStatus = "active";
        break;
      case "canceled":
        subscriptionStatus = "canceled";
        break;
      case "past_due":
        subscriptionStatus = "past_due";
        break;
      case "incomplete":
        subscriptionStatus = "incomplete";
        break;
      default:
        subscriptionStatus = "canceled";
    }
  }

  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionStatus,
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
  });

  logger.info(
    `Subscription updated for user ${userId}, status: ${subscriptionStatus}, cancel_at_period_end: ${subscription.cancel_at_period_end}`,
  );
}

async function handleSubscriptionDeleted(subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    logger.error("Missing userId in subscription deletion:", subscription.id);
    return;
  }

  // User canceled subscription - revert to free trial with 0 plan credits
  // Top-up credits are preserved (stored separately)
  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionType: "free_trial",
    subscriptionStatus: "canceled",
    subscriptionEndDate: null,
    stripeSubscriptionId: null,
    credits: 0, // Reset legacy field
    chatCredits: 0, // Reset plan chat credits to 0
    voiceCredits: 0, // Reset plan voice credits to 0
    voiceCreditsUsedToday: 0,
    voiceCreditsUsedThisMonth: 0,
  });

  logger.info(
    `Subscription canceled for user ${userId}. Plan credits reset to 0, top-up credits preserved. User reverted to free trial.`,
  );
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  const planType = subscription.metadata?.planType;

  if (!userId) return;

  // Get the plan configuration to reset credits on renewal
  const plan = planType
    ? SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]
    : null;

  // Create successful transaction record
  await subscriptionRepository.createTransaction({
    userId,
    type: "subscription",
    amount: (invoice.amount_paid / 100).toString(), // Convert from cents
    creditsAdded: 0,
    stripePaymentId: invoice.payment_intent,
    stripeSubscriptionId: subscriptionId,
    status: "succeeded",
    metadata: {
      invoiceId: invoice.id,
      periodStart: new Date(invoice.period_start * 1000).toISOString(),
      periodEnd: new Date(invoice.period_end * 1000).toISOString(),
      planType: planType || "unknown",
    },
  });

  // ✅ PAYMENT SUCCESSFUL - Now update subscription status and grant/reset credits
  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionStatus: "active", // Mark as active only after successful payment
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    voiceCredits: plan?.monthlyVoiceCredits, // ✅ Grant/reset credits ONLY after successful payment
    voiceCreditsUsedToday: 0,
    voiceCreditsUsedThisMonth: 0,
    lastMonthlyReset: new Date(),
  });

  const isRenewal = invoice.billing_reason === "subscription_cycle";
  const action = isRenewal ? "renewed" : "activated";

  logger.info(
    `✅ Payment succeeded for user ${userId}. Subscription ${action}, credits ${isRenewal ? "reset" : "granted"} to ${plan?.monthlyVoiceCredits || 0}. Next billing: ${new Date(subscription.current_period_end * 1000).toISOString()}`,
  );
}

async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  // ❌ PAYMENT FAILED - Update status but DO NOT grant/reset credits
  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionStatus: "past_due",
    // DO NOT reset voiceCredits - payment failed!
  });

  logger.warn(
    `❌ Payment failed for user ${userId}, subscription ${subscriptionId}. Credits NOT reset. Subscription status: past_due.`,
  );
}
