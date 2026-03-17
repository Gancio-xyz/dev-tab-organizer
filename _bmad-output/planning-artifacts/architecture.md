---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md']
workflowType: 'architecture'
project_name: 'dev-tab-organizer'
user_name: 'Alessandro.farandagancio'
date: '2026-03-12'
lastStep: 8
status: 'complete'
completedAt: '2026-03-12'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (26 total):**
The system divides cleanly into four capability clusters: (1) tab detection via `chrome.tabs.onUpdated` events, (2) title rewriting via `chrome.scripting.executeScript`, (3) port mapping configuration with user-defined overrides, and (4) a popup UI for editing mappings. FR3 (detect already-open tabs on install) and FR8 (re-apply prefix after SPA title mutations) are the two FRs most likely to introduce subtle bugs — both require careful event handling design.

**Non-Functional Requirements:**
- NFR1–4 (Performance): Sub-100ms title rewriting, sub-200ms popup render. Achievable trivially with vanilla JS and no framework overhead.
- NFR5–8 (Security): Minimal permissions (`tabs`, `scripting`, `storage`, scoped host permissions). No network calls. Privacy policy required for Web Store.
- NFR9–11 (Reliability): Silent failure on tab-close race conditions. Full title restoration on uninstall. Stable MV3 API dependency only.
- NFR12–14 (Accessibility): Keyboard-navigable popup, WCAG 2.1 AA contrast, labelled inputs.
- NFR15–17 (Maintainability): <50KB bundle, core logic <100 lines, no dependencies.

**Scale & Complexity:**
- Primary domain: Chrome Extension (MV3)
- Complexity level: Low — constrained surface area, no backend, no auth, no multi-user state
- Estimated architectural components: 4 discrete modules

### Technical Constraints & Dependencies

- **Runtime:** Chrome MV3 service worker (background) + popup page (foreground). Two isolated JS execution contexts.
- **No build tooling required:** Vanilla JS, no transpilation, no bundler. Direct file structure deployable as-is.
- **API surface:** `chrome.tabs`, `chrome.scripting`, `chrome.storage.sync` — all stable MV3 APIs available since Chrome 88.
- **Content script approach explicitly rejected** (PRD): Unreliable for SPA `document.title` mutations. Architecture must not use content scripts for title rewriting.
- **Bundle size ceiling:** 50KB unzipped (NFR15). No external libraries.

### Cross-Cutting Concerns Identified

- **Race condition on tab close:** `executeScript` called after `onUpdated` fires but before tab exists. Must be guarded in every call site.
- **SPA title churn:** `onUpdated` fires on every title change. Background worker must detect whether the current title already has the port prefix before re-injecting to avoid infinite loop or double-prefix.
- **Storage sync latency:** `chrome.storage.sync` reads are async. Popup and background worker both read from the same store — reads must be awaited, never assumed synchronous.
- **Port map precedence:** Custom user mappings override defaults. Merge logic must be consistent between the popup display and the background title-rewriting path.

## Starter Template Evaluation

### Primary Technology Domain

Chrome Extension (MV3) — browser-native, no web framework applicable.

### Starter Options Considered

| Option | Status | Reason |
|---|---|---|
| `crxjs` (Vite-based) | Rejected | Adds build pipeline — violates PRD no-build constraint |
| `plasmo` framework | Rejected | Framework abstraction layer — violates maintainability NFRs |
| `chrome-extension-boilerplate-react` | Rejected | React + Webpack — excess weight, violates NFR15 (<50KB) |
| Manual MV3 scaffold | **Selected** | Matches all PRD constraints exactly |

### Selected Starter: Manual MV3 Vanilla JS Scaffold

**Rationale:** The PRD constrains this project to vanilla JS with no build step and no dependencies. No existing CLI starter satisfies these constraints without modification. The project is small enough (5 files) that a manual scaffold is the correct foundation.

**Initialization:** Create files manually (first implementation story).

**Architectural Decisions Established by Scaffold:**

**Language & Runtime:**
Vanilla ES2020+ JavaScript. No TypeScript, no transpilation. Direct Chrome API consumption.

**Project Structure:**
```
dev-tab-organizer/
├── manifest.json       ← MV3 manifest, permissions, service worker registration
├── background.js       ← Service worker: tabs.onUpdated listener + scripting injection
├── port-map.js         ← Standalone default port→name config object (community-editable)
├── popup.html          ← Popup UI markup
└── popup.js            ← Popup logic: storage.sync read/write, tab list rendering
```

