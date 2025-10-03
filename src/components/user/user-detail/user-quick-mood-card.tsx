"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MOOD_OPTIONS = [
  {
    emoji: "😊",
    label: "Happy",
    score: 9,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    emoji: "😌",
    label: "Calm",
    score: 8,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    emoji: "😐",
    label: "Neutral",
    score: 5,
    color: "bg-gray-500 hover:bg-gray-600",
  },
  {
    emoji: "😔",
    label: "Sad",
    score: 3,
    color: "bg-blue-700 hover:bg-blue-800",
  },
  {
    emoji: "😰",
    label: "Anxious",
    score: 4,
    color: "bg-yellow-600 hover:bg-yellow-700",
  },
  {
    emoji: "😓",
    label: "Stressed",
    score: 4,
    color: "bg-orange-500 hover:bg-orange-600",
  },
  {
    emoji: "😢",
    label: "Crying",
    score: 2,
    color: "bg-indigo-500 hover:bg-indigo-600",
  },
  {
    emoji: "😡",
    label: "Angry",
    score: 3,
    color: "bg-red-500 hover:bg-red-600",
  },
];

export function UserQuickMoodCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [todayMood, setTodayMood] = useState<string | null>(null);

  const handleMoodSelect = async (mood: (typeof MOOD_OPTIONS)[0]) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/track-mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moodScore: mood.score,
          sentiment:
            mood.score >= 7
              ? "positive"
              : mood.score >= 4
                ? "neutral"
                : "negative",
          notes: `Manual mood entry: ${mood.label}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to track mood");
      }

      setTodayMood(mood.emoji);
      toast.success(`Mood tracked: ${mood.label} ${mood.emoji}`);

      // Reload the weekly mood data
      window.location.reload();
    } catch (error) {
      console.error("Error tracking mood:", error);
      toast.error("Failed to track mood. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Quick Mood Check
            </CardTitle>
            <CardDescription>How are you feeling right now?</CardDescription>
          </div>
          {todayMood && <div className="text-4xl">{todayMood}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <Button
                  key={mood.label}
                  variant="outline"
                  className={`flex flex-col items-center gap-1 sm:gap-2 h-auto py-3 sm:py-4 transition-all hover:scale-105 ${
                    todayMood === mood.emoji ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleMoodSelect(mood)}
                  disabled={isLoading}
                >
                  <span className="text-2xl sm:text-3xl">{mood.emoji}</span>
                  <span className="text-[10px] sm:text-xs font-medium">
                    {mood.label}
                  </span>
                </Button>
              ))}
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t text-xs text-muted-foreground text-center">
              Tap an emotion to track your mood for today
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
