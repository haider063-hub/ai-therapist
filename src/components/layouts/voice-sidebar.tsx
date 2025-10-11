"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "ui/sidebar";
import { SidebarHeaderShared } from "./sidebar-header";
import { AppSidebarUser } from "./app-sidebar-user";
import {
  CreditCard as CreditCardIcon,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { WriteIcon } from "ui/write-icon";
import { BasicUser } from "app-types/user";
import { getIsUserAdmin } from "@/lib/user/utils";

interface VoiceSidebarProps {
  user?: BasicUser;
}

export function VoiceSidebar({ user }: VoiceSidebarProps) {
  const router = useRouter();
  const [canUseChat, setCanUseChat] = useState(true);
  const isAdmin = getIsUserAdmin(user);

  // Fetch chat status for context-aware button
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

  const handleStartChatSession = () => {
    if (canUseChat) {
      router.push("/chat");
    } else {
      router.push("/subscription");
    }
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-sidebar-border/80"
    >
      <SidebarHeaderShared
        title="EchoNest AI Therapy"
        href="/"
        onLinkClick={() => {
          router.push("/");
          router.refresh();
        }}
      />

      <SidebarContent className="mt-2 overflow-hidden relative">
        <div className="flex flex-col overflow-y-auto">
          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleStartChatSession}
                    disabled={!canUseChat}
                    className={`font-semibold ${!canUseChat ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <WriteIcon className="size-4" />
                    {canUseChat ? "Start Chat Session" : "Out of Credits"}
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => router.push("/admin/users")}
                      className="font-semibold"
                    >
                      <Shield className="size-4" />
                      Admin
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/subscription")}
                    className="font-semibold"
                  >
                    <CreditCardIcon className="size-4" />
                    Subscription
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/dashboard")}
                    className="font-semibold"
                  >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter className="flex flex-col items-stretch space-y-2">
        <AppSidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
