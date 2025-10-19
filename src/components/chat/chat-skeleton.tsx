import { Skeleton } from "ui/skeleton";
import { Avatar, AvatarFallback } from "ui/avatar";

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b bg-white/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      {/* Messages Area Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* User Message Skeleton */}
        <div className="flex justify-end">
          <div className="flex items-end gap-2 max-w-[70%]">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                <Skeleton className="h-full w-full rounded-full" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Assistant Message Skeleton */}
        <div className="flex justify-start">
          <div className="flex items-end gap-2 max-w-[70%]">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                <Skeleton className="h-full w-full rounded-full" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        {/* User Message Skeleton */}
        <div className="flex justify-end">
          <div className="flex items-end gap-2 max-w-[70%]">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
            </div>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                <Skeleton className="h-full w-full rounded-full" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Assistant Message Skeleton */}
        <div className="flex justify-start">
          <div className="flex items-end gap-2 max-w-[70%]">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                <Skeleton className="h-full w-full rounded-full" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="p-4 border-t bg-white/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
