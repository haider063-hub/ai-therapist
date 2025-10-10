"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "ui/sidebar";
import { SidebarHeaderShared } from "./sidebar-header";
import { AppSidebarUser } from "./app-sidebar-user";
import {
  CreditCard as CreditCardIcon,
  Grid3X3,
  MessageSquare,
  Mic,
} from "lucide-react";
import { BasicUser } from "app-types/user";

interface GlobalSidebarProps {
  user?: BasicUser;
}

export function GlobalSidebar({ user }: GlobalSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [canUseChat, setCanUseChat] = useState(true);

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
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/dashboard")}
                    className={pathname === "/dashboard" ? "bg-accent" : ""}
                  >
                    <Grid3X3 className="size-4" />
                    Dashboard
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/therapists")}
                    className={pathname === "/therapists" ? "bg-accent" : ""}
                  >
                    <MessageSquare className="size-4" />
                    Select Therapist
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/voice-chat")}
                    className={pathname === "/voice-chat" ? "bg-accent" : ""}
                  >
                    <Mic className="size-4" />
                    Voice Chat
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Context-aware Start Chat Session button */}
                {pathname === "/voice-chat" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleStartChatSession}
                      disabled={!canUseChat}
                      className={
                        !canUseChat ? "opacity-50 cursor-not-allowed" : ""
                      }
                    >
                      <MessageSquare className="size-4" />
                      {canUseChat ? "Start Chat Session" : "Out of Credits"}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Subscription Management */}
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/subscription")}
                    className={pathname === "/subscription" ? "bg-accent" : ""}
                  >
                    <CreditCardIcon className="size-4" />
                    Subscription
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
