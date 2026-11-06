import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, toItems } from '../src/lib/html.ts';

test('escapeHtml neutralises every HTML-significant character', () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('1')">&`), '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;');
});

test('escapeHtml tolerates non-string and nullish values', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(42), '42');
  assert.equal(escapeHtml('plain text'), 'plain text');
});

test('toItems unwraps every API list envelope', () => {
  const rows = [{ a: 1 }, { a: 2 }];
  assert.deepEqual(toItems(rows), rows);
  assert.deepEqual(toItems({ items: rows }), rows);
  assert.deepEqual(toItems({ data: rows }), rows);
  assert.deepEqual(toItems({ items: rows, data: [{ a: 9 }] }), rows, 'items wins over data');
});

test('toItems returns an empty array for anything that is not a list', () => {
  assert.deepEqual(toItems(null), []);
  assert.deepEqual(toItems(undefined), []);
  assert.deepEqual(toItems('nope'), []);
  assert.deepEqual(toItems({ items: 'not-an-array' }), []);
  assert.deepEqual(toItems({ data: { nested: true } }), []);
  assert.deepEqual(toItems({ total: 3 }), []);
});
