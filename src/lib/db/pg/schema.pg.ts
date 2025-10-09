import {
  pgTable,
  text,
  timestamp,
  boolean,
  json,
  jsonb,
  integer,
  decimal,
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

  // Subscription and Credit System Fields
  credits: integer("credits").default(400).notNull(), // Legacy field - kept for backward compatibility
  subscriptionType: text("subscription_type").default("free_trial").notNull(), // free_trial, chat_only, voice_only, voice_chat
  subscriptionStatus: text("subscription_status").default("active").notNull(), // active, canceled, past_due, incomplete
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),

  // User Preferences
  preferredLanguage: text("preferred_language").default("en").notNull(), // Language code: en, es, ja, ar, fr, de, hi, ru
  subscriptionEndDate: timestamp("subscription_end_date"),

  // Separate Chat & Voice Credits System
  chatCredits: integer("chat_credits").default(200).notNull(), // Chat credits from free trial
  voiceCredits: integer("voice_credits").default(200).notNull(), // Voice credits from free trial
  chatCreditsFromTopup: integer("chat_credits_from_topup").default(0).notNull(), // Chat credits from purchases
  voiceCreditsFromTopup: integer("voice_credits_from_topup")
    .default(0)
    .notNull(), // Voice credits from purchases

  // Voice Plan Credit Tracking (for voice_only and premium plans)
  dailyVoiceCredits: integer("daily_voice_credits").default(300).notNull(), // Configurable daily limit
  monthlyVoiceCredits: integer("monthly_voice_credits").default(9000).notNull(), // Configurable monthly limit
  voiceCreditsUsedToday: integer("voice_credits_used_today")
    .default(0)
    .notNull(),
  voiceCreditsUsedThisMonth: integer("voice_credits_used_this_month")
    .default(0)
    .notNull(),

  // Credit Reset Tracking
  lastDailyReset: timestamp("last_daily_reset").defaultNow().notNull(),
  lastMonthlyReset: timestamp("last_monthly_reset").defaultNow().notNull(),

  // Profile Setup Fields (for AI personalization)
  profileCompleted: boolean("profile_completed").default(false).notNull(), // Track if user completed profile setup
  dateOfBirth: text("date_of_birth"), // Stored as YYYY-MM-DD for age calculation
  gender: text("gender"), // male, female, non-binary, prefer_not_to_say, other
  country: text("country"), // Full country name from dropdown
  religion: text("religion"), // christianity, islam, hinduism, buddhism, judaism, atheist, spiritual, other
  therapyNeeds: text("therapy_needs"), // JSON array: ["stress", "anxiety", "depression", etc.]
  preferredTherapyStyle: text("preferred_therapy_style"), // cbt, mindfulness, supportive, other
  specificConcerns: text("specific_concerns"), // Open text field for detailed concerns
  profileLastUpdated: timestamp("profile_last_updated"),

  // Session Tracking
  totalChatSessions: integer("total_chat_sessions").default(0).notNull(), // Count of chat threads
  totalVoiceSessions: integer("total_voice_sessions").default(0).notNull(), // Count of completed voice sessions

  // Selected AI Therapist for Voice
  selectedTherapistId: text("selected_therapist_id"), // ID of selected therapist (e.g., "yuki-tanaka")

  // Image Upload Tracking (for chat_only and premium plans)
  imagesUsedThisMonth: integer("images_used_this_month").default(0).notNull(), // Count of images uploaded this month
  imageUsageResetDate: timestamp("image_usage_reset_date")
    .defaultNow()
    .notNull(), // Last monthly reset date
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
  id: text("id").primaryKey().notNull(),
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
  threadId: text("thread_id")
    .notNull()
    .references(() => ChatThreadSchema.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<UIMessage["role"]>(),
  parts: jsonb("parts").notNull().$type<UIMessage["parts"]>(),
  metadata: jsonb("metadata").$type<ChatMetadata>(),
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
  threadId: text("thread_id").notNull(),
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
  threadId: text("thread_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table - logs Stripe payments and top-ups
export const TransactionSchema = pgTable("transaction", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'subscription' or 'topup'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Amount in dollars
  creditsAdded: integer("credits_added").default(0).notNull(),
  stripePaymentId: text("stripe_payment_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull(), // 'pending', 'succeeded', 'failed', 'canceled'
  metadata: json("metadata"), // Additional payment metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Usage logs table - tracks each credit deduction
export const UsageLogSchema = pgTable("usage_log", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'chat' or 'voice'
  creditsUsed: integer("credits_used").notNull(),
  threadId: text("thread_id"), // Reference to chat thread if applicable
  metadata: json("metadata"), // Additional usage metadata
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Mood tracking table - stores daily mood scores from conversations
export const MoodTrackingSchema = pgTable("mood_tracking", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  moodScore: integer("mood_score").notNull(), // 1-10 scale
  sentiment: text("sentiment"), // positive, neutral, negative
  threadId: text("thread_id"), // Which conversation this came from
  sessionType: text("session_type"), // 'chat' or 'voice'
  notes: text("notes"), // AI-generated mood notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscription Plans Configuration table - configurable limits
export const SubscriptionPlanSchema = pgTable("subscription_plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // 'chat_only', 'voice_only', 'premium'
  displayName: text("display_name").notNull(), // 'Chat Only', 'Voice Only', 'Premium'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
  chatCreditsPerMessage: integer("chat_credits_per_message")
    .default(5)
    .notNull(),
  voiceCreditsPerMinute: integer("voice_credits_per_minute")
    .default(10)
    .notNull(),
  dailyVoiceCredits: integer("daily_voice_credits").default(300).notNull(),
  monthlyVoiceCredits: integer("monthly_voice_credits").default(9000).notNull(),
  unlimitedChat: boolean("unlimited_chat").default(false).notNull(),
  unlimitedVoice: boolean("unlimited_voice").default(false).notNull(),
  isOneTimePayment: boolean("is_one_time_payment").default(false).notNull(), // For top-ups and one-time purchases
  features: json("features").$type<string[]>(), // Array of feature descriptions
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports - using direct Drizzle types instead of Zod
export type UserEntity = typeof UserSchema.$inferSelect;
export type SessionEntity = typeof SessionSchema.$inferSelect;
export type AccountEntity = typeof AccountSchema.$inferSelect;
export type VerificationEntity = typeof VerificationSchema.$inferSelect;
export type ChatThreadEntity = typeof ChatThreadSchema.$inferSelect;
export type ChatMessageEntity = typeof ChatMessageSchema.$inferSelect;
export type MoodTrackingEntity = typeof MoodTrackingSchema.$inferSelect;
export type ArchiveEntity = typeof ArchiveSchema.$inferSelect;
export type ArchiveItemEntity = typeof ArchiveItemSchema.$inferSelect;
export type BookmarkEntity = typeof BookmarkSchema.$inferSelect;
export type TransactionEntity = typeof TransactionSchema.$inferSelect;
export type UsageLogEntity = typeof UsageLogSchema.$inferSelect;
export type SubscriptionPlanEntity = typeof SubscriptionPlanSchema.$inferSelect;
