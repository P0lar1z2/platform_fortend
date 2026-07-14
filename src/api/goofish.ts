import { apiClient, API_MOCK } from "./client";
import type {
  GoofishAccount,
  GoofishCookie,
  GoofishItem,
  GoofishOpportunity,
  GoofishRefSubscription,
  GoofishSellerSubscription,
  GoofishStatus,
  LarkBindCode,
  LarkBindingStatus,
} from "./types";

// backend 统一信封：{ success, data, error }
interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// goofish_login /accounts 返回的原始 map（snake_case）
type AccountsMap = Record<
  string,
  {
    status?: string;
    unb?: string | null;
    updated_at?: number | null;
    live_status?: string;
    owner_user_id?: string | null;
  }
>;

// 1x1 占位 png，mock 模式下让二维码框有东西可渲染
const MOCK_QR =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const MOCK_ACCOUNTS: GoofishAccount[] = [
  { account: "demo_a", status: "logged_in", liveStatus: undefined, unb: "2200000001", updatedAt: 1717000000 },
  { account: "demo_b", status: "anonymous", liveStatus: "pending", unb: null, updatedAt: 1716900000 },
];

const MOCK_SELLER_SUBSCRIPTIONS: GoofishSellerSubscription[] = [
  {
    seller_id: "demo_seller_001",
    seller_name: "demo seller",
    note: "mock",
    enabled: true,
    crawl_interval_minutes: 1440,
    last_crawled_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_REF_SUBSCRIPTIONS: GoofishRefSubscription[] = [
  {
    reference: "124300",
    brand: "Rolex",
    keyword: "Rolex 124300",
    note: "mock",
    enabled: true,
    crawl_interval_minutes: 1440,
    last_crawled_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_LARK_BINDING: LarkBindingStatus = {
  bound: false,
  open_id_suffix: null,
  updated_at: null,
};

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
    ownerUserId: v.owner_user_id ?? null,
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

export async function listSellerSubscriptions(): Promise<GoofishSellerSubscription[]> {
  if (API_MOCK) return MOCK_SELLER_SUBSCRIPTIONS;
  const { data } = await apiClient.get<{ subscriptions: GoofishSellerSubscription[] }>("/v1/goofish/seller-subscriptions");
  return data.subscriptions ?? [];
}

export async function upsertSellerSubscription(input: {
  seller_id: string;
  seller_name?: string;
  note?: string;
  enabled?: boolean;
  crawl_interval_minutes?: number;
}): Promise<GoofishSellerSubscription> {
  if (API_MOCK) {
    return {
      ...MOCK_SELLER_SUBSCRIPTIONS[0],
      ...input,
      enabled: input.enabled ?? true,
      crawl_interval_minutes: input.crawl_interval_minutes ?? 1440,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  const { data } = await apiClient.post<{ subscription: GoofishSellerSubscription }>("/v1/goofish/seller-subscriptions", input);
  return data.subscription;
}

export async function setSellerSubscriptionEnabled(sellerId: string, enabled: boolean): Promise<GoofishSellerSubscription> {
  if (API_MOCK) return { ...MOCK_SELLER_SUBSCRIPTIONS[0], seller_id: sellerId, enabled };
  const { data } = await apiClient.patch<{ subscription: GoofishSellerSubscription }>(
    `/v1/goofish/seller-subscriptions/${encodeURIComponent(sellerId)}`,
    { enabled }
  );
  return data.subscription;
}

export async function deleteSellerSubscription(sellerId: string): Promise<void> {
  if (API_MOCK) return;
  await apiClient.delete(`/v1/goofish/seller-subscriptions/${encodeURIComponent(sellerId)}`);
}

export async function triggerSellerSubscription(sellerId: string): Promise<{ request_id: string }> {
  if (API_MOCK) return { request_id: `mock-seller-${sellerId}` };
  const { data } = await apiClient.post<{ request_id: string }>(
    `/v1/goofish/seller-subscriptions/${encodeURIComponent(sellerId)}/trigger`,
    { pages: 1 }
  );
  return data;
}

export async function listRefSubscriptions(): Promise<GoofishRefSubscription[]> {
  if (API_MOCK) return MOCK_REF_SUBSCRIPTIONS;
  const { data } = await apiClient.get<{ subscriptions: GoofishRefSubscription[] }>("/v1/goofish/ref-subscriptions");
  return data.subscriptions ?? [];
}

export async function upsertRefSubscription(input: {
  reference: string;
  brand?: string;
  keyword?: string;
  note?: string;
  enabled?: boolean;
  crawl_interval_minutes?: number;
}): Promise<GoofishRefSubscription> {
  if (API_MOCK) {
    return {
      ...MOCK_REF_SUBSCRIPTIONS[0],
      ...input,
      keyword: input.keyword || [input.brand, input.reference].filter(Boolean).join(" "),
      enabled: input.enabled ?? true,
      crawl_interval_minutes: input.crawl_interval_minutes ?? 1440,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  const { data } = await apiClient.post<{ subscription: GoofishRefSubscription }>("/v1/goofish/ref-subscriptions", input);
  return data.subscription;
}

export async function setRefSubscriptionEnabled(reference: string, enabled: boolean): Promise<GoofishRefSubscription> {
  if (API_MOCK) return { ...MOCK_REF_SUBSCRIPTIONS[0], reference, enabled };
  const { data } = await apiClient.patch<{ subscription: GoofishRefSubscription }>(
    `/v1/goofish/ref-subscriptions/${encodeURIComponent(reference)}`,
    { enabled }
  );
  return data.subscription;
}

export async function triggerRefSubscription(reference: string): Promise<{ request_id: string; keyword?: string }> {
  if (API_MOCK) return { request_id: `mock-ref-${reference}`, keyword: reference };
  const { data } = await apiClient.post<{ request_id: string; keyword?: string }>(
    `/v1/goofish/ref-subscriptions/${encodeURIComponent(reference)}/trigger`,
    { pages: 1 }
  );
  return data;
}

export async function listGoofishItems(): Promise<GoofishItem[]> {
  if (API_MOCK) return [];
  const { data } = await apiClient.get<{ items: GoofishItem[] }>("/v1/goofish/items");
  return data.items ?? [];
}

export async function listGoofishOpportunities(): Promise<GoofishOpportunity[]> {
  if (API_MOCK) return [];
  const { data } = await apiClient.get<{ opportunities: GoofishOpportunity[] }>("/v1/goofish/opportunities");
  return data.opportunities ?? [];
}

export async function getLarkBindingStatus(): Promise<LarkBindingStatus> {
  if (API_MOCK) return MOCK_LARK_BINDING;
  const { data } = await apiClient.get<Envelope<LarkBindingStatus>>("/v1/lark/binding");
  if (!data.success || !data.data) throw new Error(data.error || "get Lark binding failed");
  return data.data;
}

export async function createLarkBindCode(): Promise<LarkBindCode> {
  if (API_MOCK) {
    return {
      code: "mock_LarkBindCode_1234567890",
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }
  const { data } = await apiClient.post<Envelope<LarkBindCode>>("/v1/lark/bind-code");
  if (!data.success || !data.data) throw new Error(data.error || "create Lark bind code failed");
  return data.data;
}

export async function deleteLarkBinding(): Promise<void> {
  if (API_MOCK) return;
  const { data } = await apiClient.delete<Envelope<{ disabled: boolean }>>("/v1/lark/binding");
  if (!data.success) throw new Error(data.error || "delete Lark binding failed");
}
