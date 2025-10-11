import type { ReactNode } from "react";
import { Button } from "ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

interface UserDetailLayoutProps {
  children: ReactNode;
}

export default function UserDetailLayout({ children }: UserDetailLayoutProps) {
  return (
    <div className="relative w-full min-h-screen">
      {/* EchoNest Background */}
      <div className="echonest-gradient-bg"></div>

      {/* Content */}
      <div className="relative z-10 overflow-y-auto chat-scrollbar p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/admin/users">
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
              <p>Back to Users</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
