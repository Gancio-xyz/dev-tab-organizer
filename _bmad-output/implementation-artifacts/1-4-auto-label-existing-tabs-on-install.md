# Story 1.4: Auto-Label Existing Tabs on Install

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer who discovers this extension mid-workday with 10 localhost tabs already open,
I want all my currently open localhost tabs to be labeled immediately when I install the extension,
So that I get the full value instantly without refreshing my entire environment.

## Acceptance Criteria

1. When the extension is installed or reloaded, all currently open `localhost:*` and `127.0.0.1:*` tabs are labeled with `⚡ {PORT} — {ORIGINAL_PAGE_TITLE}` without requiring any page refresh.
2. Tabs that are not localhost URLs are unaffected.
3. Tabs that are already labeled (title starts with `⚡`) are not double-prefixed — this handles extension reloads during development where tabs were already labeled in a prior session.
4. The labeling completes silently — no errors thrown, no UI feedback, even if some tabs close between query and injection (race condition).

## Tasks / Subtasks

- [ ] Add `chrome.runtime.onInstalled` listener in `background.js` (AC: 1, 2, 3, 4)
  - [ ] Register listener at module level alongside the existing `onUpdated` listener
  - [ ] On install: query ALL open localhost tabs using `chrome.tabs.query({ url: ['*://localhost/*', '*://127.0.0.1/*'] })`
  - [ ] Iterate results and for each tab:
    - [ ] Check `tab.title` — if already starts with `⚡`, skip (AC: 3)
    - [ ] Call `extractPort(tab.url)` — if null, skip
    - [ ] Call `chrome.scripting.executeScript` with the same inline strip + prefix logic from Stories 1.2/1.3
  - [ ] Entire handler wrapped in `async/await` + `try/catch` — empty catch (AC: 4)
- [ ] Manual verification
  - [ ] Load extension unpacked with multiple localhost tabs already open → confirm all are labeled instantly
  - [ ] Reload extension from `chrome://extensions` with labeled tabs open → confirm no double-prefix (AC: 3)
  - [ ] Open a non-localhost tab while extension loads → confirm it is untouched (AC: 2)
  - [ ] Check service worker console — no errors

## Dev Notes

### What Already Exists (Do NOT Re-Implement)

From Stories 1.1–1.3, `background.js` already has:
- `extractPort(url)` — exported pure function (returns port string or null)
- `buildTitle(port, pageTitle)` — exported pure function (returns `⚡ PORT — TITLE` or `⚡ PORT`)
- `stripPrefix(title)` — exported pure function (strips `⚡ PORT — ` if present)
- `chrome.tabs.onUpdated` listener — handles new navigations
- All wrapped in `async/await` + silent `catch`

This story adds ONE new listener: `chrome.runtime.onInstalled`. The `executeScript` injection function body is **identical** to what Story 1.3 established — copy it exactly, do not rewrite.

### `onInstalled` Listener — Complete Implementation

```js
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
            const bare = raw.startsWith('⚡')
              ? raw.replace(/^⚡\s+\d+\s+—\s+/, '')
              : raw;
            document.title = bare ? `⚡ ${port} — ${bare}` : `⚡ ${port}`;
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
```

**Critical details:**
- Inner `try/catch` per tab — one tab closing must not abort labeling of the remaining tabs
- Outer `try/catch` — the query itself may fail if permissions are denied
- `tab.title.startsWith('⚡')` guard on entry — skip already-labeled tabs (extension reload case)
- `!tab.title` guard — skip tabs with no title yet (just opened, not loaded)
- The `func` body is the same inline strip + prefix logic as Story 1.3 — do not simplify it

### Why `onInstalled` and Not `onStartup`

| Event | Fires when |
|---|---|
| `chrome.runtime.onInstalled` | Extension first installed, updated, or reloaded via DevTools |
| `chrome.runtime.onStartup` | Browser launches with extension already installed |

**Use `onInstalled`.** It fires on the scenarios that matter here: fresh install (user just added the extension mid-workday) and developer reload (reloading unpacked extension after editing). `onStartup` would also be useful for the browser-restart case, but that is out of scope for MVP — when the browser restarts, existing tabs reload naturally and `onUpdated` handles them.

### `onInstalled` `reason` Parameter — Not Used Here

`onInstalled` passes `{ reason }` which can be `'install'`, `'update'`, or `'chrome_update'`. **Do not filter by reason.** We want to run the backfill on both fresh installs AND extension updates/reloads — a new version might introduce new port mappings and the user benefits from immediate relabeling.

