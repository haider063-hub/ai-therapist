import {
  pgTable,
  text,
  timestamp,
  boolean,
  json,
  uuid,
} from "drizzle-orm/pg-core";
import { UIMessage } from "ai";
import { ChatMetadata } from "app-types/chat";

// User table
export const UserSchema = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  password: text("password"),
  image: text("image"),
  role: text("role"),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session table
export const SessionSchema = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UserSchema.id),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Account table
export const AccountSchema = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UserSchema.id),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Verification table
export const VerificationSchema = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat Thread table
export const ChatThreadSchema = pgTable("chat_thread", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  model: text("model"),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat Message table
export const ChatMessageSchema = pgTable("chat_message", {
  id: text("id").primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => ChatThreadSchema.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<UIMessage["role"]>(),
  parts: json("parts").notNull().array().$type<UIMessage["parts"]>(),
  metadata: json("metadata").$type<ChatMetadata>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Archive table
export const ArchiveSchema = pgTable("archive", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UserSchema.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Archive Item table
export const ArchiveItemSchema = pgTable("archive_item", {
  id: text("id").primaryKey(),
  archiveId: text("archive_id")
    .notNull()
    .references(() => ArchiveSchema.id),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => ChatThreadSchema.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(), // Reference to the actual item
  userId: text("user_id")
    .notNull()
    .references(() => UserSchema.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bookmark table
export const BookmarkSchema = pgTable("bookmark", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UserSchema.id),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => ChatThreadSchema.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports - using direct Drizzle types instead of Zod
export type UserEntity = typeof UserSchema.$inferSelect;
export type SessionEntity = typeof SessionSchema.$inferSelect;
export type AccountEntity = typeof AccountSchema.$inferSelect;
export type VerificationEntity = typeof VerificationSchema.$inferSelect;
export type ChatThreadEntity = typeof ChatThreadSchema.$inferSelect;
export type ChatMessageEntity = typeof ChatMessageSchema.$inferSelect;
export type ArchiveEntity = typeof ArchiveSchema.$inferSelect;
export type ArchiveItemEntity = typeof ArchiveItemSchema.$inferSelect;
export type BookmarkEntity = typeof BookmarkSchema.$inferSelect;
