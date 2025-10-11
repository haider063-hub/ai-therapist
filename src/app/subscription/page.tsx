"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  CreditCard,
  MessageSquare,
  Mic,
  Star,
  ArrowLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// import { stripePromise } from '@/lib/stripe/client'; // Not used in this component

interface SubscriptionData {
  user: {
    id: string;
    email: string;
    name: string;
    subscriptionType: string;
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
    stripeCustomerId: string | null;
  };
  credits: {
    current: number;
    chatCredits: number;
    voiceCredits: number;
    chatCreditsFromTopup: number;
    voiceCreditsFromTopup: number;
    dailyVoiceUsed: number;
    dailyVoiceLimit: number;
    monthlyVoiceUsed: number;
    monthlyVoiceLimit: number;
  };
  features: {
    canUseChat: boolean;
    canUseVoice: boolean;
  };
  plans: Array<{
    id: string;
    name: string;
    price: number;
    features: string[];
    unlimitedChat: boolean;
    unlimitedVoice: boolean;
    dailyVoiceCredits: number;
    monthlyVoiceCredits: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: string;
    creditsAdded: number;
    status: string;
    createdAt: string;
    metadata?: {
      planType?: string;
      [key: string]: any;
    };
  }>;
}

// Helper function to get proper plan display names
function getPlanDisplayName(subscriptionType: string): string {
  switch (subscriptionType) {
    case "voice_chat":
      return "Voice + Chat (Premium Plan)";
    case "chat_only":
      return "Chat Only Plan";
    case "voice_only":
      return "Voice Only Plan";
    case "free_trial":
      return "Free Trial";
    default:
      return subscriptionType.replace("_", " ");
  }
}

