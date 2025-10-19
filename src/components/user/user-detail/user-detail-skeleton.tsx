import { UserDetailFormSkeleton } from "./user-detail-form-skeleton";
import { UserAccessCardSkeleton } from "./user-access-card-skeleton";
import { UserProfileCardSkeleton } from "./user-profile-card-skeleton";
import { UserSessionStatsCardSkeleton } from "./user-session-stats-card-skeleton";
import { UserQuickMoodCardSkeleton } from "./user-quick-mood-card-skeleton";
import { UserWeeklyMoodCardSkeleton } from "./user-weekly-mood-card-skeleton";
import { Button } from "ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "ui/skeleton";

export function UserDetailSkeleton() {
  return (
    <div className="relative w-full min-h-screen">
      {/* EchoNest Background */}
      <div className="echonest-gradient-bg"></div>

      {/* Content */}
      <div className="relative z-10 overflow-y-auto chat-scrollbar p-6">
        {/* Back Button Skeleton */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:text-white hover:bg-white/10"
            disabled
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Page Content Skeleton */}
        <div className="space-y-4 md:space-y-6">
          {/* Hero Section */}
          <div className="space-y-2 px-1 sm:px-0">
            <Skeleton className="h-8 w-48 bg-white/20" />
            <Skeleton className="h-5 w-80 bg-white/20" />
          </div>

          {/* Cards Layout - Exactly 6 cards to match actual structure */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
