"use client";

import { Button } from "ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function TherapistSelectionHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
