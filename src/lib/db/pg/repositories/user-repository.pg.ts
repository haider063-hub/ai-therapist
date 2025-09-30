import { pgDb } from "../db.pg";
import { UserSchema, ChatThreadSchema, ChatMessageSchema } from "../schema.pg";
import { eq, count } from "drizzle-orm";
import type { User, BasicUserWithLastLogin } from "app-types/user";

export const pgUserRepository = {
  async create(data: any) {
    const [newUser] = await pgDb
      .insert(UserSchema)
      .values({
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newUser;
  },

  async findById(id: string) {
    const [user] = await pgDb
      .select()
      .from(UserSchema)
      .where(eq(UserSchema.id, id));

    return user || null;
  },

  async findByEmail(email: string) {
    const [user] = await pgDb
      .select()
      .from(UserSchema)
      .where(eq(UserSchema.email, email));

    return user || null;
  },

  async update(id: string, data: any) {
    const [updatedUser] = await pgDb
      .update(UserSchema)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, id))
      .returning();

    return updatedUser;
  },

  async delete(id: string) {
    await pgDb.delete(UserSchema).where(eq(UserSchema.id, id));
  },

  async existsByEmail(email: string): Promise<boolean> {
    const [user] = await pgDb
      .select({ id: UserSchema.id })
      .from(UserSchema)
      .where(eq(UserSchema.email, email));

    return !!user;
  },

  async updateUserDetails(data: {
    userId: string;
    name?: string;
    email?: string;
    image?: string;
  }): Promise<User> {
    const [updatedUser] = await pgDb
      .update(UserSchema)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, data.userId))
      .returning();

    return updatedUser;
  },

  async getUserById(userId: string): Promise<BasicUserWithLastLogin | null> {
    const [user] = await pgDb
      .select()
      .from(UserSchema)
      .where(eq(UserSchema.id, userId));

    return user || null;
  },

  async getUserCount(): Promise<number> {
    const [result] = await pgDb.select({ count: count() }).from(UserSchema);

    return result.count;
  },

  async getUserStats(userId: string): Promise<{
    threadCount: number;
    messageCount: number;
    modelStats: { model: string; count: number }[];
  }> {
    const [threadStats] = await pgDb
      .select({ count: count() })
      .from(ChatThreadSchema)
      .where(eq(ChatThreadSchema.userId, userId));

    const [messageStats] = await pgDb
      .select({ count: count() })
      .from(ChatMessageSchema)
      .innerJoin(
        ChatThreadSchema,
        eq(ChatMessageSchema.threadId, ChatThreadSchema.id),
      )
      .where(eq(ChatThreadSchema.userId, userId));

    const modelStats = await pgDb
      .select({
        model: ChatThreadSchema.model,
        count: count(),
      })
      .from(ChatThreadSchema)
      .where(eq(ChatThreadSchema.userId, userId))
      .groupBy(ChatThreadSchema.model);

    return {
      threadCount: threadStats.count,
      messageCount: messageStats.count,
      modelStats: modelStats.map((stat) => ({
        model: stat.model || "unknown",
        count: stat.count,
      })),
    };
  },
};
