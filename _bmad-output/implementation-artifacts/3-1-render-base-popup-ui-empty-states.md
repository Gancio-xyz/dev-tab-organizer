# Story 3.1: Render Base Popup UI & Empty States

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer opening the extension popup for the first time,
I want to see a clean, keyboard-navigable interface that clearly shows my active localhost ports or tells me none are open,
So that I immediately understand the extension's status without any guesswork.

## Acceptance Criteria

1. Given no active `localhost` tabs are open, when the developer clicks the extension icon, `popup.html` displays the informational empty state message "No localhost tabs open yet — start a local server and I'll label it automatically." by setting the text content of `#empty-state` — `#tab-list` remains hidden/empty.
2. Given localhost tabs are active, when the developer clicks the extension icon, the popup renders a list showing each port with its current resolved name (default map or custom override), and the popup is fully rendered within 200ms of opening.
3. The popup is fully keyboard-navigable — all tab row inputs are reachable via Tab key without mouse interaction.
4. Initial list render may use `innerHTML` to build the structure. Subsequent DOM updates (Stories 3.2+) must NOT use `innerHTML` replacement — only in-place node mutation.

## Tasks / Subtasks

- [ ] Implement `popup.js` `init()` async function (AC: 1, 2, 3)
  - [ ] Replace stub `init()` from Story 1.1 with real implementation
  - [ ] Call `chrome.tabs.query({ url: ['*://localhost/*', '*://127.0.0.1/*'] })` to get active localhost tabs
  - [ ] Call `chrome.storage.sync.get('portMappings')` to load user overrides
  - [ ] Resolve display map: `const resolved = { ...DEFAULT_PORT_MAP, ...(portMappings ?? {}) }`
  - [ ] Branch on `tabs.length === 0`: call `renderEmptyState()` OR `renderTabList(tabs, resolved, portMappings)`
  - [ ] Wrap entire `init()` in `try/catch` — if storage read fails, fall back to `DEFAULT_PORT_MAP` only (do not crash the popup)
  - [ ] Call `init()` at module level (bottom of `popup.js`, after function declarations)
- [ ] Implement `renderEmptyState()` function (AC: 1)
  - [ ] Show `#empty-state`, hide `#tab-list`
  - [ ] Set `#empty-state` text content (NOT innerHTML) to exactly: `"No localhost tabs open yet — start a local server and I'll label it automatically."`
  - [ ] Do NOT leave `#empty-state` as a blank div — it must contain visible text
- [ ] Implement `renderTabList(tabs, resolved, portMappings)` function (AC: 2, 3, 4)
  - [ ] Show `#tab-list`, hide `#empty-state`
  - [ ] Sort tabs by port number (ascending) before rendering
  - [ ] For each tab, extract port using `new URL(tab.url).port`
  - [ ] Build one `.tab-row` per tab using the exact HTML structure specified in Dev Notes
  - [ ] `input.value` = `portMappings[port] ?? ''` — shows the user's custom override only (empty means using default)
  - [ ] `input.placeholder` = `DEFAULT_PORT_MAP[port] ?? 'Port ' + port` — shows the default that is currently active
  - [ ] Set the initial `innerHTML` of `#tab-list` to the generated rows (initial render only — see AC: 4)
- [ ] Add basic popup styling in `popup.html` or a linked `popup.css` (AC: 2, 3)
  - [ ] Popup width: fixed at ~320px (set via `body { min-width: 320px }` in CSS)
  - [ ] Tab rows: clear visual separation, port label visible, input field full-width within row
  - [ ] Empty state: centered, readable text — not a blank white panel
  - [ ] No external CSS frameworks — vanilla CSS only (zero dependencies, NFR15)
- [ ] Manual verification (AC: 1, 2, 3)
  - [ ] With no localhost tabs open: click icon → empty state message appears
  - [ ] With localhost tabs open: click icon → list renders within ~200ms, each port and name visible
  - [ ] Tab through all inputs with keyboard only → all inputs reachable without mouse
  - [ ] Check popup DevTools console (right-click popup → Inspect) → no JS errors

## Dev Notes

### What Already Exists in `popup.js` (Story 1.1 Stub)

```js
// Current popup.js — REPLACE the stub init() with real implementation
import { DEFAULT_PORT_MAP } from './port-map.js';

async function init() {
  // stub — replace this entire function body
}
```

The `import` statement is already there — do not change it. The stub `init()` body is the only thing being replaced.

