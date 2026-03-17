import { test } from 'node:test';
import assert from 'node:assert/strict';

// Provide minimal DOM and chrome mocks before importing popup.js
// Minimal DOM mock for toggle button
let btn = { textContent: '', _attrs: {} };
btn.setAttribute = (k, v) => { btn._attrs[k] = String(v); };
btn.addEventListener = () => {};

globalThis.document = {
  getElementById: (id) => id === 'toggle-btn' ? btn : { hidden: false, textContent: '' },
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

const { applyMapping, updateToggleUI } = await import('../extension/popup.js');

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

test('updateToggleUI: active state sets Pause + aria-pressed false', () => {
  updateToggleUI(true);
  assert.equal(btn.textContent, 'Pause');
  assert.equal(btn._attrs['aria-pressed'], 'false');
});

test('updateToggleUI: paused state sets Resume + aria-pressed true', () => {
  updateToggleUI(false);
  assert.equal(btn.textContent, 'Resume');
  assert.equal(btn._attrs['aria-pressed'], 'true');
});
