import express from "express";
import router from "./router";
import morgan from "morgan";
import cors from "cors";
import { protect } from "./modules/auth";
import { createNewUser, signin } from "./handlers/user";
import { handlePull } from "./handlers/pull";
import { handlePush } from "./handlers/push";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  console.log("hello from express");
  res.status(200);
  res.json({ location: "home route" });
});

app.use("/api", protect, router);
app.post("/api/replicache/pull", handlePull);
app.post("/api/replicache/push", handlePush);
app.post("/user", createNewUser);
app.post("/signin", signin);

export default app;
