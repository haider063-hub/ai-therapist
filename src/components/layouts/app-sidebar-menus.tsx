"use client";
import { SidebarMenuButton, useSidebar } from "ui/sidebar";
import { SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroupContent } from "ui/sidebar";

import { SidebarGroup } from "ui/sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { WriteIcon } from "ui/write-icon";
import { CreditCardIcon, LayoutDashboard } from "lucide-react";
import { Tooltip } from "ui/tooltip";
import { getIsUserAdmin } from "lib/user/utils";
import { BasicUser } from "app-types/user";
import { AppSidebarAdmin } from "./app-sidebar-menu-admin";
import { useEffect, useState } from "react";

export function AppSidebarMenus({ user }: { user?: BasicUser }) {
  const router = useRouter();
  const t = useTranslations("");
  const { setOpenMobile } = useSidebar();

  // Check if user can create new chats
  const [canUseChat, setCanUseChat] = useState(true);

  useEffect(() => {
    const fetchChatStatus = async () => {
      try {
        const response = await fetch("/api/stripe/get-subscription-status");
        if (response.ok) {
          const data = await response.json();
          setCanUseChat(data.features.canUseChat);
        }
      } catch (error) {
        console.error("Failed to fetch chat status:", error);
      }
    };

    fetchChatStatus();

    // Listen for credit updates
    const handleCreditUpdate = () => fetchChatStatus();
    window.addEventListener("credits-updated", handleCreditUpdate);
    return () =>
      window.removeEventListener("credits-updated", handleCreditUpdate);
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem className="mb-1">
            {canUseChat ? (
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
            ) : (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/subscription");
                }}
                className="cursor-pointer"
              >
                <SidebarMenuButton
                  disabled
                  className="flex font-semibold group/new-chat bg-input/10 border border-border/20 opacity-50 cursor-not-allowed"
                >
                  <WriteIcon className="size-4" />
                  {t("Layout.newChat")}
                </SidebarMenuButton>
              </div>
            )}
          </SidebarMenuItem>
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
              <Link
                href="/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMobile(false);
                  router.push("/dashboard");
                }}
              >
                <SidebarMenuButton className="font-semibold">
                  <LayoutDashboard className="size-4 text-foreground" />
                  Dashboard
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
