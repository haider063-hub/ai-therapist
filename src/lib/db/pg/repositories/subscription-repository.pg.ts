import { eq, and, desc, sql } from "drizzle-orm";
import { pgDb } from "../db.pg";
import { getCurrentUTCTime } from "lib/utils/timezone-utils";

// Helper function to get UTC timestamp for database storage
function getUTCTimestamp(): Date {
  return new Date(getCurrentUTCTime());
}

import {
  UserSchema,
  TransactionSchema,
  UsageLogSchema,
  SubscriptionPlanSchema,
  type UserEntity,
  type TransactionEntity,
  type UsageLogEntity,
  type SubscriptionPlanEntity,
} from "../schema.pg";

export const subscriptionRepository = {
  // User subscription and credit operations
  async getUserById(userId: string): Promise<UserEntity | null> {
    const result = await pgDb
      .select()
      .from(UserSchema)
      .where(eq(UserSchema.id, userId))
      .limit(1);

    return result[0] || null;
  },

  async updateUserSubscription(
    userId: string,
    data: Partial<UserEntity>,
  ): Promise<UserEntity> {
    const result = await pgDb
      .update(UserSchema)
      .set({
        ...data,
        updatedAt: getUTCTimestamp(),
      })
      .where(eq(UserSchema.id, userId))
      .returning();

    return result[0];
  },

  async deductCredits(
    userId: string,
    amount: number,
    type: "chat" | "voice",
  ): Promise<UserEntity | null> {
    // Use atomic transaction to prevent race conditions
    return await pgDb.transaction(async (tx) => {
      // Lock the user row for update to prevent concurrent modifications
      const user = await tx
        .select()
        .from(UserSchema)
        .where(eq(UserSchema.id, userId))
        .for("update")
        .limit(1);

      if (!user || user.length === 0) {
        return null;
      }

      const currentUser = user[0];

      // Check if paid subscription has expired
      if (
        currentUser.subscriptionType !== "free_trial" &&
        currentUser.subscriptionEndDate &&
        getUTCTimestamp() > currentUser.subscriptionEndDate
      ) {
        throw new Error(
          "Your subscription has expired. Please renew your subscription to continue.",
        );
      }

      // Premium users (voice_chat plan) - track monthly usage
      if (currentUser.subscriptionType === "voice_chat") {
        if (type === "chat") {
          // Chat is unlimited for voice_chat plan - no deduction needed
          // Just return the user without any changes
          return currentUser;
        } else {
          // Voice: Track monthly usage against plan limit (1400) + any top-up credits
          const planCredits = 1400; // Monthly plan credits
          const topupCredits = currentUser.voiceCreditsFromTopup || 0;
          const usedThisMonth = currentUser.voiceCreditsUsedThisMonth || 0;
          const remainingPlanCredits = Math.max(0, planCredits - usedThisMonth);
          const totalAvailable = remainingPlanCredits + topupCredits;

          if (totalAvailable < amount) {
            throw new Error(
              `Insufficient voice credits. You have ${totalAvailable} credits remaining (${remainingPlanCredits} from plan, ${topupCredits} from top-up).`,
            );
          }

          // Deduct from plan credits first, then from top-up credits
          let planUsage = 0;
          let topupUsage = 0;

          if (remainingPlanCredits >= amount) {
            // Enough plan credits available
            planUsage = amount;
          } else {
            // Use all remaining plan credits, then deduct from top-up
            planUsage = remainingPlanCredits;
            topupUsage = amount - remainingPlanCredits;
          }

          // Update monthly usage counter and deduct from top-up if needed
          const result = await tx
            .update(UserSchema)
            .set({
              voiceCreditsUsedThisMonth: usedThisMonth + planUsage,
              voiceCreditsFromTopup: topupCredits - topupUsage,
              updatedAt: getUTCTimestamp(),
            })
            .where(eq(UserSchema.id, userId))
            .returning();
          return result[0];
        }
      }

      // Chat only plan
      if (currentUser.subscriptionType === "chat_only") {
        if (type === "chat") {
          // Chat is unlimited for chat_only plan - no deduction needed
          // Just return the user without any changes
          return currentUser;
        } else {
          // Voice: Use free trial + top-up credits
          const totalVoiceCredits =
            currentUser.voiceCredits + currentUser.voiceCreditsFromTopup;
          if (totalVoiceCredits < amount) {
            throw new Error("Insufficient voice credits");
          }

          // Deduct from free trial credits first, then from top-up credits
          let remainingAmount = amount;
          let newFreeCredits = currentUser.voiceCredits;
          let newTopupCredits = currentUser.voiceCreditsFromTopup;

          if (newFreeCredits >= remainingAmount) {
            newFreeCredits -= remainingAmount;
          } else {
            remainingAmount -= newFreeCredits;
            newFreeCredits = 0;
            newTopupCredits -= remainingAmount;
          }

          const result = await tx
            .update(UserSchema)
            .set({
              voiceCredits: newFreeCredits,
              voiceCreditsFromTopup: newTopupCredits,
              credits: currentUser.credits - amount,
              updatedAt: getUTCTimestamp(),
            })
            .where(eq(UserSchema.id, userId))
            .returning();

          return result[0];
        }
      }

      // Voice only plan - track monthly usage
      if (currentUser.subscriptionType === "voice_only") {
        if (type === "voice") {
          // Voice: Track monthly usage against plan limit (1000) + any top-up credits
          const planCredits = 1000; // Monthly plan credits
          const topupCredits = currentUser.voiceCreditsFromTopup || 0;
          const usedThisMonth = currentUser.voiceCreditsUsedThisMonth || 0;
          const remainingPlanCredits = Math.max(0, planCredits - usedThisMonth);
          const totalAvailable = remainingPlanCredits + topupCredits;

          if (totalAvailable < amount) {
            throw new Error(
              `Insufficient voice credits. You have ${totalAvailable} credits remaining (${remainingPlanCredits} from plan, ${topupCredits} from top-up).`,
            );
          }

          // Deduct from plan credits first, then from top-up credits
          let planUsage = 0;
          let topupUsage = 0;

          if (remainingPlanCredits >= amount) {
            // Enough plan credits available
            planUsage = amount;
          } else {
            // Use all remaining plan credits, then deduct from top-up
            planUsage = remainingPlanCredits;
            topupUsage = amount - remainingPlanCredits;
          }

          // Update monthly usage counter and deduct from top-up if needed
          const result = await tx
            .update(UserSchema)
            .set({
              voiceCreditsUsedThisMonth: usedThisMonth + planUsage,
              voiceCreditsFromTopup: topupCredits - topupUsage,
              updatedAt: getUTCTimestamp(),
            })
            .where(eq(UserSchema.id, userId))
            .returning();
          return result[0];
        } else {
          // Chat: Use free trial + top-up credits
          const totalChatCredits =
            currentUser.chatCredits + currentUser.chatCreditsFromTopup;
          if (totalChatCredits < amount) {
            throw new Error("Insufficient chat credits");
          }

          // Deduct from free trial credits first, then from top-up credits
          let remainingAmount = amount;
          let newFreeCredits = currentUser.chatCredits;
          let newTopupCredits = currentUser.chatCreditsFromTopup;

          if (newFreeCredits >= remainingAmount) {
            newFreeCredits -= remainingAmount;
          } else {
            remainingAmount -= newFreeCredits;
            newFreeCredits = 0;
            newTopupCredits -= remainingAmount;
          }

          const result = await tx
            .update(UserSchema)
            .set({
              chatCredits: newFreeCredits,
              chatCreditsFromTopup: newTopupCredits,
              credits: currentUser.credits - amount,
              updatedAt: getUTCTimestamp(),
            })
            .where(eq(UserSchema.id, userId))
            .returning();

          return result[0];
        }
      }

      // For all other cases (free trial, or using bonus credits on paid plans)
      // Deduct from the appropriate credit pool
      if (type === "chat") {
        const totalChatCredits =
          currentUser.chatCredits + currentUser.chatCreditsFromTopup;

        if (totalChatCredits < amount) {
          throw new Error("Insufficient chat credits");
        }

        // Deduct from free trial credits first, then from top-up credits
        let remainingAmount = amount;
        let newFreeCredits = currentUser.chatCredits;
        let newTopupCredits = currentUser.chatCreditsFromTopup;

        if (newFreeCredits >= remainingAmount) {
          // Enough free credits available
          newFreeCredits -= remainingAmount;
        } else {
          // Use all free credits, then deduct from top-up
          remainingAmount -= newFreeCredits;
          newFreeCredits = 0;
          newTopupCredits -= remainingAmount;
        }

        const result = await tx
          .update(UserSchema)
          .set({
            chatCredits: newFreeCredits,
            chatCreditsFromTopup: newTopupCredits,
            credits: currentUser.credits - amount, // Keep legacy field in sync
            updatedAt: getUTCTimestamp(),
          })
          .where(eq(UserSchema.id, userId))
          .returning();

        return result[0];
      } else {
        // Voice credits
        const totalVoiceCredits =
          currentUser.voiceCredits + currentUser.voiceCreditsFromTopup;
        if (totalVoiceCredits < amount) {
          throw new Error("Insufficient voice credits");
        }

        // Deduct from free trial credits first, then from top-up credits
        let remainingAmount = amount;
        let newFreeCredits = currentUser.voiceCredits;
        let newTopupCredits = currentUser.voiceCreditsFromTopup;

        if (newFreeCredits >= remainingAmount) {
          // Enough free credits available
          newFreeCredits -= remainingAmount;
        } else {
          // Use all free credits, then deduct from top-up
          remainingAmount -= newFreeCredits;
          newFreeCredits = 0;
          newTopupCredits -= remainingAmount;
        }

        const result = await tx
          .update(UserSchema)
          .set({
            voiceCredits: newFreeCredits,
            voiceCreditsFromTopup: newTopupCredits,
            credits: currentUser.credits - amount, // Keep legacy field in sync
            updatedAt: getUTCTimestamp(),
          })
          .where(eq(UserSchema.id, userId))
          .returning();

        return result[0];
      }
    });
  },

  async addCredits(userId: string, amount: number): Promise<UserEntity> {
    const result = await pgDb
      .update(UserSchema)
      .set({
        credits: sql`${UserSchema.credits} + ${amount}`,
        updatedAt: getUTCTimestamp(),
      })
      .where(eq(UserSchema.id, userId))
      .returning();

    return result[0];
  },

  async addChatTopupCredits(
    userId: string,
    amount: number,
  ): Promise<UserEntity> {
    const result = await pgDb
      .update(UserSchema)
      .set({
        chatCreditsFromTopup: sql`${UserSchema.chatCreditsFromTopup} + ${amount}`,
        credits: sql`${UserSchema.credits} + ${amount}`, // Keep legacy field in sync
        updatedAt: getUTCTimestamp(),
      })
      .where(eq(UserSchema.id, userId))
      .returning();

    return result[0];
  },

  async addVoiceTopupCredits(
    userId: string,
    amount: number,
  ): Promise<UserEntity> {
    const result = await pgDb
      .update(UserSchema)
      .set({
        voiceCreditsFromTopup: sql`${UserSchema.voiceCreditsFromTopup} + ${amount}`,
        credits: sql`${UserSchema.credits} + ${amount}`, // Keep legacy field in sync
        updatedAt: getUTCTimestamp(),
      })
      .where(eq(UserSchema.id, userId))
      .returning();

    return result[0];
  },

  // Transaction operations
  async createTransaction(
    transaction: Omit<TransactionEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<TransactionEntity> {
    // Check for existing transaction with same Stripe payment ID to prevent duplicates
    if (transaction.stripePaymentId) {
      const existingTransaction = await this.getTransactionByStripePaymentId(
        transaction.stripePaymentId,
      );
      if (existingTransaction) {
        console.log(
          "Transaction already exists, returning existing:",
          existingTransaction.id,
        );
        return existingTransaction;
      }
    }

    const result = await pgDb
      .insert(TransactionSchema)
      .values({
        ...transaction,
        id: crypto.randomUUID(),
        createdAt: getUTCTimestamp(),
        updatedAt: getUTCTimestamp(),
      })
      .returning();

    return result[0];
  },

  async getTransactionByStripePaymentId(
    stripePaymentId: string,
  ): Promise<TransactionEntity | null> {
    const result = await pgDb
      .select()
      .from(TransactionSchema)
      .where(eq(TransactionSchema.stripePaymentId, stripePaymentId))
      .limit(1);

    return result[0] || null;
  },

  async getTransactionsByUserId(
    userId: string,
    limit: number = 10,
  ): Promise<TransactionEntity[]> {
    const result = await pgDb
      .select()
      .from(TransactionSchema)
      .where(eq(TransactionSchema.userId, userId))
      .orderBy(desc(TransactionSchema.createdAt))
      .limit(limit);

    return result;
  },

  // Usage log operations
  async createUsageLog(
    log: Omit<UsageLogEntity, "id" | "timestamp">,
  ): Promise<UsageLogEntity> {
    const result = await pgDb
      .insert(UsageLogSchema)
      .values({
        ...log,
        id: crypto.randomUUID(),
        timestamp: getUTCTimestamp(),
      })
      .returning();

    return result[0];
  },

  async getUsageLogsByUserId(
    userId: string,
    limit: number = 50,
  ): Promise<UsageLogEntity[]> {
    const result = await pgDb
      .select()
      .from(UsageLogSchema)
      .where(eq(UsageLogSchema.userId, userId))
      .orderBy(desc(UsageLogSchema.timestamp))
      .limit(limit);

    return result;
  },

  // Subscription plan operations
  async getSubscriptionPlanByName(
    name: string,
  ): Promise<SubscriptionPlanEntity | null> {
    const result = await pgDb
      .select()
      .from(SubscriptionPlanSchema)
      .where(
        and(
          eq(SubscriptionPlanSchema.name, name),
          eq(SubscriptionPlanSchema.isActive, true),
        ),
      )
      .limit(1);

    return result[0] || null;
  },

  async getAllActiveSubscriptionPlans(): Promise<SubscriptionPlanEntity[]> {
    const result = await pgDb
      .select()
      .from(SubscriptionPlanSchema)
      .where(eq(SubscriptionPlanSchema.isActive, true))
      .orderBy(SubscriptionPlanSchema.price);

    return result;
  },

  async createSubscriptionPlan(
    plan: Omit<SubscriptionPlanEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<SubscriptionPlanEntity> {
    const result = await pgDb
      .insert(SubscriptionPlanSchema)
      .values({
        ...plan,
        id: crypto.randomUUID(),
        createdAt: getUTCTimestamp(),
        updatedAt: getUTCTimestamp(),
      })
      .returning();

    return result[0];
  },

  // Check if user can use a feature
  async canUseFeature(
    userId: string,
    featureType: "chat" | "voice",
  ): Promise<{
    canUse: boolean;
    reason?: string;
    creditsNeeded?: number;
  }> {
    const user = await this.getUserById(userId);
    if (!user) {
      return { canUse: false, reason: "User not found" };
    }

    if (user.banned) {
      return { canUse: false, reason: "User is banned" };
    }

    // Check if paid subscription has expired
    if (
      user.subscriptionType !== "free_trial" &&
      user.subscriptionEndDate &&
      getUTCTimestamp() > user.subscriptionEndDate &&
      user.subscriptionStatus === "active"
    ) {
      // Subscription expired - should have been handled by Stripe webhooks
      // But handle it here as fallback
      await this.updateUserSubscription(userId, {
        subscriptionType: "free_trial",
        subscriptionStatus: "expired",
        subscriptionEndDate: null,
        chatCredits: 0, // Reset plan credits to 0
        voiceCredits: 0, // Reset plan credits to 0
        voiceCreditsUsedToday: 0,
        voiceCreditsUsedThisMonth: 0,
      });

      // Return user as free trial - recheck feature access with remaining topup credits only
      return this.canUseFeature(userId, featureType);
    }

    // Premium users can use everything
    if (user.subscriptionType === "premium") {
      return { canUse: true };
    }

    // Voice + Chat (Premium) plan
    if (user.subscriptionType === "voice_chat") {
      if (featureType === "voice") {
        // Premium plan: Check monthly usage against plan limit (1400) + any top-up credits
        const planCredits = 1400;
        const topupCredits = user.voiceCreditsFromTopup || 0;
        const usedThisMonth = user.voiceCreditsUsedThisMonth || 0;
        const totalAvailable = planCredits + topupCredits;
        const remainingCredits = totalAvailable - usedThisMonth;

        if (remainingCredits < 10) {
          return {
            canUse: false,
            reason: `Insufficient voice credits. You have ${remainingCredits} credits remaining this month.`,
          };
        }
        return { canUse: true };
      } else {
        // Chat is unlimited for premium plan
        return { canUse: true };
      }
    }

    // Chat only plan
    if (user.subscriptionType === "chat_only") {
      if (featureType === "chat") {
        return { canUse: true }; // Unlimited chat
      } else {
        // Check if user has voice credits from topup or free trial
        const totalVoiceCredits =
          user.voiceCredits + user.voiceCreditsFromTopup;
        if (totalVoiceCredits >= 10) {
          return { canUse: true };
        }
        return {
          canUse: false,
          reason:
            "Voice not available in Chat Only plan. Upgrade to Premium or purchase voice top-ups.",
        };
      }
    }

    // Voice only plan
    if (user.subscriptionType === "voice_only") {
      if (featureType === "voice") {
        // Voice only plan: Check monthly usage against plan limit (1000) + any top-up credits
        const planCredits = 1000;
        const topupCredits = user.voiceCreditsFromTopup || 0;
        const usedThisMonth = user.voiceCreditsUsedThisMonth || 0;
        const totalAvailable = planCredits + topupCredits;
        const remainingCredits = totalAvailable - usedThisMonth;

        if (remainingCredits < 10) {
          return {
            canUse: false,
            reason: `Insufficient voice credits. You have ${remainingCredits} credits remaining this month.`,
          };
        }
        return { canUse: true };
      } else {
        // Check if user has chat credits from topup or free trial
        const totalChatCredits = user.chatCredits + user.chatCreditsFromTopup;
        if (totalChatCredits >= 5) {
          return { canUse: true };
        }
        return {
          canUse: false,
          reason: "Chat not available in Voice Only plan. Upgrade to Premium.",
        };
      }
    }

    // Free trial users - check separate credit pools
    if (featureType === "chat") {
      const totalChatCredits = user.chatCredits + user.chatCreditsFromTopup;
      if (totalChatCredits < 5) {
        return {
          canUse: false,
          reason: "Insufficient chat credits",
          creditsNeeded: 5 - totalChatCredits,
        };
      }
      return { canUse: true };
    } else {
      const totalVoiceCredits = user.voiceCredits + user.voiceCreditsFromTopup;
      if (totalVoiceCredits < 10) {
        return {
          canUse: false,
          reason: "Insufficient voice credits",
          creditsNeeded: 10 - totalVoiceCredits,
        };
      }
      return { canUse: true };
    }
  },

  // Image upload tracking methods
  async canUploadImage(userId: string): Promise<{
    canUpload: boolean;
    reason?: string;
    imagesUsed?: number;
    imagesRemaining?: number;
  }> {
    const user = await this.getUserById(userId);
    if (!user) {
      return { canUpload: false, reason: "User not found" };
    }

    if (user.banned) {
      return { canUpload: false, reason: "User is banned" };
    }

    // Only chat_only and voice_chat (premium) users can upload images
    if (
      user.subscriptionType !== "chat_only" &&
      user.subscriptionType !== "voice_chat"
    ) {
      return {
        canUpload: false,
        reason:
          "Image upload is only available for Chat Only and Premium plans",
      };
    }

    // Reset monthly counter if needed
    const now = getUTCTimestamp();
    const resetDate = new Date(user.imageUsageResetDate);
    const monthsSinceReset =
      (now.getFullYear() - resetDate.getFullYear()) * 12 +
      (now.getMonth() - resetDate.getMonth());

    if (monthsSinceReset >= 1) {
      // Reset the counter
      await pgDb
        .update(UserSchema)
        .set({
          imagesUsedThisMonth: 0,
          imageUsageResetDate: now,
          updatedAt: now,
        })
        .where(eq(UserSchema.id, userId));

      return {
        canUpload: true,
        imagesUsed: 0,
        imagesRemaining: 50,
      };
    }

    // Check if user has reached the limit (50 images per month)
    if (user.imagesUsedThisMonth >= 50) {
      return {
        canUpload: false,
        reason: "Monthly image upload limit reached (50/month)",
        imagesUsed: user.imagesUsedThisMonth,
        imagesRemaining: 0,
      };
    }

    return {
      canUpload: true,
      imagesUsed: user.imagesUsedThisMonth,
      imagesRemaining: 50 - user.imagesUsedThisMonth,
    };
  },

  async incrementImageUsage(userId: string): Promise<void> {
    const now = getUTCTimestamp();
    await pgDb
      .update(UserSchema)
      .set({
        imagesUsedThisMonth: sql`${UserSchema.imagesUsedThisMonth} + 1`,
        updatedAt: now,
      })
      .where(eq(UserSchema.id, userId));
  },

  async getImageUsageStats(userId: string): Promise<{
    imagesUsed: number;
    imagesRemaining: number;
    resetDate: Date;
  } | null> {
    const user = await this.getUserById(userId);
    if (!user) {
      return null;
    }

    return {
      imagesUsed: user.imagesUsedThisMonth,
      imagesRemaining: Math.max(0, 50 - user.imagesUsedThisMonth),
      resetDate: user.imageUsageResetDate,
    };
  },
};
