import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true, // auth cookie session
});

apiClient.interceptors.response.use(
  r => r,
  err => {
    // 401 → 跳登录页（保留 from=当前路径，登录后回到原页）
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      const url = err?.config?.url ?? "";
      const path = window.location.pathname;
      // /auth/me 探活时拿 401 是正常未登录信号，不要跳
      const skipRedirect = url.endsWith("/auth/me") || path === "/login" || path === "/signup";
      if (!skipRedirect) {
        window.location.href = `/login?from=${encodeURIComponent(path + window.location.search)}`;
      }
    }
    return Promise.reject(err);
  }
);

// 全局 mock 开关：每个 api/*.ts 模块自己读这个判断走 mock 还是 real
export const API_MOCK: boolean = String(import.meta.env.VITE_API_MOCK ?? "1") === "1";
