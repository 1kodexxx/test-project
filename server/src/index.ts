import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { initSchema } from "./db/sqlite";
import { authMiddleware } from "./middleware/auth";
import authRouter from "./routes/auth";
import todosRouter from "./routes/todos";

dotenv.config();
initSchema();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/todos", authMiddleware, todosRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () =>
  console.log(`✅ Server started: http://localhost:${port}`)
);
