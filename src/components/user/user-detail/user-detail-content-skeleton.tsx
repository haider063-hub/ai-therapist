import { UserDetailFormSkeleton } from "./user-detail-form-skeleton";
import { UserAccessCardSkeleton } from "./user-access-card-skeleton";
import { UserStatsCardLoaderSkeleton } from "./user-stats-card-loader";
import { Skeleton } from "ui/skeleton";
import { Button } from "ui/button";
import { ArrowLeft } from "lucide-react";

export function UserDetailContentSkeleton() {
  return (
    <div className="w-full min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header Skeleton */}
        <div className="w-full p-4 md:p-6">
          <div className="flex items-center gap-4">
            {/* Back Button Skeleton */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-white hover:text-white/80"
              disabled
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>

            {/* Dashboard Title Skeleton */}
            <Skeleton className="h-6 sm:h-7 md:h-8 w-32 bg-white/20" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full">
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
          </div>
        </div>
      </div>
    </div>
  );
}
