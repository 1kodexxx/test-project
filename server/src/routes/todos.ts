import { Router } from "express";
import { db } from "../db/sqlite";
import { AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", (req: AuthRequest, res) => {
  const rows = db
    .prepare("SELECT * FROM todos WHERE user_id = ? ORDER BY id DESC")
    .all(req.user!.id);
  res.json(rows);
});

router.post("/", (req: AuthRequest, res) => {
  const { title } = req.body as { title?: string };
  if (!title) return res.status(400).json({ error: "title required" });
  const info = db
    .prepare("INSERT INTO todos (user_id, title) VALUES (?, ?)")
    .run(req.user!.id, title);
  const row = db
    .prepare("SELECT * FROM todos WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.patch("/:id", (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { completed } = req.body as { completed?: boolean };
  if (typeof completed !== "boolean")
    return res.status(400).json({ error: "completed boolean required" });

  db.prepare("UPDATE todos SET completed = ? WHERE id = ? AND user_id = ?").run(
    completed ? 1 : 0,
    id,
    req.user!.id
  );

  const row = db
    .prepare("SELECT * FROM todos WHERE id = ? AND user_id = ?")
    .get(id, req.user!.id);
  res.json(row);
});

router.delete("/:id", (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM todos WHERE id = ? AND user_id = ?").run(
    id,
    req.user!.id
  );
  res.status(204).end();
});

export default router;
