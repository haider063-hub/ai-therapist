"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mic, RefreshCw } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface CreditStatus {
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
}

interface CreditDisplayProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
  context?: "chat" | "voice" | "global"; // New prop for context-aware display
}

export default function CreditDisplay({
  compact = false,
  showUpgradeButton = true,
  context = "global",
}: CreditDisplayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-detect context from pathname if not provided
  const effectiveContext =
    context === "global"
      ? pathname?.includes("/voice")
        ? "voice"
        : pathname?.includes("/chat")
          ? "chat"
          : "global"
      : context;

  useEffect(() => {
    fetchCreditStatus(false); // Initial load with loading state

    // Listen for credit update events
    const handleCreditUpdate = () => {
      fetchCreditStatus(true); // Silent refresh when credits are used
    };

    window.addEventListener("credits-updated", handleCreditUpdate);

    return () => {
      window.removeEventListener("credits-updated", handleCreditUpdate);
    };
  }, []);

  const fetchCreditStatus = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await fetch("/api/stripe/get-subscription-status");
      if (response.ok) {
        const data = await response.json();
        setCreditStatus({
          credits: data.credits.current,
          chatCredits: data.credits.chatCredits || 0,
          voiceCredits: data.credits.voiceCredits || 0,
          chatCreditsFromTopup: data.credits.chatCreditsFromTopup || 0,
          voiceCreditsFromTopup: data.credits.voiceCreditsFromTopup || 0,
          subscriptionType: data.user.subscriptionType,
          subscriptionStatus: data.user.subscriptionStatus,
          dailyVoiceCreditsUsed: data.credits.dailyVoiceUsed,
          dailyVoiceCreditsLimit: data.credits.dailyVoiceLimit,
          monthlyVoiceCreditsUsed: data.credits.monthlyVoiceUsed,
          monthlyVoiceCreditsLimit: data.credits.monthlyVoiceLimit,
          canUseChat: data.features.canUseChat,
          canUseVoice: data.features.canUseVoice,
        });
        setLoading(false); // Always set loading to false after successful fetch
      }
    } catch (error) {
      console.error("Failed to fetch credit status:", error);
      setLoading(false);
    }
  };

  const getSubscriptionBadge = (type: string, status: string) => {
    if (type === "free_trial") {
      return <Badge variant="secondary">Free Trial</Badge>;
    }

    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "canceled":
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      case "past_due":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Past Due</Badge>
        );
      default:
        return <Badge variant="secondary">{type.replace("_", " ")}</Badge>;
    }
  };

  const getFeatureIcon = (canUse: boolean) => {
    return canUse ? (
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    ) : (
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!creditStatus) {
    return (
      <div className="text-sm text-gray-500">Unable to load credit status</div>
    );
  }

  if (compact) {
    const hasUnlimitedChat =
      creditStatus.subscriptionType === "chat_only" ||
      creditStatus.subscriptionType === "premium";
    const hasUnlimitedVoice =
      creditStatus.subscriptionType === "voice_only" ||
      creditStatus.subscriptionType === "premium";

    // Context-aware credit display
    if (effectiveContext === "chat") {
      // CHAT PAGE VIEW
      const totalChatCredits =
        creditStatus.chatCredits + creditStatus.chatCreditsFromTopup;

      return (
        <div className="flex items-center gap-3 text-sm">
          <MessageSquare className="h-4 w-4" />

          {hasUnlimitedChat ? (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0 h-5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            >
              Unlimited Chat
            </Badge>
          ) : totalChatCredits > 0 ? (
            <div className="flex items-center gap-1">
              <span className="font-medium">{totalChatCredits}</span>
              <span className="text-muted-foreground text-xs">
                {creditStatus.chatCreditsFromTopup > 0
                  ? `(${creditStatus.chatCredits} free + ${creditStatus.chatCreditsFromTopup} top-up)`
                  : "credits"}
              </span>
            </div>
          ) : (
            <span className="text-red-500 text-xs">No chat credits</span>
          )}

          {showUpgradeButton &&
            creditStatus.subscriptionType === "free_trial" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/subscription")}
              >
                Upgrade
              </Button>
            )}
        </div>
      );
    } else if (effectiveContext === "voice") {
      // VOICE PAGE VIEW
      const totalVoiceCredits =
        creditStatus.voiceCredits + creditStatus.voiceCreditsFromTopup;

      return (
        <div className="flex items-center gap-3 text-sm">
          <Mic className="h-4 w-4" />

          {hasUnlimitedVoice ? (
            <>
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0 h-5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              >
                Unlimited Voice
              </Badge>
              {/* Show daily usage for voice-only and premium users */}
              <span className="text-xs text-muted-foreground">
                {creditStatus.dailyVoiceCreditsUsed}/
                {creditStatus.dailyVoiceCreditsLimit} used today
              </span>
            </>
          ) : totalVoiceCredits > 0 ? (
            <div className="flex items-center gap-1">
              <span className="font-medium">{totalVoiceCredits}</span>
              <span className="text-muted-foreground text-xs">
                {creditStatus.voiceCreditsFromTopup > 0
                  ? `(${creditStatus.voiceCredits} free + ${creditStatus.voiceCreditsFromTopup} top-up)`
                  : "credits"}
              </span>
            </div>
          ) : (
            <span className="text-red-500 text-xs">No voice credits</span>
          )}

          {showUpgradeButton &&
            creditStatus.subscriptionType === "free_trial" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/subscription")}
              >
                Upgrade
              </Button>
            )}
        </div>
      );
    } else {
      // GLOBAL VIEW (navbar/header - not on specific page)
      return (
        <div className="flex items-center gap-3 text-sm">
          {/* Chat Status */}
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            {hasUnlimitedChat ? (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0 h-5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              >
                Unlimited
              </Badge>
            ) : (
              getFeatureIcon(creditStatus.canUseChat)
            )}
          </div>

          {/* Voice Status */}
          <div className="flex items-center gap-1.5">
            <Mic className="h-4 w-4" />
            {hasUnlimitedVoice ? (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0 h-5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              >
                Unlimited
              </Badge>
            ) : (
              getFeatureIcon(creditStatus.canUseVoice)
            )}
          </div>

          {showUpgradeButton &&
            creditStatus.subscriptionType === "free_trial" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/subscription")}
              >
                Upgrade
              </Button>
            )}
        </div>
      );
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Subscription Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plan</span>
            {getSubscriptionBadge(
              creditStatus.subscriptionType,
              creditStatus.subscriptionStatus,
            )}
          </div>

          {/* Credits */}
          {creditStatus.subscriptionType === "free_trial" && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Credits</span>
              <span className="text-sm font-bold text-blue-600">
                {creditStatus.credits}
              </span>
            </div>
          )}

          {/* Voice Usage (for voice plans) */}
          {(creditStatus.subscriptionType === "voice_only" ||
            creditStatus.subscriptionType === "premium") && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Voice</span>
                <span className="text-sm">
                  {creditStatus.dailyVoiceCreditsUsed} /{" "}
                  {creditStatus.dailyVoiceCreditsLimit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monthly Voice</span>
                <span className="text-sm">
                  {creditStatus.monthlyVoiceCreditsUsed} /{" "}
                  {creditStatus.monthlyVoiceCreditsLimit}
                </span>
              </div>
            </>
          )}

          {/* Feature Access */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">Chat</span>
              </div>
              {getFeatureIcon(creditStatus.canUseChat)}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span className="text-sm">Voice</span>
              </div>
              {getFeatureIcon(creditStatus.canUseVoice)}
            </div>
          </div>

          {/* Upgrade Button */}
          {showUpgradeButton && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/subscription")}
            >
              Manage Subscription
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
