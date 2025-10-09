"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { CreditCard, Sparkles } from "lucide-react";
import { useEffect } from "react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureType: "chat" | "voice";
  creditsRemaining?: number;
  subscriptionType?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  featureType,
  creditsRemaining = 0,
  subscriptionType = "free_trial",
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/subscription");
  };

  // Auto-close modal if credits become available
  useEffect(() => {
    if (creditsRemaining > 0 && open) {
      onOpenChange(false);
    }
  }, [creditsRemaining, open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
            {creditsRemaining === 0 ? (
              <CreditCard className="h-8 w-8 text-white" />
            ) : (
              <Sparkles className="h-8 w-8 text-white" />
            )}
          </div>
          <DialogTitle className="text-2xl">
            {creditsRemaining === 0
              ? `No ${featureType === "chat" ? "Chat" : "Voice"} Credits Left`
              : `Low ${featureType === "chat" ? "Chat" : "Voice"} Credits`}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {creditsRemaining === 0 ? (
              <span>
                You've used all your {featureType} credits. Upgrade to a
                subscription plan to continue enjoying our service.
              </span>
            ) : (
              <span>
                You have{" "}
                <span className="font-bold text-yellow-600">
                  {creditsRemaining}
                </span>{" "}
                credits remaining. Upgrade now to get unlimited or more credits.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-center text-muted-foreground">
            Choose from our subscription plans to continue
          </p>

          <Button
            onClick={handleUpgrade}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            View Subscription Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
