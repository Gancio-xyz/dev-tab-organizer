---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
completedAt: '2026-03-12'
inputDocuments: []
workflowType: 'prd'
classification:
  projectType: 'Browser Extension — Developer Consumer Utility'
  domain: 'Developer Productivity / General'
  complexity: 'low'
  projectContext: 'greenfield'
  uxPrinciple: 'Zero friction to first value'
  keyConstraint: 'MV3 background worker architecture'
  monetization: 'open-source; no paid tier'
---

# Product Requirements Document - dev-tab-organizer

**Author:** Alessandro.farandagancio
**Date:** March 12, 2026

## Executive Summary

`dev-tab-organizer` is a minimal, open-source Chrome extension (Manifest V3) that solves a ubiquitous developer pain point: the inability to distinguish multiple `localhost:*` tabs at a glance. When a developer has five or more local services running simultaneously, every tab reads `localhost:3000 | App` — the extension rewrites tab titles to display the port number or a user-defined service name (e.g., `⚡ 3000 — React App`, `Auth Service`) using Chrome's background service worker and `chrome.scripting.executeScript`. No backend, no API, no ongoing maintenance. Ships once, works forever.

**Target users:** Web developers running local multi-service environments (full-stack apps, microservices, frontend + backend splits). Secondary: any developer who keeps 3+ localhost tabs open simultaneously.

**Scope:** Greenfield, v1. Single deliverable: Chrome extension distributed via the Chrome Web Store and open-sourced on GitHub. No server infrastructure. No paid tier.

### What Makes This Special

Zero direct competition on the Chrome Web Store. The solution space is obvious in retrospect but nobody has shipped it cleanly. The core bet: developer tools with the highest adoption are the ones that install silently, deliver value immediately, and never ask for anything again. This extension exists in that category — configure once (or not at all), benefit forever.

Ships with an opinionated default port map (3000 → React, 5173 → Vite, 8080 → Backend, 8000 → Django/FastAPI, etc.) so the zero-config experience delivers value before the user opens the popup. Custom port-to-name mappings are persisted via `chrome.storage.sync` — no account, no cloud, no friction.

Open source by design: community contributions drive the port map, favicon themes, and browser support expansions. The codebase is intentionally small (~50 lines of core logic) — complexity is a bug, not a feature.

## Project Classification

| | |
|---|---|
| **Type** | Browser Extension — Developer Consumer Utility |
| **Domain** | Developer Productivity / General |
| **Complexity** | Low |
| **Context** | Greenfield |
| **Distribution** | Chrome Web Store + GitHub (open source) |
| **Monetization** | None (GitHub Sponsors as optional tip jar) |
| **Key Constraint** | MV3 background service worker architecture (content script `document.title` mutation unreliable for SPAs) |

## Success Criteria

### User Success

- **Aha moment:** Developer opens a `localhost:*` tab and the title is automatically rewritten (e.g., `⚡ 3001`) with zero configuration required. Value is delivered before the popup is ever opened.
- **Completion scenario:** Developer running 3+ local services can identify each tab at a glance without clicking through them.
- **Custom name success:** Developer sets a custom name for a port (e.g., `3001 → Auth Service`) via the popup and it persists across browser restarts without any account or sync setup.
- **Delight signal:** Extension works silently — no notifications, no onboarding prompts, no badge clutter. It just works.

### Project Success

Open-source project; no revenue goal. Success defined by community signal and personal utility:

- Extension works reliably for Alessandro's own daily workflow with zero maintenance intervention
- At least one community contribution (PR, issue, or port map suggestion) received post-launch
- GitHub stars as adoption signal
- Zero critical bugs in the first 30 days post-launch

### Technical Success

- Tab title rewriting works correctly for SPAs (React, Next.js, Vite) that update `document.title` dynamically — handled via background service worker, not content script
- `chrome.storage.sync` persists user config across browser sessions and Chrome profile syncs
- Extension does not impact page load performance (background worker, no DOM manipulation on load)
- Core logic stays under ~100 lines — complexity is a bug, not a feature
- Passes Chrome Web Store review on first submission

