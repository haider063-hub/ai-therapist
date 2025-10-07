"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Mic, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserSessionStatsCardProps {
  stats: {
    totalChatSessions: number;
    totalVoiceSessions: number;
    weeklyMoodScore?: number;
  };
}

export function UserSessionStatsCard({ stats }: UserSessionStatsCardProps) {
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
      </CardContent>
    </Card>
  );
}