**Build Tooling:** None. Extension loaded directly from source directory via `chrome://extensions` (dev) or zipped for Web Store submission.

**Testing:** Manual testing only for MVP. No testing framework in bundle.

**Development Experience:** Load unpacked via Chrome DevTools. Service worker logs visible in `chrome://extensions` → service worker → inspect.

**Note:** Project initialization (creating these 5 files with correct MV3 structure) should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Storage schema: flat `portMappings` object in `chrome.storage.sync`
- Inter-context communication: live tab query in popup + storage for config only
- Popup rendering: targeted DOM node updates (not full innerHTML re-render) for accessibility focus preservation
- `port-map.js` module format: ES module with `"type": "module"` in manifest service worker declaration

**Important Decisions (Shape Architecture):**
- Title prefix guard: detect existing prefix before re-injecting (prevents double-prefix on SPA route changes)
- Port map merge strategy: spread defaults, override with user mappings at read time
- Port number as storage key: deliberate product decision (not URL pattern / regex) — preserves zero-config simplicity and is the core competitive differentiator vs. Tab Modifier
- Popup empty state: distinct render path from populated list (not an empty list render)

**In Scope for MVP:**
- CI/CD: GitHub Actions workflow for auto-zip + auto-publish to Chrome Web Store on tag push

### Data Architecture

Single storage namespace in `chrome.storage.sync`:

```js
// Complete storage schema
{
  portMappings: {
    // User-defined overrides only — defaults are never written to storage
    "3001": "Auth Service",
    "3002": "Payments API"
  }
}
```

**Port map resolution at runtime** (both in `background.js` and `popup.js`):
```js
const resolved = { ...DEFAULT_PORT_MAP, ...userMappings };
```
Defaults live in `port-map.js` (never written to storage). User overrides live in storage. Merge happens at read time in both contexts.

**Port number as key is a deliberate product decision:** Using port number (e.g., `"3001"`) rather than URL pattern or regex is the architectural choice that enables zero-config simplicity. It is the direct inverse of Tab Modifier's approach (regex per URL) and is the reason this extension has lower setup friction. Do not introduce pattern matching until there is explicit user demand.

**Storage quota:** `chrome.storage.sync` allows 100KB total / 8KB per key. A `portMappings` object with 100 entries is ~2KB — well within limits.

### Authentication & Security

No authentication layer. Security model enforced entirely via `manifest.json` permission declaration:
- `tabs` — read tab URL and title
- `scripting` — inject title-rewriting script
- `storage` — persist user config
- `host_permissions: ["http://localhost/*", "http://127.0.0.1/*"]` — scoped to localhost only

No network requests anywhere in the codebase. Privacy policy: no data collected or transmitted.

### API & Communication Patterns

**Two isolated JS contexts — communication model:**

| Context | Responsibility | How it reads config |
|---|---|---|
| `background.js` (service worker) | Listens for tab events, injects title rewrites | `chrome.storage.sync.get('portMappings')` on each relevant `onUpdated` event |
| `popup.js` (popup page) | Renders active localhost tabs, edits mappings | `chrome.tabs.query()` for live tab list; `chrome.storage.sync.get/set` for mappings |

**No message passing required for MVP.** Both contexts read from storage independently. If a user edits a mapping in the popup, the background picks it up on the next `onUpdated` event naturally.

**SPA double-prefix guard (critical):**
```js
// In background.js before injecting — check if prefix already present
if (!tab.title.startsWith('⚡')) {
  chrome.scripting.executeScript(...)
}
```

### Frontend Architecture (Popup)

Vanilla JS with targeted DOM node updates. **Full innerHTML re-renders are prohibited** — they destroy DOM focus context and break keyboard navigation (NFR12).

**Popup render strategy:**
- Initial render: build DOM structure once on popup open
- Updates on edit: mutate individual DOM nodes in place via `querySelector`, do not re-render the list

**Popup render paths (two distinct states):**

1. **Empty state** (no localhost tabs open): Render informational message — *"No localhost tabs open yet — start a local server and I’ll label it automatically."* Not a blank div.
2. **Populated state**: Render list of active localhost tabs with editable name fields.

