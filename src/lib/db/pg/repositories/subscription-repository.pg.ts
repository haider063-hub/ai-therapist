import { eq, and, desc, sql } from "drizzle-orm";
import { pgDb } from "../db.pg";
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
        updatedAt: new Date(),
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
    const user = await this.getUserById(userId);
    if (!user) return null;

    // Premium users have unlimited access to both
    if (user.subscriptionType === "premium") {
      return user;
    }

    // Chat only plan has unlimited chat
    if (user.subscriptionType === "chat_only" && type === "chat") {
      return user;
    }

    // Voice only plan has unlimited voice (with daily/monthly limits)
    if (user.subscriptionType === "voice_only" && type === "voice") {
      // Check voice plan daily/monthly limits
      const now = new Date();
      const lastDailyReset = user.lastDailyReset || user.createdAt;
      const lastMonthlyReset = user.lastMonthlyReset || user.createdAt;

      // Check if we need to reset daily credits
      if (
        now.getDate() !== lastDailyReset.getDate() ||
        now.getMonth() !== lastDailyReset.getMonth() ||
        now.getFullYear() !== lastDailyReset.getFullYear()
      ) {
        await this.resetDailyVoiceCredits(userId);
      }

      // Check if we need to reset monthly credits
      if (
        now.getMonth() !== lastMonthlyReset.getMonth() ||
        now.getFullYear() !== lastMonthlyReset.getFullYear()
      ) {
        await this.resetMonthlyVoiceCredits(userId);
      }

      // Get updated user after potential resets
      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) return null;

      // Check daily limit
      if (
        updatedUser.voiceCreditsUsedToday + amount >
        updatedUser.dailyVoiceCredits
      ) {
        throw new Error("Daily voice credit limit exceeded");
      }

      // Check monthly limit
      if (
        updatedUser.voiceCreditsUsedThisMonth + amount >
        updatedUser.monthlyVoiceCredits
      ) {
        throw new Error("Monthly voice credit limit exceeded");
      }

      // Update voice usage counters
      const result = await pgDb
        .update(UserSchema)
        .set({
          voiceCreditsUsedToday: updatedUser.voiceCreditsUsedToday + amount,
          voiceCreditsUsedThisMonth:
            updatedUser.voiceCreditsUsedThisMonth + amount,
          updatedAt: new Date(),
        })
        .where(eq(UserSchema.id, userId))
        .returning();

      return result[0];
    }

    // For all other cases (free trial, or using bonus credits on paid plans)
    // Deduct from the appropriate credit pool
    if (type === "chat") {
      const totalChatCredits = user.chatCredits + user.chatCreditsFromTopup;
      if (totalChatCredits < amount) {
        throw new Error("Insufficient chat credits");
      }

      // Deduct from topup credits first, then from free credits
      let remainingAmount = amount;
      let newTopupCredits = user.chatCreditsFromTopup;
      let newFreeCredits = user.chatCredits;

      if (newTopupCredits >= remainingAmount) {
        newTopupCredits -= remainingAmount;
      } else {
        remainingAmount -= newTopupCredits;
        newTopupCredits = 0;
        newFreeCredits -= remainingAmount;
      }

      const result = await pgDb
        .update(UserSchema)
        .set({
          chatCredits: newFreeCredits,
          chatCreditsFromTopup: newTopupCredits,
          credits: user.credits - amount, // Keep legacy field in sync
          updatedAt: new Date(),
        })
        .where(eq(UserSchema.id, userId))
        .returning();

      return result[0];
    } else {
      // Voice credits
      const totalVoiceCredits = user.voiceCredits + user.voiceCreditsFromTopup;
      if (totalVoiceCredits < amount) {
        throw new Error("Insufficient voice credits");
      }

      // Deduct from topup credits first, then from free credits
      let remainingAmount = amount;
      let newTopupCredits = user.voiceCreditsFromTopup;
      let newFreeCredits = user.voiceCredits;

      if (newTopupCredits >= remainingAmount) {
        newTopupCredits -= remainingAmount;
      } else {
        remainingAmount -= newTopupCredits;
        newTopupCredits = 0;
        newFreeCredits -= remainingAmount;
      }

      const result = await pgDb
        .update(UserSchema)
        .set({
          voiceCredits: newFreeCredits,
          voiceCreditsFromTopup: newTopupCredits,
          credits: user.credits - amount, // Keep legacy field in sync
          updatedAt: new Date(),
        })
        .where(eq(UserSchema.id, userId))
        .returning();

      return result[0];
    }
  },

  async addCredits(userId: string, amount: number): Promise<UserEntity> {
    const result = await pgDb
      .update(UserSchema)
      .set({
        credits: sql`${UserSchema.credits} + ${amount}`,
        updatedAt: new Date(),
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
        updatedAt: new Date(),
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
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, userId))
      .returning();

    return result[0];
  },

  async resetDailyVoiceCredits(userId: string): Promise<void> {
    await pgDb
      .update(UserSchema)
      .set({
        voiceCreditsUsedToday: 0,
        lastDailyReset: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, userId));
  },

  async resetMonthlyVoiceCredits(userId: string): Promise<void> {
    await pgDb
      .update(UserSchema)
      .set({
        voiceCreditsUsedThisMonth: 0,
        lastMonthlyReset: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, userId));
  },

  // Transaction operations
  async createTransaction(
    transaction: Omit<TransactionEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<TransactionEntity> {
    const result = await pgDb
      .insert(TransactionSchema)
      .values({
        ...transaction,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
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
        timestamp: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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

    // Premium users can use everything
    if (user.subscriptionType === "premium") {
      return { canUse: true };
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
        // Check daily and monthly limits
        const now = new Date();
        const lastDailyReset = user.lastDailyReset || user.createdAt;
        const lastMonthlyReset = user.lastMonthlyReset || user.createdAt;

        // Check if we need to reset daily credits
        if (
          now.getDate() !== lastDailyReset.getDate() ||
          now.getMonth() !== lastDailyReset.getMonth() ||
          now.getFullYear() !== lastDailyReset.getFullYear()
        ) {
          await this.resetDailyVoiceCredits(userId);
          const updatedUser = await this.getUserById(userId);
          if (
            updatedUser &&
            updatedUser.voiceCreditsUsedToday + 10 <=
              updatedUser.dailyVoiceCredits
          ) {
            return { canUse: true };
          }
        }

        // Check if we need to reset monthly credits
        if (
          now.getMonth() !== lastMonthlyReset.getMonth() ||
          now.getFullYear() !== lastMonthlyReset.getFullYear()
        ) {
          await this.resetMonthlyVoiceCredits(userId);
          const updatedUser = await this.getUserById(userId);
          if (
            updatedUser &&
            updatedUser.voiceCreditsUsedThisMonth + 10 <=
              updatedUser.monthlyVoiceCredits
          ) {
            return { canUse: true };
          }
        }

        // Check daily limit
        if (user.voiceCreditsUsedToday + 10 > user.dailyVoiceCredits) {
          return {
            canUse: false,
            reason: `Daily voice limit reached (${user.dailyVoiceCredits} credits). Resets tomorrow.`,
          };
        }

        // Check monthly limit
        if (user.voiceCreditsUsedThisMonth + 10 > user.monthlyVoiceCredits) {
          return {
            canUse: false,
            reason: `Monthly voice limit reached (${user.monthlyVoiceCredits} credits). Resets next month.`,
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
};
