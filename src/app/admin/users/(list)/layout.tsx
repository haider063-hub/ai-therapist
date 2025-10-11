import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Button } from "ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

interface UsersLayoutProps {
  children: ReactNode;
}

export default async function UsersLayout({ children }: UsersLayoutProps) {
  const t = await getTranslations("Admin.Users");

  return (
    <div className="relative w-full flex flex-col min-h-screen">
      {/* EchoNest Background */}
      <div className="echonest-gradient-bg"></div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto chat-scrollbar p-6 w-full">
        <div className="space-y-6 w-full max-w-none">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Back to Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Page Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">{t("allUsers")}</h1>
            <p className="text-white/80">{t("viewAndManageUsers")}</p>
          </div>

          {/* Users Table Content */}
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
