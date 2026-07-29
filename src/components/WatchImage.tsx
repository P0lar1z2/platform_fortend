import { useEffect, useState } from "react";
import { proxied } from "../lib/imageUrl";

/**
 * 表款图片的统一入口。
 *
 * 两件事一起做：
 * 1. **走后端中转**（`proxied()`）—— 前端不直连原站图，见 lib/imageUrl.ts；
 * 2. **加载失败兜底** —— 回退到 `WatchPlaceholder`，不留破图。
 *
 * 之前 SearchResults / BrandModels 各有一份复制粘贴的 WatchImage，
 * Watchlist / GoofishSubscriptions 则是裸 `<img>` 连 onError 都没有（会显示破图 icon）。
 * 统一到这里后，中转和兜底都只有一处实现。
 */

export function WatchPlaceholder({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" fill="rgba(255,255,255,0.03)" />
      <circle cx="60" cy="56" r="32" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="56" r="26" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
      <line x1="60" y1="56" x2="60" y2="38" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="60" y1="56" x2="72" y2="56" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="60" cy="56" r="2" fill="rgba(255,255,255,0.2)" />
      <rect x="56" y="24" width="8" height="6" rx="1" fill="rgba(255,255,255,0.08)" />
      <rect x="55" y="88" width="10" height="14" rx="2" fill="rgba(255,255,255,0.06)" />
      <rect x="55" y="18" width="10" height="8" rx="2" fill="rgba(255,255,255,0.06)" />
      <text x="60" y="108" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="Barlow, sans-serif">NO IMAGE</text>
    </svg>
  );
}

type WatchImageProps = {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** 关掉占位图，失败时什么都不渲染（详情页主图区自己有更大的占位） */
  noPlaceholder?: boolean;
};

export default function WatchImage({
  src,
  alt = "",
  size = 120,
  className = "",
  style,
  noPlaceholder = false,
}: WatchImageProps) {
  const [err, setErr] = useState(false);
  // src 变了要清掉上一张的失败态，否则换图后仍显示占位
  useEffect(() => setErr(false), [src]);

  const url = proxied(src);
  if (err || !url) return noPlaceholder ? null : <WatchPlaceholder size={size} />;

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setErr(true)}
      style={{ width: size, height: size, objectFit: "contain", display: "block", ...style }}
    />
  );
}
