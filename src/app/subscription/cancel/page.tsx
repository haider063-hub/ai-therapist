"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl text-yellow-600">
            Payment Canceled
          </CardTitle>
          <CardDescription className="text-lg">
            Your payment was canceled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800">
              No charges were made to your account. You can continue using
              EchoNest AI Therapy with your current free trial credits, or try
              subscribing again when you&apos;re ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/subscription")}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              View Plans
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
              Need help choosing a plan? Contact our support team for
              personalized recommendations based on your therapy needs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
