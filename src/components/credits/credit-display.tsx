"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mic, RefreshCw } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ChatCreditsView } from "./chat-credits-view";
import { VoiceCreditsView } from "./voice-credits-view";
import { GlobalCreditsView } from "./global-credits-view";

interface CreditStatus {
  credits: number;
  chatCredits: number;
  voiceCredits: number;
  chatCreditsFromTopup: number;
  voiceCreditsFromTopup: number;
  subscriptionType: string;
  subscriptionStatus: string;
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
        <RefreshCw className="h-4 w-4 animate-spin text-white" />
        <span className="text-sm text-white">Loading...</span>
      </div>
    );
  }

  if (!creditStatus) {
    return (
      <div className="text-sm text-gray-500">Unable to load credit status</div>
    );
  }

  if (compact) {
    // Context-aware credit display
    if (effectiveContext === "chat") {
      return (
        <ChatCreditsView
          creditStatus={creditStatus}
          showUpgradeButton={showUpgradeButton}
        />
      );
    } else if (effectiveContext === "voice") {
      return (
        <VoiceCreditsView
          creditStatus={creditStatus}
          showUpgradeButton={showUpgradeButton}
        />
      );
    } else {
      return (
        <GlobalCreditsView
          creditStatus={creditStatus}
          showUpgradeButton={showUpgradeButton}
        />
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

          {/* Voice Credits (for voice plans) */}
          {(creditStatus.subscriptionType === "voice_only" ||
            creditStatus.subscriptionType === "voice_chat") && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Voice Credits</span>
              <span className="text-sm font-bold text-blue-600">
                {creditStatus.voiceCredits + creditStatus.voiceCreditsFromTopup}
              </span>
            </div>
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
