// import prisma from "../db";
// import { Octokit } from "@octokit/core";

// const octokit = new Octokit({
//   auth: process.env.GITHUB_TOKEN,
// });

// async function createGitHubIssue(todoTitle: string) {
//   const res = await octokit.request("POST /repos/{owner}/{repo}/issues", {
//     owner: "Biki-Das",
//     repo: "Feedback-App",
//     title: todoTitle,
//     body: todoTitle,
//     labels: ["bug"],
//     headers: {
//       "X-GitHub-Api-Version": "2022-11-28",
//     },
//   });
//   const { number } = res.data;
//   return number;
// }
// async function updateGitHubIssue(
//   issueNumber,
//   title?: string,
//   completed?: boolean
// ) {
//   const result = await octokit.request(
//     "PATCH /repos/{owner}/{repo}/issues/{issue_number}",
//     {
//       owner: "Biki-Das",
//       repo: "Feedback-App",
//       issue_number: issueNumber,
//       state: completed ? "closed" : "open",
//       title: title,
//       headers: {
//         "X-GitHub-Api-Version": "2022-11-28",
//       },
//     }
//   );

//   return result;
// }

// export const getTodos = async (req, res) => {
//   const user = await prisma.user.findUnique({
//     where: { id: req.user.id },
//     include: { todos: true },
//   });

//   res.json({ data: user?.todos });
// };

// export const getTodo = async (req, res) => {
//   const id = req.params.id;
//   const todo = await prisma.todo.findFirst({
//     where: {
//       id,
//       belongsToId: req.user.id,
//     },
//   });

//   res.json({ data: todo });
// };

// export const createTodo = async (req, res, version) => {
//   // const ghNumber = await createGitHubIssue(req.body.title);
//   const todo = await prisma.todo.create({
//     data: {
//       title: req.body.title,
//       id: req.body.id,
//       version: version,
//       completed: req.body.completed,
//       belongsToId: req.user.id,
//     },
//   });
//   res.json({ data: todo });
// };

// export const updateTodo = async (req, res) => {
//   const id = req.params.id;
//   const todo = await prisma.todo.findFirst({
//     where: {
//       id,
//       belongsToId: req.user.id,
//     },
//   });

//   if (!todo) {
//     res.status(404);
//     res.json({ message: "todo not found" });
//     return;
//   }

//   try {
//     await updateGitHubIssue(
//       todo.githubIssueNumber,
//       req.body.title,
//       req.body.completed
//     );
//   } catch (error) {
//     console.log(error);
//   }

//   const updated = await prisma.todo.update({
//     where: {
//       id_belongsToId: {
//         id: req.params.id,
//         belongsToId: req.user.id,
//       },
//     },
//     data: {
//       title: req.body.title,
//       completed: req.body.completed,
//     },
//   });

//   res.json({ data: updated });
// };

// export const deleteTodo = async (req, res) => {
//   try {
//     const deleted = await prisma.todo.delete({
//       where: {
//         id_belongsToId: {
//           id: req.params.id,
//           belongsToId: req.user.id,
//         },
//       },
//     });
//     res.json({ data: deleted });
//   } catch (error) {
//     if (error.code === "P2025") {
//       return res.status(404).json({ message: "Todo item not found." });
//     }
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "An error occurred while deleting the todo item." });
//   }
// };