### Measurable Outcomes

| Outcome | Measure |
|---|---|
| Zero-config value delivery | Title rewritten on first `localhost:*` tab with no user action |
| Custom name persistence | Survives browser restart, verified via storage.sync |
| SPA compatibility | Tested against React (CRA + Vite), Next.js, Angular |
| Performance | No measurable delta in tab load time |
| Community traction | ≥1 external contribution within 60 days of launch |

## User Journeys

### Journey 1: The Zero-Config Developer (Primary — Happy Path)

**Meet Marco.** Marco is a full-stack developer working on a three-service app: a React frontend on `3000`, a Node API on `3001`, and a PostgreSQL admin UI on `5432`. He has eight tabs open by 10am and can't tell which localhost tab is which without clicking through each one. He wastes maybe 30 seconds every time he needs to switch context — which is constantly.

A colleague mentions the extension in a Slack message. Marco installs it from the Chrome Web Store in 20 seconds. He doesn't open the popup. He just... looks at his tab bar. `⚡ 3000 — React`, `⚡ 3001 — Node`, `⚡ 5432 — DB Admin`. His existing open tabs have already been relabeled.

Marco doesn't configure anything. He doesn't need to. He goes back to coding. The tab bar is not a problem anymore. He forgets the extension exists — which is exactly the point.

**Requirements revealed:** Auto-detect on install for already-open tabs; default port map must cover common stacks out of the box; must not require any user action for first-value delivery.

---

### Journey 2: The Power User Developer (Primary — Customization Path)

**Meet Priya.** Priya runs a microservices environment with 12 services. The defaults get her 60% of the way there, but `⚡ 3002` means nothing to her — she wants `Payments API`. She opens the popup.

The popup shows a simple list of active localhost ports with their current names. She clicks on `3002`, types `Payments API`, hits enter. Done. She moves down the list — `3003 → Inventory`, `3004 → Auth`. Five minutes of setup she'll never have to redo. The names survive a browser restart, a Chrome update, and syncing to her work laptop.

Two weeks later she changes the payments service to port `3010`. She opens the popup, updates one entry. No reinstall, no export/import.

**Requirements revealed:** Popup UI with editable port-to-name list; real-time title update when mapping changes; `chrome.storage.sync` persistence; easy editing flow (click-to-edit inline, not a modal form).

---

### Journey 3: The SPA Developer Edge Case (Primary — Reliability Path)

**Meet Dev.** Dev is building a Next.js app on `localhost:3000`. The title starts as `localhost:3000` but Next.js rewrites it to `My App — Dashboard` after hydration. Then navigates to a new route: `My App — Settings`. Then a client-side nav: title changes again.

Without careful implementation, the extension would lose the custom prefix after the SPA rewrites `document.title`, or override the SPA's own meaningful titles with just `⚡ 3000`. With the correct MV3 background service worker approach, the extension listens to `chrome.tabs.onUpdated` and re-injects the title prefix on every title change event. Dev sees `⚡ 3000 — My App — Dashboard` → `⚡ 3000 — My App — Settings` as he navigates. Port context is always visible, SPA titles are preserved.

**Requirements revealed:** `chrome.tabs.onUpdated` listener must fire on `title` change events, not just URL changes; title format must preserve the original page title, not replace it; must handle rapid navigation without flickering.

---

### Journey 4: The Open Source Contributor (Community Path)

**Meet Hana.** Hana uses the extension daily and notices that `5000 → Flask` is missing from the default port map. She goes to the GitHub repo, finds the port map config file (a simple JSON or JS object), adds `5000 → "Flask"`, and opens a PR with a one-line change.

The PR takes 5 minutes to write. Alessandro reviews it, merges it. Next release, every Flask developer who installs the extension gets `⚡ 5000 — Flask` out of the box.

