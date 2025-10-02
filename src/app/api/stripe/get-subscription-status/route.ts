import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { creditService } from "lib/services/credit-service";
import { subscriptionRepository } from "lib/db/pg/repositories/subscription-repository.pg";
import { SUBSCRIPTION_PLANS } from "lib/stripe/server";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await subscriptionRepository.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get credit status
    const creditStatus = await creditService.getUserCreditStatus(
      session.user.id,
    );
    if (!creditStatus) {
      return NextResponse.json(
        { error: "Failed to get credit status" },
        { status: 500 },
      );
    }

    // Get available subscription plans
    const availablePlans = Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
      id: plan.name,
      name: plan.displayName,
      price: plan.price,
      features: plan.features,
      unlimitedChat: plan.unlimitedChat,
      unlimitedVoice: plan.unlimitedVoice,
      dailyVoiceCredits: plan.dailyVoiceCredits,
      monthlyVoiceCredits: plan.monthlyVoiceCredits,
    }));

    // Get recent transactions
    const transactions = await subscriptionRepository.getTransactionsByUserId(
      session.user.id,
      5,
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate,
        stripeCustomerId: user.stripeCustomerId,
      },
      credits: {
        current: creditStatus.credits,
        chatCredits: creditStatus.chatCredits,
        voiceCredits: creditStatus.voiceCredits,
        chatCreditsFromTopup: creditStatus.chatCreditsFromTopup,
        voiceCreditsFromTopup: creditStatus.voiceCreditsFromTopup,
        dailyVoiceUsed: creditStatus.dailyVoiceCreditsUsed,
        dailyVoiceLimit: creditStatus.dailyVoiceCreditsLimit,
        monthlyVoiceUsed: creditStatus.monthlyVoiceCreditsUsed,
        monthlyVoiceLimit: creditStatus.monthlyVoiceCreditsLimit,
      },
      features: {
        canUseChat: creditStatus.canUseChat,
        canUseVoice: creditStatus.canUseVoice,
      },
      plans: availablePlans,
      recentTransactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        creditsAdded: t.creditsAdded,
        status: t.status,
        createdAt: t.createdAt,
        metadata: t.metadata,
      })),
    });
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 },
    );
  }
}
