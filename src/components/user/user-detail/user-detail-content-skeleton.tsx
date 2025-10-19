import { UserDetailFormSkeleton } from "./user-detail-form-skeleton";
import { UserAccessCardSkeleton } from "./user-access-card-skeleton";
import { UserStatsCardLoaderSkeleton } from "./user-stats-card-loader";
import { Skeleton } from "ui/skeleton";

export function UserDetailContentSkeleton() {
  return (
    <div className="min-h-full space-y-4 md:space-y-6">
      {/* Hero Section */}
      <div className="space-y-2 px-1 sm:px-0">
        <Skeleton className="h-8 w-48 bg-white/20" />
        <Skeleton className="h-5 w-80 bg-white/20" />
      </div>

      {/* Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <UserDetailFormSkeleton />
        <UserAccessCardSkeleton />

        {/* Full Width Statistics */}
        <div className="col-span-1 md:col-span-2">
          <UserStatsCardLoaderSkeleton />
        </div>
      </div>
    </div>
  );
}
