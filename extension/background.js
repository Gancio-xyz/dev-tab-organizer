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

export function stripPrefix(title) {
  if (!title || !title.startsWith('⚡')) return title;
  return title.replace(/^⚡\s+\d+\s+—\s+/, '');
}

// --- Chrome API wiring ---
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({
      url: ['*://localhost/*', '*://127.0.0.1/*']
    });
    for (const tab of tabs) {
      try {
        if (!tab.title || tab.title.startsWith('⚡')) continue;
        const port = extractPort(tab.url);
        if (!port) continue;
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (port) => {
            const raw = document.title;
            const bare = raw && raw.startsWith('⚡')
              ? raw.replace(/^⚡\s+\d+\s+—\s+/, '')
              : raw;
            if (bare && bare.trim()) {
              document.title = `⚡ ${port} — ${bare.trim()}`;
            } else {
              document.title = `⚡ ${port}`;
            }
          },
          args: [port]
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

    // Derive the authoritative title: prefer changeInfo.title (title-change event),
    // fall back to tab.title (status=complete with no simultaneous title change).
    const currentTitle = changeInfo.title || tab.title || '';
    if (currentTitle.startsWith('⚡')) return;

    const port = extractPort(tab.url);
    if (!port) return;

    // STORY 3.4: pause guard
    const { isEnabled = true } = await chrome.storage.sync.get('isEnabled');
    if (!isEnabled) return;

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (port) => {
        const raw = document.title;
        const bare = raw && raw.startsWith('⚡')
          ? raw.replace(/^⚡\s+\d+\s+—\s+/, '')
          : raw;
        if (bare && bare.trim()) {
          document.title = `⚡ ${port} — ${bare.trim()}`;
        } else {
          document.title = `⚡ ${port}`;
        }
      },
      args: [port]
    });
  } catch (_) {
    // silent failure
  }
});

async function handleStorageChange(changes, area) {
  if (area !== 'sync') return;
  if (!changes.portMappings) return;

  // STORY 3.4: pause guard
  const { isEnabled = true } = await chrome.storage.sync.get('isEnabled');
  if (!isEnabled) return;

  const newPortMappings = changes.portMappings.newValue ?? {};

  try {
    const tabs = await chrome.tabs.query({
      url: ['*://localhost/*', '*://127.0.0.1/*']
    });

    for (const tab of tabs) {
      const port = extractPort(tab.url);
      if (!port) continue;

      const name = resolvePortName(port, newPortMappings, DEFAULT_PORT_MAP);
      const newTitle = buildTitle(port, name);

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (title) => {
            document.title = title;
          },
          args: [newTitle]
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
