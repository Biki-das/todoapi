/*
  Warnings:

  - A unique constraint covering the columns `[id,belongsToId]` on the table `Todo` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Todo_belongsToId_title_key";

-- CreateIndex
CREATE UNIQUE INDEX "Todo_id_belongsToId_key" ON "Todo"("id", "belongsToId");
