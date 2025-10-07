"use client";

import { Button } from "ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

export function TherapistSelectionHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center px-4 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="text-white hover:text-white/80"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Back to Home</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
