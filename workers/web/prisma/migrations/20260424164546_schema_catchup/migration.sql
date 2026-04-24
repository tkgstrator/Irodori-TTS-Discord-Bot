-- AlterEnum
ALTER TYPE "ChapterStatus" ADD VALUE 'failed';

-- AlterEnum
ALTER TYPE "CueKind" ADD VALUE 'scene';

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "caption" TEXT,
ADD COLUMN     "sample_quotes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "scenario_chapters" ADD COLUMN     "generation_error" TEXT;

-- AlterTable
ALTER TABLE "scenario_cues" ADD COLUMN     "scene_name" TEXT;

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "editor_model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
ADD COLUMN     "prompt_note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "writer_model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash';
