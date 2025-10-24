import axios from "axios";
import { useEffect, useState } from "react";
import { api, setAuthToken, type Todo } from "./api";

// Типы ответов, которые приходят из auth-эндпоинтов и в ошибках API.
type AuthResponse = { token: string };
type ApiErrorBody = { error?: string };

// Универсально превращаем любую ошибку запроса в понятное сообщение.
function getErrMsg(e: unknown) {
  if (axios.isAxiosError(e)) {
    const body = e.response?.data as ApiErrorBody | undefined;
    return body?.error ?? e.message;
  }
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

// Блок авторизации: хранит поля формы и управляет сохранением токена.
function AuthPanel() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password");
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [error, setError] = useState<string | null>(null);

  // Регистрация создаёт пользователя и сохраняет выданный токен.
  async function register() {
    try {
      setError(null);
      const { data } = await api.post<AuthResponse>("/auth/register", {
        email,
        password,
      });
      setAuthToken(data.token);
      setToken(data.token);
    } catch (e: unknown) {
      setError(getErrMsg(e) ?? "Register failed");
    }
  }

  // Логин повторяет ту же схему, только для существующего пользователя.
  async function login() {
    try {
      setError(null);
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      setAuthToken(data.token);
      setToken(data.token);
    } catch (e: unknown) {
      setError(getErrMsg(e) ?? "Login failed");
    }
  }

  // Логаут сбрасывает токен и очищает авторизационное состояние.
  function logout() {
    setAuthToken(undefined);
    setToken(null);
  }

  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white/60 dark:bg-zinc-900/60">
      <h2 className="text-xl font-semibold mb-3">Введите логин и пароль</h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 flex-1"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded border" onClick={register}>
          Регистрация
        </button>
        <button className="px-3 py-2 rounded border" onClick={login}>
          Логин
        </button>
        <button className="px-3 py-2 rounded border" onClick={logout}>
          Выход
        </button>
      </div>
      <div className="text-sm mt-2">
        Token: {token ? "✅ установлен" : "❌ не установлен"}
      </div>
      {error && (
        <div className="text-sm text-rose-600 mt-1">Ошибка: {error}</div>
      )}
    </div>
  );
}

// Панель задач: CRUD по todo-приложению текущего пользователя.
function TodosPanel() {
  const [items, setItems] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Подтягиваем список задач с сервера.
  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const { data } = await api.get<Todo[]>("/todos");
      setItems(data);
    } catch (e: unknown) {
      setErr(getErrMsg(e));
    } finally {
      setLoading(false);
    }
  }

  // Добавляем задачу и кладём её в начало списка, чтобы сразу увидеть результат.
  async function add() {
    if (!title.trim()) return;
    try {
      const { data } = await api.post<Todo>("/todos", { title });
      setItems((prev) => [data, ...prev]);
      setTitle("");
    } catch (e: unknown) {
      setErr(getErrMsg(e));
    }
  }

  // Переключаем флаг completed и синхронно обновляем локальный список.
  async function toggle(id: number, completed: 0 | 1) {
    try {
      const { data } = await api.patch<Todo>(`/todos/${id}`, {
        completed: !completed,
      });
      setItems((prev) => prev.map((t) => (t.id === id ? data : t)));
    } catch (e: unknown) {
      setErr(getErrMsg(e));
    }
  }

  // Удаляем задачу на сервере и убираем её у пользователя.
  async function remove(id: number) {
    try {
      await api.delete(`/todos/${id}`);
      setItems((prev) => prev.filter((t) => t.id !== id));
    } catch (e: unknown) {
      setErr(getErrMsg(e));
    }
  }

  // При первом рендере автоматически загружаем данные.
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white/60 dark:bg-zinc-900/60">
      <h2 className="text-xl font-semibold mb-3">
        Список задач (Todo, JWT авторизация)
      </h2>
      <div className="flex gap-2 mb-3">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Введите задачу..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="px-3 py-2 rounded border" onClick={add}>
          Добавить
        </button>
        <button className="px-3 py-2 rounded border" onClick={load}>
          Обновить
        </button>
      </div>
      {loading && <div className="text-sm opacity-70 mb-2">Загрузка...</div>}
      {err && <div className="text-sm text-rose-600 mb-2">Ошибка: {err}</div>}
      <ul className="space-y-1">
        {items.map((t) => (
          <li key={t.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!t.completed}
              onChange={() => toggle(t.id, t.completed)}
            />
            <span className={t.completed ? "line-through opacity-60" : ""}>
              {t.title}
            </span>
            <button
              className="ml-auto text-rose-600 hover:underline"
              onClick={() => remove(t.id)}
            >
              Удалить
            </button>
          </li>
        ))}
        {!items.length && !loading && (
          <li className="opacity-60">Список задач пуст</li>
        )}
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <h1 className="text-2xl font-bold">
        Fullstack Demo — React + TypeScript + Vite
      </h1>
      <AuthPanel />
      <TodosPanel />
    </div>
  );
}
