import { PrismaClient } from "@prisma/client";

import prisma from "../db";

type TransactionCallback<R> = (prisma: PrismaClient) => Promise<R>;

export async function tx<R>(
  f: (
    prisma: Omit<
      PrismaClient,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >
  ) => Promise<R>
): Promise<R> {
  return await prisma.$transaction(
    async (prismaTransaction) => {
      return await f(prismaTransaction);
    },
    {
      isolationLevel: "RepeatableRead",
    }
  );
}

export const ServerID = 1;
