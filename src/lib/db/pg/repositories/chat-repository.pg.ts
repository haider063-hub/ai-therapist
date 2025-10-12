import { pgDb } from "../db.pg";
import {
  ChatThreadSchema,
  ChatMessageSchema,
  UserSchema,
  MoodTrackingSchema,
} from "../schema.pg";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import type { ChatThread, ChatMessage } from "app-types/chat";
import { UIMessage } from "ai";
import { ChatMetadata } from "app-types/chat";

export const pgChatRepository = {
  async insertThread(
    thread: Omit<ChatThread, "createdAt" | "updatedAt">,
  ): Promise<ChatThread> {
    const [newThread] = await pgDb
      .insert(ChatThreadSchema)
      .values({
        id: thread.id,
        userId: thread.userId,
        title: thread.title,
        model: thread.model,
        archived: thread.archived || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return {
      ...newThread,
      model: newThread.model || undefined,
      archived: newThread.archived || false,
    };
  },

  async selectThread(id: string): Promise<ChatThread | null> {
    const [thread] = await pgDb
      .select()
      .from(ChatThreadSchema)
      .where(eq(ChatThreadSchema.id, id));

    return thread
      ? {
          ...thread,
          model: thread.model || undefined,
          archived: thread.archived || false,
        }
      : null;
  },

  async deleteChatMessage(id: string): Promise<void> {
    await pgDb.delete(ChatMessageSchema).where(eq(ChatMessageSchema.id, id));
  },

  async selectThreadDetails(
    id: string,
  ): Promise<(ChatThread & { messages: ChatMessage[] }) | null> {
    const [thread] = await pgDb
      .select()
      .from(ChatThreadSchema)
      .where(eq(ChatThreadSchema.id, id));

    if (!thread) return null;

    const messages = await pgDb
      .select()
      .from(ChatMessageSchema)
      .where(eq(ChatMessageSchema.threadId, id))
      .orderBy(ChatMessageSchema.createdAt);

    return {
      ...thread,
      model: thread.model || undefined,
      archived: thread.archived || false,
      messages: messages.map((msg) => ({
        ...msg,
        role: msg.role as UIMessage["role"],
        parts: msg.parts as UIMessage["parts"],
        metadata: msg.metadata as ChatMetadata,
      })),
    };
  },

  async selectMessagesByThreadId(threadId: string): Promise<ChatMessage[]> {
    const messages = await pgDb
      .select()
      .from(ChatMessageSchema)
      .where(eq(ChatMessageSchema.threadId, threadId))
      .orderBy(ChatMessageSchema.createdAt);

    return messages.map((msg) => ({
      ...msg,
      role: msg.role as UIMessage["role"],
      parts: msg.parts as UIMessage["parts"],
      metadata: msg.metadata as ChatMetadata,
    }));
  },

  async selectThreadsByUserId(
    userId: string,
  ): Promise<(ChatThread & { lastMessageAt: number })[]> {
    const threads = await pgDb
      .select({
        id: ChatThreadSchema.id,
        userId: ChatThreadSchema.userId,
        title: ChatThreadSchema.title,
        model: ChatThreadSchema.model,
        archived: ChatThreadSchema.archived,
        createdAt: ChatThreadSchema.createdAt,
        updatedAt: ChatThreadSchema.updatedAt,
        lastMessageAt: sql<Date | null>`(
          SELECT MAX(${ChatMessageSchema.createdAt})
          FROM ${ChatMessageSchema}
          WHERE ${ChatMessageSchema.threadId} = ${ChatThreadSchema.id}
        )`,
      })
      .from(ChatThreadSchema)
      .where(eq(ChatThreadSchema.userId, userId))
      .orderBy(
        desc(sql`(
        SELECT MAX(${ChatMessageSchema.createdAt})
        FROM ${ChatMessageSchema}
        WHERE ${ChatMessageSchema.threadId} = ${ChatThreadSchema.id}
      )`),
      );

    return threads.map((thread) => ({
      ...thread,
      model: thread.model || undefined,
      archived: thread.archived || false,
      lastMessageAt: thread.lastMessageAt?.getTime() || 0,
    }));
  },

  async updateThread(
    id: string,
    thread: Partial<Omit<ChatThread, "id" | "createdAt">>,
  ): Promise<ChatThread> {
    const [updatedThread] = await pgDb
      .update(ChatThreadSchema)
      .set({
        ...thread,
        updatedAt: new Date(),
      })
      .where(eq(ChatThreadSchema.id, id))
      .returning();

    return {
      ...updatedThread,
      model: updatedThread.model || undefined,
      archived: updatedThread.archived || false,
    };
  },

  async deleteThread(id: string): Promise<void> {
    try {
      // First check if the thread exists
      const existingThread = await pgDb
        .select()
        .from(ChatThreadSchema)
        .where(eq(ChatThreadSchema.id, id))
        .limit(1);

      if (existingThread.length === 0) {
        return;
      }

      // First delete related messages manually to ensure they're removed
      await pgDb
        .delete(ChatMessageSchema)
        .where(eq(ChatMessageSchema.threadId, id));

      // Then delete the thread
      await pgDb.delete(ChatThreadSchema).where(eq(ChatThreadSchema.id, id));
    } catch (error) {
      console.error("Error deleting thread:", error);
      throw error;
    }
  },

  async upsertThread(
    thread: Partial<Omit<ChatThread, "createdAt">> & {
      id: string;
      userId?: string;
    },
  ): Promise<ChatThread> {
    if (thread.id) {
      const [updatedThread] = await pgDb
        .update(ChatThreadSchema)
        .set({
          title: thread.title,
          model: thread.model,
          archived: thread.archived,
          updatedAt: new Date(),
        })
        .where(eq(ChatThreadSchema.id, thread.id))
        .returning();

      return {
        ...updatedThread,
        model: updatedThread.model || undefined,
        archived: updatedThread.archived || false,
      };
    } else {
      const [newThread] = await pgDb
        .insert(ChatThreadSchema)
        .values({
          id: crypto.randomUUID(),
          userId: thread.userId || "",
          title: thread.title || "",
          model: thread.model,
          archived: thread.archived || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        ...newThread,
        model: newThread.model || undefined,
        archived: newThread.archived || false,
      };
    }
  },

  async insertMessage(
    message: Omit<ChatMessage, "createdAt" | "updatedAt">,
  ): Promise<ChatMessage> {
    // Fix for drizzle-orm 0.44.5 JSON serialization issue
    // Ensure parts is properly formatted as a JSON array
    let formattedParts = message.parts;
    if (typeof message.parts === "string") {
      try {
        const parsed = JSON.parse(message.parts);
        formattedParts = Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        console.error("Failed to parse parts string:", error);
        formattedParts = [];
      }
    } else if (!Array.isArray(message.parts)) {
      formattedParts = [message.parts];
    }

    // Use raw SQL to bypass Drizzle's JSON serialization issues
    const partsJson = JSON.stringify(formattedParts);
    const metadataJson = message.metadata
      ? JSON.stringify(message.metadata)
      : "null";

    const result = await pgDb.execute(sql`
      INSERT INTO chat_message (id, thread_id, role, parts, metadata, created_at, updated_at)
      VALUES (${message.id}, ${message.threadId}, ${message.role}, ${partsJson}::jsonb, ${metadataJson}::jsonb, ${new Date()}, ${new Date()})
      RETURNING id, thread_id as "threadId", role, parts, metadata, created_at as "createdAt", updated_at as "updatedAt"
    `);

    return result.rows[0] as ChatMessage;
  },

  async upsertMessage(
    message: Omit<ChatMessage, "createdAt" | "updatedAt">,
  ): Promise<ChatMessage> {
    // Fix for drizzle-orm 0.44.5 JSON serialization issue
    // Ensure parts is properly formatted as a JSON array
    let formattedParts = message.parts;
    if (typeof message.parts === "string") {
      try {
        const parsed = JSON.parse(message.parts);
        formattedParts = Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        console.error("Failed to parse parts string:", error);
        formattedParts = [];
      }
    } else if (!Array.isArray(message.parts)) {
      formattedParts = [message.parts];
    }

    // Try using raw SQL to bypass Drizzle's JSON serialization issues
    const partsJson = JSON.stringify(formattedParts);
    const metadataJson = message.metadata
      ? JSON.stringify(message.metadata)
      : "null";

    const result = await pgDb.execute(sql`
      INSERT INTO chat_message (id, thread_id, role, parts, metadata, created_at, updated_at)
      VALUES (${message.id}, ${message.threadId}, ${message.role}, ${partsJson}::jsonb, ${metadataJson}::jsonb, ${new Date()}, ${new Date()})
      ON CONFLICT (id) DO UPDATE SET
        parts = ${partsJson}::jsonb,
        metadata = ${metadataJson}::jsonb,
        updated_at = ${new Date()}
      RETURNING id, thread_id as "threadId", role, parts, metadata, created_at as "createdAt", updated_at as "updatedAt"
    `);

    return result.rows[0] as ChatMessage;
  },

  async deleteMessagesByChatIdAfterTimestamp(messageId: string): Promise<void> {
    const [message] = await pgDb
      .select()
      .from(ChatMessageSchema)
      .where(eq(ChatMessageSchema.id, messageId));

    if (message) {
      await pgDb
        .delete(ChatMessageSchema)
        .where(
          and(
            eq(ChatMessageSchema.threadId, message.threadId),
            gte(ChatMessageSchema.createdAt, message.createdAt),
          ),
        );
    }
  },

  async deleteAllThreads(userId: string): Promise<void> {
    await pgDb
      .delete(ChatThreadSchema)
      .where(eq(ChatThreadSchema.userId, userId));
  },

  async deleteUnarchivedThreads(userId: string): Promise<void> {
    await pgDb
      .delete(ChatThreadSchema)
      .where(
        and(
          eq(ChatThreadSchema.userId, userId),
          eq(ChatThreadSchema.archived, false),
        ),
      );
  },

  async insertMessages(
    messages: Omit<ChatMessage, "createdAt" | "updatedAt">[],
  ): Promise<ChatMessage[]> {
    const now = new Date();
    const messagesWithTimestamps = messages.map((msg) => ({
      id: msg.id,
      threadId: msg.threadId,
      role: msg.role,
      content: "",
      parts: msg.parts,
      metadata: msg.metadata,
      createdAt: now,
      updatedAt: now,
    }));

    const inserted = await pgDb
      .insert(ChatMessageSchema)
      .values(messagesWithTimestamps)
      .returning();

    return inserted.map((msg, index) => ({
      ...msg,
      role: messages[index].role,
      parts: messages[index].parts,
      metadata: messages[index].metadata,
    }));
  },

  // Increment user's chat session count
  async incrementUserChatSessions(userId: string): Promise<void> {
    await pgDb
      .update(UserSchema)
      .set({
        totalChatSessions: sql`${UserSchema.totalChatSessions} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, userId));
  },

  // Increment user's voice session count
  async incrementUserVoiceSessions(userId: string): Promise<void> {
    await pgDb
      .update(UserSchema)
      .set({
        totalVoiceSessions: sql`${UserSchema.totalVoiceSessions} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, userId));
  },

  async selectVoiceConversationsByUserId(
    userId: string,
  ): Promise<
    Array<{ threadId: string; lastMessageTime: number; notes?: string }>
  > {
    // Get voice conversations directly from mood tracking with their timestamps
    const voiceConversations = await pgDb
      .select({
        threadId: MoodTrackingSchema.threadId,
        createdAt: MoodTrackingSchema.createdAt,
        notes: MoodTrackingSchema.notes,
      })
      .from(MoodTrackingSchema)
      .where(
        and(
          eq(MoodTrackingSchema.userId, userId),
          eq(MoodTrackingSchema.sessionType, "voice"),
          sql`${MoodTrackingSchema.threadId} IS NOT NULL`,
        ),
      )
      .orderBy(desc(MoodTrackingSchema.createdAt));

    console.log(
      `Raw voice conversations from DB: ${voiceConversations.length}`,
    );
    voiceConversations.forEach((conv, index) => {
      console.log(
        `Raw ${index + 1}: threadId=${conv.threadId}, createdAt=${conv.createdAt?.toISOString()}, notes="${conv.notes?.substring(0, 30)}..."`,
      );
    });

    // Group by threadId and get the most recent entry for each thread
    const threadMap = new Map<
      string,
      { threadId: string; lastMessageTime: number; notes?: string }
    >();

    console.log(
      `Processing ${voiceConversations.length} voice conversations...`,
    );
    for (const voiceConv of voiceConversations) {
      if (voiceConv.threadId && !threadMap.has(voiceConv.threadId)) {
        const lastMessageTime = voiceConv.createdAt.getTime();
        console.log(
          `Adding to map: threadId=${voiceConv.threadId}, lastMessageTime=${lastMessageTime}, notes="${voiceConv.notes?.substring(0, 30)}..."`,
        );
        threadMap.set(voiceConv.threadId, {
          threadId: voiceConv.threadId,
          lastMessageTime: lastMessageTime,
          notes: voiceConv.notes || undefined,
        });
      } else if (voiceConv.threadId) {
        console.log(`Skipping duplicate threadId: ${voiceConv.threadId}`);
      }
    }

    const result = Array.from(threadMap.values()).sort(
      (a, b) => b.lastMessageTime - a.lastMessageTime,
    );

    console.log(`Final result: ${result.length} unique voice conversations`);
    result.forEach((conv, index) => {
      const timestamp = new Date(conv.lastMessageTime);
      console.log(
        `Result ${index + 1}: threadId=${conv.threadId}, lastMessageTime=${conv.lastMessageTime} (${timestamp.toISOString()})`,
      );
    });

    return result;
  },
};
