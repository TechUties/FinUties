/**
 * Shared number/date formatting helpers used by cards and sections.
 */

const DASH = '—';

/** Compact share/volume count: 1.2M, 45.0K, 999. Non-numeric or zero → em dash. */
export function formatShares(value: unknown): string {
  const n = Number(value);
  if (!n || Number.isNaN(n)) return DASH;
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

/** Relative age of an ISO date string: "just now", "3h ago", "yesterday", "4d ago", else YYYY-MM-DD. */
export function timeAgo(dateStr: string, now: number = Date.now()): string {
  const ms = new Date(dateStr).getTime();
  if (Number.isNaN(ms)) return dateStr.slice(0, 10);
  const hours = Math.floor((now - ms) / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return dateStr.slice(0, 10);
}
