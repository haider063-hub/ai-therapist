import { pgDb } from "../db.pg";
import { UserSchema, ChatThreadSchema, ChatMessageSchema } from "../schema.pg";
import { eq, count, desc } from "drizzle-orm";
import type { User } from "app-types/user";

export const pgAdminRepository = {
  async getAllUsers(): Promise<User[]> {
    const users = await pgDb
      .select()
      .from(UserSchema)
      .orderBy(desc(UserSchema.createdAt));

    return users.map((user) => ({
      ...user,
      lastLogin: user.lastLogin || null,
    }));
  },

  async getUserById(userId: string): Promise<User | null> {
    const [user] = await pgDb
      .select()
      .from(UserSchema)
      .where(eq(UserSchema.id, userId));

    if (!user) return null;

    return {
      ...user,
      lastLogin: user.lastLogin || null,
    };
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const [updatedUser] = await pgDb
      .update(UserSchema)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, userId))
      .returning();

    return {
      ...updatedUser,
      lastLogin: updatedUser.lastLogin || null,
    };
  },

  async deleteUser(userId: string): Promise<void> {
    await pgDb.delete(UserSchema).where(eq(UserSchema.id, userId));
  },

  async getUserStats(): Promise<{
    totalUsers: number;
    totalThreads: number;
    totalMessages: number;
  }> {
    const [userStats] = await pgDb.select({ count: count() }).from(UserSchema);

    const [threadStats] = await pgDb
      .select({ count: count() })
      .from(ChatThreadSchema);

    const [messageStats] = await pgDb
      .select({ count: count() })
      .from(ChatMessageSchema);

    return {
      totalUsers: userStats.count,
      totalThreads: threadStats.count,
      totalMessages: messageStats.count,
    };
  },

  // Add the missing getUsers method that the admin server expects
  async getUsers(query: any): Promise<any> {
    // Placeholder implementation - this should match the expected interface
    const users = await this.getAllUsers();
    return {
      users,
      total: users.length,
      limit: query.limit || 10,
      offset: query.offset || 0,
    };
  },
};
