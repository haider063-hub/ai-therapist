-- Migration: Fix Chat Schema to Match BetterChatBot
-- This migration converts EchoNestTherapy's chat schema to match BetterChatBot's working schema
-- Changes: text IDs -> UUID IDs, single JSON parts -> JSON array parts, remove content field
-- NOTE: This migration is DEPRECATED and SKIPPED for fresh installs
-- It was only needed for the initial schema conversion and is no longer required

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- This migration is now a no-op
-- The correct schema is created by migration 0000 (initial schema)
-- This file is kept for compatibility with existing migration history
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration 0003: Skipped (no longer needed for fresh installs)';
END $$;

-- All migration steps removed
-- This migration is no longer needed for fresh installs
