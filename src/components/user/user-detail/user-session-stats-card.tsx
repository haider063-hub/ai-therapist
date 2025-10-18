"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageSquare,
  Mic,
  TrendingUp,
  Calendar,
  RefreshCw,
} from "lucide-react";
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

interface SessionInsights {
  lastChatSession?: string;
  lastVoiceSession?: string;
  mostActiveDay?: string;
  averageSessionDuration?: number;
}

export function UserSessionStatsCard({ stats }: UserSessionStatsCardProps) {
  const [insights, setInsights] = useState<SessionInsights>({});
  const [loading, setLoading] = useState(true);

  // Fetch additional session insights
  const fetchInsights = async () => {
    try {
      console.log("🔍 [DEBUG] Fetching real session insights...");
      const response = await fetch("/api/user/session-insights");
      const data = await response.json();

      if (data.insights) {
        console.log("🔍 [DEBUG] Received session insights:", data.insights);
        setInsights(data.insights);
      } else {
        console.error("❌ No insights data received:", data);
        // Fallback to default values
        setInsights({
          lastChatSession: "Never",
          lastVoiceSession: "Never",
          mostActiveDay: "Unknown",
          averageSessionDuration: 0,
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch session insights:", error);
      // Fallback to default values
      setInsights({
        lastChatSession: "Never",
        lastVoiceSession: "Never",
        mostActiveDay: "Unknown",
        averageSessionDuration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();

    // Refresh insights every 10 seconds to keep data current
    const refreshInterval = setInterval(fetchInsights, 10000);

    return () => clearInterval(refreshInterval);
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

        {/* Recent Activity Section - Only show if there's actual recent activity */}
        {!loading &&
          ((insights.lastChatSession && insights.lastChatSession !== "Never") ||
            (insights.lastVoiceSession &&
              insights.lastVoiceSession !== "Never")) && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Recent Activity
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

              {/* Last Sessions */}
              <div
                className={`grid gap-3 ${
                  (
                    insights.lastChatSession &&
                      insights.lastChatSession !== "Never"
                  ) &&
                  (
                    insights.lastVoiceSession &&
                      insights.lastVoiceSession !== "Never"
                  )
                    ? "grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {/* Only show Last Chat if there's actual chat activity */}
                {insights.lastChatSession &&
                  insights.lastChatSession !== "Never" && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs font-medium text-blue-900">
                          Last Chat
                        </p>
                        <p className="text-xs text-blue-700">
                          {insights.lastChatSession}
                        </p>
                      </div>
                    </div>
                  )}
                {/* Only show Last Voice if there's actual voice activity */}
                {insights.lastVoiceSession &&
                  insights.lastVoiceSession !== "Never" && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs font-medium text-green-900">
                          Last Voice
                        </p>
                        <p className="text-xs text-green-700">
                          {insights.lastVoiceSession}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
