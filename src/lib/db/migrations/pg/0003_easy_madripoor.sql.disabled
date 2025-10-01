ALTER TABLE "archive_item" DROP CONSTRAINT "archive_item_thread_id_chat_thread_id_fk";
--> statement-breakpoint
ALTER TABLE "bookmark" DROP CONSTRAINT "bookmark_thread_id_chat_thread_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_message" DROP CONSTRAINT "chat_message_thread_id_chat_thread_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_thread" DROP CONSTRAINT "chat_thread_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "archive_item" ALTER COLUMN "thread_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookmark" ALTER COLUMN "thread_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "chat_message" ALTER COLUMN "thread_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "chat_message" ALTER COLUMN "parts" SET DATA TYPE json[];--> statement-breakpoint
ALTER TABLE "chat_thread" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "chat_thread" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "archive_item" ADD CONSTRAINT "archive_item_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread" ADD CONSTRAINT "chat_thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" DROP COLUMN "content";