"use client";

import { BasicUserWithLastLogin } from "app-types/user";
import { UserDetailFormCard } from "./user-detail-form-card";
import { UserAccessCard } from "./user-access-card";
import { UserProfileCard } from "./user-profile-card";
import { UserSessionStatsCard } from "./user-session-stats-card";
import { UserWeeklyMoodCard } from "./user-weekly-mood-card";
import { UserQuickMoodCard } from "./user-quick-mood-card";
import { useProfileTranslations } from "@/hooks/use-profile-translations";
import useSWR, { mutate } from "swr";
import { fetcher } from "lib/utils";
import { useEffect, useState } from "react";

interface UserDetailProps {
  user: BasicUserWithLastLogin;
  currentUserId: string;
  userAccountInfo?: {
    hasPassword: boolean;
    oauthProviders: string[];
  };
  view?: "admin" | "user";
}

export function UserDetail({
  view,
  user: initialUser,
  currentUserId,
  userAccountInfo,
}: UserDetailProps) {
  // No sidebar logic needed - admin pages don't use sidebar
  const userDetailRoute =
    currentUserId === initialUser.id
      ? `/api/user/details`
      : `/api/user/details/${initialUser.id}`;
  const { data: user } = useSWR<BasicUserWithLastLogin>(
    userDetailRoute,
    fetcher,
    {
      fallbackData: initialUser,
      revalidateOnMount: false,
    },
  );
  const handleUserUpdate = async (
    updatedUser: Partial<BasicUserWithLastLogin>,
  ) => {
    if (user) {
      mutate<BasicUserWithLastLogin>(userDetailRoute, {
        ...user,
        ...updatedUser,
      });
    }
  };
  const { t } = useProfileTranslations(view);

  // Fetch weekly mood data
  const [weeklyMoodData, setWeeklyMoodData] = useState<any[]>([]);
  useEffect(() => {
    // Fetch mood data for the user being viewed (either self or admin viewing another user)
    const moodApiRoute =
      currentUserId === initialUser.id
        ? "/api/user/weekly-mood"
        : `/api/user/weekly-mood/${initialUser.id}`;

    fetch(moodApiRoute)
      .then((res) => res.json())
      .then((data) => setWeeklyMoodData(data.weeklyMoodData || []))
      .catch(() => setWeeklyMoodData([]));
  }, [currentUserId, initialUser.id]);

  return (
    <div
      className="min-h-full space-y-4 md:space-y-6"
      data-testid="user-detail-content"
    >
      {/* Hero Section */}
      <div className="space-y-2 px-1 sm:px-0">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {user?.name}
        </h1>
        <p className="text-white/80">{t("userDetailDescription")}</p>
      </div>

      {/* Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Top Row: User Details Form & Access & Account */}
        <UserDetailFormCard
          user={user ?? initialUser}
          currentUserId={currentUserId}
          userAccountInfo={userAccountInfo}
          view={view}
          onUserDetailsUpdate={handleUserUpdate}
        />

        <UserAccessCard
          user={user ?? initialUser}
          currentUserId={currentUserId}
          userAccountInfo={userAccountInfo}
          view={view}
          onUserDetailsUpdate={handleUserUpdate}
        />

        <UserProfileCard
          user={user ?? initialUser}
          currentUserId={currentUserId}
          view={view}
        />

        <UserSessionStatsCard
          stats={{
            totalChatSessions: (user ?? initialUser).totalChatSessions || 0,
            totalVoiceSessions: (user ?? initialUser).totalVoiceSessions || 0,
          }}
        />

        <UserQuickMoodCard />

        <UserWeeklyMoodCard weeklyMoodData={weeklyMoodData} />
      </div>
    </div>
  );
}
