-- Migration: Remove ocr_text column from notes table
-- Version: v1.4
-- Date: 2024-12-31

-- Remove ocr_text column
ALTER TABLE notes DROP COLUMN ocr_text;
