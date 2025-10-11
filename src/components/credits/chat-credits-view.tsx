import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

interface ChatCreditsViewProps {
  creditStatus: CreditStatus;
  showUpgradeButton?: boolean;
}

export function ChatCreditsView({
  creditStatus,
  showUpgradeButton = false,
}: ChatCreditsViewProps) {
  const hasUnlimitedChat =
    creditStatus.subscriptionType === "chat_only" ||
    creditStatus.subscriptionType === "voice_chat";

  const totalChatCredits = creditStatus.chatCredits;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <CreditCard className="h-4 w-4 text-white" />

        {totalChatCredits === -1 || hasUnlimitedChat ? (
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0 h-5 bg-white/20 text-white border-white/30"
          >
            Unlimited
          </Badge>
        ) : totalChatCredits > 0 ? (
          <span className="font-medium text-white">{totalChatCredits}</span>
        ) : (
          <span className="text-red-300 text-xs">No credits</span>
        )}

        <span className="font-normal text-xs text-white">Chat Credits</span>
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
