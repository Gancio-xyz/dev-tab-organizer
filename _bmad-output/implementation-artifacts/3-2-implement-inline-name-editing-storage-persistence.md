# Story 3.2: Implement Inline Name Editing & Storage Persistence

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a power-user developer managing ports without default names,
I want to edit port name mappings inline in the popup and have them save automatically,
So that my custom names persist across browser restarts without any modal or form friction.

## Acceptance Criteria

1. Given the popup list is rendered, when a user types a custom name in an input field then blurs the field or presses Enter, the custom name is saved to `chrome.storage.sync` as `{ portMappings: { "PORT": "Custom Name" } }` taking precedence over the default port map — without any full `innerHTML` re-render of the list.
2. Given a custom mapping exists, when the user clears the input and saves (blur or Enter), the custom override is deleted from `chrome.storage.sync` — the input remains empty with the default name shown as placeholder (no re-render needed).
3. Keyboard focus is preserved after saving — pressing Enter to save must not move focus to another element unexpectedly.

## Tasks / Subtasks

- [ ] Add `attachEditListeners()` function to `popup.js` (AC: 1, 2, 3)
  - [ ] Called once immediately after `renderTabList()` in `init()` — not called after `renderEmptyState()`
  - [ ] Uses `document.querySelectorAll('.tab-name-input')` to find all rendered inputs
  - [ ] Attach `blur` listener to each input → calls `saveMapping(input)`
  - [ ] Attach `keydown` listener to each input → if `e.key === 'Enter'`: call `saveMapping(input)` then `input.blur()`
- [ ] Implement `saveMapping(input)` async function (AC: 1, 2)
  - [ ] Read `port` from `input.dataset.port`
  - [ ] Read `value` from `input.value.trim()`
  - [ ] Fetch current `portMappings` from `chrome.storage.sync.get('portMappings')`
  - [ ] If `value` is non-empty: `portMappings[port] = value`
  - [ ] If `value` is empty: `delete portMappings[port]` — removes the custom override
  - [ ] Write back: `await chrome.storage.sync.set({ portMappings })`
  - [ ] Wrap entirely in `try/catch` with empty catch — silent fail per NFR9
- [ ] Update `init()` call site to attach listeners after rendering (AC: 1)
  - [ ] In the `tabs.length > 0` branch: `renderTabList(...)` then `attachEditListeners()`
  - [ ] Do NOT call `attachEditListeners()` in the empty state branch (no inputs rendered)
- [ ] Add unit tests in `tests/popup.test.js` (replaces empty placeholder from Story 1.1)
  - [ ] Mock `globalThis.chrome` before imports (same pattern as `tests/background.test.js`)
  - [ ] Test `saveMapping` logic (extract as a pure function or test via integration): non-empty value writes to storage, empty value deletes from storage
  - [ ] Run with `node --test tests/popup.test.js` — zero failures
- [ ] Manual verification (AC: 1, 2, 3)
  - [ ] Open popup with localhost tabs → type a custom name → press Enter → close and reopen popup → custom name persists in input
  - [ ] Clear the custom name → blur field → reopen popup → input is empty, placeholder shows default name
  - [ ] Press Enter to save → cursor stays in the same input (focus not lost to body or another element)
  - [ ] Open `chrome://extensions` → service worker console → no errors during save

## Dev Notes

### What Story 3.1 Established (Do Not Re-Implement)

Story 3.1 rendered the full popup with:
- `renderTabList()` — builds `#tab-list` innerHTML with `.tab-row` divs, each containing a `.tab-name-input` with `data-port` and correct `id`/`aria-label`
- `input.value` = custom override (from `portMappings[port] ?? ''`)
- `input.placeholder` = default name (from `DEFAULT_PORT_MAP[port] ?? 'Port ' + port`)

Story 3.2 adds listeners to the EXISTING DOM nodes rendered by 3.1. Do NOT re-render the list. Do NOT reset `input.value` after saving — the browser already shows what the user typed.

### `popup.js` Changes — Minimal and Surgical

Add two functions and one call site change. Nothing else:

