-- Migration: Fix Chat Schema to Match BetterChatBot
-- This migration converts EchoNestTherapy's chat schema to match BetterChatBot's working schema
-- Changes: text IDs -> UUID IDs, single JSON parts -> JSON array parts, remove content field

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Add new UUID columns
ALTER TABLE chat_thread ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE chat_message ADD COLUMN thread_id_uuid UUID;
ALTER TABLE chat_message ADD COLUMN parts_array JSON[];

-- Step 2: Create mapping table for old -> new ID conversion
CREATE TABLE id_mapping (
  old_id TEXT PRIMARY KEY,
  new_id UUID NOT NULL
);

-- Step 3: Populate mapping table with thread ID conversions
INSERT INTO id_mapping (old_id, new_id)
SELECT id, id_uuid FROM chat_thread;

-- Step 4: Update message thread references to use new UUIDs
UPDATE chat_message 
SET thread_id_uuid = m.new_id
FROM id_mapping m 
WHERE chat_message.thread_id = m.old_id;

-- Step 5: Convert parts from single JSON to JSON array
-- Handle different cases: single object, null with content, or already array
UPDATE chat_message 
SET parts_array = CASE 
  WHEN json_typeof(parts) = 'object' THEN ARRAY[parts]
  WHEN parts IS NULL AND content IS NOT NULL THEN ARRAY[json_build_object('type','text','text',content)]
  WHEN json_typeof(parts) = 'array' THEN parts::json[]
  ELSE ARRAY[]::json[]
END;

-- Step 6: Drop foreign key constraints temporarily
ALTER TABLE chat_message DROP CONSTRAINT IF EXISTS chat_message_thread_id_chat_thread_id_fk;
ALTER TABLE archive_item DROP CONSTRAINT IF EXISTS archive_item_thread_id_chat_thread_id_fk;
ALTER TABLE bookmark DROP CONSTRAINT IF EXISTS bookmark_thread_id_chat_thread_id_fk;

-- Step 7: Atomic column rename (preserves data integrity)
-- Rename old columns to _old suffix
ALTER TABLE chat_thread RENAME COLUMN id TO id_old;
ALTER TABLE chat_message RENAME COLUMN thread_id TO thread_id_old;
ALTER TABLE chat_message RENAME COLUMN parts TO parts_old;

-- Rename new columns to final names
ALTER TABLE chat_thread RENAME COLUMN id_uuid TO id;
ALTER TABLE chat_message RENAME COLUMN thread_id_uuid TO thread_id;
ALTER TABLE chat_message RENAME COLUMN parts_array TO parts;

-- Step 8: Add NOT NULL constraints
ALTER TABLE chat_message ALTER COLUMN thread_id SET NOT NULL;
ALTER TABLE chat_message ALTER COLUMN parts SET NOT NULL;

-- Step 9: Recreate foreign key constraints with CASCADE delete
ALTER TABLE chat_message ADD CONSTRAINT chat_message_thread_id_chat_thread_id_fk 
  FOREIGN KEY (thread_id) REFERENCES chat_thread(id) ON DELETE CASCADE;
ALTER TABLE archive_item ADD CONSTRAINT archive_item_thread_id_chat_thread_id_fk 
  FOREIGN KEY (thread_id) REFERENCES chat_thread(id) ON DELETE CASCADE;
ALTER TABLE bookmark ADD CONSTRAINT bookmark_thread_id_chat_thread_id_fk 
  FOREIGN KEY (thread_id) REFERENCES chat_thread(id) ON DELETE CASCADE;

-- Step 10: Cleanup - drop old columns and mapping table
ALTER TABLE chat_thread DROP COLUMN id_old;
ALTER TABLE chat_message DROP COLUMN thread_id_old;
ALTER TABLE chat_message DROP COLUMN parts_old;
ALTER TABLE chat_message DROP COLUMN content;
DROP TABLE id_mapping;

-- Step 11: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_message_thread_id ON chat_message(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_created_at ON chat_message(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_thread_user_id ON chat_thread(user_id);
