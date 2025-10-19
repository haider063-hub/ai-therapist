import { Skeleton } from "ui/skeleton";
import { Card, CardContent, CardHeader } from "ui/card";

export function SubscriptionSkeleton() {
  // Generate 3 skeleton subscription plans
  const skeletonPlans = Array.from({ length: 3 }, (_, i) => i);

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-8">
      {/* Header Skeleton */}
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-80 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      {/* Current Plan Status Skeleton */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Skeleton className="h-6 w-48 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>

      {/* Subscription Plans Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {skeletonPlans.map((index) => (
          <Card
            key={index}
            className={`relative ${index === 1 ? "ring-2 ring-blue-500" : ""}`}
          >
            {index === 1 && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            )}
            <CardHeader className="text-center space-y-2">
              <Skeleton className="h-6 w-24 mx-auto" />
              <Skeleton className="h-8 w-32 mx-auto" />
              <Skeleton className="h-4 w-40 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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

      {/* Additional Features Skeleton */}
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-6 w-48 mx-auto mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
