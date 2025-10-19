import { pgDb } from "../db.pg";
import { UserSchema, ChatThreadSchema, ChatMessageSchema } from "../schema.pg";
import { eq, count, desc, asc, ilike, and, or } from "drizzle-orm";
import type { User } from "app-types/user";
import type { AdminUsersQuery, AdminUsersPaginated } from "app-types/admin";

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

  // Proper implementation of getUsers with pagination and search
  async getUsers(query: AdminUsersQuery = {}): Promise<AdminUsersPaginated> {
    const {
      searchValue,
      searchField = "email",
      searchOperator = "contains",
      limit = 10,
      offset = 0,
      sortDirection = "desc",
    } = query;

    // Build search conditions
    const searchConditions: any[] = [];

    if (searchValue && searchValue.trim()) {
      const searchTerm = searchValue.trim();

      if (searchField === "email") {
        if (searchOperator === "contains") {
          searchConditions.push(ilike(UserSchema.email, `%${searchTerm}%`));
        } else if (searchOperator === "starts_with") {
          searchConditions.push(ilike(UserSchema.email, `${searchTerm}%`));
        } else if (searchOperator === "ends_with") {
          searchConditions.push(ilike(UserSchema.email, `%${searchTerm}`));
        }
      } else if (searchField === "name") {
        if (searchOperator === "contains") {
          searchConditions.push(ilike(UserSchema.name, `%${searchTerm}%`));
        } else if (searchOperator === "starts_with") {
          searchConditions.push(ilike(UserSchema.name, `${searchTerm}%`));
        } else if (searchOperator === "ends_with") {
          searchConditions.push(ilike(UserSchema.name, `%${searchTerm}`));
        }
      } else if (searchField === "both") {
        // Search both name and email
        searchConditions.push(
          or(
            ilike(UserSchema.email, `%${searchTerm}%`),
            ilike(UserSchema.name, `%${searchTerm}%`),
          )!,
        );
      } else {
        // Default: search both name and email if no specific field is provided
        searchConditions.push(
          or(
            ilike(UserSchema.email, `%${searchTerm}%`),
            ilike(UserSchema.name, `%${searchTerm}%`),
          )!,
        );
      }
    }

    // Build where clause
    const whereClause =
      searchConditions.length > 0 ? and(...searchConditions) : undefined;

    // Build order by clause
    const orderByClause =
      sortDirection === "asc"
        ? asc(UserSchema.createdAt) // Default to createdAt for now
        : desc(UserSchema.createdAt);

    // Get total count for pagination
    const [totalResult] = await pgDb
      .select({ count: count() })
      .from(UserSchema)
      .where(whereClause);

    // Get paginated users
    const users = await pgDb
      .select()
      .from(UserSchema)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return {
      users: users.map((user) => ({
        ...user,
        lastLogin: user.lastLogin || null,
      })),
      total: totalResult.count,
      limit,
      offset,
    };
  },
};
