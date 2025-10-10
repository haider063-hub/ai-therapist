import { subscriptionRepository } from "../db/pg/repositories/subscription-repository.pg";
import { CREDIT_COSTS, SUBSCRIPTION_PLANS } from "../stripe/server";
import logger from "logger";

// Helper functions for plan type checks
export const isUnlimitedChatPlan = (subscriptionType: string): boolean => {
  return subscriptionType === "chat_only" || subscriptionType === "voice_chat";
};

export const isUnlimitedVoicePlan = (subscriptionType: string): boolean => {
  return subscriptionType === "voice_only" || subscriptionType === "voice_chat";
};

export const hasMonthlyVoiceCredits = (subscriptionType: string): boolean => {
  return subscriptionType === "voice_only" || subscriptionType === "voice_chat";
};

export type FeatureType = "chat" | "voice";

// Custom error enums for better debugging
export enum CreditError {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS",
  DB_ERROR = "DB_ERROR",
  FEATURE_NOT_AVAILABLE = "FEATURE_NOT_AVAILABLE",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
  DEDUCTION_FAILED = "DEDUCTION_FAILED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface CreditCheckResult {
  canUse: boolean;
  reason?: string;
  errorCode?: CreditError;
  creditsNeeded?: number;
  userCredits?: number;
  voiceCredits?: number;
  chatCredits?: number;
}

export class CreditService {
  private userCache = new Map<string, { user: any; timestamp: number }>();
  private readonly CACHE_TTL = 5000; // 5 seconds cache

  private async getUserWithCache(userId: string): Promise<any> {
    const cached = this.userCache.get(userId);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.user;
    }

    const user = await subscriptionRepository.getUserById(userId);
    if (user) {
      this.userCache.set(userId, { user, timestamp: now });
    }

