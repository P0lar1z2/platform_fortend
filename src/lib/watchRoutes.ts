export function getWatchHref(ref: string, catalogId?: string): string {
  const path = `/watch/${encodeURIComponent(ref)}`;
  return catalogId
    ? `${path}?catalogId=${encodeURIComponent(catalogId)}`
    : path;
}