**Popup lifecycle:**
1. `popup.js` runs on popup open
2. `chrome.tabs.query({ url: ['*://localhost/*', '*://127.0.0.1/*'] })` — get active localhost tabs
3. `chrome.storage.sync.get('portMappings')` — get user config
4. Resolve display names: `{ ...DEFAULT_PORT_MAP, ...portMappings }`
5. Branch: empty state render OR tab list render
6. Attach `input` event listeners for inline editing (no re-render on change)
7. On edit commit (blur / Enter): `chrome.storage.sync.set({ portMappings: updated })`

**`port-map.js` module format:**
Must use ES module syntax. The background service worker must be declared with `"type": "module"` in `manifest.json` to support `import` statements. Plain `importScripts()` is the MV3 legacy pattern and should not be used.

```json
// manifest.json
"background": {
  "service_worker": "background.js",
  "type": "module"
}
```

```js
// port-map.js
export const DEFAULT_PORT_MAP = {
  "3000": "React",
  "5173": "Vite",
  // ...
};
```

### Infrastructure & Deployment

| Phase | Approach |
|---|---|
| Development | `chrome://extensions` → Load unpacked from source directory |
| Release | GitHub Actions: on tag push → auto-zip + auto-publish to Chrome Web Store via CWS Publish API |
| Source | GitHub repository, MIT license, tagged releases |
| CI/CD | **In scope for MVP** — GitHub Actions workflow (~30 lines YAML) + one-time CWS API credentials setup |

**GitHub Actions release workflow (MVP):**
- Trigger: `push` to tag matching `v*.*.*`
- Steps: zip extension directory → upload to Chrome Web Store via `trunow/chrome-webstore-upload-action` or equivalent → publish
- Secrets required: `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` (one-time OAuth setup via Google API Console)

### Decision Impact Analysis

**Implementation Sequence:**
1. `manifest.json` — MV3 scaffold, `"type": "module"` for service worker, correct permissions
2. `port-map.js` — ES module default port config
3. `background.js` — `onUpdated` listener + `executeScript` + double-prefix guard + ES module import
4. `popup.html` — accessible shell with labelled inputs
5. `popup.js` — tab query + storage read + two render paths + in-place DOM updates + storage write
6. GitHub Actions workflow — auto-zip + CWS publish on tag
7. Chrome Web Store listing + privacy policy

**Cross-Component Dependencies:**
- `port-map.js` ES module format must be confirmed before `background.js` or `popup.js` implement their import
- Storage schema must be agreed before implementing either `background.js` or `popup.js`
- Double-prefix guard in `background.js` depends on exact title prefix format (must match what popup displays)
- Popup empty state render path must be implemented before accessibility testing (NFR12–14)

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

6 areas where AI agents could make incompatible choices without explicit rules.

### Naming Patterns

**Storage Keys (exact strings — must match across all files):**
```js
// ONLY this key is ever written to chrome.storage.sync
'portMappings'   // { "3001": "Auth Service" } — user overrides only
```
Never use: `port_mappings`, `portMap`, `mappings`, or any variant.

**Title Prefix Format (exact string — must match guard check):**
```
⚡ {PORT} — {NAME}    // e.g., "⚡ 3001 — Auth Service"
⚡ {PORT}              // e.g., "⚡ 3000" (when no name is set)
```
The double-prefix guard checks `tab.title.startsWith('⚡')`. Any deviation in prefix character or format breaks the guard.

**Port Map Export (exact pattern in `port-map.js`):**
```js
export const DEFAULT_PORT_MAP = { ... };
// NOT: export default { ... }
// NOT: const DEFAULT_PORT_MAP = { ... }; (no export)
// NOT: window.DEFAULT_PORT_MAP = { ... };
```

**DOM element IDs (popup.html / popup.js must agree):**
```
#tab-list          — container for all tab rows
#empty-state       — empty state message element
.tab-row           — individual tab row
.tab-name-input    — the editable name field within a row
[data-port]        — attribute on each row storing the port number
```

### Structure Patterns

**File responsibilities (strict — no logic bleeding between files):**

| File | Owns | Must NOT contain |
|---|---|---|
| `manifest.json` | Permissions, entry points | Any logic |
| `port-map.js` | Default port→name map only | Any Chrome API calls |
| `background.js` | `onUpdated` listener, `executeScript` call | Any DOM manipulation |
| `popup.html` | Markup shell, accessibility labels | Any inline scripts |
| `popup.js` | Popup render, storage read/write | Any `chrome.tabs.onUpdated` listener |

