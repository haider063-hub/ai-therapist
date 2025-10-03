"use client";
import { SidebarMenuButton, useSidebar } from "ui/sidebar";
import { Tooltip } from "ui/tooltip";
import { SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroupContent } from "ui/sidebar";

import { SidebarGroup } from "ui/sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { WriteIcon } from "ui/write-icon";
import { CreditCardIcon, LayoutDashboard } from "lucide-react";
import { getIsUserAdmin } from "lib/user/utils";
import { BasicUser } from "app-types/user";
import { AppSidebarAdmin } from "./app-sidebar-menu-admin";
import { appStore } from "@/app/store";

export function AppSidebarMenus({ user }: { user?: BasicUser }) {
  const router = useRouter();
  const t = useTranslations("");
  const { setOpenMobile } = useSidebar();
  const appStoreMutate = appStore((state) => state.mutate);

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem className="mb-1">
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMobile(false);
                  router.push(`/`);
                  router.refresh();
                }}
              >
                <SidebarMenuButton className="flex font-semibold group/new-chat bg-input/20 border border-border/40">
                  <WriteIcon className="size-4" />
                  {t("Layout.newChat")}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        {getIsUserAdmin(user) && <AppSidebarAdmin />}

        {/* Subscription Management */}
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link
                href="/subscription"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMobile(false);
                  router.push("/subscription");
                }}
              >
                <SidebarMenuButton className="font-semibold">
                  <CreditCardIcon className="size-4 text-foreground" />
                  Subscription
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        {/* Dashboard (User Settings) */}
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="font-semibold"
                onClick={() => {
                  setOpenMobile(false);
                  appStoreMutate({ openUserSettings: true });
                }}
              >
                <LayoutDashboard className="size-4 text-foreground" />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
