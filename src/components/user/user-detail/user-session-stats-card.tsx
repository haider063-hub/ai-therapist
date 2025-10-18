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
  Clock,
  Target,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
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
  weeklyGoal?: number;
  weeklyProgress?: number;
  mostActiveDay?: string;
  averageSessionDuration?: number;
}

export function UserSessionStatsCard({ stats }: UserSessionStatsCardProps) {
  const router = useRouter();
  const [insights, setInsights] = useState<SessionInsights>({});
  const [loading, setLoading] = useState(true);

  // Fetch additional session insights
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // This would be replaced with actual API calls
        // For now, we'll simulate some data
        setInsights({
          lastChatSession: "2 days ago",
          lastVoiceSession: "Yesterday",
          weeklyGoal: 5,
          weeklyProgress: 3,
          mostActiveDay: "Tuesday",
          averageSessionDuration: 18,
        });
      } catch (error) {
        console.error("Failed to fetch session insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const getProgressPercentage = () => {
    if (!insights.weeklyGoal || !insights.weeklyProgress) return 0;
    return Math.min((insights.weeklyProgress / insights.weeklyGoal) * 100, 100);
  };

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

        {/* Recent Activity Section */}
        {!loading && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">
              Recent Activity
            </h4>

            {/* Last Sessions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-blue-900">Last Chat</p>
                  <p className="text-xs text-blue-700">
                    {insights.lastChatSession || "Never"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <Calendar className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-green-900">
                    Last Voice
                  </p>
                  <p className="text-xs text-green-700">
                    {insights.lastVoiceSession || "Never"}
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly Progress */}
            {insights.weeklyGoal && insights.weeklyProgress !== undefined && (
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900">
                      Weekly Goal
                    </span>
                  </div>
                  <span className="text-xs text-purple-700">
                    {insights.weeklyProgress}/{insights.weeklyGoal}
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={() => router.push("/chat")}
              >
                <Plus className="h-3 w-3 mr-1" />
                New Chat
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={() => router.push("/voice-chat")}
              >
                <Mic className="h-3 w-3 mr-1" />
                Voice Chat
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
