# Story 3.4: Implement Global Pause/Resume Toggle

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer temporarily recording a screen-share,
I want to pause the extension's title-rewriting from the popup without uninstalling it,
So that new tabs open during the session use native browser titles, while my setup remains intact for when I resume.

## Acceptance Criteria

1. Given a user opens the popup, when they click the Pause/Resume toggle, an `isEnabled` boolean flag flips in `chrome.storage.sync` (default `true`) and the button reflects the new state immediately.
2. Given `isEnabled = false` in storage, `background.js` checks this flag and returns immediately before any `chrome.scripting.executeScript` call — new localhost tabs opened while paused receive their native browser title, not the `⚡` prefix.
3. Given the extension is paused and already-renamed tabs show their `⚡` prefixed titles, when the user pauses, those tabs retain their current titles — no active reversion occurs.
4. Given the user clicks Resume (flipping `isEnabled` to `true`), the next `chrome.tabs.onUpdated` event for any localhost tab resumes normal title-rewriting behaviour.
5. Given `isEnabled = false`, `background.js` also skips the `handleStorageChange` injection loop — even if `portMappings` changes while paused, no tab titles are updated.

## Tasks / Subtasks

- [x] Add `<button id="toggle-btn">` to `popup.html` (AC: 1)
  - [x] Add after `#empty-state` div, before the `<script>` tag
  - [x] Use: `<button id="toggle-btn" type="button" aria-pressed="false">Pause</button>`
  - [x] Add CSS for toggle button to `popup.css` (see Dev Notes for styles)
- [x] Implement toggle logic in `popup.js` (AC: 1)
  - [x] Add `updateToggleUI(isEnabled)` function — sets `textContent` and `aria-pressed` on `#toggle-btn`
  - [x] Add `initToggle()` async function — reads `isEnabled` from storage, calls `updateToggleUI`, attaches `click` listener
  - [x] In click listener: read current `isEnabled`, flip it, `chrome.storage.sync.set({ isEnabled: next })`, call `updateToggleUI(next)`
  - [x] Wrap click handler body in `try/catch` — silent fail per NFR9
  - [x] Call `initToggle()` from `init()` — ALWAYS call it, regardless of the tabs.length branch (toggle must show in both empty and populated state)
- [x] Add `isEnabled` guard to `onUpdated` handler in `background.js` (AC: 2, 3, 4)
  - [x] Add `const { isEnabled = true } = await chrome.storage.sync.get('isEnabled');` inside the handler, after the existing `extractPort` check
  - [x] Add `if (!isEnabled) return;` immediately after the storage read
  - [x] Do NOT move or restructure any existing guard checks (`!changeInfo.title`, `startsWith('⚡')`, `!port`)
- [x] Add `isEnabled` guard to `handleStorageChange` in `background.js` (AC: 5)
  - [x] This function was added by Story 3.3 — add the check after the `area`/`portMappings` guards
  - [x] Add `const { isEnabled = true } = await chrome.storage.sync.get('isEnabled');`
  - [x] Add `if (!isEnabled) return;` immediately after
- [x] Add unit tests in `tests/background.test.js` (AC: 2, 5)
  - [x] Extend chrome mock to return `{ isEnabled: false }` from `storage.sync.get` in relevant tests
  - [x] Test: `onUpdated` handler skips injection when `isEnabled = false`
  - [x] Test: `handleStorageChange` skips injection when `isEnabled = false`
  - [x] Run: `node --test tests/background.test.js` → zero failures
- [x] Add unit tests in `tests/popup.test.js` (AC: 1)
  - [x] Test: `updateToggleUI(true)` sets button text to "Pause" and `aria-pressed="false"`
  - [x] Test: `updateToggleUI(false)` sets button text to "Resume" and `aria-pressed="true"`
  - [x] Run: `node --test tests/popup.test.js` → zero failures
- [x] Manual verification (AC: 1, 2, 3, 4)
  - [x] Open popup → button shows "Pause" → click → button changes to "Resume"
  - [x] While paused: open a new `localhost:PORT` tab → title does NOT get `⚡` prefix
  - [x] Existing `⚡`-prefixed tabs retain their titles (no reversion) while paused
  - [x] Click "Resume" → open a new localhost tab → title gets `⚡` prefix again
  - [x] Close and reopen popup while paused → button still shows "Resume" (state persisted in storage)
  - [x] Inspect service worker console → no errors during any toggle action

## Dev Notes

### What Stories 3.1–3.3 Established (Do Not Duplicate)

