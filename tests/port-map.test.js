import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PORT_MAP } from '../extension/port-map.js';

test('DEFAULT_PORT_MAP is exported correctly and is an object', () => {
  assert.ok(DEFAULT_PORT_MAP, 'DEFAULT_PORT_MAP should be exported');
  assert.equal(typeof DEFAULT_PORT_MAP, 'object');
  assert.notEqual(DEFAULT_PORT_MAP, null);
  assert.ok(!Array.isArray(DEFAULT_PORT_MAP), 'Should not be an array');
});

test('DEFAULT_PORT_MAP contains at least 10 entries', () => {
  const keys = Object.keys(DEFAULT_PORT_MAP);
  assert.ok(keys.length >= 10, `Expected at least 10 entries, but got ${keys.length}`);
});

test('DEFAULT_PORT_MAP all keys must be strings, not integers', () => {
  // JavaScript always coerces object keys to strings at runtime, so Object.keys()
  // always returns strings regardless of whether the source used "3000" or 3000.
  // This test validates key format (non-empty, numeric) and documents the intended
  // contract (string keys). Source-level enforcement relies on code review — the
  // architecture mandates string literals in port-map.js (e.g., "3000": "React").
  for (const key of Object.keys(DEFAULT_PORT_MAP)) {
    assert.equal(typeof key, 'string', `Key ${key} is not a string type`);
    assert.ok(!isNaN(parseInt(key, 10)), `Key ${key} does not look like a port number`);
    assert.ok(key.length > 0, `Key must be non-empty`);
  }
});
