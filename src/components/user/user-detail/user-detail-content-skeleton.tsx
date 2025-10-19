import { UserDetailFormSkeleton } from "./user-detail-form-skeleton";
import { UserAccessCardSkeleton } from "./user-access-card-skeleton";
import { UserStatsCardLoaderSkeleton } from "./user-stats-card-loader";
import { UserProfileCardSkeleton } from "./user-profile-card-skeleton";
import { UserSessionStatsCardSkeleton } from "./user-session-stats-card-skeleton";
import { UserQuickMoodCardSkeleton } from "./user-quick-mood-card-skeleton";
import { UserWeeklyMoodCardSkeleton } from "./user-weekly-mood-card-skeleton";
import { Skeleton } from "ui/skeleton";

export function UserDetailContentSkeleton() {
  return (
    <div className="min-h-full space-y-4 md:space-y-6">
      {/* Hero Section */}
      <div className="space-y-2 px-1 sm:px-0">
        <Skeleton className="h-8 w-48 bg-white/20" />
        <Skeleton className="h-5 w-80 bg-white/20" />
      </div>

      {/* Cards Layout - All 6 cards to match actual dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Top Row: User Details Form & Access & Account */}
        <UserDetailFormSkeleton />
        <UserAccessCardSkeleton />

        {/* Second Row: Profile Card & Session Stats */}
        <UserProfileCardSkeleton />
        <UserSessionStatsCardSkeleton />

        {/* Third Row: Quick Mood & Weekly Mood */}
        <UserQuickMoodCardSkeleton />
        <UserWeeklyMoodCardSkeleton />

        {/* Full Width Statistics */}
        <div className="col-span-1 md:col-span-2">
          <UserStatsCardLoaderSkeleton />
        </div>
      </div>
    </div>
  );
}