**`popup.html`** (after 3.1) has these IDs — do NOT rename:
```html
<div id="tab-list" role="list" aria-label="Active localhost tabs" hidden></div>
<div id="empty-state" aria-live="polite" hidden></div>
```

**`popup.js`** (after 3.1, 3.2) has:
- `renderEmptyState()` — shows `#empty-state`, hides `#tab-list`
- `renderTabList(tabs, resolved, portMappings)` — builds `#tab-list` innerHTML
- `attachEditListeners()` — attaches blur/Enter listeners to `.tab-name-input` elements (3.2)
- `saveMapping(input)` — reads/writes `portMappings` in storage (3.2)
- `init()` — `Promise.all([tabs.query, storage.get('portMappings')])`, branches on tabs.length, calls `renderTabList` then `attachEditListeners()` OR `renderEmptyState()`

**`background.js`** (after 3.3) has:
- `extractPort(url)` — pure function, returns port string or null
- `buildTitle(port, pageTitle)` — pure function, returns `'⚡ PORT — pageTitle'` or `'⚡ PORT'`
- `chrome.tabs.onUpdated.addListener(...)` — listens for title changes, injects `document.title`
- `handleStorageChange(changes, area)` — handles `portMappings` storage changes, rewrites all matching tabs
- `chrome.storage.onChanged.addListener(handleStorageChange)` (3.3)

### `popup.html` Change — Add Toggle Button

Add `<button id="toggle-btn">` after `#empty-state` and before `<script>`:

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
  <button id="toggle-btn" type="button" aria-pressed="false">Pause</button>
  <script src="popup.js" type="module"></script>
</body>
</html>
```

**Why `aria-pressed`:** The WAI-ARIA `aria-pressed` attribute is the standard toggle button pattern. Screen readers announce the pressed state — "Pause, toggle button, not pressed" vs "Resume, toggle button, pressed". This satisfies NFR14 (labelled interactions for screen readers).

### `popup.css` — Toggle Button Styles

Add to existing `popup.css`:

```css
#toggle-btn {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 8px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f5f5f5;
  font-size: 13px;
  cursor: pointer;
}

#toggle-btn:hover {
  background: #ececec;
}

#toggle-btn:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

#toggle-btn[aria-pressed="true"] {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}
```

The `[aria-pressed="true"]` selector provides a visual paused state (amber tint) that is distinct from the active state — satisfies WCAG 2.1 AA colour context requirement when combined with the text change.

### `popup.js` — `initToggle()` and `updateToggleUI()` — Exact Pattern

```js
// ADD these two functions to popup.js (after saveMapping, before init):

