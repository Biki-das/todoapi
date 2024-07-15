import type { Request, Response, NextFunction } from "express";
import prisma from "../db";

export async function handlePull(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const resp = await pull(req, res);
    res.json(resp);
  } catch (e) {
    next(e);
  }
}

async function pull(req, res: Response) {
  const pull = req.body;
  const userId = req.user.id;
  console.log(`Processing pull`, JSON.stringify(pull));
  const { clientGroupID } = pull;
  const fromVersion = pull.cookie ?? 0;
  const t0 = Date.now();

  try {
    // Read all data in a single transaction so it's consistent.
    const result = await prisma.$transaction(
      async (prisma) => {
        // Get current version
        const replicacheServer = await prisma.replicacheServer.findUnique({
          where: { id: 1 },
          select: { version: true },
        });

        if (!replicacheServer) {
          throw new Error(`No replicache_server found with id ${1}`);
        }

        const currentVersion = replicacheServer.version;

        if (fromVersion > currentVersion) {
          throw new Error(
            `fromVersion ${fromVersion} is from the future - aborting. This can happen in development if the server restarts. In that case, clear application data in browser and refresh.`
          );
        }

        // Get lmids for requesting client groups
        const lastMutationIDChanges = await getLastMutationIDChanges(
          clientGroupID,
          fromVersion
        );

        // Get changed domain objects since requested version
        const changed = await prisma.todo.findMany({
          where: {
            version: { gt: fromVersion },
            belongsToId: userId,
          },
          select: {
            id: true,
            title: true,
            version: true,
            deleted: true,
            completed: true,
          },
        });

        console.log(changed);

        // Build response patch
        const patch = changed.map((row) => {
          if (row.deleted) {
            return {
              op: "del",
              key: `message/${row.id}`,
            };
          } else {
            return {
              op: "put",
              key: `message/${row.id}`,
              value: {
                id: row.id,
                title: row.title,
                completed: row.completed,
              },
            };
          }
        });

        return {
          lastMutationIDChanges: lastMutationIDChanges ?? {},
          cookie: currentVersion,
          patch,
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    res.json(result);
    res.end();
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  } finally {
    console.log("Processed pull in", Date.now() - t0);
  }
}

async function getLastMutationIDChanges(
  clientGroupID: string,
  fromVersion: number
) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const rows = await prisma.replicacheClient.findMany({
    where: {
      clientGroupId: clientGroupID,
      version: { gt: fromVersion },
    },
    select: {
      id: true,
      lastMutationId: true,
    },
  });
  return Object.fromEntries(rows.map((r) => [r.id, r.lastMutationId]));
}
