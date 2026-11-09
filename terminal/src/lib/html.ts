/**
 * Shared HTML helpers for card and section renderers.
 *
 * Every renderer that builds markup with template strings must escape
 * untrusted API values through `escapeHtml`, and should unwrap list payloads
 * through `toItems` so one place knows the API envelope shapes.
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape a value for safe interpolation into HTML text or attribute content. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/**
 * Unwrap a list payload from the API.
 *
 * Accepts a bare array, `{ items: [...] }` or `{ data: [...] }` and returns
 * an array in every case (empty for anything else), so renderers never
 * have to branch on the envelope.
 */
export function toItems<T = Record<string, unknown>>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const env = raw as { items?: unknown; data?: unknown };
    if (Array.isArray(env.items)) return env.items as T[];
    if (Array.isArray(env.data)) return env.data as T[];
  }
  return [];
}
