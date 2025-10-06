-- Migration: Add Subscription and Credit System
-- This migration adds all subscription, credit, and profile fields to the user table

-- Add subscription and credit system fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "credits" integer DEFAULT 400 NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_type" text DEFAULT 'free_trial' NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;

-- Add user preferences
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "preferred_language" text DEFAULT 'en' NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_end_date" timestamp;

-- Add separate chat & voice credits system
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "chat_credits" integer DEFAULT 200 NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "voice_credits" integer DEFAULT 200 NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "chat_credits_from_topup" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "voice_credits_from_topup" integer DEFAULT 0 NOT NULL;

-- Add voice plan credit tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "daily_voice_credits" integer DEFAULT 300 NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "monthly_voice_credits" integer DEFAULT 9000 NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "voice_credits_used_today" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "voice_credits_used_this_month" integer DEFAULT 0 NOT NULL;

-- Add credit reset tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_daily_reset" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_monthly_reset" timestamp DEFAULT now() NOT NULL;

-- Add profile setup fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profile_completed" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "date_of_birth" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "gender" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "country" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "religion" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "therapy_needs" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "preferred_therapy_style" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "specific_concerns" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profile_last_updated" timestamp;

-- Add session tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "total_chat_sessions" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "total_voice_sessions" integer DEFAULT 0 NOT NULL;

-- Add selected therapist for voice
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "selected_therapist_id" text;

-- Update existing users to have correct credit amounts (200 each for chat and voice)
UPDATE "user" 
SET 
  "chat_credits" = 200,
  "voice_credits" = 200
WHERE "subscription_type" = 'free_trial'
  OR "subscription_type" IS NULL;

-- Create transaction table if it doesn't exist
CREATE TABLE IF NOT EXISTS "transaction" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "type" text NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "credits_added" integer DEFAULT 0 NOT NULL,
  "stripe_payment_id" text,
  "stripe_subscription_id" text,
  "status" text NOT NULL,
  "metadata" json,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Create usage_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS "usage_log" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "type" text NOT NULL,
  "credits_used" integer NOT NULL,
  "thread_id" text,
  "metadata" json,
  "timestamp" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "usage_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Create mood_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS "mood_tracking" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "date" text NOT NULL,
  "mood_score" integer NOT NULL,
  "sentiment" text,
  "thread_id" text,
  "session_type" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "mood_tracking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Create subscription_plan table if it doesn't exist
CREATE TABLE IF NOT EXISTS "subscription_plan" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "display_name" text NOT NULL,
  "price" numeric(10, 2) NOT NULL,
  "stripe_price_id" text NOT NULL,
  "chat_credits_per_message" integer DEFAULT 5 NOT NULL,
  "voice_credits_per_minute" integer DEFAULT 10 NOT NULL,
  "daily_voice_credits" integer DEFAULT 300 NOT NULL,
  "monthly_voice_credits" integer DEFAULT 9000 NOT NULL,
  "unlimited_chat" boolean DEFAULT false NOT NULL,
  "unlimited_voice" boolean DEFAULT false NOT NULL,
  "is_one_time_payment" boolean DEFAULT false NOT NULL,
  "features" json,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscription_type ON "user"("subscription_type");
CREATE INDEX IF NOT EXISTS idx_user_subscription_status ON "user"("subscription_status");
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON "transaction"("user_id");
CREATE INDEX IF NOT EXISTS idx_usage_log_user_id ON "usage_log"("user_id");
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_id ON "mood_tracking"("user_id");
CREATE INDEX IF NOT EXISTS idx_mood_tracking_date ON "mood_tracking"("date");