```js
// ADD after renderTabList() definition:

function attachEditListeners() {
  document.querySelectorAll('.tab-name-input').forEach(input => {
    input.addEventListener('blur', () => saveMapping(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();    // prevent form submission if ever inside a form
        saveMapping(input);
        input.blur();
      }
    });
  });
}

async function saveMapping(input) {
  const port = input.dataset.port;
  const value = input.value.trim();
  try {
    const { portMappings = {} } = await chrome.storage.sync.get('portMappings');
    if (value) {
      portMappings[port] = value;
    } else {
      delete portMappings[port];
    }
    await chrome.storage.sync.set({ portMappings });
  } catch (_) {
    // silent — NFR9
  }
}

// MODIFY init() — add attachEditListeners() call:
async function init() {
  try {
    const [tabs, storage] = await Promise.all([...]);
    const portMappings = storage.portMappings ?? {};
    if (tabs.length === 0) {
      renderEmptyState();
      // NOTE: no attachEditListeners() here — no inputs in empty state
    } else {
      renderTabList(tabs, { ...DEFAULT_PORT_MAP, ...portMappings }, portMappings);
      attachEditListeners(); // ← ADD THIS LINE
    }
  } catch (_) {
    renderEmptyState();
  }
}
```

### Why `input.blur()` After Enter (AC: 3)

Pressing Enter calls `saveMapping()` then `input.blur()`. The `blur()` call:
1. Triggers the `blur` event listener which calls `saveMapping()` again — this is a **double-save** but it is harmless (same value written twice to storage)
2. Moves focus away from the input, which is the expected keyboard UX

To avoid the double-save, remove the `blur` listener before calling `input.blur()`, or use a guard flag. For MVP the double-save is acceptable — two identical writes to `chrome.storage.sync` have no visible side effect.

```js
// OPTIONAL — prevents double-save on Enter, slightly more complex:
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    input.removeEventListener('blur', blurHandler); // remove before blur()
    saveMapping(input);
    input.blur();
    input.addEventListener('blur', blurHandler);    // re-attach after
  }
});
```

For MVP: accept the double-save. Only optimize if you observe actual problems.

### Storage Write Pattern — Exact Keys (CRITICAL)

```js
// CORRECT — read current portMappings, mutate, write back
const { portMappings = {} } = await chrome.storage.sync.get('portMappings');
portMappings[port] = value;
await chrome.storage.sync.set({ portMappings });

// WRONG — overwrites the entire storage with just the new entry
await chrome.storage.sync.set({ portMappings: { [port]: value } });

// WRONG — key name variant breaks background.js ↔ popup.js contract
await chrome.storage.sync.set({ port_mappings: ... });
await chrome.storage.sync.set({ portMap: ... });
```

Always read-then-write to preserve all existing port overrides. Never write just the changed entry.

### Removing a Custom Override — `delete` Pattern

```js
// CORRECT — delete removes the key entirely
delete portMappings[port];
await chrome.storage.sync.set({ portMappings });

// WRONG — setting to empty string leaves an empty override that shadows the default
portMappings[port] = '';
await chrome.storage.sync.set({ portMappings });

// WRONG — setting to null same problem
portMappings[port] = null;
```

After deletion, `background.js` reads storage on the next `onUpdated` event and sees no override for that port, so it falls back to `DEFAULT_PORT_MAP[port]` naturally. Story 3.3 handles the immediate title update triggered by this storage change.

### No DOM Updates After Save (Architecture Rule)

