import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/sqlite";

const router = Router();

// POST /register — создаёт нового пользователя и сразу выдаёт ему токен.
router.post("/register", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password)
    return res.status(400).json({ error: "email & password required" });

  const hash = bcrypt.hashSync(password, 10);

  try {
    const stmt = db.prepare(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)"
    );
    const info = stmt.run(email, hash);
    const token = jwt.sign(
      { id: Number(info.lastInsertRowid), email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    return res.json({ token });
  } catch (e: any) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /login — проверяем пароль и возвращаем подпись с идентификатором пользователя.
router.post("/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password)
    return res.status(400).json({ error: "email & password required" });

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as any;
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
  return res.json({ token });
});

export default router;
