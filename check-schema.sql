-- Check if content column still exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chat_message' 
ORDER BY ordinal_position;

-- If content column exists, drop it
ALTER TABLE chat_message DROP COLUMN IF EXISTS content;
