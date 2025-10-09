import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface VoiceCreditsViewProps {
  creditStatus: CreditStatus;
  showUpgradeButton?: boolean;
}

export function VoiceCreditsView({
  creditStatus,
  showUpgradeButton = false,
}: VoiceCreditsViewProps) {
  const hasMonthlyVoiceCredits =
    creditStatus.subscriptionType === "voice_only" ||
    creditStatus.subscriptionType === "voice_chat";

  const totalVoiceCredits = creditStatus.voiceCredits;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <Mic className="h-4 w-4 text-white" />
        <span className="font-semibold text-xs text-white">Voice Credits</span>

        {totalVoiceCredits > 0 ? (
          <span className="font-medium text-white">
            {totalVoiceCredits}
            {hasMonthlyVoiceCredits && (
              <span className="text-xs text-gray-300 ml-1">/month</span>
            )}
          </span>
        ) : (
          <span className="text-red-300 text-xs">No credits</span>
        )}
      </div>

      {showUpgradeButton && creditStatus.subscriptionType === "free_trial" && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-6 px-2 border-white/30 text-white hover:bg-white/10"
          onClick={() => (window.location.href = "/subscription")}
        >
          Upgrade
        </Button>
      )}
    </div>
  );
}
