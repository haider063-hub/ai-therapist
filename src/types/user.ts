import { z } from "zod";
import { passwordSchema } from "lib/validations/password";

import { UserEntity } from "lib/db/pg/schema.pg";
import { getSession } from "auth/server";

// user without password
export interface User extends Omit<UserEntity, "password"> {
  lastLogin: Date | null;
}

export type BasicUser = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface BasicUserWithLastLogin extends BasicUser {
  lastLogin: Date | null;
  // Profile fields
  dateOfBirth?: string | null;
  gender?: string | null;
  country?: string | null;
  religion?: string | null;
  therapyNeeds?: string | null;
  preferredTherapyStyle?: string | null;
  specificConcerns?: string | null;
  profileCompleted?: boolean;
  // Session tracking
  totalChatSessions?: number;
  totalVoiceSessions?: number;
}

export type UserSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export type UserSessionUser = UserSession["user"];

export type UserRepository = {
  existsByEmail: (email: string) => Promise<boolean>;
  updateUserDetails: (data: {
    userId: string;
    name?: string;
    email?: string;
    image?: string;
  }) => Promise<User>;

  getUserById: (userId: string) => Promise<BasicUserWithLastLogin | null>;
  getUserCount: () => Promise<number>;
  getUserStats: (userId: string) => Promise<{
    threadCount: number;
    messageCount: number;
    modelStats: Array<{
      model: string;
      messageCount: number;
      totalTokens: number;
    }>;
    totalTokens: number;
    period: string;
  }>;
  getUserAuthMethods: (userId: string) => Promise<{
    hasPassword: boolean;
    oauthProviders: string[];
  }>;
};

export const UserZodSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
});
