import { Skeleton } from "ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "ui/card";

export function UserProfileCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-56" />
            </CardDescription>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Information Items */}
        <div className="space-y-4">
          {/* Age */}
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5" />
            <div>
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Gender */}
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5" />
            <div>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Country */}
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5" />
            <div>
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Religion */}
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5" />
            <div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Therapy Needs */}
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-18 rounded-full" />
              </div>
            </div>
          </div>

          {/* Preferred Therapy Style */}
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5" />
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          {/* Specific Concerns */}
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5" />
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