**`port-map.js` must be side-effect free** — exports one constant, nothing else. Cannot call any Chrome API.

### Format Patterns

**Port numbers are always strings (not integers):**
```js
// CORRECT
portMappings["3001"] = "Auth Service";

// WRONG
portMappings[3001] = "Auth Service";
```
Chrome storage serializes to JSON; URL parsing produces strings; keep types consistent throughout.

**Resolved name lookup (canonical pattern):**
```js
const resolvedName = (userMappings[port] ?? DEFAULT_PORT_MAP[port]) ?? `⚡ ${port}`;
```
Use `??` (nullish coalescing), not `||`, to allow empty string overrides.

### Communication Patterns

**Chrome API async pattern — always `async/await` with try/catch:**
```js
// CORRECT
async function rewriteTitle(tabId, port) {
  try {
    const { portMappings = {} } = await chrome.storage.sync.get('portMappings');
    // ...
  } catch (err) {
    // silent fail per NFR9 — no console.error, no rethrow
  }
}

// WRONG — callbacks
chrome.storage.sync.get('portMappings', (result) => { ... });

// WRONG — unhandled promise
chrome.storage.sync.get('portMappings').then(...);
```

**Silent failure is the rule (NFR9):** `catch` blocks must not `console.error`, not rethrow, not show UI errors. Exception: `popup.js` may show an inline error state if storage read fails.

### Process Patterns

**Popup rendering — two mandatory render paths:**
```js
function render(tabs, portMappings) {
  if (tabs.length === 0) {
    renderEmptyState();   // distinct function — never skip
  } else {
    renderTabList(tabs, portMappings);
  }
}
```
Empty state message: *"No localhost tabs open yet — start a local server and I’ll label it automatically."*

**DOM updates — in-place mutation only after initial render:**
```js
// CORRECT — update existing node
document.querySelector(`[data-port="${port}"] .tab-name-input`).value = newName;

// WRONG — destroys focus context
document.getElementById('tab-list').innerHTML = buildListHTML(tabs);
```
Initial render (on popup open) may use innerHTML. All subsequent updates must target specific nodes.

**`chrome.tabs.query` filter (canonical pattern):**
```js
const tabs = await chrome.tabs.query({
  url: ['*://localhost/*', '*://127.0.0.1/*']
});
```
Always query both `localhost` and `127.0.0.1`. Never query all tabs and filter in JS.

## Project Structure & Boundaries

### Requirements → Components Mapping

| FR Group | FRs | Lives In |
|---|---|---|
| Tab title rewriting (detect, guard, inject) | FR1–FR6 | `background.js` |
| Default port→name map | FR7–FR10 | `port-map.js` |
| Custom name management (read/write) | FR11–FR16 | `popup.js` + `popup.html` |
| Storage & persistence | FR17–FR20 | `chrome.storage.sync` (via `background.js` read, `popup.js` read+write) |
| Popup UI (list, input, empty state) | FR21–FR24 | `popup.html` + `popup.js` |
| CI/CD & distribution | FR25–FR26 | `.github/workflows/publish.yml` |

### Complete Project Directory Structure

```
dev-tab-organizer/
├── .github/
│   └── workflows/
│       └── publish.yml          # Tag-triggered: zip extension → Chrome Web Store Publish API
├── extension/                   # Canonical runtime extension bundle
│   ├── icons/
│   │   ├── icon-16.png          # Toolbar icon (16×16)
│   │   ├── icon-48.png          # Extensions page icon (48×48)
│   │   └── icon-128.png         # Chrome Web Store listing icon (128×128)
│   ├── manifest.json            # MV3 manifest — permissions, service worker, popup, icons
│   ├── background.js            # Service worker — chrome.tabs.onUpdated listener + executeScript
│   ├── port-map.js              # ES module — exports DEFAULT_PORT_MAP (port strings → names)
│   ├── popup.html               # Popup skeleton — #tab-list, #empty-state, .tab-row structure
│   └── popup.js                 # Popup logic — storage read/write, in-place DOM mutations
├── tests/
│   ├── background.test.js       # Unit: title injection logic, guard check, port resolution
│   ├── port-map.test.js         # Unit: DEFAULT_PORT_MAP exports, port-as-string keys
│   └── popup.test.js            # Unit: render paths (active tabs vs. empty state), DOM updates
├── .gitignore
├── CONTRIBUTING.md              # How to add default port mappings, submit PRs
├── LICENSE                      # MIT
└── README.md                    # Install, usage, custom port names, contribute
```

