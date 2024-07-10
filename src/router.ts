import { Router } from "express";
import { body } from "express-validator";
import { handleInputErrors } from "./modules/middleware";
import {
  createTodo,
  deleteTodo,
  getTodo,
  getTodos,
  updateTodo,
} from "./handlers/todo";

const router = Router();

router.get("/todo", getTodos);
router.get("/todo/:id", getTodo);
router.put(
  "/todo/:id",
  [
    body("title").isString().optional(),
    body("completed").isBoolean().optional(),
  ],
  handleInputErrors,
  updateTodo
);
router.post(
  "/todo",
  [
    body("title").isString(),
    body("completed").isBoolean().optional(),
    body("githubIssueNumber").isInt().optional(),
  ],
  handleInputErrors,
  createTodo
);
router.delete("/todo/:id", deleteTodo);

export default router;
