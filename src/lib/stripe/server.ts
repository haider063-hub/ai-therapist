import Stripe from "stripe";

// Initialize Stripe with better error handling
function initializeStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn(
      "STRIPE_SECRET_KEY is not set - Stripe features will be disabled",
    );
    return null;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
    return stripe;
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    return null;
  }
}

// Initialize on module load
const stripe = initializeStripe();

export { stripe };

// Stripe Price IDs from environment variables
export const STRIPE_PRICE_IDS = {
  CHAT_ONLY: process.env.STRIPE_CHAT_ONLY_PRICE_ID || "",
  VOICE_ONLY: process.env.STRIPE_VOICE_ONLY_PRICE_ID || "",
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID || "",
  VOICE_TOPUPS: process.env.STRIPE_VOICE_TOPUPS_PRICE_ID || "",
} as const;

// Subscription plan configurations (used in API routes)
export const SUBSCRIPTION_PLANS = {
  CHAT_ONLY: {
    name: "chat_only",
    displayName: "Chat Only",
    price: 19.0,
    stripePriceId: STRIPE_PRICE_IDS.CHAT_ONLY,
    chatCreditsPerMessage: 5,
    voiceCreditsPerMinute: 10, // 10 credits per minute (user + bot duration)
    dailyVoiceCredits: 0, // No voice access
    monthlyVoiceCredits: 0, // No voice access
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
  },
  VOICE_ONLY: {
    name: "voice_only",
    displayName: "Voice Only",
    price: 49.0,
    stripePriceId: STRIPE_PRICE_IDS.VOICE_ONLY,
    chatCreditsPerMessage: 5,
    voiceCreditsPerMinute: 10, // 10 credits per minute (user + bot duration)
    dailyVoiceCredits: 1000, // 1000 credits (≈ 100 minutes)
    monthlyVoiceCredits: 1000, // 1000 credits per month
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
  },
  VOICE_CHAT: {
    name: "voice_chat",
    displayName: "Voice + Chat",
    price: 69.0,
    stripePriceId: STRIPE_PRICE_IDS.PREMIUM,
    chatCreditsPerMessage: 5,
    voiceCreditsPerMinute: 10, // 10 credits per minute (user + bot duration)
    dailyVoiceCredits: 1400, // 1400 credits (≈ 140 minutes)
    monthlyVoiceCredits: 1400, // 1400 credits per month
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
  },
  VOICE_TOPUP: {
    name: "voice_topup",
    displayName: "Voice Top-Up",
    price: 19.0,
    stripePriceId: STRIPE_PRICE_IDS.VOICE_TOPUPS,
    chatCreditsPerMessage: 0,
    voiceCreditsPerMinute: 10, // 10 credits per minute (user + bot duration)
    dailyVoiceCredits: 0,
    monthlyVoiceCredits: 0,
    unlimitedChat: false,
    unlimitedVoice: false,
    creditsAdded: 300, // 300 voice credits (≈ 30 minutes)
    isOneTimePayment: true, // This is a one-time purchase, not monthly
    features: [
      "300 voice credits",
      "Instant availability",
      "No subscription required",
      "Works with any plan",
      "Purchase as many as you want",
    ],
  },
} as const;

// Credit costs for free trial users
export const CREDIT_COSTS = {
  CHAT_MESSAGE: 5,
  VOICE_PER_MINUTE: 10, // 10 credits per minute (user + bot duration)
} as const;

// Free trial starting credits (split into 200 chat + 200 voice)
export const FREE_TRIAL_CREDITS = 400;
export const FREE_TRIAL_CHAT_CREDITS = 200;
export const FREE_TRIAL_VOICE_CREDITS = 200;
