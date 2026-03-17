import { DEFAULT_PORT_MAP } from './port-map.js';

export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderEmptyState() {
  document.getElementById('tab-list').hidden = true;
  const el = document.getElementById('empty-state');
  el.hidden = false;
  el.textContent = "No localhost tabs open yet — start a local server and I'll label it automatically.";
}

export function renderTabList(tabs, portMappings, rawPortMappings = {}) {
  document.getElementById('empty-state').hidden = true;
  const list = document.getElementById('tab-list');
  list.hidden = false;

  // One row per unique port: deduplicate by port so we never show duplicate menu items
  // (e.g. multiple tabs on same port or duplicate query results)
  const ports = [...new Set(
    tabs
      .map(tab => new URL(tab.url).port)
      .filter(port => port !== '')
  )].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  list.innerHTML = ports.map(port => {
    const customName = rawPortMappings?.[port] ?? '';
    const defaultName = DEFAULT_PORT_MAP[port] ?? 'Port ' + port;
    return `
      <div class="tab-row" data-port="${port}" role="listitem">
        <label for="input-${port}">Port ${port}</label>
        <input id="input-${port}"
               class="tab-name-input"
               data-port="${port}"
               type="text"
               placeholder="${defaultName}"
               aria-label="Custom name for port ${port}"
               value="${escapeHtml(customName)}">
      </div>`;
  }).join('');
}

export function applyMapping(portMappings, port, value) {
  const updated = { ...portMappings };
  if (value) {
    updated[port] = value;
  } else {
    delete updated[port];
  }
  return updated;
}

async function saveMapping(input) {
  const port = input.dataset.port;
  const value = input.value.trim();
  try {
    const { portMappings = {} } = await chrome.storage.sync.get('portMappings');
    const updated = applyMapping(portMappings, port, value);
    await chrome.storage.sync.set({ portMappings: updated });
  } catch (_) {
    // silent per NFR9
  }
}

export function attachEditListeners() {
  document.querySelectorAll('.tab-name-input').forEach(input => {
    input.addEventListener('blur', () => {
      saveMapping(input);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveMapping(input);
      }
    });
  });
}

export function updateToggleUI(isEnabled) {
  const btn = document.getElementById('toggle-btn');
  btn.textContent = isEnabled ? 'Pause' : 'Resume';
  btn.setAttribute('aria-pressed', String(!isEnabled));
}

function updateRewriteModeUI(mode) {
  const checkbox = document.getElementById('rewrite-mode-toggle');
  if (!checkbox) return;
  checkbox.checked = mode === 'replace';
}

async function initRewriteMode() {
  try {
    const { rewriteMode = 'prefix' } = await chrome.storage.sync.get('rewriteMode');
    updateRewriteModeUI(rewriteMode);

    const checkbox = document.getElementById('rewrite-mode-toggle');
    if (!checkbox) return;
    checkbox.addEventListener('change', async () => {
      try {
        const nextMode = checkbox.checked ? 'replace' : 'prefix';
        await chrome.storage.sync.set({ rewriteMode: nextMode });
        updateRewriteModeUI(nextMode);
      } catch (_) {
        // silent — NFR9
      }
    });
  } catch (_) {
    // silent — NFR9
  }
}

async function initToggle() {
  try {
    const { isEnabled = true } = await chrome.storage.sync.get('isEnabled');
    updateToggleUI(isEnabled);
    document.getElementById('toggle-btn').addEventListener('click', async () => {
      try {
        const { isEnabled: current = true } = await chrome.storage.sync.get('isEnabled');
        const next = !current;
        await chrome.storage.sync.set({ isEnabled: next });
        updateToggleUI(next);
      } catch (_) {
        // silent — NFR9
      }
    });
  } catch (_) {
    // silent — NFR9; button defaults to "Pause" (isEnabled=true assumed)
  }
}

export async function init() {
  try {
    const [tabs, storage] = await Promise.all([
      chrome.tabs.query({ url: ['*://localhost/*', '*://127.0.0.1/*'] }),
      chrome.storage.sync.get('portMappings')
    ]);
    const portMappings = storage.portMappings ?? {};
    if (tabs.length === 0) {
      renderEmptyState();
    } else {
      const resolved = { ...DEFAULT_PORT_MAP, ...portMappings };
      renderTabList(tabs, resolved, portMappings);
      attachEditListeners();
    }
  } catch (_) {
    renderEmptyState();
  }
  initToggle();
  initRewriteMode();
}

init();
