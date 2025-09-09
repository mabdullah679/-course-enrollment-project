// utils/normalize.ts
export function normalizePage<T>(raw: any): T[] {
  if (!raw) return [];

  // If it's the envelope { success, data: {...} }, unwrap first
  const payload = typeof raw === 'object' && raw !== null && 'data' in raw ? raw.data : raw;

  if (Array.isArray(payload)) return payload as T[];
  if (payload && Array.isArray(payload.content)) return payload.content as T[];
  if (payload && Array.isArray(payload.items)) return payload.items as T[];

  // Some backends use page.content / page.items, try one more level
  if (payload?.page && Array.isArray(payload.page.content)) return payload.page.content as T[];
  if (payload?.page && Array.isArray(payload.page.items)) return payload.page.items as T[];

  return [];
}