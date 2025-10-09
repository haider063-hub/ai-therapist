-- Add image upload tracking fields to user table
ALTER TABLE "user" ADD COLUMN "images_used_this_month" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN "image_usage_reset_date" timestamp DEFAULT now() NOT NULL;
