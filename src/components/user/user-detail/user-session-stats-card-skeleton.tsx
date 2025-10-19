import { Skeleton } from "ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "ui/card";

export function UserSessionStatsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-56" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Sessions */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background">
              <Skeleton className="h-5 w-5" />
            </div>
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>

        {/* Voice Sessions */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background">
              <Skeleton className="h-5 w-5" />
            </div>
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>

        {/* Tips & Encouragement Section */}
        <div className="space-y-3 pt-2 border-t">
          <Skeleton className="h-4 w-40" />

          <div className="space-y-2">
            {/* Daily Tip */}
            <div className="pl-4 pr-2 py-2 rounded-lg bg-green-50 border border-green-200">
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Motivational Message */}
            <div className="pl-4 pr-2 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Wellness Reminder */}
            <div className="pl-4 pr-2 py-2 rounded-lg bg-purple-50 border border-purple-200">
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
