import { DEFAULT_PORT_MAP } from './port-map.js';

// --- Pure functions (exported for testing) ---
export function extractPort(url) {
  try {
    const { hostname, port } = new URL(url);
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return null;
    return port || null;
  } catch (_) {
    return null;
  }
}

export function buildTitle(port, pageTitle) {
  const trimmed = pageTitle && pageTitle.trim();
  if (trimmed) {
    return `⚡ ${port} — ${trimmed}`;
  }
  return `⚡ ${port}`;
}

export function resolvePortName(port, userMappings, defaultMap) {
  const mappings = userMappings || {};
  const defaults = defaultMap || {};

  const userName = mappings[port];
  if (typeof userName === 'string' && userName.trim()) {
    return userName.trim();
  }

  const defaultName = defaults[port];
  if (typeof defaultName === 'string' && defaultName.trim()) {
    return defaultName.trim();
  }

  return undefined;
}

// Matches one or more "⚡ port" prefixes (with optional " — "), so we strip all and avoid accumulation.
const PREFIX_REGEX = /^(?:⚡\s+\d+\s*(?:—\s*)?)+/;

export function stripPrefix(title) {
  if (!title || !title.startsWith('⚡')) return title;
  return title.replace(PREFIX_REGEX, '').trim();
}

/**
 * Injected via executeScript.
 *
 * - mode === 'replace': title becomes "⚡ port — name" (or "⚡ port — bareTitle" if name is empty).
 * - mode === 'prefix': title becomes "⚡ port — bareTitle" (port prefix only; no service name in title).
 *
 * @param {string} port - e.g. '3000'
 * @param {string} name - resolved service name or ''
 * @param {string} mode - 'replace' | 'prefix'
 */
function applyTitleInPage(port, name, mode) {
  const raw = document.title || '';
  const prefixed = raw.startsWith('⚡');
  const afterPrefix = prefixed ? raw.replace(PREFIX_REGEX, '').trim() : raw;

  const nameStr = (name && name.trim()) || '';
  let pageTitle = afterPrefix;

  // If the page title starts with "Name —", strip that leading segment so we don't duplicate it.
  if (nameStr && pageTitle.startsWith(nameStr + ' — ')) {
    pageTitle = pageTitle.slice(nameStr.length + 3).trim();
  }

  const replaceMode = mode === 'replace';
  if (replaceMode) {
    const useName = nameStr || pageTitle.trim();
    document.title = useName ? `⚡ ${port} — ${useName}` : `⚡ ${port}`;
    return;
  }

  // prefix mode: ignore service name in the final title; just add the port prefix.
  if (pageTitle && pageTitle.trim()) {
    document.title = `⚡ ${port} — ${pageTitle.trim()}`;
  } else {
    document.title = `⚡ ${port}`;
  }
}

// --- Chrome API wiring ---
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const { portMappings = {}, rewriteMode } = await chrome.storage.sync.get(['portMappings', 'rewriteMode']);
    const mode = rewriteMode === 'replace' ? 'replace' : 'prefix';
    const tabs = await chrome.tabs.query({
      url: ['*://localhost/*', '*://127.0.0.1/*']
    });
    for (const tab of tabs) {
      try {
        const port = extractPort(tab.url);
        if (!port) continue;
        const serviceName = resolvePortName(port, portMappings, DEFAULT_PORT_MAP);
        const nameStr = (typeof serviceName === 'string' && serviceName.trim()) ? serviceName.trim() : '';
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: applyTitleInPage,
          args: [port, nameStr, mode]
        });
      } catch (_) {
        // Tab closed between query and executeScript — silent per NFR9
      }
    }
  } catch (_) {
    // Query failed — silent per NFR9
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    const titleChanged = !!changeInfo.title;
    const pageLoaded = changeInfo.status === 'complete';
    if (!titleChanged && !pageLoaded) return;

    const port = extractPort(tab.url);
    if (!port) return;

    // STORY 3.4: pause guard + STORY 3.7: initial name resolution + rewriteMode
    const stored = await chrome.storage.sync.get(['isEnabled', 'portMappings', 'rewriteMode']);
    const isEnabled = stored.isEnabled !== false;
    const portMappings = stored.portMappings || {};
    const rewriteMode = stored.rewriteMode === 'replace' ? 'replace' : 'prefix';
    if (!isEnabled) return;

    const serviceName = resolvePortName(port, portMappings, DEFAULT_PORT_MAP);
    const nameStr = (typeof serviceName === 'string' && serviceName.trim()) ? serviceName.trim() : '';

    await chrome.scripting.executeScript({
      target: { tabId },
      func: applyTitleInPage,
      args: [port, nameStr, rewriteMode]
    });
  } catch (_) {
    // silent failure
  }
});

async function handleStorageChange(changes, area) {
  if (area !== 'sync') return;
  if (!changes.portMappings) return;

  const stored = await chrome.storage.sync.get(['isEnabled', 'rewriteMode']);
  if (stored.isEnabled === false) return;
  const rewriteMode = stored.rewriteMode === 'replace' ? 'replace' : 'prefix';

  const newPortMappings = changes.portMappings.newValue ?? {};

  try {
    const tabs = await chrome.tabs.query({
      url: ['*://localhost/*', '*://127.0.0.1/*']
    });

    for (const tab of tabs) {
      const port = extractPort(tab.url);
      if (!port) continue;

      const serviceName = resolvePortName(port, newPortMappings, DEFAULT_PORT_MAP);
      const nameStr = (typeof serviceName === 'string' && serviceName.trim()) ? serviceName.trim() : '';

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: applyTitleInPage,
          args: [port, nameStr, rewriteMode]
        });
      } catch (_) {
        // Tab may have closed between query and inject — silent fail per NFR9
      }
    }
  } catch (_) {
    // Silent fail per NFR9
  }
}

chrome.storage.onChanged.addListener(handleStorageChange);
