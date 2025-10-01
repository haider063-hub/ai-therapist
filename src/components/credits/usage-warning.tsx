"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface UsageWarningProps {
  featureType: "chat" | "voice";
  onDismiss?: () => void;
}

export default function UsageWarning({
  featureType,
  onDismiss,
}: UsageWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [creditsNeeded, setCreditsNeeded] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkUsageLimits();
  }, [featureType]);

  const checkUsageLimits = async () => {
    try {
      const response = await fetch("/api/stripe/get-subscription-status");
      if (response.ok) {
        const data = await response.json();

        if (featureType === "chat" && !data.features.canUseChat) {
          setWarningMessage(
            data.credits.current === 0
              ? "You have no credits remaining. Upgrade your plan to continue using chat."
              : `You need ${5 - data.credits.current} more credits to send a chat message.`,
          );
          setCreditsNeeded(Math.max(0, 5 - data.credits.current));
          setShowWarning(true);
        } else if (featureType === "voice" && !data.features.canUseVoice) {
          if (data.user.subscriptionType === "chat_only") {
            setWarningMessage(
              "Voice features are not available in the Chat Only plan. Upgrade to Premium or purchase voice top-ups.",
            );
          } else if (data.user.subscriptionType === "free_trial") {
            setWarningMessage(
              data.credits.current < 10
                ? `You need ${10 - data.credits.current} more credits for voice interaction.`
                : "You have insufficient credits for voice interaction.",
            );
            setCreditsNeeded(Math.max(0, 10 - data.credits.current));
          } else {
            setWarningMessage(
              "Daily or monthly voice limits reached. Try again tomorrow or next month.",
            );
          }
          setShowWarning(true);
        }
      }
    } catch (error) {
      console.error("Failed to check usage limits:", error);
    }
  };

  if (!showWarning) {
    return null;
  }

  const handleUpgrade = () => {
    router.push("/subscription");
  };

  const handleDismiss = () => {
    setShowWarning(false);
    onDismiss?.();
  };

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Usage Limit Reached</AlertTitle>
      <AlertDescription className="text-yellow-700">
        <div className="space-y-3">
          <p>{warningMessage}</p>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUpgrade}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {creditsNeeded > 0 ? "Buy Credits" : "Upgrade Plan"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
