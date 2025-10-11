"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "ui/button";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

export function DashboardHeaderClient() {
  const router = useRouter();

  return (
    <div className="w-full p-4 md:p-6">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-white hover:text-white/80"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Go to Home</TooltipContent>
        </Tooltip>

        {/* Dashboard Title */}
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
          Dashboard
        </h1>
      </div>
    </div>
  );
}
