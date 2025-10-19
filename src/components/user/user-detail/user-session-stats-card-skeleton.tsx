import { Skeleton } from "ui/skeleton";
import { Card, CardContent, CardHeader } from "ui/card";

export function UserSessionStatsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Sessions */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-gray-200">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>

        {/* Voice Sessions */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-gray-200">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
