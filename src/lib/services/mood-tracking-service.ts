import { pgDb, executeWithRetry } from "lib/db/pg/db.pg";
import { generateUUID } from "lib/utils";
import { customModelProvider } from "lib/ai/models";
import { generateText } from "ai";
import { getCurrentUTCTime } from "lib/utils/timezone-utils";
import { sql } from "drizzle-orm";
import logger from "logger";

interface MoodAnalysisResult {
  moodScore: number; // 1-10
  sentiment: "positive" | "neutral" | "negative";
  notes?: string;
}

export class MoodTrackingService {
  /**
   * Analyze mood from conversation messages
   */
  async analyzeMood(messages: string[]): Promise<MoodAnalysisResult | null> {
    try {
      // Only analyze if we have meaningful conversation
      if (messages.length === 0) {
        console.log("🔍 [DEBUG] No messages to analyze for mood");
        return null;
      }

      const conversationText = messages.join("\n");
      console.log(
        "🔍 [DEBUG] Analyzing mood for conversation:",
        conversationText.substring(0, 100) + "...",
      );

      // Use a fast model for mood analysis
      const model = customModelProvider.getModel({
        provider: "openai",
        model: "gpt-4o-mini",
      });

      console.log("🔍 [DEBUG] Model configured for mood analysis:", model);

      const prompt = `Analyze the emotional tone and mood of this therapy conversation.

Conversation:
${conversationText}

Provide a JSON response with:
1. moodScore: A number from 1-10 where:
   - 1-3: Very low mood, depressed, distressed
   - 4-6: Okay mood, mixed feelings, moderate stress
   - 7-10: Good to great mood, positive, hopeful

2. sentiment: "positive", "neutral", or "negative"

3. notes: A brief 1-sentence summary of the emotional state (max 100 chars)

Return ONLY valid JSON in this format:
{"moodScore": 5, "sentiment": "neutral", "notes": "Feeling stressed about work but hopeful"}`;

      console.log("🔍 [DEBUG] Sending prompt to AI model for mood analysis");
      const { text } = await generateText({
        model,
        prompt,
      });

      console.log(
        "🔍 [DEBUG] AI response received:",
        text.substring(0, 200) + "...",
      );

      // Parse the response
      const cleaned = text.trim().replace(/```json\n?|\n?```/g, "");
      console.log("🔍 [DEBUG] Cleaned AI response:", cleaned);

      const result: MoodAnalysisResult = JSON.parse(cleaned);
      console.log("🔍 [DEBUG] Parsed mood analysis result:", result);

      // Validate the result
      if (!result.moodScore || result.moodScore < 1 || result.moodScore > 10) {
        console.error("❌ Invalid mood score:", result.moodScore);
        logger.error("Invalid mood score:", result.moodScore);
        return null;
      }

      console.log("✅ Mood analysis successful:", result);
      return result;
    } catch (error) {
      console.error("❌ Error analyzing mood:", error);
      logger.error("Error analyzing mood:", error);
      return null;
    }
  }

  /**
   * Save mood tracking data
   */
  async saveMoodTracking(
    userId: string,
    threadId: string,
    sessionType: "chat" | "voice",
    moodAnalysis: MoodAnalysisResult,
    _conversationEndTime?: Date,
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Use EXACT same UTC method as chat messages for consistency
      const utcTimestamp = getCurrentUTCTime(); // Same as chat messages
      const finalTimestamp = new Date(utcTimestamp);

      console.log(
        "🔍 [DEBUG] Mood tracking save - User:",
        userId,
        "Thread:",
        threadId,
        "Session:",
        sessionType,
        "UTC Time:",
        utcTimestamp,
        "Final Timestamp:",
        finalTimestamp.toISOString(),
      );

      const moodTrackingData = {
        id: generateUUID(),
        userId,
        date: today,
        moodScore: moodAnalysis.moodScore,
        sentiment: moodAnalysis.sentiment,
        threadId,
        sessionType,
        notes: moodAnalysis.notes || null,
        createdAt: finalTimestamp, // Store as UTC Date object (same as chat)
      };

      // Use raw SQL like chat messages to ensure consistent timestamp handling
      try {
        await executeWithRetry(
          () =>
            pgDb.execute(sql`
            INSERT INTO mood_tracking (id, user_id, date, mood_score, sentiment, thread_id, session_type, notes, created_at)
            VALUES (${moodTrackingData.id}, ${moodTrackingData.userId}, ${moodTrackingData.date}, ${moodTrackingData.moodScore}, ${moodTrackingData.sentiment}, ${moodTrackingData.threadId}, ${moodTrackingData.sessionType}, ${moodTrackingData.notes}, ${new Date(utcTimestamp)})
          `),
          3, // maxRetries
          1000, // delay
        );
        logger.info(
          `Mood tracked for user ${userId}: ${moodAnalysis.moodScore}/10 (${moodAnalysis.sentiment})`,
        );
      } catch (error: any) {
        console.error(
          `❌ Failed to save mood tracking after all retries:`,
          error,
        );
        logger.error(`Failed to save mood tracking after all retries:`, error);
        // Don't throw - mood tracking should not break the main flow
      }
    } catch (error) {
      console.error("Error saving mood tracking:", error);
      logger.error("Error saving mood tracking:", error);
      // Don't throw - mood tracking should not break the main flow
    }
  }

  /**
   * Track mood from a conversation
   */
  async trackConversationMood(
    userId: string,
    threadId: string,
    messages: Array<{ role: string; content: string }>,
    sessionType: "chat" | "voice",
    conversationEndTime?: Date,
  ): Promise<void> {
    try {
      console.log("🔍 [DEBUG] Starting mood tracking for:", {
        userId,
        threadId,
        sessionType,
        messageCount: messages.length,
        conversationEndTime: conversationEndTime?.toISOString(),
      });

      // Extract user messages for mood analysis
      const userMessages = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .filter((content) => content && content.trim().length > 0);

      console.log("🔍 [DEBUG] Extracted user messages:", userMessages);

      if (userMessages.length === 0) {
        console.log(
          "🔍 [DEBUG] No user messages to analyze - skipping mood tracking",
        );
        return; // No user messages to analyze
      }

      // Analyze the mood
      console.log("🔍 [DEBUG] Starting mood analysis...");
      const moodAnalysis = await this.analyzeMood(userMessages);

      if (moodAnalysis) {
        console.log(
          "🔍 [DEBUG] Mood analysis successful, saving to database...",
        );
        await this.saveMoodTracking(
          userId,
          threadId,
          sessionType,
          moodAnalysis,
          conversationEndTime,
        );
        console.log("✅ Mood tracking completed successfully");
      } else {
        console.log("❌ Mood analysis returned null - no mood data saved");
      }
    } catch (error) {
      console.error("❌ Error tracking conversation mood:", error);
      logger.error("Error tracking conversation mood:", error);
      // Don't throw - mood tracking should not break the main flow
    }
  }
}

export const moodTrackingService = new MoodTrackingService();