    return user;
  }

  /**
   * Invalidate user cache to ensure fresh data after updates
   */
  private invalidateUserCache(userId: string): void {
    this.userCache.delete(userId);
  }

  /**
   * Calculate total voice credits for a user based on their subscription plan
   * Centralized function to ensure consistency across the codebase
   */
  private getVoiceCreditsForUser(user: any): number {
    // Get plan credits based on subscription type
    let planCredits = 0;

    if (user.subscriptionType === "voice_chat") {
      // Premium plan: Calculate remaining monthly credits
      const monthlyLimit = SUBSCRIPTION_PLANS.VOICE_CHAT.monthlyVoiceCredits;
      const usedThisMonth = user.voiceCreditsUsedThisMonth || 0;
      planCredits = Math.max(0, monthlyLimit - usedThisMonth);
    } else if (user.subscriptionType === "voice_only") {
      // Voice only plan: Calculate remaining monthly credits
      const monthlyLimit = SUBSCRIPTION_PLANS.VOICE_ONLY.monthlyVoiceCredits;
      const usedThisMonth = user.voiceCreditsUsedThisMonth || 0;
      planCredits = Math.max(0, monthlyLimit - usedThisMonth);
    } else {
      // Free trial or chat_only: use stored credits
      planCredits = user.voiceCredits || 0;
    }

    // Add topup credits
    return planCredits + (user.voiceCreditsFromTopup || 0);
  }
  /**
   * Check if a user can use a specific feature
   */
  async canUseFeature(
    userId: string,
    featureType: FeatureType,
  ): Promise<CreditCheckResult> {
    try {
      const result = await subscriptionRepository.canUseFeature(
        userId,
        featureType,
      );

      if (!result.canUse) {
        return result;
      }

      // Get additional user info for response (using cache)
      const user = await this.getUserWithCache(userId);
      if (!user) {
        return {
          canUse: false,
          reason: "User not found",
          errorCode: CreditError.USER_NOT_FOUND,
        };
      }

      // Calculate voice credits using centralized method
      const totalVoiceCredits = this.getVoiceCreditsForUser(user);

      return {
        canUse: true,
        userCredits: user.credits,
        voiceCredits: totalVoiceCredits,
        chatCredits: user.chatCredits + user.chatCreditsFromTopup,
      };
    } catch (error) {
      logger.error("Error checking feature usage:", error);
      return {
        canUse: false,
        reason: "Internal server error",
        errorCode: CreditError.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Deduct credits for using a feature
   */
  async deductCreditsForUsage(
    userId: string,
    featureType: FeatureType,
    threadId?: string,
  ): Promise<{
    success: boolean;
    reason?: string;
    creditsUsed?: number;
    remainingCredits?: number;
  }> {
    try {
      const creditsToDeduct =
        featureType === "chat"
          ? CREDIT_COSTS.CHAT_MESSAGE
          : CREDIT_COSTS.VOICE_PER_MINUTE;

      // Check if user can use the feature first
      const canUse = await this.canUseFeature(userId, featureType);
      if (!canUse.canUse) {
        return {
          success: false,
          reason: canUse.reason,
        };
      }

      // Deduct credits
      const updatedUser = await subscriptionRepository.deductCredits(
        userId,
        creditsToDeduct,
        featureType,
      );
      if (!updatedUser) {
        return {
          success: false,
          reason: "Failed to deduct credits",
        };
      }

      // Log the usage
      await subscriptionRepository.createUsageLog({
        userId,
        type: featureType,
        creditsUsed: creditsToDeduct,
        threadId: threadId || null,
        metadata: {
          timestamp: new Date().toISOString(),
          featureType,
        },
      });

      // Invalidate cache to ensure fresh data on next fetch
      this.invalidateUserCache(userId);

      // Calculate appropriate remaining credits based on plan type
      let remainingCredits;
      if (featureType === "chat") {
        if (isUnlimitedChatPlan(updatedUser.subscriptionType)) {
          // Unlimited chat plans - return -1 to indicate unlimited
          remainingCredits = -1;
        } else {
          // Limited chat plans
          remainingCredits =
            (updatedUser.chatCredits || 0) +
            (updatedUser.chatCreditsFromTopup || 0);
        }
      } else {
        // Voice credits - use the calculated method
        remainingCredits = this.getVoiceCreditsForUser(updatedUser);
      }

      return {
        success: true,
        creditsUsed: creditsToDeduct,
        remainingCredits: remainingCredits,
      };
    } catch (error) {
      logger.error("Error deducting credits:", error);
      return {
        success: false,
        reason: "Failed to process credit deduction",
      };
    }
  }

  /**
   * Deduct credits for voice usage based on actual audio duration
   * @param userId - User ID
   * @param userAudioDuration - User audio duration in seconds
   * @param botAudioDuration - Bot audio duration in seconds
   * @param threadId - Thread ID for logging
   */
  async deductVoiceCreditsByDuration(
    userId: string,
    userAudioDuration: number,
    botAudioDuration: number,
    threadId?: string,
  ): Promise<{
    success: boolean;
    reason?: string;
    creditsUsed?: number;
    remainingCredits?: number;
    minutesUsed?: number;
  }> {
    try {
      // Calculate total duration and exact minutes (with decimals)
      const totalSeconds = userAudioDuration + botAudioDuration;
      const exactMinutes = totalSeconds / 60; // Keep decimals: 150s = 2.5 minutes
      const creditsToDeduct = Math.ceil(
        exactMinutes * CREDIT_COSTS.VOICE_PER_MINUTE,
      ); // 2.5 × 10 = 25 credits (always round up to prevent undercharging)
      const minutesUsed = Math.round(exactMinutes * 10) / 10; // Round to 1 decimal place for display

      // Check if user can use voice feature
      const canUse = await this.canUseFeature(userId, "voice");
      if (!canUse.canUse) {
        return {
          success: false,
          reason: canUse.reason,
        };
      }

      // Deduct credits
      const updatedUser = await subscriptionRepository.deductCredits(
        userId,
        creditsToDeduct,
        "voice",
      );
      if (!updatedUser) {
        return {
          success: false,
          reason: "Failed to deduct credits",
        };
      }

      // Log the usage
      await subscriptionRepository.createUsageLog({
        userId,
        type: "voice",
        creditsUsed: creditsToDeduct,
        threadId: threadId || null,
        metadata: {
          timestamp: new Date().toISOString(),
          userAudioDuration,
          botAudioDuration,
          totalSeconds,
          minutesUsed,
          featureType: "voice",
        },
      });

      return {
        success: true,
        creditsUsed: creditsToDeduct,
        remainingCredits: updatedUser.credits,
        minutesUsed,
      };
    } catch (error) {
      logger.error("Error deducting voice credits by duration:", error);
      return {
        success: false,
        reason: "Failed to process voice credit deduction",
      };
    }
  }

  /**
   * Add credits to a user (for top-ups)
   */
  async addCredits(
    userId: string,
    amount: number,
    source: string,
  ): Promise<{
    success: boolean;
    reason?: string;
    newBalance?: number;
  }> {
    try {
      const updatedUser = await subscriptionRepository.addCredits(
        userId,
        amount,
      );

      // Log the credit addition
      await subscriptionRepository.createTransaction({
        userId,
        type: "topup",
        amount: "0", // This will be set by the actual payment
        creditsAdded: amount,
        stripePaymentId: null, // This will be set by the actual payment
        stripeSubscriptionId: null,
        status: "succeeded",
        metadata: {
          source,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: true,
        newBalance: updatedUser.credits,
      };
    } catch (error) {
      logger.error("Error adding credits:", error);
      return {
        success: false,
        reason: "Failed to add credits",
      };
    }
  }

  /**
   * Get user's current credit status
   */
  async getUserCreditStatus(userId: string): Promise<{
    credits: number;
    chatCredits: number;
    voiceCredits: number;
    chatCreditsFromTopup: number;
    voiceCreditsFromTopup: number;
    subscriptionType: string;
    subscriptionStatus: string;
    canUseChat: boolean;
    canUseVoice: boolean;
  } | null> {
    try {
      const user = await this.getUserWithCache(userId);
      if (!user) {
        return null;
      }

      const chatCheck = await this.canUseFeature(userId, "chat");
      const voiceCheck = await this.canUseFeature(userId, "voice");

      // Calculate voice credits using centralized method
      const totalVoiceCredits = this.getVoiceCreditsForUser(user);

      // Calculate chat credits based on subscription type
      let totalChatCredits;
      if (isUnlimitedChatPlan(user.subscriptionType)) {
        // Unlimited chat plans - return -1 to indicate unlimited in UI
        totalChatCredits = -1;
      } else {
        // Limited plans - return actual credits
        totalChatCredits =
          (user.chatCredits || 0) + (user.chatCreditsFromTopup || 0);
      }

      return {
        credits: user.credits,
        chatCredits: totalChatCredits,
        voiceCredits: totalVoiceCredits,
        chatCreditsFromTopup: user.chatCreditsFromTopup || 0,
        voiceCreditsFromTopup: user.voiceCreditsFromTopup || 0,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.subscriptionStatus,
        canUseChat: chatCheck.canUse,
        canUseVoice: voiceCheck.canUse,
      };
    } catch (error) {
      logger.error("Error getting user credit status:", error);
      return null;
    }
  }

  /**
   * Reset all users' daily voice credits (for cron job)
   */
  async resetAllUsersDailyVoiceCredits(): Promise<void> {
    try {
      // This would need to be implemented in the repository
      // For now, we'll handle it user by user as needed
    } catch (error) {
      logger.error("Error resetting all users daily voice credits:", error);
    }
  }

  /**
   * Reset all users' monthly voice credits (for cron job)
   */
  async resetAllUsersMonthlyVoiceCredits(): Promise<void> {
    try {
      // This would need to be implemented in the repository
      // For now, we'll handle it user by user as needed
    } catch (error) {
      logger.error("Error resetting all users monthly voice credits:", error);
    }
  }
}

// Export a singleton instance
export const creditService = new CreditService();
