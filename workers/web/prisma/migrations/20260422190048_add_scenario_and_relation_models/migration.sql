-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('draft', 'generating', 'completed', 'failed');

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "age_group" TEXT NOT NULL DEFAULT 'young_adult',
    "gender" TEXT NOT NULL DEFAULT 'male',
    "occupation" TEXT NOT NULL DEFAULT 'student_high',
    "personality_tags" TEXT[],
    "speech_style" TEXT NOT NULL DEFAULT 'neutral',
    "first_person" TEXT NOT NULL DEFAULT 'boku',
    "second_person" TEXT NOT NULL DEFAULT '',
    "honorific" TEXT NOT NULL DEFAULT 'san',
    "attribute_tags" TEXT[],
    "background_tags" TEXT[],
    "memo" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_relations" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "from_character_id" TEXT NOT NULL,
    "to_character_id" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,

    CONSTRAINT "character_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "genres" TEXT[],
    "tone" TEXT NOT NULL,
    "ending" TEXT NOT NULL,
    "status" "ScenarioStatus" NOT NULL DEFAULT 'draft',
    "vds_json" JSONB,
    "narrator_id" TEXT,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_casts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenario_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "scenario_casts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "character_relations_from_character_id_to_character_id_key" ON "character_relations"("from_character_id", "to_character_id");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_casts_scenario_id_character_id_key" ON "scenario_casts"("scenario_id", "character_id");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_casts_scenario_id_alias_key" ON "scenario_casts"("scenario_id", "alias");

-- AddForeignKey
ALTER TABLE "character_relations" ADD CONSTRAINT "character_relations_from_character_id_fkey" FOREIGN KEY ("from_character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_relations" ADD CONSTRAINT "character_relations_to_character_id_fkey" FOREIGN KEY ("to_character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_narrator_id_fkey" FOREIGN KEY ("narrator_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_casts" ADD CONSTRAINT "scenario_casts_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_casts" ADD CONSTRAINT "scenario_casts_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
