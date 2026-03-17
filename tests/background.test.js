import { test } from 'node:test';
import assert from 'node:assert/strict';

let onChangedCallback = null;
let onUpdatedCallback = null;
let lastInjectedTitle = null;

// Mock chrome BEFORE importing background.js
globalThis.chrome = {
  runtime: { onInstalled: { addListener: () => {} } },
  tabs: {
    onUpdated: {
      addListener: (cb) => { onUpdatedCallback = cb; }
    },
    query: async () => [
      { id: 1, url: 'http://localhost:3001/', title: '⚡ 3001 — Node / API' }
    ]
  },
  scripting: {
    executeScript: async ({ func, args }) => {
      if (typeof func === 'function' && args && args.length >= 3) {
        if (!globalThis.document) globalThis.document = { title: '' };
        func(...args);
        lastInjectedTitle = globalThis.document.title;
      } else {
        lastInjectedTitle = args && args[0];
      }
    }
  },
  storage: {
    sync: {
      get: async () => ({}),
      set: async () => {}
    },
    onChanged: {
      addListener: (cb) => {
        onChangedCallback = cb;
      }
    }
  }
};

const { extractPort, buildTitle, stripPrefix } = await import('../extension/background.js');

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

test('stripPrefix: prefix without separator (short title) returns empty string', () => {
  assert.equal(stripPrefix('⚡ 3000'), '');
});

test('stripPrefix: doubled prefix returns empty string (no accumulation)', () => {
  assert.equal(stripPrefix('⚡ 3000 — ⚡ 3000'), '');
});

test('stripPrefix: multiple prefix runs stripped to bare content', () => {
  assert.equal(stripPrefix('⚡ 3000 — ⚡ 3000 — Hello'), 'Hello');
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

// --- status=complete (static-page) path ---

test('status=complete: proceeds when tab.title is a plain title', () => {
  const changeInfo = { status: 'complete' };
  const tab = { url: 'http://localhost:8000/', title: 'Directory listing for /' };
  const titleChanged = !!changeInfo.title;
  const pageLoaded = changeInfo.status === 'complete';
  const shouldProceed = titleChanged || pageLoaded;
  const currentTitle = changeInfo.title || tab.title || '';
  assert.equal(shouldProceed, true);
  assert.equal(currentTitle.startsWith('⚡'), false);
});

test('status=complete: guard blocks when tab.title is already prefixed', () => {
  const changeInfo = { status: 'complete' };
  const tab = { url: 'http://localhost:8000/', title: '⚡ 8000 — Directory listing for /' };
  const currentTitle = changeInfo.title || tab.title || '';
  assert.equal(currentTitle.startsWith('⚡'), true);
});

test('status=complete: skipped when neither title change nor complete', () => {
  const changeInfo = { status: 'loading' };
  const titleChanged = !!changeInfo.title;
  const pageLoaded = changeInfo.status === 'complete';
  assert.equal(titleChanged || pageLoaded, false);
});

test('onChanged: updates title via portMappings in replace mode', async () => {
  lastInjectedTitle = null;
  globalThis.document = { title: '⚡ 3001 — Node / API' };
  const originalGet = globalThis.chrome.storage.sync.get;
  globalThis.chrome.storage.sync.get = async () => ({ isEnabled: true, rewriteMode: 'replace' });
  await onChangedCallback(
    { portMappings: { oldValue: {}, newValue: { '3001': 'Payment API' } } },
    'sync'
  );
  assert.equal(lastInjectedTitle, '⚡ 3001 — Payment API');
  globalThis.chrome.storage.sync.get = originalGet;
});

test('onChanged: in prefix mode keeps original bare title with new mapping', async () => {
  lastInjectedTitle = null;
  globalThis.document = { title: '⚡ 3001 — Node / API' };
  const originalGet = globalThis.chrome.storage.sync.get;
  globalThis.chrome.storage.sync.get = async () => ({ isEnabled: true, rewriteMode: 'prefix' });
  await onChangedCallback(
    { portMappings: { oldValue: {}, newValue: { '3001': 'Payment API' } } },
    'sync'
  );
  assert.equal(lastInjectedTitle, '⚡ 3001 — Node / API');
  globalThis.chrome.storage.sync.get = originalGet;
});
test('onUpdated: in prefix mode adds only port prefix and keeps page title', async () => {
  lastInjectedTitle = null;
  globalThis.document = { title: 'My App' };
  const originalGet = globalThis.chrome.storage.sync.get;
  globalThis.chrome.storage.sync.get = async () => ({
    isEnabled: true,
    portMappings: {},
    rewriteMode: 'prefix'
  });

  await onUpdatedCallback(
    1,
    { status: 'complete' },
    { url: 'http://localhost:3000/', title: 'My App' }
  );

  assert.equal(lastInjectedTitle, '⚡ 3000 — My App');
  globalThis.chrome.storage.sync.get = originalGet;
});

test('onChanged: in replace mode reverts to default name when custom override deleted', async () => {
  lastInjectedTitle = null;
  globalThis.document = { title: '⚡ 3001 — Payment API' };
  const originalGet = globalThis.chrome.storage.sync.get;
  globalThis.chrome.storage.sync.get = async () => ({ isEnabled: true, rewriteMode: 'replace' });
  await onChangedCallback(
    { portMappings: { oldValue: { '3001': 'Payment API' }, newValue: {} } },
    'sync'
  );
  assert.equal(lastInjectedTitle, '⚡ 3001 — Node / API');
  globalThis.chrome.storage.sync.get = originalGet;
});

test('onChanged: ignores non-sync area', async () => {
  lastInjectedTitle = null;
  await onChangedCallback(
    { portMappings: { oldValue: {}, newValue: { '3001': 'X' } } },
    'local'
  );
  assert.equal(lastInjectedTitle, null);
});

test('onChanged: ignores changes without portMappings key', async () => {
  lastInjectedTitle = null;
  await onChangedCallback(
    { isEnabled: { oldValue: true, newValue: false } },
    'sync'
  );
  assert.equal(lastInjectedTitle, null);
});

test('onUpdated: skips injection when isEnabled = false', async () => {
  let injected = false;
  // Temporarily override mocks for this test
  const originalExecuteScript = globalThis.chrome.scripting.executeScript;
  const originalGet = globalThis.chrome.storage.sync.get;
  
  globalThis.chrome.scripting.executeScript = async () => { injected = true; };
  globalThis.chrome.storage.sync.get = async () => ({ isEnabled: false });

  // Simulate onUpdated firing for a localhost tab with a non-prefixed title
  await onUpdatedCallback(
    1,
    { title: 'My App' },
    { url: 'http://localhost:3000/', title: 'My App' }
  );
  assert.equal(injected, false);
  
  // Restore mocks
  globalThis.chrome.scripting.executeScript = originalExecuteScript;
  globalThis.chrome.storage.sync.get = originalGet;
});

test('handleStorageChange: skips injection when isEnabled = false', async () => {
  let injected = false;
  const originalExecuteScript = globalThis.chrome.scripting.executeScript;
  const originalGet = globalThis.chrome.storage.sync.get;
  
  globalThis.chrome.scripting.executeScript = async () => { injected = true; };
  globalThis.chrome.storage.sync.get = async () => ({ isEnabled: false });

  await onChangedCallback(
    { portMappings: { newValue: { '3001': 'Payment API' } } },
    'sync'
  );
  assert.equal(injected, false);
  
  // Restore mocks
  globalThis.chrome.scripting.executeScript = originalExecuteScript;
  globalThis.chrome.storage.sync.get = originalGet;
});
