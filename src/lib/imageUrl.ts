/**
 * 图片中转 URL。
 *
 * 前端**不直接引用原站图片**，一律走后端 `/api/img?u=<原图URL>`：
 * - 后端 S3 里有就直接返回（桶里已有 7 万+ 张），没有就回源取并顺手入桶；
 * - 不暴露原站域名，也不受原站防盗链 Referer 校验影响
 *   （闲鱼头像此前要靠 referrerPolicy="no-referrer" 才显示，走中转后不需要了）。
 *
 * 后端只放行白名单里的图片域名（见 `platform_backend/src/api/image_handlers.rs`
 * 的 HOST_SOURCE），未知域名会返回 400。
 *
 * 注意：`<img src>` 不走 axios，所以这里不能用 apiClient 的 baseURL。
 * 单独读 VITE_API_BASE_URL（为空时用同源 `/api`，由 nginx/vite 代理转给后端）。
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

/** data:/blob: 这类内联资源本来就不该中转（如登录二维码）。 */
function isInline(url: string): boolean {
  return url.startsWith("data:") || url.startsWith("blob:");
}

/** 站内静态资源（/logo/... 等）也不中转。 */
function isLocalAsset(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/**
 * 把原图 URL 转成中转 URL。
 * 传入空值返回 undefined，方便直接喂给 `<img src>` 配合判空回退到占位图。
 */
export function proxied(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (isInline(trimmed) || isLocalAsset(trimmed)) return trimmed;
  return `${API_BASE}/img?u=${encodeURIComponent(trimmed)}`;
}