**Requirements revealed:** Default port map must be a standalone, clearly-documented, easy-to-edit config file (not buried in logic); contribution guide in README; port map format must be trivially understandable to non-JS developers.

---

### Journey Requirements Summary

| Journey | Key Capabilities Required |
|---|---|
| Zero-config developer | Auto-relabel on install; default port map; no UX friction |
| Power user developer | Popup edit UI; real-time title update; storage.sync persistence |
| SPA edge case | `tabs.onUpdated` on title change; prefix + preserve original title; no flicker |
| OSS contributor | Separated, documented port map config; clear contribution path |

## Innovation & Differentiation

### Market Gap

No credible solution exists on the Chrome Web Store for localhost tab labeling as of March 2026. Searches for "localhost tab", "tab renamer developer", and "port tab label" return nothing purpose-built. This is a gap of execution, not demand — the problem is universal among developers running multi-service local environments.

### Core Product Insight

The innovation is not technical — it's the recognition that a zero-config default port map delivers immediate value before any user interaction. Most tab-management extensions require setup first. This extension works the moment it is installed, with sensible defaults that cover the majority of common stacks (React, Vite, Django, FastAPI, Angular, Phoenix, Node). Configuration is optional, not required.

### Competitive Landscape

- **Generic tab renamers** (e.g., Tab Modifier): require manual rules per URL, no developer-specific defaults, high setup friction
- **Browser DevTools**: solve debugging, not tab identification at a glance
- **Custom browser profiles**: workaround, not a solution
- **Nothing built specifically for localhost port labeling**: confirmed gap

### Validation Approach

Validation is personal-first: the author uses the extension daily. Community signal (GitHub stars, PRs, issues) provides post-launch validation. Chrome Web Store install count as a passive growth indicator. No formal user research required given the simplicity and universality of the problem.

## Technical Architecture

### Project-Type Overview

A Chrome Manifest V3 browser extension distributed via the Chrome Web Store and open-sourced on GitHub. The extension operates entirely client-side with no external dependencies, backend services, or network requests. The entire artifact is a static bundle of ~5 files installable in seconds.

### Technical Architecture Considerations

**Manifest Version:** MV3 (required — MV2 is deprecated by Chrome as of 2024)

**Core Architecture Pattern:**
- `background.js` — Service worker (persistent listener for `chrome.tabs.onUpdated`). Fires on both URL change and title change events, calls `chrome.scripting.executeScript` to inject title rewrite logic.
- Content script approach explicitly **rejected** — unreliable for SPA `document.title` mutations; background service worker is the correct MV3 pattern.
- `popup.html` / `popup.js` — Extension popup UI for viewing and editing port→name mappings. Reads/writes from `chrome.storage.sync`.
- `port-map.js` (or `port-map.json`) — Standalone, human-readable default port mapping config. Separated from logic intentionally for community contribution ease.

**Permissions Required:**
```json
{
  "permissions": ["tabs", "scripting", "storage"],
  "host_permissions": ["http://localhost/*", "http://127.0.0.1/*"]
}
```
No broad host permissions. `tabs` for tab URL/title access, `scripting` for `executeScript`, `storage` for `chrome.storage.sync`.

### Installation & Distribution

| Channel | Details |
|---|---|
| Chrome Web Store | Primary distribution; requires developer account ($5 one-time fee) |
| GitHub | Source + releases; MIT license; direct `.zip` install for contributors |
| Manual install | `chrome://extensions` → developer mode → load unpacked (dev/contributor path only) |

No package manager distribution (not an npm library — browser extension only).

### Storage Model

`chrome.storage.sync` for all user config:
- Port-to-name mapping object: `{ "3001": "Auth Service", "3002": "Payments" }`
- Syncs automatically across the user's Chrome profile/devices
- No account, no backend, no API keys
- Storage quota: 100KB sync limit — far exceeds any realistic mapping config size

### Documentation Requirements

