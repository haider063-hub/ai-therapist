import { VoiceSidebar } from "@/components/layouts/voice-sidebar";
import { SidebarProvider, SidebarInset } from "ui/sidebar";
import { getSession } from "auth/server";
import { redirect } from "next/navigation";

export default async function VoiceChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <VoiceSidebar user={session.user} />
        <SidebarInset className="flex-1 overflow-hidden bg-transparent">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
