import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

apiClient.interceptors.response.use(
  r => r,
  err => {
    // TODO: 统一错误处理 (toast + 401 跳登录) —— 留待登录态接好后
    return Promise.reject(err);
  }
);
