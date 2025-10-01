"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  // const [sessionData, setSessionData] = useState<any>(null); // Not used currently

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      // Here you could fetch additional session details if needed
      setLoading(false);
      toast.success(
        "Payment successful! Your subscription has been activated.",
      );
    } else {
      setLoading(false);
      toast.error("No session ID found");
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-lg">
            Thank you for subscribing to EchoNest AI Therapy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800">
              Your subscription has been activated and you now have access to
              all premium features. You can start using the enhanced therapy
              experience right away.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/subscription")}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              View Subscription
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            <p>
              You will receive a confirmation email shortly with your
              subscription details. If you have any questions, please contact
              our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