function updateToggleUI(isEnabled) {
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
```

**`aria-pressed` mapping:**

| `isEnabled` | Button text | `aria-pressed` | Meaning |
|-------------|-------------|----------------|---------|
| `true`      | "Pause"     | `"false"`      | Active; not in paused state |
| `false`     | "Resume"    | `"true"`       | Paused; in paused state |

`aria-pressed` describes whether the button's action is currently engaged, NOT whether `isEnabled` is true. "Paused" is the toggle state, so `aria-pressed="true"` = paused is ON.

### `popup.js` — Updated `init()` — Call `initToggle()` in Both Branches

```js
// MODIFY init() — add initToggle() call:
async function init() {
  try {
    const [tabs, storage] = await Promise.all([
      chrome.tabs.query({ url: ['*://localhost/*', '*://127.0.0.1/*'] }),
      chrome.storage.sync.get('portMappings')
    ]);
    const portMappings = storage.portMappings ?? {};
    if (tabs.length === 0) {
      renderEmptyState();
      // NOTE: no attachEditListeners() here — no inputs in empty state
    } else {
      renderTabList(tabs, { ...DEFAULT_PORT_MAP, ...portMappings }, portMappings);
      attachEditListeners();
    }
  } catch (_) {
    renderEmptyState();
  }
  initToggle(); // ← ADD THIS LINE — called outside the try/catch, always runs
}
```

**Critical:** `initToggle()` must run in BOTH branches (empty state AND populated state). The toggle is always visible in the popup. Placing the call after the `try/catch` block ensures it always executes regardless of whether tab rendering succeeded.

**Why not inside `Promise.all`:** The `isEnabled` read is separate from the tab query and portMappings read — keeping `initToggle` independent simplifies the data flow and prevents one failure from blocking the other.

### `background.js` — `isEnabled` Guard in `onUpdated`

The current `onUpdated` handler (after Story 1.2):

```js
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (!changeInfo.title) return;
    if (changeInfo.title.startsWith('⚡')) return;
    const port = extractPort(tab.url);
    if (!port) return;

    await chrome.scripting.executeScript({ ... });
  } catch (_) { }
});
```

**Story 3.4 adds the `isEnabled` check after `extractPort`:**

```js
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (!changeInfo.title) return;
    if (changeInfo.title.startsWith('⚡')) return;
    const port = extractPort(tab.url);
    if (!port) return;

    // STORY 3.4: pause guard
    const { isEnabled = true } = await chrome.storage.sync.get('isEnabled');
    if (!isEnabled) return;

    await chrome.scripting.executeScript({ ... });
  } catch (_) { }
});
```

**Why AFTER `extractPort`:** The early guards (`!changeInfo.title`, `startsWith('⚡')`, `!port`) are O(1) synchronous checks. Deferring the async storage read until we know this is a real localhost tab that needs rewriting avoids unnecessary storage reads for unrelated `onUpdated` events (which are frequent).

### `background.js` — `isEnabled` Guard in `handleStorageChange` (Story 3.3 Function)

```js
// MODIFY handleStorageChange (added in Story 3.3):
async function handleStorageChange(changes, area) {
  if (area !== 'sync') return;
  if (!changes.portMappings) return;

  // STORY 3.4: pause guard
  const { isEnabled = true } = await chrome.storage.sync.get('isEnabled');
  if (!isEnabled) return;

  const newPortMappings = changes.portMappings.newValue ?? {};
  // ... rest of handler (tab query loop + executeScript) unchanged
}
```

**Behavioral note (AC: 5):** When `isEnabled = false`, a user editing port names in the popup still saves to `portMappings` (Story 3.2 is unaffected — it only writes storage). However, `handleStorageChange` skips the injection loop, so already-open tab titles are NOT updated while paused. When the user resumes, the next `onUpdated` event will apply the latest saved names naturally.

### Storage Keys — Both Keys Now in Use

| Key | Type | Default | Owner |
|-----|------|---------|-------|
| `portMappings` | `object` | `{}` | `popup.js` (write), `background.js` (read) |
| `isEnabled` | `boolean` | `true` (inferred via `?? true`) | `popup.js` (write), `background.js` (read) |

`isEnabled` is NEVER explicitly written as `true` at startup — both `popup.js` and `background.js` use `?? true` as the default when the key is absent. This keeps storage clean on first install (no unnecessary write).

**Exact storage read pattern for multiple keys:**
```js
// CORRECT — read both keys at once
const { portMappings = {}, isEnabled = true } = await chrome.storage.sync.get(['portMappings', 'isEnabled']);

// Also correct — separate reads where needed
const { isEnabled = true } = await chrome.storage.sync.get('isEnabled');
```

### Testing `updateToggleUI` — DOM Mock Pattern

`updateToggleUI` accesses the real DOM — tests must provide a mock DOM element:

```js
// tests/popup.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Minimal DOM mock for toggle button
let btn = { textContent: '', _attrs: {} };
btn.setAttribute = (k, v) => { btn._attrs[k] = v; };
btn.addEventListener = () => {};

globalThis.document = {
  getElementById: (id) => id === 'toggle-btn' ? btn : null,
  // ... other mocks for tab-list, empty-state as needed by popup.js init
};

globalThis.chrome = {
  tabs: { query: async () => [] },
  storage: { sync: { get: async () => ({}), set: async () => {} } }
};

// Import popup.js (triggers init() side effect — ensure chrome mock is complete)
// If updateToggleUI is NOT exported, test indirectly via initToggle() mock
// OR extract as a pure function and export:
// export function updateToggleUI(isEnabled) { ... }

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
```

**If `updateToggleUI` is not exported:** extract it as an export for testability (same pattern as `applyMapping` in Story 3.2):
```js
export function updateToggleUI(isEnabled) {
  const btn = document.getElementById('toggle-btn');
  btn.textContent = isEnabled ? 'Pause' : 'Resume';
  btn.setAttribute('aria-pressed', String(!isEnabled));
}
```

### Testing `isEnabled` Guard in `background.js`

Extend the existing `background.test.js` chrome mock to return `isEnabled: false` for specific tests:

```js
// In background.test.js — add tests for isEnabled guard:

