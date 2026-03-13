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
    if (!changeInfo.title) return;
    if (changeInfo.title.startsWith('⚡')) return;
    const port = extractPort(tab.url);
    if (!port) return;

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
