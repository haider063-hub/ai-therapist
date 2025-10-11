"use client";

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
import { AppSidebarThreads } from "./app-sidebar-threads";
import {
  CreditCard as CreditCardIcon,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { WriteIcon } from "ui/write-icon";
import { BasicUser } from "app-types/user";
import { getIsUserAdmin } from "@/lib/user/utils";

interface ChatSidebarProps {
  user?: BasicUser;
}

export function ChatSidebar({ user }: ChatSidebarProps) {
  const router = useRouter();
  const isAdmin = getIsUserAdmin(user); // Admin button visibility check

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
                    onClick={() => router.push("/chat")}
                    className="font-semibold"
                  >
                    <WriteIcon className="size-4" />
                    New Chat
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

          {/* Recent Chats */}
          <AppSidebarThreads />
        </div>
      </SidebarContent>

      <SidebarFooter className="flex flex-col items-stretch space-y-2">
        <AppSidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
