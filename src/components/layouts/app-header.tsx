"use client";

import { useSidebar } from "ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { AudioWaveformIcon, ChevronDown, PanelLeft } from "lucide-react";
import { Button } from "ui/button";
import { Separator } from "ui/separator";

import { useEffect, useMemo } from "react";
import { ThreadDropdown } from "../thread-dropdown";
import { appStore } from "@/app/store";
import { usePathname, useSearchParams } from "next/navigation";
import { useShallow } from "zustand/shallow";
import { useTranslations } from "next-intl";
import { TextShimmer } from "ui/text-shimmer";
import { buildReturnUrl } from "lib/admin/navigation-utils";
import { BackButton } from "@/components/layouts/back-button";
import CreditDisplay from "@/components/credits/credit-display";

export function AppHeader() {
  const t = useTranslations();
  const [appStoreMutate] = appStore(useShallow((state) => [state.mutate]));
  const { toggleSidebar, open } = useSidebar();
  const currentPaths = usePathname();
  const searchParams = useSearchParams();

  const showActionButtons = useMemo(() => {
    if (currentPaths.startsWith("/admin")) {
      return false;
    }
    return true;
  }, [currentPaths]);

  const componentByPage = useMemo(() => {
    if (currentPaths.startsWith("/chat/")) {
      return <ThreadDropdownComponent />;
    }
    if (
      currentPaths.startsWith("/admin/users/") &&
      currentPaths.split("/").length > 3
    ) {
      const searchPageParams = searchParams.get("searchPageParams");
      const returnUrl = buildReturnUrl("/admin/users", searchPageParams || "");
      return (
        <BackButton
          data-testid="admin-users-back-button"
          returnUrl={returnUrl}
          title={t("Admin.Users.backToUsers")}
        />
      );
    }
  }, [currentPaths, searchParams]);

  return (
    <header className="sticky top-0 z-50 flex items-center px-3 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Sidebar"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSidebar();
            }}
            data-testid="sidebar-toggle"
            data-state={open ? "open" : "closed"}
          >
            <PanelLeft />
          </Button>
        </TooltipTrigger>
        <TooltipContent align="start" side="bottom">
          {t("KeyboardShortcuts.toggleSidebar")}
        </TooltipContent>
      </Tooltip>

      {componentByPage}
      <div className="flex-1" />
      {showActionButtons && (
        <div className="flex items-center gap-2">
          {/* Credit Display */}
          <CreditDisplay compact={true} showUpgradeButton={false} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={"icon"}
                variant={"ghost"}
                className="bg-secondary/40"
                onClick={() => {
                  appStoreMutate((state) => ({
                    voiceChat: {
                      ...state.voiceChat,
                      isOpen: true,
                      agentId: undefined,
                    },
                  }));
                }}
              >
                <AudioWaveformIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent align="end" side="bottom">
              <div className="text-xs flex items-center gap-2">
                {t("KeyboardShortcuts.toggleVoiceChat")}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </header>
  );
}

function ThreadDropdownComponent() {
  const [threadList, currentThreadId, generatingTitleThreadIds] = appStore(
    useShallow((state) => [
      state.threadList,
      state.currentThreadId,
      state.generatingTitleThreadIds,
    ]),
  );
  const currentThread = useMemo(() => {
    return threadList.find((thread) => thread.id === currentThreadId);
  }, [threadList, currentThreadId]);

  useEffect(() => {
    if (currentThread?.id) {
      document.title = currentThread.title || "New Chat";
    }
  }, [currentThread?.id]);

  if (!currentThread) return null;

  return (
    <div className="items-center gap-1 hidden md:flex">
      <div className="w-1 h-4">
        <Separator orientation="vertical" />
      </div>

      <ThreadDropdown
        threadId={currentThread.id}
        beforeTitle={currentThread.title}
      >
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-input! hover:text-foreground cursor-pointer flex gap-1 items-center px-2 py-1 rounded-md hover:bg-accent"
              >
                {generatingTitleThreadIds.includes(currentThread.id) ? (
                  <TextShimmer className="truncate max-w-60 min-w-0 mr-1">
                    {currentThread.title || "New Chat"}
                  </TextShimmer>
                ) : (
                  <p className="truncate max-w-60 min-w-0 mr-1">
                    {currentThread.title || "New Chat"}
                  </p>
                )}

                <ChevronDown size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-4 break-all overflow-y-auto max-h-[200px]">
              {currentThread.title || "New Chat"}
            </TooltipContent>
          </Tooltip>
        </div>
      </ThreadDropdown>
    </div>
  );
}
