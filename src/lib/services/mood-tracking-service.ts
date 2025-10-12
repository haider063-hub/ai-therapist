import { pgDb } from "lib/db/pg/db.pg";
import { MoodTrackingSchema } from "lib/db/pg/schema.pg";
import { generateUUID } from "lib/utils";
import { customModelProvider } from "lib/ai/models";
import { generateText } from "ai";
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
        return null;
      }

      const conversationText = messages.join("\n");

      // Use a fast model for mood analysis
      const model = customModelProvider.getModel({
        provider: "openai",
        model: "gpt-4o-mini",
      });

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

      const { text } = await generateText({
        model,
        prompt,
      });

      // Parse the response
      const cleaned = text.trim().replace(/```json\n?|\n?```/g, "");
      const result: MoodAnalysisResult = JSON.parse(cleaned);

      // Validate the result
      if (!result.moodScore || result.moodScore < 1 || result.moodScore > 10) {
        logger.error("Invalid mood score:", result.moodScore);
        return null;
      }

      return result;
    } catch (error) {
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
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];

      console.log("=== SAVING MOOD TRACKING ===");
      console.log(`User ID: ${userId}`);
      console.log(`Thread ID: ${threadId}`);
      console.log(`Session Type: ${sessionType}`);
      console.log(`Mood Score: ${moodAnalysis.moodScore}`);
      console.log(`Sentiment: ${moodAnalysis.sentiment}`);
      console.log(`Notes: ${moodAnalysis.notes?.substring(0, 100)}...`);

      await pgDb.insert(MoodTrackingSchema).values({
        id: generateUUID(),
        userId,
        date: today,
        moodScore: moodAnalysis.moodScore,
        sentiment: moodAnalysis.sentiment,
        threadId,
        sessionType,
        notes: moodAnalysis.notes || null,
        createdAt: new Date(),
      });

      console.log("Mood tracking saved successfully to database");
      logger.info(
        `Mood tracked for user ${userId}: ${moodAnalysis.moodScore}/10 (${moodAnalysis.sentiment})`,
      );
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
  ): Promise<void> {
    try {
      console.log("=== TRACKING CONVERSATION MOOD ===");
      console.log(`User ID: ${userId}`);
      console.log(`Thread ID: ${threadId}`);
      console.log(`Session Type: ${sessionType}`);
      console.log(`Total messages: ${messages.length}`);

      // Extract user messages for mood analysis
      const userMessages = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .filter((content) => content && content.trim().length > 0);

      console.log(`User messages extracted: ${userMessages.length}`);
      userMessages.forEach((msg, index) => {
        console.log(`User message ${index + 1}: "${msg.substring(0, 50)}..."`);
      });

      if (userMessages.length === 0) {
        console.log("No user messages to analyze - returning");
        return; // No user messages to analyze
      }

      // Analyze the mood
      console.log("Analyzing mood...");
      const moodAnalysis = await this.analyzeMood(userMessages);

      if (moodAnalysis) {
        console.log("Mood analysis successful, saving...");
        await this.saveMoodTracking(
          userId,
          threadId,
          sessionType,
          moodAnalysis,
        );
      } else {
        console.log("Mood analysis failed - no analysis returned");
      }
    } catch (error) {
      console.error("Error tracking conversation mood:", error);
      logger.error("Error tracking conversation mood:", error);
      // Don't throw - mood tracking should not break the main flow
    }
  }
}

export const moodTrackingService = new MoodTrackingService();
