"use client";

import { useRouter, usePathname } from "next/navigation";
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

interface DashboardSidebarProps {
  user?: BasicUser;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

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
                <SidebarMenuItem className="mb-1">
                  <SidebarMenuButton
                    onClick={() => router.push("/chat")}
                    className="flex font-semibold group/new-chat bg-input/20 border border-border/40"
                  >
                    <WriteIcon className="size-4" />
                    Start Chat Session
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/therapists")}
                    className={
                      pathname === "/therapists"
                        ? "bg-accent font-semibold"
                        : ""
                    }
                  >
                    <Shield className="size-4" />
                    Admin
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/subscription")}
                    className={
                      pathname === "/subscription"
                        ? "bg-accent font-semibold"
                        : ""
                    }
                  >
                    <CreditCardIcon className="size-4" />
                    Subscription
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/dashboard")}
                    className={
                      pathname === "/dashboard" ? "bg-accent font-semibold" : ""
                    }
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
