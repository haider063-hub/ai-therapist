-- Migration: Fix Chat Schema to Match BetterChatBot
-- This migration converts EchoNestTherapy's chat schema to match BetterChatBot's working schema
-- Changes: text IDs -> UUID IDs, single JSON parts -> JSON array parts, remove content field

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if migration is needed (only run if old schema exists)
DO $$ 
DECLARE
  needs_migration BOOLEAN;
  thread_id_type TEXT;
BEGIN
  -- Check if chat_thread.id is text type (old schema)
  SELECT data_type INTO thread_id_type
  FROM information_schema.columns
  WHERE table_name = 'chat_thread' AND column_name = 'id';
  
  needs_migration := (thread_id_type = 'text');
  
  IF NOT needs_migration THEN
    RAISE NOTICE 'Schema already migrated or tables do not exist. Skipping migration 0003.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Starting chat schema migration...';
END $$;

-- Step 1: Add new UUID columns (only if tables exist with old schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_thread' AND column_name = 'id' AND data_type = 'text'
  ) THEN
    ALTER TABLE chat_thread ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();
    ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS thread_id_uuid UUID;
    ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS parts_array JSONB[];
  END IF;
END $$;

-- Step 2: Create mapping table and convert data (only if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_thread' AND column_name = 'id_uuid'
  ) THEN
    -- Create mapping table for old -> new ID conversion
    CREATE TABLE IF NOT EXISTS id_mapping (
      old_id TEXT PRIMARY KEY,
      new_id UUID NOT NULL
    );

    -- Populate mapping table with thread ID conversions
    INSERT INTO id_mapping (old_id, new_id)
    SELECT id, id_uuid FROM chat_thread
    ON CONFLICT (old_id) DO NOTHING;

    -- Update message thread references to use new UUIDs
    UPDATE chat_message 
    SET thread_id_uuid = m.new_id
    FROM id_mapping m 
    WHERE chat_message.thread_id = m.old_id
      AND thread_id_uuid IS NULL;

    -- Convert parts from single JSON to JSON array (handle different cases)
    UPDATE chat_message 
    SET parts_array = CASE 
      WHEN parts IS NULL AND content IS NOT NULL THEN 
        ARRAY[jsonb_build_object('type','text','text',content)]
      WHEN jsonb_typeof(parts::jsonb) = 'object' THEN 
        ARRAY[parts::jsonb]
      WHEN jsonb_typeof(parts::jsonb) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements(parts::jsonb))
      ELSE 
        ARRAY[]::jsonb[]
    END
    WHERE parts_array IS NULL;
  END IF;
END $$;

-- Step 3: Rename columns and update constraints (only if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_thread' AND column_name = 'id_uuid'
  ) THEN
    -- Drop foreign key constraints temporarily
    ALTER TABLE chat_message DROP CONSTRAINT IF EXISTS chat_message_thread_id_chat_thread_id_fk;
    ALTER TABLE archive_item DROP CONSTRAINT IF EXISTS archive_item_thread_id_chat_thread_id_fk;
    ALTER TABLE bookmark DROP CONSTRAINT IF EXISTS bookmark_thread_id_chat_thread_id_fk;

    -- Atomic column rename (preserves data integrity)
    ALTER TABLE chat_thread RENAME COLUMN id TO id_old;
    ALTER TABLE chat_message RENAME COLUMN thread_id TO thread_id_old;
    ALTER TABLE chat_message RENAME COLUMN parts TO parts_old;

    -- Rename new columns to final names
    ALTER TABLE chat_thread RENAME COLUMN id_uuid TO id;
    ALTER TABLE chat_message RENAME COLUMN thread_id_uuid TO thread_id;
    ALTER TABLE chat_message RENAME COLUMN parts_array TO parts;

    -- Add NOT NULL constraints
    ALTER TABLE chat_message ALTER COLUMN thread_id SET NOT NULL;
    ALTER TABLE chat_message ALTER COLUMN parts SET NOT NULL;

    -- Recreate foreign key constraints with CASCADE delete
    ALTER TABLE chat_message ADD CONSTRAINT chat_message_thread_id_chat_thread_id_fk 
      FOREIGN KEY (thread_id) REFERENCES chat_thread(id) ON DELETE CASCADE;
    ALTER TABLE archive_item ADD CONSTRAINT archive_item_thread_id_chat_thread_id_fk 
      FOREIGN KEY (thread_id) REFERENCES chat_thread(id) ON DELETE CASCADE;
    ALTER TABLE bookmark ADD CONSTRAINT bookmark_thread_id_chat_thread_id_fk 
      FOREIGN KEY (thread_id) REFERENCES chat_thread(id) ON DELETE CASCADE;

    -- Cleanup - drop old columns and mapping table
    ALTER TABLE chat_thread DROP COLUMN IF EXISTS id_old;
    ALTER TABLE chat_message DROP COLUMN IF EXISTS thread_id_old;
    ALTER TABLE chat_message DROP COLUMN IF EXISTS parts_old;
    ALTER TABLE chat_message DROP COLUMN IF EXISTS content;
    DROP TABLE IF EXISTS id_mapping;
  END IF;
END $$;

-- Step 11: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_message_thread_id ON chat_message(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_created_at ON chat_message(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_thread_user_id ON chat_thread(user_id);
