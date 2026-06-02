-- DropIndex
DROP INDEX "outbox_events_published_at_idx";

-- AlterTable
ALTER TABLE "outbox_events" ADD COLUMN     "claimed_at" TIMESTAMP(3),
ADD COLUMN     "claimed_by" TEXT;

-- CreateIndex
CREATE INDEX "outbox_events_published_at_claimed_at_created_at_idx" ON "outbox_events"("published_at", "claimed_at", "created_at");