### What Already Exists in `popup.html` (Story 1.1 Stub)

```html
<div id="tab-list" role="list" aria-label="Active localhost tabs"></div>
<div id="empty-state" aria-live="polite"></div>
<script src="popup.js" type="module"></script>
```

These IDs (`#tab-list`, `#empty-state`) are already present — do NOT rename or restructure them. Stories 3.2–3.4 depend on these exact IDs.

### Exact DOM Structure for Tab Rows (CRITICAL — Architecture-Specified)

Every tab row must match this exact HTML structure for accessibility compliance (NFR12–14) and forward compatibility with Story 3.2's in-place DOM mutation:

```html
<div class="tab-row" data-port="3001" role="listitem">
  <label for="input-3001">Port 3001</label>
  <input id="input-3001"
         class="tab-name-input"
         data-port="3001"
         type="text"
         placeholder="Auth Service"
         aria-label="Custom name for port 3001"
         value="My Override">
</div>
```

**Required attributes — do not omit any:**
- `class="tab-row"` — Story 3.2 uses `querySelector('.tab-row')` iteration
- `data-port="{PORT}"` on both the `.tab-row` div AND the input — Story 3.2 reads `dataset.port`
- `id="input-{PORT}"` on the input — must match `for=` on the label (WCAG requirement)
- `class="tab-name-input"` on the input — Story 3.2 uses `querySelectorAll('.tab-name-input')`
- `role="listitem"` on each row — pairs with `role="list"` already on `#tab-list`
- `aria-label="Custom name for port {PORT}"` — screen reader context (NFR14)

**Input value vs placeholder semantics:**
- `value` = user's custom override from `portMappings[port]` — empty string if no override
- `placeholder` = `DEFAULT_PORT_MAP[port] ?? 'Port ' + port` — shows the active default name

This design lets the user see at a glance: empty input = using default (shown as placeholder), filled input = using custom override. This is the intended UX.

### Complete `popup.js` Structure

```js
import { DEFAULT_PORT_MAP } from './port-map.js';

function renderEmptyState() {
  document.getElementById('tab-list').hidden = true;
  const el = document.getElementById('empty-state');
  el.hidden = false;
  el.textContent = "No localhost tabs open yet — start a local server and I'll label it automatically.";
}

function renderTabList(tabs, resolved, portMappings) {
  document.getElementById('empty-state').hidden = true;
  const list = document.getElementById('tab-list');
  list.hidden = false;

  // Sort tabs by port number ascending
  const sorted = [...tabs].sort((a, b) => {
    return parseInt(new URL(a.url).port) - parseInt(new URL(b.url).port);
  });

  list.innerHTML = sorted.map(tab => {
    const port = new URL(tab.url).port;
    const customName = portMappings?.[port] ?? '';
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
               value="${customName}">
      </div>`;
  }).join('');
}

async function init() {
  try {
    const [tabs, storage] = await Promise.all([
      chrome.tabs.query({ url: ['*://localhost/*', '*://127.0.0.1/*'] }),
      chrome.storage.sync.get('portMappings')
    ]);
    const portMappings = storage.portMappings ?? {};
    if (tabs.length === 0) {
      renderEmptyState();
    } else {
      renderTabList(tabs, { ...DEFAULT_PORT_MAP, ...portMappings }, portMappings);
    }
  } catch (_) {
    // Fallback: show empty state if anything fails
    renderEmptyState();
  }
}

init();
```

**Key patterns:**
- `Promise.all` to parallelize the tab query and storage read — faster than sequential `await`
- `storage.portMappings ?? {}` — nullish coalescing avoids `undefined` errors on first run
- `list.innerHTML = ...` for initial render (AC: 4 — allowed for initial render only)
- `el.textContent` not `innerHTML` for empty state — avoids any XSS risk on the message text

### Hiding/Showing Sections — Use `hidden` Attribute

Use the `hidden` HTML attribute (not CSS `display: none`) to toggle visibility. It's semantic and requires no CSS class:

```js
// CORRECT — semantic, accessible
document.getElementById('empty-state').hidden = true;
document.getElementById('tab-list').hidden = false;

// AVOID — requires CSS coordination
element.classList.add('hidden');
element.style.display = 'none';
```

Add `hidden` to both `#tab-list` and `#empty-state` in the initial `popup.html` markup so neither shows a flash of content before `init()` runs:

```html
<div id="tab-list" role="list" aria-label="Active localhost tabs" hidden></div>
<div id="empty-state" aria-live="polite" hidden></div>
```

