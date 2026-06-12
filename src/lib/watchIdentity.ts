export function getWatchIdentity(ref: string, catalogId?: string): string {
  return JSON.stringify([ref, catalogId || null]);
}
