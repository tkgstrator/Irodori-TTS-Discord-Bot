-- DropForeignKey
ALTER TABLE "ruby_dict_entries" DROP CONSTRAINT "ruby_dict_entries_scenario_id_fkey";

-- DropIndex
DROP INDEX "ruby_dict_entries_scenario_id_idx";

-- DropIndex
DROP INDEX "ruby_dict_entries_word_scenario_id_key";

-- AlterTable
ALTER TABLE "ruby_dict_entries" DROP COLUMN "scenario_id",
ADD COLUMN     "dict_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ruby_dicts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ruby_dicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_ruby_dicts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenario_id" TEXT NOT NULL,
    "dict_id" TEXT NOT NULL,

    CONSTRAINT "scenario_ruby_dicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scenario_ruby_dicts_scenario_id_dict_id_key" ON "scenario_ruby_dicts"("scenario_id", "dict_id");

-- CreateIndex
CREATE INDEX "ruby_dict_entries_dict_id_idx" ON "ruby_dict_entries"("dict_id");

-- CreateIndex
CREATE UNIQUE INDEX "ruby_dict_entries_word_dict_id_key" ON "ruby_dict_entries"("word", "dict_id");

-- AddForeignKey
ALTER TABLE "ruby_dict_entries" ADD CONSTRAINT "ruby_dict_entries_dict_id_fkey" FOREIGN KEY ("dict_id") REFERENCES "ruby_dicts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_ruby_dicts" ADD CONSTRAINT "scenario_ruby_dicts_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_ruby_dicts" ADD CONSTRAINT "scenario_ruby_dicts_dict_id_fkey" FOREIGN KEY ("dict_id") REFERENCES "ruby_dicts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
