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
import {
  CreditCard as CreditCardIcon,
  LayoutDashboard,
  Shield,
  MessageSquare,
} from "lucide-react";
import { BasicUser } from "app-types/user";
import { getIsUserAdmin } from "@/lib/user/utils";
import { Button } from "ui/button";

interface VoiceSidebarProps {
  user?: BasicUser;
}

export function VoiceSidebar({ user }: VoiceSidebarProps) {
  const router = useRouter();
  const isAdmin = getIsUserAdmin(user);

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
        {/* Chat with EchoNest Button */}
        <Button
          className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 font-semibold justify-start"
          onClick={() => {
            router.push("/chat");
            router.refresh();
          }}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat with EchoNest
        </Button>

        <AppSidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
