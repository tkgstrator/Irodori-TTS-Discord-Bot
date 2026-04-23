/*
  Warnings:

  - You are about to drop the column `image_url` on the `speakers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('draft', 'generating', 'completed');

-- CreateEnum
CREATE TYPE "CueKind" AS ENUM ('speech', 'pause');

-- AlterTable
ALTER TABLE "speakers" DROP COLUMN "image_url";

-- CreateTable
CREATE TABLE "scenario_chapters" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ChapterStatus" NOT NULL DEFAULT 'draft',
    "cue_count" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "synopsis" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "scenario_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_chapter_characters" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chapter_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,

    CONSTRAINT "scenario_chapter_characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_cues" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "cue_order" INTEGER NOT NULL,
    "kind" "CueKind" NOT NULL,
    "speaker_alias" TEXT,
    "text" TEXT,
    "pause_duration" DOUBLE PRECISION,
    "synth_options" JSONB,

    CONSTRAINT "scenario_cues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scenario_chapters_scenario_id_number_key" ON "scenario_chapters"("scenario_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_chapter_characters_chapter_id_character_id_key" ON "scenario_chapter_characters"("chapter_id", "character_id");

-- CreateIndex
CREATE INDEX "scenario_cues_chapter_id_idx" ON "scenario_cues"("chapter_id");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_cues_chapter_id_cue_order_key" ON "scenario_cues"("chapter_id", "cue_order");

-- AddForeignKey
ALTER TABLE "scenario_chapters" ADD CONSTRAINT "scenario_chapters_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_chapter_characters" ADD CONSTRAINT "scenario_chapter_characters_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "scenario_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_chapter_characters" ADD CONSTRAINT "scenario_chapter_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_cues" ADD CONSTRAINT "scenario_cues_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "scenario_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