// Helper function to get transaction plan display name
function getTransactionPlanName(
  transaction: any,
  userSubscriptionType?: string,
): string {
  // Check metadata first
  if (transaction.metadata?.planType) {
    return getPlanDisplayName(transaction.metadata.planType);
  }

  // Check if transaction has planType in metadata as string
  if (transaction.metadata && typeof transaction.metadata === "object") {
    const planType = Object.keys(transaction.metadata).find(
      (key) =>
        key.toLowerCase().includes("plan") ||
        key.toLowerCase().includes("type"),
    );
    if (planType && transaction.metadata[planType]) {
      return getPlanDisplayName(transaction.metadata[planType]);
    }
  }

  // Fallback: if it's a subscription transaction, use the user's current subscription type
  if (transaction.type === "subscription") {
    if (userSubscriptionType) {
      return getPlanDisplayName(userSubscriptionType);
    }
    // Default fallback
    return "Voice + Chat (Premium Plan)";
  }

  // If it's a topup, show appropriate name
  if (transaction.type === "topup") {
    return "Voice Top-Up";
  }

  return transaction.type || "Unknown Plan";
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/stripe/get-subscription-status", {
        cache: "no-store", // Force fresh data
      });
      if (response.ok) {
        const subscriptionData = await response.json();
        setData(subscriptionData);
      } else {
        toast.error("Failed to load subscription data");
      }
    } catch (_error) {
      toast.error("Error loading subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planType: string) => {
    setProcessing(planType);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create checkout session");
      }
    } catch (_error) {
      toast.error("Error creating checkout session");
    } finally {
      setProcessing(null);
    }
  };

  const handleManageSubscription = async () => {
    setProcessing("portal");
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to open billing portal");
      }
    } catch (_error) {
      toast.error("Error opening billing portal");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary">Active</Badge>;
      case "canceled":
        return <Badge variant="secondary">Canceled</Badge>;
      case "past_due":
        return <Badge variant="secondary">Past Due</Badge>;
      case "incomplete":
        return <Badge variant="secondary">Incomplete</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "chat_only":
        return <MessageSquare className="h-6 w-6" />;
      case "voice_only":
        return <Mic className="h-6 w-6" />;
      case "premium":
        return <Star className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Subscription Management</h1>
          <p className="text-gray-600">Failed to load subscription data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>
      <div className="container mx-auto p-6 relative z-10">
        <div className="mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                className="mb-4 text-white hover:text-white/80"
              >
                <ArrowLeft className="h-4 w-4 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Go Back</TooltipContent>
          </Tooltip>
          <h1 className="text-3xl font-bold mb-2 text-white text-center">
            Subscription Management
          </h1>
          <p className="text-white/80 text-center">
            Manage your EchoNest AI Therapy subscription and credits
          </p>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <CreditCard className="h-5 w-5 text-black" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-black">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Plan:</span>
                  <span className="font-semibold">
                    {getPlanDisplayName(data.user.subscriptionType)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(data.user.subscriptionStatus)}
                </div>
                {data.user.subscriptionEndDate && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Next Billing:</span>
                    <span>
                      {new Date(
                        data.user.subscriptionEndDate,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {data.user.subscriptionStatus === "active" &&
                  data.user.subscriptionType !== "free_trial" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleManageSubscription}
                      disabled={processing === "portal"}
                      className="w-full mt-4"
                    >
                      {processing === "portal"
                        ? "Loading..."
                        : "Manage Billing"}
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <CreditCard className="h-5 w-5 text-black" />
                Credits & Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="text-black">
              <div className="space-y-3">
                {/* Voice Credits - Show for all plans with voice access */}
                {(data.user.subscriptionType === "free_trial" ||
                  data.user.subscriptionType === "voice_only" ||
                  data.user.subscriptionType === "voice_chat") && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Voice Credits:</span>
                    <span className="font-semibold text-blue-600">
                      {data.credits.voiceCredits +
                        data.credits.voiceCreditsFromTopup}
                    </span>
                  </div>
                )}

                {/* Chat Credits for all plans */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Chat Credits:</span>
                  <span className="font-semibold text-green-600">
                    {data.user.subscriptionType === "chat_only" ||
                    data.user.subscriptionType === "voice_chat"
                      ? "Unlimited"
                      : data.credits.chatCredits +
                        data.credits.chatCreditsFromTopup}
                  </span>
                </div>

                {/* Premium: Also show unlimited chat */}
                {data.user.subscriptionType === "premium" && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Chat Access:</span>
                    <span className="font-bold">Unlimited</span>
                  </div>
                )}

                {/* Show voice credits breakdown for Chat Only users */}
                {data.user.subscriptionType === "chat_only" &&
                  (data.credits.voiceCredits > 0 ||
                    data.credits.voiceCreditsFromTopup > 0) && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Voice Credits:</span>
                      <span className="font-bold">
                        {data.credits.voiceCredits +
                          data.credits.voiceCreditsFromTopup}
                        {data.credits.voiceCreditsFromTopup > 0
                          ? ` (${data.credits.voiceCredits} free trial + ${data.credits.voiceCreditsFromTopup} top-ups)`
                          : data.credits.voiceCredits > 0
                            ? " (free trial)"
                            : ""}
                      </span>
                    </div>
                  )}

                {/* Show chat credits breakdown for Voice Only users */}
                {data.user.subscriptionType === "voice_only" &&
                  (data.credits.chatCredits > 0 ||
                    data.credits.chatCreditsFromTopup > 0) && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Chat Credits:</span>
                      <span className="font-bold">
                        {data.credits.chatCredits +
                          data.credits.chatCreditsFromTopup}
                        {data.credits.chatCreditsFromTopup > 0
                          ? ` (${data.credits.chatCredits} free trial + ${data.credits.chatCreditsFromTopup} top-ups)`
                          : data.credits.chatCredits > 0
                            ? " (free trial)"
                            : ""}
                      </span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white text-center">
            Available Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {data.plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative bg-white flex flex-col ${plan.id === data.user.subscriptionType ? "ring-2 ring-primary" : ""}`}
              >
                {plan.id === data.user.subscriptionType && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                )}
                {plan.id === "voice_chat" && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-black text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-xl text-black">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-black">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-black flex flex-col flex-1">
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <Button
                      className="w-full"
                      variant={
                        plan.id === data.user.subscriptionType
                          ? "outline"
                          : "default"
                      }
                      disabled={
                        (plan.id === data.user.subscriptionType &&
                          plan.id !== "voice_topup") ||
                        processing === plan.id
                      }
                      onClick={() => handleCheckout(plan.id.toUpperCase())}
                    >
                      {processing === plan.id
                        ? "Processing..."
                        : plan.id === data.user.subscriptionType &&
                            plan.id !== "voice_topup"
                          ? "Current Plan"
                          : plan.id === "voice_topup"
                            ? "Buy Voice Credits"
                            : plan.id === "chat_only"
                              ? "Start Chat Plan"
                              : plan.id === "voice_only"
                                ? "Start Voice Plan"
                                : plan.id === "voice_chat"
                                  ? "Start Premium Plan"
                                  : "Upgrade"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white text-center">
            Recent Transactions
          </h2>
          <Card className="bg-white">
            <CardContent className="p-4 text-black">
              {data.recentTransactions.filter((t) => t.status === "succeeded")
                .length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No successful transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentTransactions
                    .filter((transaction) => transaction.status === "succeeded")
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <div>
                          <div className="font-medium">
                            {getTransactionPlanName(
                              transaction,
                              data.user.subscriptionType,
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(
                              transaction.createdAt,
                            ).toLocaleDateString()}{" "}
                            {new Date(transaction.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${transaction.amount}
                          </div>
                          {transaction.creditsAdded > 0 && (
                            <div className="text-sm text-muted-foreground">
                              +{transaction.creditsAdded} credits
                            </div>
                          )}
                          <Badge
                            variant={
                              transaction.status === "succeeded"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
