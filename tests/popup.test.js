import { test } from 'node:test';
import assert from 'node:assert/strict';

// Provide minimal DOM and chrome mocks before importing popup.js
globalThis.document = {
  getElementById: () => ({ hidden: false, textContent: '' }),
  querySelectorAll: () => []
};

globalThis.chrome = {
  tabs: {
    query: async () => []
  },
  storage: {
    sync: {
      get: async () => ({ portMappings: {} }),
      set: async () => {}
    }
  }
};

const { applyMapping } = await import('../extension/popup.js');

test('applyMapping sets new value for empty mappings', () => {
  const result = applyMapping({}, '3000', 'My App');
  assert.deepEqual(result, { '3000': 'My App' });
});

test('applyMapping removes mapping when value is empty', () => {
  const result = applyMapping({ '3000': 'My App' }, '3000', '');
  assert.deepEqual(result, {});
});

test('applyMapping preserves other ports when updating one', () => {
  const result = applyMapping({ '3000': 'A', '8080': 'B' }, '3000', 'C');
  assert.deepEqual(result, { '3000': 'C', '8080': 'B' });
});