test('onUpdated: skips injection when isEnabled = false', async () => {
  let injected = false;
  globalThis.chrome.scripting.executeScript = async () => { injected = true; };
  globalThis.chrome.storage.sync.get = async () => ({ isEnabled: false });

  // Simulate onUpdated firing for a localhost tab with a non-prefixed title
  await onUpdatedCallback(
    1,
    { title: 'My App' },
    { url: 'http://localhost:3000/', title: 'My App' }
  );
  assert.equal(injected, false);
});

test('handleStorageChange: skips injection when isEnabled = false', async () => {
  let injected = false;
  globalThis.chrome.scripting.executeScript = async () => { injected = true; };
  globalThis.chrome.storage.sync.get = async () => ({ isEnabled: false });

  await onChangedCallback(
    { portMappings: { newValue: { '3001': 'Payment API' } } },
    'sync'
  );
  assert.equal(injected, false);
});
```

Capture `onUpdatedCallback` the same way `onChangedCallback` is captured — by storing the function passed to `chrome.tabs.onUpdated.addListener`.

### Regression Checklist — Stories 3.1–3.3 Must Not Break

| Feature | Test |
|---------|------|
| Empty state renders when no tabs open | Manual: no localhost tabs → "No localhost tabs open yet" message |
| Tab list renders when tabs open | Manual: localhost tabs → port list visible |
| Inline name editing persists | Manual: type name → blur → reopen popup → name still there |
| Storage-triggered title update | Manual: type name → blur → tab title updates within 100ms |
| Toggle button visible in BOTH states | Manual: check empty state AND populated state |

### Files Modified by This Story

| File | Change |
|------|--------|
| `popup.html` | Add `<button id="toggle-btn" type="button" aria-pressed="false">Pause</button>` |
| `popup.css` | Add toggle button styles (`#toggle-btn` and `#toggle-btn[aria-pressed="true"]`) |
| `popup.js` | Add `updateToggleUI()`, `initToggle()`; update `init()` to call `initToggle()` |
| `background.js` | Add `isEnabled` guard to `onUpdated` handler; add `isEnabled` guard to `handleStorageChange` |
| `tests/background.test.js` | Add 2 tests for `isEnabled = false` bypass behavior |
| `tests/popup.test.js` | Add 2 tests for `updateToggleUI` state |

**Do NOT touch:** `port-map.js`, `manifest.json`

### References

- Epics: Story 3.4 ACs — `isEnabled` flag, guard before `executeScript`, no active reversion, resume on next `onUpdated` [Source: `_bmad-output/planning-artifacts/epics.md#Story 3.4`]
- PRD: FR27 — Global pause/resume toggle [Source: `_bmad-output/planning-artifacts/epics.md#Epic 3 FR Coverage Map`]
- Architecture: in-place DOM mutation after initial render — `updateToggleUI` uses `setAttribute` not innerHTML [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture: `async/await` + silent `catch` pattern [Source: `_bmad-output/planning-artifacts/architecture.md#Communication Patterns`]
- Architecture: storage key `portMappings` exact string — `isEnabled` is a new parallel key [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]
- Architecture: `chrome.storage.sync` for all persisted state [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- Architecture: WCAG 2.1 AA, keyboard navigation, labelled inputs [Source: `_bmad-output/planning-artifacts/architecture.md#Popup Render Paths`]
- Story 3.3: "Story 3.4 will ADD the `isEnabled` check to BOTH `onUpdated` AND `handleStorageChange`" [Source: `_bmad-output/implementation-artifacts/3-3-wire-storage-to-real-time-title-engine.md#What Story 3.4 Will Add`]

## Dev Agent Record

### Agent Model Used

Antigravity (Gemini 2.5 Flash)

### Debug Log References

_None_

### Completion Notes List

✅ Implemented toggle button to pause/resume tab organizer
✅ Added CSS styling for standard and paused states using `[aria-pressed]` 
✅ Wrote failing tests & followed red-green-refactor TDD cycle
✅ Tested guards gracefully skip modification while `isEnabled=false`

### File List

_Files created/modified by dev agent:_

- `popup.html` (modify — add `<button id="toggle-btn">`)
- `popup.css` (modify — add toggle button styles)
- `popup.js` (modify — add `updateToggleUI()`, `initToggle()`; update `init()`)
- `background.js` (modify — add `isEnabled` guard in `onUpdated` and `handleStorageChange`)
- `tests/background.test.js` (modify — add 2 `isEnabled` guard tests)
- `tests/popup.test.js` (modify — add 2 `updateToggleUI` tests)
