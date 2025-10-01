import { NextRequest, NextResponse } from "next/server";
import { stripe } from "lib/stripe/server";
import { subscriptionRepository } from "lib/db/pg/repositories/subscription-repository.pg";
import { SUBSCRIPTION_PLANS } from "lib/stripe/server";
import logger from "logger";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
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

    await subscriptionRepository.addCredits(userId, creditsToAdd);
  } else {
    // Handle subscription plan
    const subscriptionId = session.subscription;
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const plan =
        SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];

      await subscriptionRepository.updateUserSubscription(userId, {
        subscriptionType: plan.name,
        subscriptionStatus: "active",
        stripeSubscriptionId: subscriptionId,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
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

  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionType: plan.name,
    subscriptionStatus: "active",
    stripeSubscriptionId: subscription.id,
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to find user by subscription ID
    const user = await subscriptionRepository.getUserById(""); // This needs to be implemented
    if (!user) return;
  }

  const status = subscription.status;
  let subscriptionStatus = "active";

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

  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionStatus,
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
  });
}

async function handleSubscriptionDeleted(subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to find user by subscription ID
    const user = await subscriptionRepository.getUserById(""); // This needs to be implemented
    if (!user) return;
  }

  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionType: "free_trial",
    subscriptionStatus: "canceled",
    subscriptionEndDate: null,
  });

  logger.info(`Subscription canceled for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

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
    },
  });

  // Update subscription status
  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionStatus: "active",
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
  });

  logger.info(
    `Payment succeeded for user ${userId}, subscription ${subscriptionId}`,
  );
}

async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  // Update subscription status to past_due
  await subscriptionRepository.updateUserSubscription(userId, {
    subscriptionStatus: "past_due",
  });

  logger.warn(
    `Payment failed for user ${userId}, subscription ${subscriptionId}`,
  );
}
