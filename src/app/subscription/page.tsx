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
  X,
  ArrowLeft,
} from "lucide-react";
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
  }>;
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
      const response = await fetch("/api/stripe/get-subscription-status");
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

  const handleCancelSubscription = async () => {
    setProcessing("cancel");
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      if (response.ok) {
        toast.success(
          "Subscription will be canceled at the end of the billing period",
        );
        fetchSubscriptionData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to cancel subscription");
      }
    } catch (_error) {
      toast.error("Error canceling subscription");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "canceled":
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      case "past_due":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Past Due</Badge>
        );
      case "incomplete":
        return <Badge className="bg-gray-100 text-gray-800">Incomplete</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-gray-600">
          Manage your EchoNest AI Therapy subscription and credits
        </p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Plan:</span>
                <span className="capitalize">
                  {data.user.subscriptionType.replace("_", " ")}
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
                    variant="outline"
                    size="sm"
                    onClick={handleCancelSubscription}
                    disabled={processing === "cancel"}
                    className="w-full mt-4"
                  >
                    {processing === "cancel"
                      ? "Processing..."
                      : "Cancel Subscription"}
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credits & Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Available Credits:</span>
                <span className="font-bold text-blue-600">
                  {data.credits.current}
                </span>
              </div>

              {/* Only show voice limits for non-free-trial users */}
              {data.user.subscriptionType !== "free_trial" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Daily Voice Used:</span>
                    <span>
                      {data.credits.dailyVoiceUsed} /{" "}
                      {data.credits.dailyVoiceLimit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Monthly Voice Used:</span>
                    <span>
                      {data.credits.monthlyVoiceUsed} /{" "}
                      {data.credits.monthlyVoiceLimit}
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium">Chat Access:</span>
                {data.features.canUseChat ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Voice Access:</span>
                {data.features.canUseVoice ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.id === data.user.subscriptionType ? "ring-2 ring-blue-500" : ""}`}
            >
              {plan.id === data.user.subscriptionType && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Current Plan</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={
                    plan.id === data.user.subscriptionType
                      ? "outline"
                      : "default"
                  }
                  disabled={
                    plan.id === data.user.subscriptionType ||
                    processing === plan.id
                  }
                  onClick={() => handleCheckout(plan.id.toUpperCase())}
                >
                  {processing === plan.id
                    ? "Processing..."
                    : plan.id === data.user.subscriptionType
                      ? "Current Plan"
                      : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
        <Card>
          <CardContent className="p-6">
            {data.recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-4">
                {data.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div>
                      <div className="font-medium capitalize">
                        {transaction.type === "subscription"
                          ? "Subscription"
                          : "Voice Top-Up"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${transaction.amount}</div>
                      {transaction.creditsAdded > 0 && (
                        <div className="text-sm text-blue-600">
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
  );
}
