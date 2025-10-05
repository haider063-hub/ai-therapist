import { subscriptionRepository } from "../src/lib/db/pg/repositories/subscription-repository.pg";
// import { SUBSCRIPTION_PLANS } from '../src/lib/stripe/server'; // Not used - we define plans directly

async function initSubscriptionPlans() {
  console.log("Initializing subscription plans...");

  try {
    // Initialize Chat Only Plan
    await subscriptionRepository.createSubscriptionPlan({
      name: "chat_only",
      displayName: "Chat Only",
      price: "19.00",
      stripePriceId: process.env.STRIPE_CHAT_ONLY_PRICE_ID || "",
      chatCreditsPerMessage: 5,
      voiceCreditsPerMinute: 10,
      dailyVoiceCredits: 0,
      monthlyVoiceCredits: 0,
      unlimitedChat: true,
      unlimitedVoice: false,
      isOneTimePayment: false, // Monthly subscription
      features: [
        "Unlimited chat credits",
        "Basic mood tracking",
        "Progress insights",
        "24/7 availability",
        "Crisis-mode support",
      ],
      isActive: true,
    });

    // Initialize Voice Only Plan
    await subscriptionRepository.createSubscriptionPlan({
      name: "voice_only",
      displayName: "Voice Only",
      price: "49.00",
      stripePriceId: process.env.STRIPE_VOICE_ONLY_PRICE_ID || "",
      chatCreditsPerMessage: 5,
      voiceCreditsPerMinute: 10,
      dailyVoiceCredits: 1000,
      monthlyVoiceCredits: 1000,
      unlimitedChat: false,
      unlimitedVoice: false,
      isOneTimePayment: false, // Monthly subscription
      features: [
        "1,000 voice credits",
        "Human-like conversation",
        "Advanced mood tracking",
        "Personalized insights",
        "Priority support",
      ],
      isActive: true,
    });

    // Initialize Voice + Chat Plan
    await subscriptionRepository.createSubscriptionPlan({
      name: "voice_chat",
      displayName: "Voice + Chat",
      price: "69.00",
      stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || "",
      chatCreditsPerMessage: 5,
      voiceCreditsPerMinute: 10,
      dailyVoiceCredits: 1400,
      monthlyVoiceCredits: 1400,
      unlimitedChat: true,
      unlimitedVoice: false,
      isOneTimePayment: false, // Monthly subscription
      features: [
        "Everything in Voice Only",
        "1,400 voice credits",
        "Unlimited chat conversations",
        "Advanced mood tracking",
        "Crisis-mode support",
      ],
      isActive: true,
    });

    // Initialize Voice Top-Up Plan
    await subscriptionRepository.createSubscriptionPlan({
      name: "voice_topup",
      displayName: "Voice Top-Up",
      price: "19.00",
      stripePriceId: process.env.STRIPE_VOICE_TOPUPS_PRICE_ID || "",
      chatCreditsPerMessage: 0,
      voiceCreditsPerMinute: 10,
      dailyVoiceCredits: 0,
      monthlyVoiceCredits: 0,
      unlimitedChat: false,
      unlimitedVoice: false,
      isOneTimePayment: true,
      features: [
        "300 voice credits",
        "Instant availability",
        "No subscription required",
        "Works with any plan",
        "Purchase as many as you want",
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
