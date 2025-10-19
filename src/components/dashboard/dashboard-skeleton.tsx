import { UserDetailContentSkeleton } from "@/components/user/user-detail/user-detail-content-skeleton";
import { Button } from "ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "ui/skeleton";

export function DashboardSkeleton() {
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
            <UserDetailContentSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
