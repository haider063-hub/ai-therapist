import { Suspense } from "react";
import { UserDetailContent } from "@/components/user/user-detail/user-detail-content";
import { UserDetailContentSkeleton } from "@/components/user/user-detail/user-detail-content-skeleton";
import { DashboardHeaderClient } from "./dashboard-header-client";

export default function DashboardPage() {
  return (
    <div className="w-full min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Back Button Only */}
        <DashboardHeaderClient />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 chat-scrollbar">
          <div className="w-full">
            <Suspense fallback={<UserDetailContentSkeleton />}>
              <UserDetailContent view="user" />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
