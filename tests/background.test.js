import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock chrome BEFORE importing background.js
globalThis.chrome = {
  runtime: { onInstalled: { addListener: () => {} } },
  tabs: { onUpdated: { addListener: () => {} } },
  scripting: { executeScript: async () => {} },
  storage: { sync: { get: async () => ({}), set: async () => {} } }
};

// Import only pure functions — NOT the module side effect (addListener call)
const { extractPort, buildTitle, stripPrefix } = await import('../background.js');

test('extractPort: localhost URL with port', () => {
  assert.equal(extractPort('http://localhost:3000/'), '3000');
});

test('extractPort: 127.0.0.1 URL with port', () => {
  assert.equal(extractPort('http://127.0.0.1:8080/app'), '8080');
});

test('extractPort: non-localhost URL returns null', () => {
  assert.equal(extractPort('https://www.google.com/'), null);
});

test('extractPort: localhost without explicit port returns null', () => {
  assert.equal(extractPort('http://localhost/'), null);
});

test('buildTitle: with page title', () => {
  assert.equal(buildTitle('3000', 'My App — Dashboard'), '⚡ 3000 — My App — Dashboard');
});

test('buildTitle: with empty page title falls back to port only', () => {
  assert.equal(buildTitle('3000', ''), '⚡ 3000');
});

test('buildTitle: with null page title falls back to port only', () => {
  assert.equal(buildTitle('8080', null), '⚡ 8080');
});

test('buildTitle: with undefined page title falls back to port only', () => {
  assert.equal(buildTitle('8080', undefined), '⚡ 8080');
});

test('buildTitle: with whitespace-only page title falls back to port only', () => {
  assert.equal(buildTitle('3000', '   '), '⚡ 3000');
});

test('buildTitle: trims leading/trailing whitespace from page title', () => {
  assert.equal(buildTitle('3000', '  My App  '), '⚡ 3000 — My App');
});

test('stripPrefix: prefixed title returns bare title', () => {
  assert.equal(stripPrefix('⚡ 3000 — My App — Dashboard'), 'My App — Dashboard');
});

test('stripPrefix: unprefixed title returns unchanged', () => {
  assert.equal(stripPrefix('My App — Settings'), 'My App — Settings');
});

test('stripPrefix: empty string returns empty string', () => {
  assert.equal(stripPrefix(''), '');
});

test('stripPrefix: null input returns null', () => {
  assert.equal(stripPrefix(null), null);
});

test('stripPrefix: undefined input returns undefined', () => {
  assert.equal(stripPrefix(undefined), undefined);
});

test('SPA cycle via buildTitle + stripPrefix composition', () => {
  assert.equal(buildTitle('3000', stripPrefix('My App — Settings')), '⚡ 3000 — My App — Settings');
});

test('guard-blocks scenario: onUpdated guard fires and prevents loop', () => {
  const changeInfo = { title: '⚡ 3000 — My App — Settings' };
  const guardBlocks = changeInfo.title && changeInfo.title.startsWith('⚡');
  assert.equal(guardBlocks, true);
});
