/*
  Warnings:

  - A unique constraint covering the columns `[belongsToId,title]` on the table `Todo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Todo_belongsToId_title_key" ON "Todo"("belongsToId", "title");
