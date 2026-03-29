import { DEFAULT_PORT_MAP, getDefaultEmoji } from './port-map.js';

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

/**
 * Resolve display name for a port. Backward compatible: userMappings[port] may be string (legacy) or { name, emoji }.
 */
export function resolvePortName(port, userMappings, defaultMap) {
  const mappings = userMappings || {};
  const defaults = defaultMap || {};

  const v = mappings[port];
  if (typeof v === 'string' && v.trim()) {
    return v.trim();
  }
  if (v && typeof v === 'object' && typeof v.name === 'string' && v.name.trim()) {
    return v.name.trim();
  }

  const defaultName = defaults[port];
  if (typeof defaultName === 'string' && defaultName.trim()) {
    return defaultName.trim();
  }

  return undefined;
}

/**
 * Resolve display emoji for a port. Backward compatible: userMappings[port] may be string (use default) or { name, emoji }.
 */
export function resolvePortEmoji(port, userMappings) {
  const mappings = userMappings || {};
  const v = mappings[port];
  if (v && typeof v === 'object' && typeof v.emoji === 'string' && v.emoji.trim()) {
    return v.emoji.trim().slice(0, 2);
  }
  return getDefaultEmoji(port);
}

// Matches one or more "emoji port" prefixes (emoji 1–8 non-word chars, e.g. ⚡ or 🚀) so we strip all and avoid accumulation.
const PREFIX_REGEX = /^(?:[^\w\s]{1,8}\s+\d+\s*(?:—\s*)?)+/u;

export function stripPrefix(title) {
  if (!title || typeof title !== 'string') return title;
  if (!PREFIX_REGEX.test(title)) return title;
  return title.replace(PREFIX_REGEX, '').trim();
}

/**
 * Injected via executeScript. Must be self-contained (no outer-scope refs) so it runs in the tab's page context.
 *
 * - mode === 'replace': title becomes "{emoji} port — name" (or "{emoji} port — bareTitle" if name is empty).
 * - mode === 'prefix': title becomes "{emoji} port — bareTitle".
 *
 * @param {string} port - e.g. '3000'
 * @param {string} name - resolved service name or ''
 * @param {string} mode - 'replace' | 'prefix'
 * @param {string} emoji - display emoji (default ⚡)
 */
function applyTitleInPage(port, name, mode, emoji = '⚡') {
  const prefixRegex = /^(?:[^\w\s]{1,8}\s+\d+\s*(?:—\s*)?)+/u;
  const raw = document.title || '';
  const prefixed = prefixRegex.test(raw);
  const afterPrefix = prefixed ? raw.replace(prefixRegex, '').trim() : raw;

  const nameStr = (name && name.trim()) || '';
  const emojiStr = (emoji && String(emoji).trim()) ? String(emoji).trim().slice(0, 2) : '⚡';
  let pageTitle = afterPrefix;

  if (nameStr && pageTitle.startsWith(nameStr + ' — ')) {
    pageTitle = pageTitle.slice(nameStr.length + 3).trim();
  }

  const replaceMode = mode === 'replace';
  if (replaceMode) {
    const useName = nameStr || pageTitle.trim();
    document.title = useName ? `${emojiStr} ${port} — ${useName}` : `${emojiStr} ${port}`;
    return;
  }

  if (pageTitle && pageTitle.trim()) {
    document.title = `${emojiStr} ${port} — ${pageTitle.trim()}`;
  } else {
    document.title = `${emojiStr} ${port}`;
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
        const emoji = resolvePortEmoji(port, portMappings);
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: applyTitleInPage,
          args: [port, nameStr, mode, emoji]
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
    const emoji = resolvePortEmoji(port, portMappings);

    await chrome.scripting.executeScript({
      target: { tabId },
      func: applyTitleInPage,
      args: [port, nameStr, rewriteMode, emoji]
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
      const emoji = resolvePortEmoji(port, newPortMappings);

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: applyTitleInPage,
          args: [port, nameStr, rewriteMode, emoji]
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