### Architectural Boundaries

**Chrome API Boundaries**

| Caller | API | Direction | Purpose |
|---|---|---|---|
| `background.js` | `chrome.tabs.onUpdated` | Inbound event | Detect localhost tab title changes |
| `background.js` | `chrome.scripting.executeScript` | Outbound | Inject `document.title` into tab |
| `background.js` | `chrome.storage.sync` | Read only | Load user overrides at title-rewrite time |
| `popup.js` | `chrome.storage.sync` | Read + Write | Display existing overrides, save new ones |
| `popup.js` | `chrome.tabs.query` | Read only | Enumerate active localhost tabs for list |
| `publish.yml` | Chrome Web Store Publish API | Outbound (CI) | Upload zipped artifact on tag push |

**Component Boundaries**

```
port-map.js  ──(ES import)──▶  background.js  ──(executeScript)──▶  [tab DOM]
                                     │
                              chrome.storage.sync (read)

port-map.js  ──(ES import)──▶  popup.js  ◀──▶  chrome.storage.sync (r/w)
                                     │
                               chrome.tabs.query ──▶  [active tabs]
```

- `background.js` and `popup.js` are **never directly coupled** — they share state only through `chrome.storage.sync`
- `port-map.js` is a **pure config module** — imported by both; never writes to storage

**Data Boundaries**

| Data Store | Holds | Never Holds |
|---|---|---|
| `chrome.storage.sync` | User overrides only: `{ portMappings: { "3001": "Auth Service" } }` | Defaults, UI state |
| `port-map.js` | Compiled-in defaults (ES `const`) | Anything dynamic |
| Runtime merge | `DEFAULT_PORT_MAP` + `portMappings` → final name | Never persisted as merged |

### Integration Points

**Internal Communication**

- `background.js` imports `port-map.js` once at service worker startup → `DEFAULT_PORT_MAP` cached in module scope
- `popup.js` imports `port-map.js` → uses `DEFAULT_PORT_MAP` to build full port list (defaults + overrides merged for display)
- `background.js` reads `portMappings` from `chrome.storage.sync` on every `onUpdated` event
- `popup.js` reads `portMappings` on popup open; writes on input change (debounced)

**Data Flow — Title Rewriting Path**

```
localhost:PORT/* navigated
        ↓
chrome.tabs.onUpdated { changeInfo.title }
        ↓
background.js: tab.title.startsWith('⚡')? → skip (guard)
        ↓ (no guard match)
load DEFAULT_PORT_MAP + read chrome.storage.sync portMappings
        ↓
resolve: override → default → port-only
        ↓
executeScript → document.title = '⚡ PORT — NAME'
```

**Data Flow — Popup Path**

```
User clicks extension icon
        ↓
popup.html loads → popup.js init()
        ↓
chrome.tabs.query { active localhost tabs } + chrome.storage.sync.get portMappings
        ↓
if tabs found: render #tab-list rows (in-place update, data-port attribute per row)
if no tabs:    show #empty-state
        ↓
User edits .tab-name-input
        ↓
in-place DOM update → chrome.storage.sync.set { portMappings: { ...existing, [port]: value } }
```

**External Integration — CI/CD**

`.github/workflows/publish.yml`: on `push` to tag `v*.*.*` → zip (excludes `tests/`, `.github/`, `*.md`, `.gitignore`) → POST to Chrome Web Store Publish API with `${{ secrets.CWS_CLIENT_ID }}`, `${{ secrets.CWS_CLIENT_SECRET }}`, `${{ secrets.CWS_REFRESH_TOKEN }}`

### File Organization Patterns

**Configuration files:** All at project root (`manifest.json`, `.gitignore`) — no nesting needed for a 5-file extension.

**Source code:** All source files at project root. Chrome's `manifest.json` references files by path; flat structure avoids path configuration overhead.

**Tests:** Isolated in `tests/` directory. Excluded from CWS zip artifact. Run with Node.js built-in test runner — zero npm dependencies required.

**Icons:** In `icons/` subdirectory. Included in CWS zip. Referenced from `manifest.json` by relative path.

