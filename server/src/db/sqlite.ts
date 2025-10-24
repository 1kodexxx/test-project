import Database from "better-sqlite3";
import dotenv from "dotenv";
dotenv.config();

const dbFile = process.env.DATABASE_FILE || "./data.sqlite";
// Подключаемся к SQLite-файлу; better-sqlite3 работает синхронно, зато стабильно.
export const db = new Database(dbFile);
// WAL режим ускоряет запись и позволяет читать и писать параллельно.
db.pragma("journal_mode = WAL");

// Создаём таблицы пользователей и задач, если база ещё пустая.
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}
