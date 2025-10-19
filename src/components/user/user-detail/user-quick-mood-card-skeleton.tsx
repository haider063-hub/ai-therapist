import { Skeleton } from "ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "ui/card";

export function UserQuickMoodCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-36" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-48" />
            </CardDescription>
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Mood Options Grid - 4 columns for 8 mood options */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-auto py-3 sm:py-4 w-full rounded-lg"
            />
          ))}
        </div>

        {/* Instruction Text */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t text-center">
          <Skeleton className="h-3 w-64 mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
}
