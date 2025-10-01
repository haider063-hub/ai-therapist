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
    displayName: "Chat Only Plan",
    price: 19.0,
    stripePriceId: STRIPE_PRICE_IDS.CHAT_ONLY,
    chatCreditsPerMessage: 5,
    voiceCreditsPerInteraction: 10,
    dailyVoiceCredits: 0, // No voice access
    monthlyVoiceCredits: 0, // No voice access
    unlimitedChat: true,
    unlimitedVoice: false,
    features: [
      "Unlimited chat sessions",
      "Basic mood tracking",
      "Progress insights",
      "24/7 availability",
      "Voice is disabled",
    ],
  },
  VOICE_ONLY: {
    name: "voice_only",
    displayName: "Voice Only Plan",
    price: 49.0,
    stripePriceId: STRIPE_PRICE_IDS.VOICE_ONLY,
    chatCreditsPerMessage: 5,
    voiceCreditsPerInteraction: 10,
    dailyVoiceCredits: 300, // 300 credits per day
    monthlyVoiceCredits: 9000, // ~9000 credits per month
    unlimitedChat: false,
    unlimitedVoice: false,
    features: [
      "300 voice credits daily (~9000/month)",
      "Natural conversation",
      "Advanced mood tracking",
      "Personalized insights",
      "Priority support",
      "Chat is disabled",
    ],
  },
  PREMIUM: {
    name: "premium",
    displayName: "Premium Plan",
    price: 99.0,
    stripePriceId: STRIPE_PRICE_IDS.PREMIUM,
    chatCreditsPerMessage: 5,
    voiceCreditsPerInteraction: 10,
    dailyVoiceCredits: 300, // Daily limit for tracking
    monthlyVoiceCredits: 9000, // Monthly limit for tracking
    unlimitedChat: true,
    unlimitedVoice: true,
    features: [
      "300 voice credits daily (~9000/month)",
      "Unlimited chat sessions",
      "Switch between modes",
      "Premium insights",
      "Crisis support access",
    ],
  },
  VOICE_TOPUP: {
    name: "voice_topup",
    displayName: "Voice Top-Up",
    price: 15.0,
    stripePriceId: STRIPE_PRICE_IDS.VOICE_TOPUPS,
    chatCreditsPerMessage: 0,
    voiceCreditsPerInteraction: 10,
    dailyVoiceCredits: 0,
    monthlyVoiceCredits: 0,
    unlimitedChat: false,
    unlimitedVoice: false,
    creditsAdded: 1000, // 1000 voice credits
    features: [
      "1000 voice credits",
      "Pay-as-you-go (no subscription required)",
      "Instant availability",
    ],
  },
} as const;

// Credit costs for free trial users
export const CREDIT_COSTS = {
  CHAT_MESSAGE: 5,
  VOICE_INTERACTION: 10,
} as const;

// Free trial starting credits
export const FREE_TRIAL_CREDITS = 500;
