-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" VARCHAR(255) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "belongsToId" TEXT NOT NULL,
    "githubIssueNumber" INTEGER,
    "version" INTEGER NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplicacheServer" (
    "id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "ReplicacheServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplicacheClient" (
    "id" VARCHAR(36) NOT NULL,
    "clientGroupId" VARCHAR(36) NOT NULL,
    "lastMutationId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "ReplicacheClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Todo_id_belongsToId_key" ON "Todo"("id", "belongsToId");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_belongsToId_fkey" FOREIGN KEY ("belongsToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
