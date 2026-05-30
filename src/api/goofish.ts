import { apiClient, API_MOCK } from "./client";
import type { GoofishAccount, GoofishStatus, GoofishCookie } from "./types";

// backend 统一信封：{ success, data, error }
interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// goofish_login /accounts 返回的原始 map（snake_case）
type AccountsMap = Record<
  string,
  { status?: string; unb?: string | null; updated_at?: number | null; live_status?: string }
>;

// 1x1 占位 png，mock 模式下让二维码框有东西可渲染
const MOCK_QR =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const MOCK_ACCOUNTS: GoofishAccount[] = [
  { account: "demo_a", status: "logged_in", liveStatus: undefined, unb: "2200000001", updatedAt: 1717000000 },
  { account: "demo_b", status: "anonymous", liveStatus: "pending", unb: null, updatedAt: 1716900000 },
];

function normalizeStatus(account: string, d: any): GoofishStatus {
  d = d ?? {};
  return {
    account: d.account ?? account,
    status: d.status ?? "unknown",
    qrcode: d.qrcode ?? null,
    faceQrcode: d.face_qrcode ?? null,
    unb: d.unb ?? null,
  };
}

/** GET /accounts — 列出全部账号（DB 快照 + 内存会话状态合并） */
export async function listAccounts(): Promise<GoofishAccount[]> {
  if (API_MOCK) return MOCK_ACCOUNTS;
  const { data } = await apiClient.get<Envelope<AccountsMap>>("/v1/goofish/accounts");
  const map = data.data ?? {};
  return Object.entries(map).map(([account, v]) => ({
    account,
    status: v.status,
    liveStatus: v.live_status,
    unb: v.unb ?? null,
    updatedAt: v.updated_at ?? null,
  }));
}

/** POST /login/start — 启动登录，返回二维码/状态 */
export async function loginStart(account: string, proxy?: string): Promise<GoofishStatus> {
  if (API_MOCK) return { account, status: "pending", qrcode: MOCK_QR };
  const { data } = await apiClient.post<Envelope<any>>("/v1/goofish/login/start", null, {
    params: { account, ...(proxy ? { proxy } : {}) },
  });
  return normalizeStatus(account, data.data);
}

/** GET /login/status — 轮询登录进度 / 人脸验证状态 */
export async function loginStatus(account: string): Promise<GoofishStatus> {
  if (API_MOCK) return { account, status: "pending", qrcode: MOCK_QR };
  const { data } = await apiClient.get<Envelope<any>>("/v1/goofish/login/status", {
    params: { account },
  });
  return normalizeStatus(account, data.data);
}

/** GET /cookie — 取账号 cookie（未登录时 backend 返回 409，axios 会 reject） */
export async function getCookie(account: string): Promise<GoofishCookie> {
  if (API_MOCK) {
    return { account, unb: "2200000001", tracknick: "demo", mtopCookie: "cookie2=...; unb=...", cookies: [] };
  }
  const { data } = await apiClient.get<Envelope<any>>("/v1/goofish/cookie", { params: { account } });
  const d = data.data ?? {};
  return {
    account,
    unb: d.unb,
    tracknick: d.tracknick ?? null,
    mtopCookie: d.mtop_cookie ?? "",
    cookies: d.cookies ?? [],
  };
}

/** POST /refresh — 重开 ctx 并落库快照 */
export async function refreshAccount(account: string): Promise<GoofishStatus> {
  if (API_MOCK) return { account, status: "logged_in" };
  const { data } = await apiClient.post<Envelope<any>>("/v1/goofish/refresh", null, {
    params: { account },
  });
  return normalizeStatus(account, data.data);
}

/** DELETE /account — 删除账号（关 ctx + 删快照 + 删 profile） */
export async function deleteAccount(account: string): Promise<void> {
  if (API_MOCK) return;
  await apiClient.delete("/v1/goofish/account", { params: { account } });
}