- `README.md` — install steps, screenshot, default port map list, how to contribute
- `CONTRIBUTING.md` — how to add port mappings (one-line change), PR process
- `port-map.js` inline comments — each entry documented with framework name
- Chrome Web Store listing — screenshots, short description, privacy policy (no data collected)

### Browser Support

| Browser | Status |
|---|---|
| Chrome | ✅ Primary target (MV3) |
| Edge | ✅ Chromium-based, MV3 compatible (likely works without modification) |
| Firefox | ❌ Out of scope for v1 (different extension API) |
| Safari | ❌ Out of scope |

### Implementation Constraints

- Zero npm dependencies in production bundle — vanilla JS only; no build step required for core functionality
- `manifest.json` declares minimum Chrome version compatible with MV3 + `scripting` API (Chrome 88+)
- Extension must pass Chrome Web Store automated review (no remote code execution, no obfuscated code, minimal permissions justification)
- Title format must be configurable but default to: `⚡ PORT — Original Title` (port visible even when tab title is truncated)

## Product Scope & Roadmap

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — deliver the aha moment (zero-config tab labeling) before any configuration is required.
**Resource Requirements:** Solo developer; vanilla JS; no dependencies; no build tooling required for core. Estimated effort: 1–2 focused weekends to MVP + Chrome Web Store submission.

### MVP Phase (Phase 1)

**Core User Journeys Supported:**
- Zero-config developer (auto-labeling on install)
- Power user developer (popup custom name editor)
- SPA developer (reliable title rewriting via background service worker)
- OSS contributor (separated port map config file)

**Must-Have Capabilities:**

| Capability | Rationale |
|---|---|
| `chrome.tabs.onUpdated` listener for URL + title changes | Core mechanism — without this, nothing works |
| `chrome.scripting.executeScript` title injection | MV3-correct pattern; content script approach rejected |
| Default port map (10+ common frameworks) | Zero-config value delivery |
| Popup UI: view active localhost tabs + edit port→name | Enables power user customization |
| `chrome.storage.sync` persistence | Mappings survive restarts and sync across devices |
| MIT license + GitHub repo | Open source distribution |
| Chrome Web Store listing + privacy policy | Public discoverability |

**Explicitly Out of MVP:**
- Color-coded favicon badges
- Port number in favicon
- Configurable title format options
- Firefox/Edge-specific testing
- Export/import config

### Post-MVP Features

### Phase 2 — Growth

- Color-coded favicon badge per port (colored dot overlay)
- Port number visible in favicon even when tab title is truncated
- Configurable title format (e.g., `[PORT]`, `⚡ PORT`, `Name` only)
- Community-maintained port map extensions via GitHub PRs

### Phase 3 — Expansion

- Firefox / Edge explicit support + testing
- Keyboard shortcut to cycle through localhost tabs by port
- Export/import port name config as JSON
- Auto-detect framework from page meta/content for smarter defaults

### Risk Mitigation Strategy

**Technical Risks:** MV3 `chrome.scripting.executeScript` approach is well-documented and used in production extensions. Fallback: if Chrome API behavior changes, the extension simply stops relabeling — it degrades gracefully with no data loss.

**Market Risks:** None applicable — open source, no revenue dependency. The project succeeds if it solves Alessandro's own daily problem.

**Resource Risks:** If time is constrained, Phase 1 can ship without the popup UI (auto-labeling only, no custom names) as an even leaner first version. Custom name editing can be added in a follow-up release.

## Functional Requirements

### Tab Detection & Monitoring

- **FR1:** The extension can detect when any tab navigates to a `localhost:*` or `127.0.0.1:*` URL
- **FR2:** The extension can detect when the title of a monitored localhost tab changes (to handle SPA navigation)
- **FR3:** The extension can detect localhost tabs that are already open at the time the extension is installed or enabled
- **FR4:** The extension can extract the port number from a localhost URL

### Title Rewriting

