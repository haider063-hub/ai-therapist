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
    const sum = weeklyMoodData.reduce((acc, day) => acc + day.score, 0);
    return Math.round((sum / weeklyMoodData.length) * 10) / 10;
  }, [weeklyMoodData]);

  const getMoodLabel = (score: number) => {
    if (score >= 8) return "Great";
    if (score >= 6) return "Good";
    if (score >= 4) return "Okay";
    if (score >= 2) return "Low";
    return "Very Low";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Weekly Mood Tracking
            </CardTitle>
            <CardDescription>
              Your emotional well-being over the past week
            </CardDescription>
          </div>
          {avgMood > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold">{avgMood}/10</div>
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
          <div className="space-y-4">
            {/* Weekly Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyMoodData.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="flex-1 flex items-end w-full">
                    <div
                      className="w-full bg-primary/20 rounded-t-md transition-all hover:bg-primary/30 relative group"
                      style={{ height: `${(day.score / 10) * 100}%` }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {getMoodLabel(day.score)}: {day.score}/10
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {day.day}
                  </span>
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
