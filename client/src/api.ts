import axios from "axios";

// Единый экземпляр axios, чтобы все запросы шли на один и тот же API-хост.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// Сохраняем или убираем JWT одновременно из axios и из localStorage.
export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
}

// При загрузке приложения пробуем восстановить токен из localStorage.
const saved = localStorage.getItem("token");
if (saved) setAuthToken(saved);

export type Todo = {
  id: number;
  user_id: number;
  title: string;
  completed: 0 | 1;
  created_at: string;
};
