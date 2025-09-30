-- Migration to fix chat_message table schema
-- Remove the content column that should have been dropped

-- Check if content column exists and drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_message' 
        AND column_name = 'content'
    ) THEN
        ALTER TABLE chat_message DROP COLUMN content;
        RAISE NOTICE 'Dropped content column from chat_message table';
    ELSE
        RAISE NOTICE 'Content column does not exist in chat_message table';
    END IF;
END $$;
