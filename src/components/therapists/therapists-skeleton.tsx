import { Skeleton } from "ui/skeleton";
import { Avatar, AvatarFallback } from "ui/avatar";
import { Card, CardContent, CardHeader } from "ui/card";
import { Button } from "ui/button";

export function TherapistsSkeleton() {
  // Generate 8 skeleton therapist cards to match actual page
  const skeletonCards = Array.from({ length: 8 }, (_, i) => i);

  // Generate language filter buttons
  const languages = [
    "All",
    "Arabic",
    "English",
    "French",
    "German",
    "Hindi",
    "Japanese",
    "Russian",
    "Spanish",
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>

      <div className="relative z-10">
        {/* Header Component Skeleton */}
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-32 bg-white/20" />
            <Skeleton className="h-8 w-8 bg-white/20" />
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <Skeleton className="h-10 w-80 mx-auto bg-white/20" />
              <Skeleton className="h-5 w-96 mx-auto bg-white/20" />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 items-center justify-center">
              {/* Search Bar */}
              <Skeleton className="h-10 w-full max-w-2xl bg-white rounded-lg" />

              {/* Language Filter Buttons */}
              <div className="flex gap-2 flex-wrap justify-center items-center">
                <span className="text-sm text-white flex items-center gap-2">
                  🌐 Languages:
                </span>
                {languages.map((lang, index) => (
                  <Button
                    key={lang}
                    variant={index === 0 ? "default" : "outline"}
                    size="sm"
                    className={index === 0 ? "font-bold" : "font-normal"}
                    disabled
                  >
                    {lang}
                  </Button>
                ))}
              </div>
            </div>

            {/* Therapist Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch auto-rows-fr mt-8">
              {skeletonCards.map((index) => (
                <Card
                  key={index}
                  className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer h-full flex flex-col bg-white"
                >
                  <CardHeader className="text-center pb-3 flex-shrink-0">
                    {/* Avatar */}
                    <div className="flex justify-center mb-3">
                      <div className="relative">
                        <Avatar className="h-20 w-20 rounded-full bg-white ring-2 ring-primary/20">
                          <AvatarFallback>
                            <Skeleton className="h-full w-full rounded-full" />
                          </AvatarFallback>
                        </Avatar>
                        <Skeleton className="absolute -bottom-1 -right-1 h-5 w-8 rounded-full" />
                      </div>
                    </div>

                    <Skeleton className="h-6 w-32 mx-auto" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </CardHeader>

                  <CardContent className="flex flex-col justify-between flex-grow">
                    {/* Content Group */}
                    <div className="space-y-3 flex-grow">
                      {/* Language Badges */}
                      <div className="flex gap-1.5 justify-center items-center">
                        <Skeleton className="h-5 w-12 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>

                      {/* Specializes in */}
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-24 mx-auto" />
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-5 w-14 rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 flex-shrink-0">
                      <Skeleton className="h-8 flex-1 rounded-lg" />
                      <Skeleton className="h-8 flex-1 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
