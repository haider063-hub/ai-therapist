import { Skeleton } from "ui/skeleton";
import { Card, CardContent, CardHeader } from "ui/card";

export function UserWeeklyMoodCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-6 items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mood Chart Area */}
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />

          {/* Day Labels */}
          <div className="flex justify-between">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
