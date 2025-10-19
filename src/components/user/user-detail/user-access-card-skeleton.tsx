import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Skeleton } from "ui/skeleton";

export function UserAccessCardSkeleton() {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          <Skeleton className="h-4 w-64" />
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Roles Section - Conditional (only for admin users) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-3 w-48 mt-2" />
          </div>
        </div>

        {/* Account Status Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-48 mt-2" />
          </div>
        </div>

        {/* Voice Therapy Section - Conditional (only for current user) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </div>

        {/* Danger Zone Section - Conditional (only for admin viewing non-admin users) */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
