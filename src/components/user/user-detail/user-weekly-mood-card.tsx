"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Smile, Meh, Frown } from "lucide-react";
import { useMemo } from "react";

interface MoodData {
  day: string;
  score: number; // 1-10
  date: string;
}

interface UserWeeklyMoodCardProps {
  weeklyMoodData: MoodData[];
}

export function UserWeeklyMoodCard({
  weeklyMoodData,
}: UserWeeklyMoodCardProps) {
  const avgMood = useMemo(() => {
    if (weeklyMoodData.length === 0) return 0;
    // Only include days with actual mood data (score > 0)
    const daysWithData = weeklyMoodData.filter((day) => day.score > 0);
    if (daysWithData.length === 0) return 0;
    const sum = daysWithData.reduce((acc, day) => acc + day.score, 0);
    return Math.round((sum / daysWithData.length) * 10) / 10;
  }, [weeklyMoodData]);

  const _getMoodLabel = (score: number) => {
    if (score >= 8) return "Great";
    if (score >= 6) return "Good";
    if (score >= 4) return "Okay";
    if (score >= 2) return "Low";
    return "Very Low";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-6 items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              Weekly Mood Tracking
            </CardTitle>
            <CardDescription>
              Your emotional well-being over the past week
            </CardDescription>
          </div>
          {avgMood > 0 && (
            <div className="text-center">
              <div className="text-2xl">{avgMood}/10</div>
              <div className="text-xs text-muted-foreground">Average</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {weeklyMoodData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No mood data yet</p>
            <p className="text-xs mt-2">
              Mood is analyzed from your therapy conversations
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Bar Chart - Professional Style */}
            <div className="space-y-5 sm:space-y-3">
              {weeklyMoodData.map((day) => (
                <div key={day.date} className="space-y-2 sm:space-y-1">
                  {/* Day label and score */}
                  <div className="flex items-center justify-between text-sm sm:text-sm">
                    <span className="font-medium min-w-[3rem]">{day.day}</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {day.score > 0 ? `${day.score}/10` : "-"}
                    </span>
                  </div>

                  {/* Bar container */}
                  <div className="relative h-1 sm:h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                    {/* Foreground bar (actual score) */}
                    {day.score > 0 ? (
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(day.score / 10) * 100}%`,
                          backgroundColor:
                            day.score >= 7
                              ? "rgb(34 197 94)" // Green
                              : day.score >= 4
                                ? "rgb(234 179 8)" // Yellow
                                : "rgb(239 68 68)", // Red
                        }}
                      />
                    ) : (
                      <div className="absolute left-0 top-0 h-full w-full rounded-full bg-border/20" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs">
              <div className="flex items-center gap-1">
                <Smile className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">7-10 Great</span>
              </div>
              <div className="flex items-center gap-1">
                <Meh className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">4-6 Okay</span>
              </div>
              <div className="flex items-center gap-1">
                <Frown className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">1-3 Low</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
