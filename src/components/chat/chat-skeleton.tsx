import { Skeleton } from "ui/skeleton";
import { Avatar, AvatarFallback } from "ui/avatar";

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full relative">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Chat Header Skeleton */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 bg-white/20" />
              <Skeleton className="h-3 w-24 bg-white/20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded bg-white/20" />
            <Skeleton className="h-8 w-8 rounded bg-white/20" />
          </div>
        </div>

        {/* Messages Area Skeleton */}
        <div className="flex-1 overflow-y-auto py-6 z-10 chat-scrollbar">
          <div className="flex flex-col gap-2 max-w-3xl mx-auto px-6">
            {/* User Message Skeleton */}
            <div className="flex justify-end">
              <div className="flex items-end gap-2 max-w-[70%]">
                <div className="space-y-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                  <Skeleton className="h-4 w-48 bg-white/20" />
                  <Skeleton className="h-4 w-32 bg-white/20" />
                </div>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    <Skeleton className="h-full w-full rounded-full bg-white/20" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Assistant Message Skeleton */}
            <div className="flex justify-start">
              <div className="flex items-end gap-2 max-w-[70%]">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    <Skeleton className="h-full w-full rounded-full bg-white/20" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                  <Skeleton className="h-4 w-56 bg-white/20" />
                  <Skeleton className="h-4 w-40 bg-white/20" />
                  <Skeleton className="h-4 w-48 bg-white/20" />
                </div>
              </div>
            </div>

            {/* User Message Skeleton */}
            <div className="flex justify-end">
              <div className="flex items-end gap-2 max-w-[70%]">
                <div className="space-y-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                  <Skeleton className="h-4 w-36 bg-white/20" />
                </div>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    <Skeleton className="h-full w-full rounded-full bg-white/20" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Assistant Message Skeleton */}
            <div className="flex justify-start">
              <div className="flex items-end gap-2 max-w-[70%]">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    <Skeleton className="h-full w-full rounded-full bg-white/20" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                  <Skeleton className="h-4 w-64 bg-white/20" />
                  <Skeleton className="h-4 w-52 bg-white/20" />
                  <Skeleton className="h-4 w-44 bg-white/20" />
                  <Skeleton className="h-4 w-28 bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Warning Banner Skeleton */}
        <div className="w-full max-w-3xl mx-auto mb-6 px-4">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-300/30 rounded-xl px-6 py-4 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="h-5 w-5 rounded bg-white/20" />
                <Skeleton className="h-5 w-32 bg-white/20" />
              </div>
              <Skeleton className="h-4 w-64 mx-auto bg-white/20" />
              <Skeleton className="h-10 w-40 mx-auto rounded-lg bg-white/20" />
            </div>
          </div>
        </div>

        {/* Scroll to Bottom Button Skeleton */}
        <div className="max-w-3xl mx-auto relative flex justify-center items-center -top-2">
          <Skeleton className="h-9 w-9 rounded-full bg-white/20" />
        </div>

        {/* Input Area Skeleton */}
        <div className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <Skeleton className="h-10 flex-1 rounded-lg bg-white/20" />
            <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
            <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
