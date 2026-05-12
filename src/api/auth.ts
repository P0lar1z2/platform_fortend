import { apiClient, API_MOCK } from "./client";
import type { AuthUser } from "./types";

export async function signup(email: string, password: string): Promise<AuthUser> {
  if (!API_MOCK) {
    const { data } = await apiClient.post<{ user: AuthUser }>("/auth/signup", { email, password });
    return data.user;
  }
  return { id: "mock-user", email, createdAt: new Date().toISOString() };
}

export async function login(email: string, password: string): Promise<AuthUser> {
  if (!API_MOCK) {
    const { data } = await apiClient.post<{ user: AuthUser }>("/auth/login", { email, password });
    return data.user;
  }
  void password;
  return { id: "mock-user", email };
}

export async function logout(): Promise<void> {
  if (!API_MOCK) {
    await apiClient.post("/auth/logout");
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  if (!API_MOCK) {
    try {
      const { data } = await apiClient.get<{ user: AuthUser }>("/auth/me");
      return data.user;
    } catch (err: any) {
      if (err?.response?.status === 401) return null;
      throw err;
    }
  }
  return null;
}
