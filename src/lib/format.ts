export function formatJPY(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return "¥" + Math.round(value).toLocaleString();
}

export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits) + "%";
}

export function formatYenWan(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return (value / 10000).toFixed(0);
}
