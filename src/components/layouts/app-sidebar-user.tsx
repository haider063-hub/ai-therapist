"use client";

import { SidebarMenuButton, SidebarMenuItem, SidebarMenu } from "ui/sidebar";
import { LogOutIcon } from "lucide-react";
import { fetcher } from "lib/utils";
import { authClient } from "auth/client";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Suspense } from "react";
import { BasicUser } from "app-types/user";
import { Skeleton } from "ui/skeleton";

export function AppSidebarUserInner(props: {
  user?: BasicUser;
}) {
  const { data: user } = useSWR<BasicUser>(`/api/user/details`, fetcher, {
    fallbackData: props.user,
    suspense: true,
    revalidateOnMount: false,
  });
  const t = useTranslations("Layout");

  const logout = () => {
    authClient.signOut().finally(() => {
      window.location.href = "/sign-in";
    });
  };

  if (!user) return null;

  return (
    <SidebarMenu>
      {/* Sign Out Button Only */}
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={logout}
          className="font-semibold"
          data-testid="sidebar-signout-button"
        >
          <LogOutIcon className="size-4 text-foreground" />
          {t("signOut")}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebarUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-input/30 border"
          size={"lg"}
          data-testid="sidebar-user-button"
        >
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebarUser({
  user,
}: {
  user?: BasicUser;
}) {
  return (
    <Suspense fallback={<AppSidebarUserSkeleton />}>
      <AppSidebarUserInner user={user} />
    </Suspense>
  );
}
