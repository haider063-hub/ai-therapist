import { SidebarProvider } from "ui/sidebar";
import { getSession } from "lib/auth/server";
import { AppPopupProvider } from "@/components/layouts/app-popup-provider";
import { SWRConfigProvider } from "../(main)/swr-config";

import { redirect } from "next/navigation";
export const experimental_ppr = true;

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return (
    <SidebarProvider defaultOpen={false}>
      <SWRConfigProvider>
        <AppPopupProvider userSettingsComponent={<div />} />
        <main className="relative w-full flex flex-col h-screen min-h-screen">
          <div className="flex-1 overflow-y-auto chat-scrollbar">
            {children}
          </div>
        </main>
      </SWRConfigProvider>
    </SidebarProvider>
  );
}