**CI/CD:** In `.github/workflows/`. Excluded from CWS zip.

**Assets excluded from CWS zip:** `tests/`, `.github/`, `*.md`, `.gitignore`

### Development Workflow Integration

**Development:** No build step. Load project root via `chrome://extensions → Load Unpacked`. Edit → reload extension → verify.

**Testing:** `node --test tests/*.test.js` — no test framework, no npm install required.

**Release:** `git tag v1.0.0 && git push --tags` → GitHub Actions zips and publishes to Chrome Web Store automatically.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices are mutually reinforcing. MV3 + vanilla JS + no build step is idiomatic — Chrome does not require a build pipeline. ES modules + `"type": "module"` in manifest is explicitly documented. `chrome.tabs.onUpdated` + `executeScript` is the only correct MV3 pattern for SPA reliability; content script approach explicitly rejected. `async/await` + ES2020+ target fully aligned. `??` nullish coalescing + port-as-string type consistency maintained throughout storage schema and runtime. GitHub Actions CI/CD + Chrome Web Store Publish API contains no conflicts with any other decision.

**Pattern Consistency:** Storage key `portMappings`, port-as-string rule, `??` operator, title prefix `⚡`, double-prefix guard, DOM IDs, `async/await` + silent catch, and `chrome.tabs.query` filter are each defined in one place with code examples. No contradictory patterns found.

**Structure Alignment:** Flat root structure matches Chrome manifest path expectations. `tests/` correctly isolated and excluded from CWS zip. `icons/` follows required three-size convention.

### Requirements Coverage Validation ✅

**Functional Requirements (26/26 covered)**

| Cluster | FRs | Coverage |
|---|---|---|
| Tab detection & title rewriting | FR1–FR6 | `background.js` — `onUpdated`, guard, `executeScript` |
| Default port map | FR7–FR10 | `port-map.js` — ES module `DEFAULT_PORT_MAP` |
| Custom name management | FR11–FR16 | `popup.js` storage read/write, `popup.html` form inputs |
| Storage & persistence | FR17–FR20 | `chrome.storage.sync` — `{ portMappings: {} }` |
| Popup UI rendering | FR21–FR24 | Two render paths: `#tab-list` + `#empty-state`; in-place update |
| Distribution | FR25–FR26 | `publish.yml` — tag-triggered zip + CWS Publish API |

**Non-Functional Requirements (17/17 covered)**

| NFR Group | Coverage |
|---|---|
| NFR1–4 Performance | Vanilla JS + no framework — sub-100ms rewrite and sub-200ms popup render trivially achievable |
| NFR5–8 Security | `tabs`, `scripting`, `storage` permissions only; host-scoped; no external calls |
| NFR9–11 Reliability | Guard pattern prevents loops; `try/catch` silent failure documented |
| NFR12–14 Accessibility | Concrete HTML structure specified (see Gap 1 below); natural DOM focus order |
| NFR15–17 Maintainability | 5 source files, no dependencies, flat structure, core logic <100 lines |

### Implementation Readiness Validation ✅

All critical decisions documented with rationale and explicit rejection of alternatives. 13-file project tree fully specified with purpose comments. Naming conventions, storage access, DOM mutation, async/await, error handling, title format, and query patterns defined with code examples. Pure function extraction pattern specified for testability.

### Gap Analysis & Resolutions

**Gap 1 — Popup HTML Accessibility Markup (Important, Resolved)**

NFR12–14 specify WCAG 2.1 AA, keyboard navigation, and labelled inputs. The concrete HTML structure for each port row is:

```html
<div class="tab-row" data-port="3001">
  <label for="input-3001">Port 3001</label>
  <input id="input-3001"
         class="tab-name-input"
         data-port="3001"
         type="text"
         placeholder="e.g. Auth Service"
         aria-label="Custom name for port 3001">
</div>
```

Rules:
- `for` attribute on `<label>` must match `id` on `<input>` using pattern `input-{PORT}`
- `aria-label` on input must include port number for screen reader context
- Natural DOM order defines tab focus sequence — no `tabindex` manipulation
- Empty state element must contain visible text (not icon-only)

**Gap 2 — CI/CD Workflow Specification (Important, Resolved)**

Complete `publish.yml` content:

