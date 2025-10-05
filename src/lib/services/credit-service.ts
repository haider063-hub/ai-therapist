import { subscriptionRepository } from "../db/pg/repositories/subscription-repository.pg";
import { CREDIT_COSTS } from "../stripe/server";
import logger from "logger";

export type FeatureType = "chat" | "voice";

export interface CreditCheckResult {
  canUse: boolean;
  reason?: string;
  creditsNeeded?: number;
  userCredits?: number;
  dailyVoiceCreditsUsed?: number;
  dailyVoiceCreditsLimit?: number;
  monthlyVoiceCreditsUsed?: number;
  monthlyVoiceCreditsLimit?: number;
}

export class CreditService {
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

      // Get additional user info for response
      const user = await subscriptionRepository.getUserById(userId);
      if (!user) {
        return { canUse: false, reason: "User not found" };
      }

      return {
        canUse: true,
        userCredits: user.credits,
        dailyVoiceCreditsUsed: user.voiceCreditsUsedToday,
        dailyVoiceCreditsLimit: user.dailyVoiceCredits,
        monthlyVoiceCreditsUsed: user.voiceCreditsUsedThisMonth,
        monthlyVoiceCreditsLimit: user.monthlyVoiceCredits,
      };
    } catch (error) {
      logger.error("Error checking feature usage:", error);
      return { canUse: false, reason: "Internal server error" };
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

      return {
        success: true,
        creditsUsed: creditsToDeduct,
        remainingCredits: updatedUser.credits,
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
      // Calculate total duration and minutes used
      const totalSeconds = userAudioDuration + botAudioDuration;
      const minutesUsed = Math.ceil(totalSeconds / 60); // Round up to nearest minute
      const creditsToDeduct = minutesUsed * CREDIT_COSTS.VOICE_PER_MINUTE;

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
    dailyVoiceCreditsUsed: number;
    dailyVoiceCreditsLimit: number;
    monthlyVoiceCreditsUsed: number;
    monthlyVoiceCreditsLimit: number;
    canUseChat: boolean;
    canUseVoice: boolean;
  } | null> {
    try {
      const user = await subscriptionRepository.getUserById(userId);
      if (!user) {
        return null;
      }

      const chatCheck = await this.canUseFeature(userId, "chat");
      const voiceCheck = await this.canUseFeature(userId, "voice");

      return {
        credits: user.credits,
        chatCredits: user.chatCredits || 0,
        voiceCredits: user.voiceCredits || 0,
        chatCreditsFromTopup: user.chatCreditsFromTopup || 0,
        voiceCreditsFromTopup: user.voiceCreditsFromTopup || 0,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.subscriptionStatus,
        dailyVoiceCreditsUsed: user.voiceCreditsUsedToday,
        dailyVoiceCreditsLimit: user.dailyVoiceCredits,
        monthlyVoiceCreditsUsed: user.voiceCreditsUsedThisMonth,
        monthlyVoiceCreditsLimit: user.monthlyVoiceCredits,
        canUseChat: chatCheck.canUse,
        canUseVoice: voiceCheck.canUse,
      };
    } catch (error) {
      logger.error("Error getting user credit status:", error);
      return null;
    }
  }

  /**
   * Reset daily voice credits (called by cron job)
   */
  async resetDailyVoiceCredits(userId: string): Promise<void> {
    try {
      await subscriptionRepository.resetDailyVoiceCredits(userId);
    } catch (error) {
      logger.error(
        `Error resetting daily voice credits for user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Reset monthly voice credits (called by cron job)
   */
  async resetMonthlyVoiceCredits(userId: string): Promise<void> {
    try {
      await subscriptionRepository.resetMonthlyVoiceCredits(userId);
    } catch (error) {
      logger.error(
        `Error resetting monthly voice credits for user ${userId}:`,
        error,
      );
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