### Popup Styling — Minimum Required CSS

Create `popup.css` at the project root and link it from `popup.html`. Minimum styles needed:

```css
body {
  min-width: 320px;
  max-width: 400px;
  padding: 12px;
  font-family: system-ui, sans-serif;
  margin: 0;
}

#empty-state {
  padding: 16px 0;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.tab-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #eee;
}

.tab-row label {
  min-width: 72px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.tab-name-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.tab-name-input:focus {
  outline: 2px solid #0066cc;
  border-color: transparent;
}
```

The `:focus` style with `outline: 2px solid` is required for WCAG 2.1 AA keyboard navigation compliance (NFR12–13). Do not use `outline: none`.

### Storage Key — `portMappings` (Exact String)

```js
// CORRECT
chrome.storage.sync.get('portMappings')
chrome.storage.sync.set({ portMappings: updated })

// WRONG — any of these break background.js ↔ popup.js contract
chrome.storage.sync.get('port_mappings')
chrome.storage.sync.get('portMap')
chrome.storage.sync.get('mappings')
```

The storage key `portMappings` is defined once in the architecture and used identically by both `background.js` (reads) and `popup.js` (reads + writes). A mismatch here causes both components to see empty storage silently.

### Scope Boundaries — What Is NOT in This Story

| Feature | Story |
|---|---|
| Saving edits on blur/Enter | 3.2 |
| Removing a custom override (clear + save) | 3.2 |
| Real-time tab title update when name changes | 3.3 |
| Pause/resume toggle | 3.4 |

Do NOT add event listeners for `blur`, `change`, or `keydown` (Enter) in this story — leave inputs as display-only for now. Story 3.2 adds those listeners. The input fields rendered here must NOT be removed or restructured by Story 3.2.

### `popup.html` — Updated Shell

Update `popup.html` to add the CSS link and `hidden` attributes:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dev Tab Organizer</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="tab-list" role="list" aria-label="Active localhost tabs" hidden></div>
  <div id="empty-state" aria-live="polite" hidden></div>
  <script src="popup.js" type="module"></script>
</body>
</html>
```

### Performance — Sub-200ms Render (NFR)

The `Promise.all` pattern parallelizes the tab query and storage read. Both are fast Chrome API calls (typically < 10ms each). The DOM construction is synchronous. Total render time should be well under 200ms on any machine.

Do NOT add `setTimeout`, polling, or any artificial delays. If you find the popup is slow, check for synchronous `await` chains that could be parallelized.

### Previous Story Context (Stories 1.1–2.2)

- **1.1:** `popup.html` stub exists with `#tab-list`, `#empty-state`, and `<script src="popup.js" type="module">`; `popup.js` stub exists with `import { DEFAULT_PORT_MAP }` and empty `init()`
- **1.2–1.4:** `background.js` is fully implemented — `popup.js` is completely independent and does not interact with it directly (they share state only via `chrome.storage.sync`)
- **2.1–2.2:** GitHub repo public, extension on CWS — no code impact on this story
- Storage key `portMappings` is already used by `background.js` (reads) — `popup.js` must use the exact same key

### References

- Architecture: popup lifecycle steps 1–5 [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture (Popup)`]
- Architecture: exact DOM structure for tab rows (Gap 1 resolution) [Source: `_bmad-output/planning-artifacts/architecture.md#Gap Analysis & Resolutions`]
- Architecture: `innerHTML` allowed for initial render, prohibited for updates [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture: storage key `portMappings` — exact string, never vary [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]
- Architecture: `chrome.tabs.query` filter — match pattern format [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture: popup empty state exact message text [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture (Popup)`]
- Epics: Story 3.1 ACs [Source: `_bmad-output/planning-artifacts/epics.md#Story 3.1`]
- PRD FRs covered: FR15 (open popup from toolbar), FR16 (display active tabs with port + name), FR19 (empty state when no localhost tabs) [Source: `_bmad-output/planning-artifacts/epics.md#Epic 3 FR Coverage Map`]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_None yet_

### Completion Notes List

_To be filled by dev agent after implementation_

### File List

_Files created/modified by dev agent:_

- `popup.js` (modify — replace stub `init()` with full implementation + `renderEmptyState` + `renderTabList`)
- `popup.html` (modify — add `<link rel="stylesheet">`, add `hidden` to both divs)
- `popup.css` (create — minimum required styles)
