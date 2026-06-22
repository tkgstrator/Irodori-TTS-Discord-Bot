-- Update column defaults to Gemini
ALTER TABLE "scenarios" ALTER COLUMN "editor_model" SET DEFAULT 'gemini-3-flash-preview';
ALTER TABLE "scenarios" ALTER COLUMN "writer_model" SET DEFAULT 'gemini-3-flash-preview';
