// utils/normalize.ts
export function normalizePage<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw.content)) return raw.content as T[];
  if (Array.isArray(raw.items)) return raw.items as T[];
  return [];
}