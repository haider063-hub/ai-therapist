"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, MessageSquare, Mic, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreditStatus {
  credits: number;
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
}

export default function CreditDisplay({
  compact = false,
  showUpgradeButton = true,
}: CreditDisplayProps) {
  const router = useRouter();
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
    const hasUnlimitedVoice = creditStatus.subscriptionType === "premium";

    return (
      <div className="flex items-center gap-3 text-sm">
        {/* Credits Display */}
        {creditStatus.credits > 0 && (
          <div className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            <span className="font-medium">{creditStatus.credits}</span>
            <span className="text-muted-foreground text-xs">credits</span>
          </div>
        )}

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
          ) : creditStatus.subscriptionType === "voice_only" ? (
            <span className="text-xs text-muted-foreground">
              {creditStatus.dailyVoiceCreditsLimit -
                creditStatus.dailyVoiceCreditsUsed}
              /{creditStatus.dailyVoiceCreditsLimit}
            </span>
          ) : creditStatus.canUseVoice && creditStatus.credits > 0 ? (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0 h-5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
            >
              {creditStatus.credits}
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
