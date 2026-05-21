export type PageEntry = number | "...";

/**
 * 生成稀疏页码列表(首末页 + 当前页邻居 + 省略号),避免 12k 型号场景下
 * 全列出 1000+ 页按钮撑爆 UI。
 *
 * 典型输出: [1, "...", 4, 5, 6, "...", 1062]
 */
export function buildPageList(
  current: number,
  total: number,
  siblings = 1,
): PageEntry[] {
  if (total <= 7 + siblings * 2) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const left = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);
  const out: PageEntry[] = [1];
  if (left > 2) out.push("...");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("...");
  out.push(total);
  return out;
}
