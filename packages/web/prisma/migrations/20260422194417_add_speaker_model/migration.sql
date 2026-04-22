-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "speaker_id" TEXT;

-- CreateTable
CREATE TABLE "speakers" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,

    CONSTRAINT "speakers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "characters_speaker_id_idx" ON "characters"("speaker_id");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "speakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
