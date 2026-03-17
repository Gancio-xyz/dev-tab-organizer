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

  const sorted = [...tabs]
    .filter(tab => new URL(tab.url).port !== '')
    .sort((a, b) => parseInt(new URL(a.url).port) - parseInt(new URL(b.url).port));

  list.innerHTML = sorted.map(tab => {
    const port = new URL(tab.url).port;
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
}

init();
