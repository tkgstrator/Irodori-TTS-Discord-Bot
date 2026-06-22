-- CreateTable
CREATE TABLE "ruby_dict_entries" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "word" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "scenario_id" TEXT,

    CONSTRAINT "ruby_dict_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ruby_dict_entries_scenario_id_idx" ON "ruby_dict_entries"("scenario_id");

-- CreateIndex
CREATE UNIQUE INDEX "ruby_dict_entries_word_scenario_id_key" ON "ruby_dict_entries"("word", "scenario_id");

-- AddForeignKey
ALTER TABLE "ruby_dict_entries" ADD CONSTRAINT "ruby_dict_entries_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
