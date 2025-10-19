import { Skeleton } from "ui/skeleton";
import { Avatar, AvatarFallback } from "ui/avatar";

export function VoiceChatSkeleton() {
  return (
    <div className="flex flex-col h-full relative">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Voice Chat Header Skeleton */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <Skeleton className="h-full w-full rounded-full bg-white/20" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Skeleton className="h-5 w-40 bg-white/20" />
              <Skeleton className="h-3 w-32 bg-white/20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded bg-white/20" />
            <Skeleton className="h-8 w-8 rounded bg-white/20" />
          </div>
        </div>

        {/* Main Voice Chat Area Skeleton */}
        <div className="flex-1 min-h-0 mx-auto w-full relative z-10">
          <div className="w-full mx-auto h-full max-h-[80vh] overflow-y-auto px-4 lg:max-w-4xl flex-1 flex items-center chat-scrollbar">
            <div className="text-center w-full">
              <div className="mb-8">
                <Skeleton className="h-16 w-96 mx-auto mb-4 bg-white/20" />
                <Skeleton className="h-8 w-64 mx-auto mb-6 bg-white/20" />
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Skeleton className="h-3 w-3 rounded-full bg-white/20" />
                  <Skeleton className="h-3 w-3 rounded-full bg-white/20" />
                  <Skeleton className="h-3 w-3 rounded-full bg-white/20" />
                </div>
                <Skeleton className="h-6 w-64 mx-auto bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Credit Warning Banner Skeleton */}
        <div className="w-full max-w-md mx-auto mb-6 px-4">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-300/30 rounded-xl px-6 py-4 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="h-5 w-5 rounded bg-white/20" />
                <Skeleton className="h-5 w-32 bg-white/20" />
              </div>
              <Skeleton className="h-4 w-56 mx-auto bg-white/20" />
              <Skeleton className="h-10 w-36 mx-auto rounded-lg bg-white/20" />
            </div>
          </div>
        </div>

        {/* Ready to Start Text Skeleton */}
        <Skeleton className="h-6 w-80 mx-auto mb-2 bg-white/20" />

        {/* Voice Controls Skeleton */}
        <div className="relative w-full p-6 flex flex-col items-center justify-center gap-4 z-10 pb-24">
          <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
          <Skeleton className="h-12 w-32 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}
