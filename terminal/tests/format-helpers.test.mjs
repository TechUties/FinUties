import test from 'node:test';
import assert from 'node:assert/strict';
import { formatShares, timeAgo } from '../src/lib/format.ts';

test('formatShares compacts large counts and dashes empty values', () => {
  assert.equal(formatShares(1_250_000), '1.3M');
  assert.equal(formatShares(45_000), '45.0K');
  assert.equal(formatShares('999'), '999');
  assert.equal(formatShares(-2_500), '-2.5K');
  assert.equal(formatShares(0), '—');
  assert.equal(formatShares(null), '—');
  assert.equal(formatShares('abc'), '—');
});

test('timeAgo buckets ages the way the cards expect', () => {
  const now = Date.parse('2026-11-06T12:00:00Z');
  assert.equal(timeAgo('2026-11-06T11:30:00Z', now), 'just now');
  assert.equal(timeAgo('2026-11-06T09:00:00Z', now), '3h ago');
  assert.equal(timeAgo('2026-11-05T10:00:00Z', now), 'yesterday');
  assert.equal(timeAgo('2026-11-02T12:00:00Z', now), '4d ago');
  assert.equal(timeAgo('2026-10-01T12:00:00Z', now), '2026-10-01');
});

test('timeAgo falls back to the date prefix for unparseable input', () => {
  assert.equal(timeAgo('not-a-date', 0), 'not-a-date');
  assert.equal(timeAgo('2026-13-45 garbage', 0), '2026-13-45');
});
