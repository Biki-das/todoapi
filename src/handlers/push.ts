import prisma from "../db";
import type { MutationV1, PushRequestV1 } from "replicache";
import type { Request, Response, NextFunction } from "express";
import { Octokit } from "@octokit/core";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function createGitHubIssue(todoTitle: string) {
  console.log("called createGitHubIssue");
  const res = await octokit.request("POST /repos/{owner}/{repo}/issues", {
    owner: "Biki-Das",
    repo: "Feedback-App",
    title: todoTitle,
    body: todoTitle,
    labels: ["bug"],
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const { number } = res.data;
  return number;
}

export async function handlePush(req, res, next: NextFunction): Promise<void> {
  try {
    await push(req);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
}

async function updateGitHubIssue(
  issueNumber,
  title?: string,
  completed?: boolean
) {
  const result = await octokit.request(
    "PATCH /repos/{owner}/{repo}/issues/{issue_number}",
    {
      owner: "Biki-Das",
      repo: "Feedback-App",
      issue_number: issueNumber,
      state: completed ? "closed" : "open",
      title: title,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return result;
}

async function push(req) {
  const push: PushRequestV1 = req.body;
  const userId = req.user.id;
  const id = req.body.id;

  const t0 = Date.now();
  try {
    // Iterate each mutation in the push.
    for (const mutation of push.mutations) {
      const t1 = Date.now();

      try {
        await prisma.$transaction(
          async (prisma) => {
            await processMutation(push.clientGroupID, mutation, userId, id);
          },
          { timeout: 10000 }
        );
      } catch (e) {
        console.error("Caught error from mutation", mutation, e);
        // Handle errors inside mutations by skipping and moving on.
        // You may want to implement more sophisticated error handling as your app matures.
        await prisma.$transaction(
          async (prisma) => {
            await processMutation(
              push.clientGroupID,
              mutation,
              userId,
              id,
              e instanceof Error ? e.message : String(e)
            );
          },
          { timeout: 10000 }
        );
      }

      console.log("Processed mutation in", Date.now() - t1);
    }

    await sendPoke();
  } finally {
    console.log("Processed push in", Date.now() - t0);
  }
}

async function processMutation(
  clientGroupID: string,
  mutation: MutationV1,
  userId: string,
  id: string,
  error?: string
) {
  const { clientID } = mutation;

  // Get the previous version and calculate the next one.
  const { version: prevVersion } =
    await prisma.replicacheServer.findUniqueOrThrow({
      where: { id: 1 },
      select: { version: true },
    });
  const nextVersion = prevVersion + 1;

  const lastMutationID = await getLastMutationID(clientID);
  const nextMutationID = lastMutationID + 1;

  console.log("nextVersion", nextVersion, "nextMutationID", nextMutationID);

  // Skip mutations that have already been processed
  if (mutation.id < nextMutationID) {
    console.log(
      `Mutation ${mutation.id} has already been processed - skipping`
    );
    return;
  }

  // Check for future mutations (should never happen in production)
  if (mutation.id > nextMutationID) {
    throw new Error(
      `Mutation ${mutation.id} is from the future - aborting. This can happen in development if the server restarts. In that case, clear application data in browser and refresh.`
    );
  }

  if (!error) {
    console.log("Processing mutation:", JSON.stringify(mutation));

    switch (mutation.name) {
      case "createMessage":
        await createMessage(mutation.args as any, userId, nextVersion, id);
        break;
      case "updateMessage":
        await updateMessage(mutation.args as any, userId, nextVersion);
        break;
      case "deleteMessage":
        await deleteMessage(mutation.args as any, nextVersion);
        break;
      // Add cases for updateMessage and deleteMessage when implemented
      default:
        throw new Error(`Unknown mutation: ${mutation.name}`);
    }
  } else {
    console.log(
      "Handling error from mutation",
      JSON.stringify(mutation),
      error
    );
    // Implement error handling logic here if needed
  }

  // Update lastMutationID for requesting client.
  await setLastMutationID(clientID, clientGroupID, nextMutationID, nextVersion);

  // Update global version.
  await prisma.replicacheServer.update({
    where: { id: 1 },
    data: { version: nextVersion },
  });
}

async function getLastMutationID(clientID: string): Promise<number> {
  const clientRow = await prisma.replicacheClient.findUnique({
    where: { id: clientID },
    select: { lastMutationId: true },
  });
  return clientRow ? clientRow.lastMutationId : 0;
}

async function setLastMutationID(
  clientID: string,
  clientGroupID: string,
  mutationID: number,
  version: number
) {
  await prisma.replicacheClient.upsert({
    where: { id: clientID },
    update: {
      clientGroupId: clientGroupID,
      lastMutationId: mutationID,
      version: version,
    },
    create: {
      id: clientID,
      clientGroupId: clientGroupID,
      lastMutationId: mutationID,
      version: version,
    },
  });
}

interface CreateMessageArgs {
  id: string;
  title: string;
  completed: boolean;
}

const createMessage = async (
  { title, completed }: CreateMessageArgs,
  userId: string,
  version: number,
  id: string
) => {
  return await prisma.$transaction(async (prisma) => {
    console.log("i am running beware!!!!!!!");
    const issueNumber = await createGitHubIssue(title);
    return await prisma.todo.create({
      data: {
        title,
        id,
        version,
        completed,
        belongsToId: userId,
        githubIssueNumber: issueNumber, // Add this field to your Todo model
      },
    });
  });
};

const updateMessage = async (
  { id, title, completed }: { id: string; title?: string; completed?: boolean },
  userId: string,
  version: number
) => {
  return await prisma.$transaction(async (prisma) => {
    // Find the existing todo
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        belongsToId: userId,
      },
    });

    if (!existingTodo) {
      throw new Error("Todo not found");
    }

    // Prepare update data
    const updateData: any = { version };
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;

    try {
      await updateGitHubIssue(existingTodo.githubIssueNumber, title, completed);
    } catch (error) {
      console.error("Failed to update GitHub issue:", error);
    }

    return await prisma.todo.update({
      where: { id },
      data: updateData,
    });
  });
};

async function deleteMessage(id: string, version: number) {
  console.log("deleteMessage", id, version);
  await prisma.todo.update({
    where: {
      id: id,
    },
    data: {
      deleted: true,
    },
  });
}

async function sendPoke() {
  // TODO: Implement poke functionality
  console.log("Poke functionality not yet implemented");
}
