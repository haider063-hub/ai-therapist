import { Skeleton } from "ui/skeleton";
import { Avatar, AvatarFallback } from "ui/avatar";

export function VoiceChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Voice Chat Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b bg-white/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              <Skeleton className="h-full w-full rounded-full" />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      {/* Main Voice Chat Area Skeleton */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          {/* Title Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-12 w-80 mx-auto" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>

          {/* Voice Status Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            <Skeleton className="h-5 w-48 mx-auto" />
          </div>

          {/* Therapist Info Skeleton */}
          <div className="flex items-center justify-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>
                <Skeleton className="h-full w-full rounded-full" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 text-left">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Voice Controls Skeleton */}
      <div className="p-4 border-t bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