```js
// CORRECT — runs on any install/update/reload
chrome.runtime.onInstalled.addListener(async () => { ... });

// WRONG — skips relabeling on extension reload, which breaks dev workflow
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== 'install') return; // ← do NOT do this
});
```

### `chrome.tabs.query` URL Filter — Match Pattern Format

The query uses **match patterns**, not plain URLs. The format must be `*://localhost/*` (scheme wildcard + exact hostname + path wildcard):

```js
// CORRECT — match pattern syntax
chrome.tabs.query({ url: ['*://localhost/*', '*://127.0.0.1/*'] })

// WRONG — not a valid match pattern
chrome.tabs.query({ url: ['localhost:*', 'http://localhost/'] })
```

This is the same canonical pattern defined in the architecture and used in `popup.js` (Story 3.x). Always use both `localhost` and `127.0.0.1` variants.

### Tab Order — Process All, Fail Individual Silently

Use a `for...of` loop (not `Promise.all`) so that a failure on one tab does not abort the rest. The inner `try/catch` ensures a tab that closes mid-loop is handled silently:

```js
// CORRECT — sequential, each tab isolated
for (const tab of tabs) {
  try { ... } catch (_) {}
}

// ACCEPTABLE for performance but loses per-tab error isolation
await Promise.all(tabs.map(tab => { ... }));

// WRONG — first failure aborts all remaining tabs
for (const tab of tabs) {
  await chrome.scripting.executeScript({ ... }); // no try/catch
}
```

For MVP with a typical developer (< 30 localhost tabs), sequential processing is fast enough (sub-second). `Promise.all` is a premature optimization.

### Architecture Placement in `background.js`

Listener registration order in `background.js` (module-level, after pure function declarations):

```js
// 1. Pure functions (exported)
export function extractPort(url) { ... }
export function buildTitle(port, pageTitle) { ... }
export function stripPrefix(title) { ... }

// 2. onInstalled — runs once at install/reload (THIS STORY)
chrome.runtime.onInstalled.addListener(async () => { ... });

// 3. onUpdated — runs on every title change (Stories 1.2 + 1.3)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => { ... });
```

Order matters: place `onInstalled` before `onUpdated` so both register during service worker startup. If the service worker is freshly started by the install event itself, `onInstalled` firing triggers the backfill. Both listeners are active for the service worker's lifetime.

### Previous Story Context (Stories 1.1–1.3)

- **1.1:** Scaffold — all files created, extension loads cleanly, `DEFAULT_PORT_MAP` in `port-map.js`
- **1.2:** `extractPort`, `buildTitle`, `onUpdated` listener with title guard
- **1.3:** `stripPrefix`, inline strip logic in `executeScript`, `tests/spa-test.html`
- **Currently:** Story 1.1 is `in-progress` — the scaffold is being implemented now

### No New Tests Needed

The `onInstalled` event requires a live Chrome runtime to fire — it cannot be meaningfully unit tested with `globalThis.chrome` mocks. The existing test suite already covers:
- `extractPort` (Story 1.2 tests)
- `buildTitle` (Story 1.2 tests)
- `stripPrefix` (Story 1.3 tests)

Manual verification (listed in Tasks) is the correct test approach for the `onInstalled` event handler itself. Do not add placeholder tests or TODOs for this — keep the test suite clean and only include what can actually run.

### References

- Architecture: `chrome.tabs.query` canonical filter pattern [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture: silent failure (`try/catch` empty catch) per NFR9 [Source: `_bmad-output/planning-artifacts/architecture.md#Communication Patterns`]
- Architecture: `executeScript` args pattern (no closure capture) [Source: `_bmad-output/planning-artifacts/architecture.md#Gap Analysis & Resolutions` — Gap 3]
- Architecture: data flow — title rewriting path (applies identically on install) [Source: `_bmad-output/planning-artifacts/architecture.md#Integration Points`]
- Epics: Story 1.4 ACs, E-FR1 (auto-detect already-open localhost tabs on install) [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.4`]
- PRD FRs covered: FR3 (detect already-open localhost tabs at install/enable) [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1 FR Coverage Map`]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_None yet_

### Completion Notes List

_To be filled by dev agent after implementation_

### File List

_Files created/modified by dev agent:_

- `background.js` (modify — add `chrome.runtime.onInstalled` listener)