After `saveMapping()` completes, do **not** update the DOM:
- `input.value` already reflects what the user typed (browser updates it live)
- `input.placeholder` still shows the default (correct — it's the fallback if input is empty)
- No visual feedback (spinner, checkmark, color flash) is required for MVP

```js
// CORRECT — just write to storage, browser DOM is already up to date
await chrome.storage.sync.set({ portMappings });

// WRONG — unnecessary re-render that breaks focus
document.getElementById('tab-list').innerHTML = rebuildList();

// WRONG — Story 3.2 does NOT update the input value or placeholder
document.querySelector(`[data-port="${port}"] .tab-name-input`).value = value;
```

The architecture explicitly prohibits innerHTML re-renders after initial render, and the input state is already correct after a save.

### Storage Key `portMappings` — Exact String, All Files

| File | Operation | Key |
|---|---|---|
| `popup.js` | Read + Write | `'portMappings'` |
| `background.js` | Read only | `'portMappings'` |

Both files read from the same `chrome.storage.sync` key. Any deviation here causes the background service worker to silently ignore user overrides.

### Testing `saveMapping` — Mock Pattern

`saveMapping` calls `chrome.storage.sync` — mock it the same way as `background.test.js`:

```js
// tests/popup.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Capture writes for assertion
let lastWrite = null;
globalThis.chrome = {
  tabs: { query: async () => [] },
  storage: {
    sync: {
      get: async () => ({ portMappings: { '3001': 'Old Name' } }),
      set: async (data) => { lastWrite = data; }
    }
  }
};

// If saveMapping is exported, test directly
// If not, test by simulating the full popup init flow
```

If `saveMapping` is not exported, extract the core read-mutate-write logic into a pure function for testability — same pure function extraction pattern used in `background.js`:

```js
// Extract as pure (no Chrome API):
export function applyMapping(portMappings, port, value) {
  const updated = { ...portMappings }; // avoid mutating original
  if (value) {
    updated[port] = value;
  } else {
    delete updated[port];
  }
  return updated;
}
```

Then test `applyMapping` cleanly:
```js
test('applyMapping: sets new value', () => {
  const result = applyMapping({}, '3000', 'My App');
  assert.deepEqual(result, { '3000': 'My App' });
});

test('applyMapping: removes empty value', () => {
  const result = applyMapping({ '3000': 'My App' }, '3000', '');
  assert.deepEqual(result, {});
});

test('applyMapping: preserves other ports', () => {
  const result = applyMapping({ '3000': 'A', '8080': 'B' }, '3000', 'C');
  assert.deepEqual(result, { '3000': 'C', '8080': 'B' });
});
```

### Previous Story Context (Story 3.1)

Story 3.1 established in `popup.js`:
- `import { DEFAULT_PORT_MAP }` at top
- `renderEmptyState()` — sets `#empty-state` text, hides `#tab-list`
- `renderTabList(tabs, resolved, portMappings)` — sets `#tab-list` innerHTML with `.tab-row` elements
- `init()` — `Promise.all` for tab query + storage read, branches on tabs.length
- `init()` called at module level at bottom of file

This story adds `attachEditListeners()` and `saveMapping()` — no existing code is removed or restructured.

### What Story 3.3 Handles (Not This Story)

Story 3.3 wires the background service worker to pick up storage changes and immediately update the actual Chrome tab title. That's a separate concern. Story 3.2 only persists to storage — the tab title update happens automatically via `chrome.storage.onChanged` or on next `onUpdated` event in `background.js` (Story 3.3 decides which).

### References

- Architecture: popup lifecycle step 7 — "On edit commit (blur / Enter): chrome.storage.sync.set" [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture (Popup)`]
- Architecture: in-place DOM mutation rule — prohibited innerHTML after initial render [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture: storage key `portMappings` exact string [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]
- Architecture: `async/await` + silent `catch` pattern [Source: `_bmad-output/planning-artifacts/architecture.md#Communication Patterns`]
- Architecture: port numbers as strings [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`]
- Architecture: resolved name lookup with `??` [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`]
- Epics: Story 3.2 ACs — blur/Enter save, remove override, focus preservation [Source: `_bmad-output/planning-artifacts/epics.md#Story 3.2`]
- PRD FRs covered: FR11 (define custom name for any port), FR12 (remove custom mapping, revert to default), FR17 (edit name in popup), FR20 (persist across restarts), FR21 (sync across devices), FR22 (no account required) [Source: `_bmad-output/planning-artifacts/epics.md#Epic 3 FR Coverage Map`]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_None yet_

### Completion Notes List

_To be filled by dev agent after implementation_

### File List

_Files created/modified by dev agent:_

- `popup.js` (modify — add `attachEditListeners()`, `saveMapping()`, optional `applyMapping()` export; update `init()` call site)
- `tests/popup.test.js` (modify — replace empty placeholder with unit tests for `applyMapping`)
