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
    // 401 → 跳登录页（Phase 12 接入）
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/signup") {
        // 暂不主动跳，先让调用方决定；登录页接入后开启:
        // window.location.href = `/login?from=${encodeURIComponent(path)}`;
      }
    }
    return Promise.reject(err);
  }
);

// 全局 mock 开关：每个 api/*.ts 模块自己读这个判断走 mock 还是 real
export const API_MOCK: boolean = String(import.meta.env.VITE_API_MOCK ?? "1") === "1";
