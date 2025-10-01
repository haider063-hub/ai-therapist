import { subscriptionRepository } from "../src/lib/db/pg/repositories/subscription-repository.pg";
// import { SUBSCRIPTION_PLANS } from '../src/lib/stripe/server'; // Not used - we define plans directly

async function initSubscriptionPlans() {
  console.log("Initializing subscription plans...");

  try {
    // Initialize Chat Only Plan
    await subscriptionRepository.createSubscriptionPlan({
      name: "chat_only",
      displayName: "Chat Only Plan",
      price: "19.00",
      stripePriceId: process.env.STRIPE_CHAT_ONLY_PRICE_ID || "",
      chatCreditsPerMessage: 5,
      voiceCreditsPerInteraction: 10,
      dailyVoiceCredits: 0,
      monthlyVoiceCredits: 0,
      unlimitedChat: true,
      unlimitedVoice: false,
      features: [
        "Unlimited chat sessions",
        "Basic mood tracking",
        "Progress insights",
        "24/7 availability",
        "Voice is disabled",
      ],
      isActive: true,
    });

    // Initialize Voice Only Plan
    await subscriptionRepository.createSubscriptionPlan({
      name: "voice_only",
      displayName: "Voice Only Plan",
      price: "49.00",
      stripePriceId: process.env.STRIPE_VOICE_ONLY_PRICE_ID || "",
      chatCreditsPerMessage: 5,
      voiceCreditsPerInteraction: 10,
      dailyVoiceCredits: 300,
      monthlyVoiceCredits: 9000,
      unlimitedChat: false,
      unlimitedVoice: false,
      features: [
        "30 minutes of daily voice (~900 mins/month)",
        "Natural conversation",
        "Advanced mood tracking",
        "Personalized insights",
        "Priority support",
        "Chat is disabled",
      ],
      isActive: true,
    });

    // Initialize Premium Plan
    await subscriptionRepository.createSubscriptionPlan({
      name: "premium",
      displayName: "Premium Plan",
      price: "99.00",
      stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || "",
      chatCreditsPerMessage: 5,
      voiceCreditsPerInteraction: 10,
      dailyVoiceCredits: 300,
      monthlyVoiceCredits: 9000,
      unlimitedChat: true,
      unlimitedVoice: true,
      features: [
        "Everything in Voice Only",
        "Unlimited chat sessions",
        "Switch between modes",
        "Premium insights",
        "Crisis support access",
      ],
      isActive: true,
    });

    console.log("✅ Subscription plans initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing subscription plans:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  initSubscriptionPlans()
    .then(() => {
      console.log("Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export { initSubscriptionPlans };