```yaml
name: Publish to Chrome Web Store
on:
  push:
    tags: ['v*.*.*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Zip extension
        run: zip -r extension.zip . -x "tests/*" ".github/*" "*.md" ".gitignore"
      - name: Publish to CWS
        uses: mnao305/chrome-extension-upload@v5.0.0
        with:
          file-path: extension.zip
          extension-id: ${{ secrets.CWS_EXTENSION_ID }}
          client-id: ${{ secrets.CWS_CLIENT_ID }}
          client-secret: ${{ secrets.CWS_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CWS_REFRESH_TOKEN }}
```

Required GitHub secrets: `CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`.

**Gap 3 — Testability Without a Chrome Runtime (Important, Resolved)**

`background.js` logic must be extracted as three pure, module-level functions testable with the Node.js built-in test runner:

```js
// Pure functions — no Chrome API dependency
function extractPort(url) { ... }                                    // URL → port string | null
function resolvePortName(port, userMappings, defaultMap) { ... }     // → string
function buildTitle(port, name) { ... }                              // → '⚡ PORT — NAME' | '⚡ PORT'
```

Chrome wiring in `background.js` becomes thin glue (<15 lines): load data → call pure function → call API.

Test files mock `chrome` at module scope:

```js
// tests/background.test.js — top of file
globalThis.chrome = {
  tabs: { onUpdated: { addListener: () => {} } },
  scripting: { executeScript: async () => {} },
  storage: { sync: { get: async () => ({}), set: async () => {} } }
};
import { extractPort, resolvePortName, buildTitle } from '../background.js';
```

This pattern documents the exact Chrome API surface the code depends on. Any future API change surfaces as a required test change.

**Gap 4 — Icon Placeholders (Minor, Resolved)**

Solid-color PNG placeholders at 16×16, 48×48, and 128×128 satisfy both the `manifest.json` requirement for unpacked loading and Chrome Web Store submission validation. No production-quality icons required to begin implementation.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with rationale and rejected alternatives
- [x] Technology stack fully specified (MV3, vanilla ES2020+, no build)
- [x] Storage schema defined (`portMappings`, port-as-string keys)
- [x] Inter-context communication pattern defined (storage-only coupling)
- [x] CI/CD pipeline fully specified (publish.yml, secrets, zip exclusions)

**✅ Implementation Patterns**
- [x] Naming conventions established (storage keys, DOM IDs, CSS classes)
- [x] Async/await + silent failure pattern specified with examples
- [x] Two popup render paths documented
- [x] In-place DOM mutation pattern specified
- [x] Port-as-string consistency rule documented
- [x] Pure function extraction pattern for testability

**✅ Project Structure**
- [x] Complete 13-file directory tree defined
- [x] Component boundaries established
- [x] Chrome API boundary table complete
- [x] Requirements to structure mapping complete
- [x] CWS zip artifact exclusion list defined

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High** — All 26 FRs and 17 NFRs have direct architectural support. All gaps identified during validation have been resolved. No blocking decisions remain undocumented.

**Key Strengths:**
- Minimal surface area — 5 source files, zero dependencies, no build step
- All architectural decisions lock out the most common MV3 implementation mistakes (content script, `importScripts`, unhandled async, full innerHTML re-renders)
- Testability pattern (pure functions + `globalThis.chrome` mock) enables `node --test` with zero tooling

**Areas for Future Enhancement (Post-MVP):**
- Dark mode popup theming
- Bulk import/export of port mappings (Phase 2 per PRD)
- Firefox/Safari extension port (Phase 3 per PRD)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented — rejected alternatives are documented for a reason
- Use implementation patterns (Section 4) as the source of truth for code style
- Respect component boundaries — `background.js` and `popup.js` never communicate directly
- Refer to this document for all architectural questions before making new decisions

**Implementation Sequence:**
1. `manifest.json` — permissions, service worker, popup declaration, icons
2. `port-map.js` — ES module `DEFAULT_PORT_MAP` with ~20 common dev ports
3. `background.js` — pure functions first (`extractPort`, `resolvePortName`, `buildTitle`), then Chrome API glue
4. `popup.html` — structural skeleton with all required IDs and ARIA attributes
5. `popup.js` — two render paths, in-place DOM mutation, storage read/write
6. `tests/` — unit tests for pure functions using `globalThis.chrome` mock pattern
7. `.github/workflows/publish.yml` — tag-triggered CI/CD