- **FR5:** The extension can rewrite the displayed tab title of a localhost tab to include the port number as a prefix
- **FR6:** The extension can rewrite the displayed tab title to include a user-defined service name in place of or alongside the port number
- **FR7:** The extension preserves the original page title as a suffix when rewriting (e.g., `⚡ 3000 — Original Title`)
- **FR8:** The extension re-applies the title prefix after a SPA updates `document.title` (title changes do not strip the prefix permanently)
- **FR9:** The extension applies the title rewrite without causing visible flicker on rapid SPA navigation

### Port Mapping Configuration

- **FR10:** The extension ships with a default port-to-name mapping covering common developer frameworks (React, Vite, Angular, Phoenix, Django/FastAPI, Node, etc.)
- **FR11:** Users can define a custom name for any port number
- **FR12:** Users can remove a custom port name mapping, reverting to the default name or port number
- **FR13:** Custom port name mappings take precedence over default port map entries
- **FR14:** The default port map is defined in a standalone, human-readable config file separate from core extension logic

### Popup Interface

- **FR15:** Users can open a popup interface from the Chrome toolbar extension icon
- **FR16:** The popup displays the currently active localhost tabs with their port numbers and current assigned names
- **FR17:** Users can edit the name assigned to any port directly within the popup
- **FR18:** Name changes made in the popup are reflected in the tab title immediately without requiring a page reload
- **FR19:** The popup remains usable when no localhost tabs are currently open (shows empty state)

### Storage & Persistence

- **FR20:** User-defined port name mappings persist across browser restarts
- **FR21:** User-defined port name mappings sync across the user's Chrome profile on different devices
- **FR22:** The extension stores configuration without requiring user account creation or external services

### Distribution & Open Source

- **FR23:** The extension is installable from the Chrome Web Store
- **FR24:** The extension source code is publicly available on GitHub under the MIT license
- **FR25:** The default port map config file is structured such that adding a new entry requires only a single-line change
- **FR26:** The repository includes a contribution guide explaining how to add port mappings

## Non-Functional Requirements

### Performance

- **NFR1:** Tab title rewriting must complete within 100ms of a `chrome.tabs.onUpdated` event firing — imperceptible to the user
- **NFR2:** The background service worker must not measurably increase page load time for localhost tabs (verified by Chrome DevTools performance profiling showing <5ms overhead)
- **NFR3:** Rapid SPA navigation (route changes occurring within 200ms of each other) must not cause tab title flickering or stale labels
- **NFR4:** The popup must open and render its full state within 200ms of the user clicking the toolbar icon

### Security

- **NFR5:** The extension must declare only the minimum permissions required: `tabs`, `scripting`, `storage`, and host permissions scoped exclusively to `http://localhost/*` and `http://127.0.0.1/*`
- **NFR6:** The extension must not make any external network requests — all logic executes locally within the browser
- **NFR7:** No user data (port names, browsing activity) may be transmitted to any external server
- **NFR8:** The Chrome Web Store listing must include an accurate privacy policy stating no data is collected or transmitted

### Reliability

- **NFR9:** If the extension encounters an unexpected error (e.g., a tab is closed between detection and script injection), it must fail silently without affecting the page or throwing uncaught errors to the console
- **NFR10:** Disabling or uninstalling the extension must fully restore original tab title behavior — no persistent `document.title` modifications remain after the extension is removed
- **NFR11:** The extension must function correctly across Chrome browser updates without requiring a new release (depends only on stable MV3 APIs)

### Accessibility

- **NFR12:** The popup UI must be keyboard-navigable — all actions (viewing ports, editing names) must be completable without a mouse
- **NFR13:** The popup must meet WCAG 2.1 Level AA minimum contrast requirements for text and interactive elements
- **NFR14:** Input fields in the popup must have associated labels readable by screen readers

### Maintainability

- **NFR15:** Total extension bundle size must remain under 50KB (unzipped) — no frameworks, no dependencies
- **NFR16:** Core title-rewriting logic must be contained in a single file under 100 lines to remain trivially auditable by any contributor
- **NFR17:** The codebase must be understandable without inline documentation for any developer experienced with the Chrome Extensions API
