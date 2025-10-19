import { Skeleton } from "ui/skeleton";
import { Card, CardContent, CardHeader } from "ui/card";
import { Button } from "ui/button";
import { ArrowLeft } from "lucide-react";

export function SubscriptionSkeleton() {
  // Generate 4 skeleton subscription plans to match actual page
  const skeletonPlans = Array.from({ length: 4 }, (_, i) => i);

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>

      <div className="container mx-auto p-6 relative z-10">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="mb-4 text-white hover:text-white/80"
            disabled
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </Button>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-80 mx-auto bg-white/20" />
            <Skeleton className="h-5 w-96 mx-auto bg-white/20" />
          </div>
        </div>

        {/* Current Status Skeleton - 2 cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-full mt-4" />
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Plans Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-6 bg-white/20" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {skeletonPlans.map((index) => (
              <Card
                key={index}
                className={`relative bg-white flex flex-col ${index === 1 ? "ring-2 ring-primary" : ""}`}
              >
                {index === 1 && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                )}
                {index === 2 && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <Skeleton className="h-6 w-6" />
                  </div>
                  <Skeleton className="h-6 w-24 mx-auto" />
                  <div className="space-y-1">
                    <Skeleton className="h-8 w-16 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="space-y-2 mb-6 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Transactions Skeleton */}
        <div>
          <Skeleton className="h-8 w-56 mx-auto mb-6 bg-white/20" />
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
