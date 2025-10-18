"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Mic, TrendingUp, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface UserSessionStatsCardProps {
  stats: {
    totalChatSessions: number;
    totalVoiceSessions: number;
    weeklyMoodScore?: number;
  };
}

export function UserSessionStatsCard({ stats }: UserSessionStatsCardProps) {
  const [loading, setLoading] = useState(true);

  // Simple loading simulation for tips refresh
  const fetchInsights = async () => {
    setLoading(true);
    // Simulate loading time for refresh effect
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Session Statistics
        </CardTitle>
        <CardDescription>
          Your therapy session activity and engagement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Sessions */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Chat Sessions</p>
              <p className="text-xs text-muted-foreground">
                Total conversations
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-lg px-4 py-1 border border-gray-200"
          >
            {stats.totalChatSessions}
          </Badge>
        </div>

        {/* Voice Sessions */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Voice Sessions</p>
              <p className="text-xs text-muted-foreground">Total voice chats</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-lg px-4 py-1 border border-gray-200"
          >
            {stats.totalVoiceSessions}
          </Badge>
        </div>

        {/* Weekly Mood Score (if available) */}
        {stats.weeklyMoodScore !== undefined && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Weekly Mood Score</p>
                <p className="text-xs text-muted-foreground">
                  Average this week
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="text-lg px-4 py-1 border border-gray-200"
            >
              {stats.weeklyMoodScore}/10
            </Badge>
          </div>
        )}

        {/* Tips & Encouragement Section */}
        {!loading && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Tips & Encouragement
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  fetchInsights();
                }}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            {/* Motivational Messages */}
            <div className="space-y-3">
              {/* Daily Tip */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-sm">💡</span>
                  <div>
                    <p className="text-xs font-medium text-green-900 mb-1">
                      Daily Therapy Tip
                    </p>
                    <p className="text-xs text-green-800">
                      Practice deep breathing for 5 minutes daily. It helps
                      reduce stress and improves mental clarity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-sm">🌟</span>
                  <div>
                    <p className="text-xs font-medium text-blue-900 mb-1">
                      You're Doing Great!
                    </p>
                    <p className="text-xs text-blue-800">
                      Every therapy session is a step forward in your mental
                      health journey. Keep going!
                    </p>
                  </div>
                </div>
              </div>

              {/* Wellness Reminder */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 text-sm">🌸</span>
                  <div>
                    <p className="text-xs font-medium text-purple-900 mb-1">
                      Wellness Reminder
                    </p>
                    <p className="text-xs text-purple-800">
                      Remember to take breaks, stay hydrated, and get enough
                      sleep. Your mental health matters!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
