-- Migrate existing Gemini model references to Qwen defaults
UPDATE "scenarios" SET "editor_model" = 'qwen36-27b' WHERE "editor_model" LIKE 'gemini-%';
UPDATE "scenarios" SET "writer_model" = 'qwen36-27b' WHERE "writer_model" LIKE 'gemini-%';

-- Update column defaults
ALTER TABLE "scenarios" ALTER COLUMN "editor_model" SET DEFAULT 'qwen36-27b';
ALTER TABLE "scenarios" ALTER COLUMN "writer_model" SET DEFAULT 'qwen36-27b';
