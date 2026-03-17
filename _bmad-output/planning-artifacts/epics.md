---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation', 'step-01-update-prerequisites', 'step-02-update-design-epics', 'step-03-update-create-stories', 'step-04-update-final-validation']
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md']
lastEdited: '2026-03-13'
editReason: 'Remediation based on implementation-readiness-report-2026-03-13: FR27 added, missing stories added (FR12, FR23/24/26, CI/CD), AC quality improvements, FR numbering collision fixed'
---

# dev-tab-organizer - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for dev-tab-organizer, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Implementation Functional Requirements

> Note: These E-FR items are implementation-level decompositions derived from PRD FRs. PRD FR numbers (FR1–FR27) are the authoritative reference — see FR Coverage Map above.

E-FR1: Auto-detect already-open `localhost:*` tabs on extension install and rewrite titles. (PRD: FR3)
E-FR2: Detect tab URL and title changes via Chrome MV3 background service worker using `chrome.tabs.onUpdated`. (PRD: FR1, FR2)
E-FR3: Rewrite tab titles to include a configurable prefix (e.g., `⚡ 3000 — React`) using `chrome.scripting.executeScript`, preserving the original page title as suffix. (PRD: FR5, FR6, FR7)
E-FR4: Preserve SPA dynamic title mutations by detecting changes and safely re-applying the prefix (without infinite loops or flickering). (PRD: FR8, FR9)
E-FR5: Implement a default, standalone port-to-name mapping configuration (`port-map.js`) that covers common default stacks and supports single-line additions. (PRD: FR10, FR14, FR25)
E-FR6: Deliver zero-config first value immediately upon extension installation matching the default mappings. (PRD: FR10)
E-FR7: Provide a popup UI that displays a list of active localhost tabs. (PRD: FR15, FR16)
E-FR8: Allow users to click-to-edit name mappings inline via the popup UI, with support for removing a custom mapping to revert to the default. (PRD: FR11, FR12, FR17)
E-FR9: Persist custom port-to-name mapping overrides across browser sessions to `chrome.storage.sync`, syncing across Chrome profile devices without accounts. (PRD: FR20, FR21, FR22)
E-FR10: Update tab titles in real-time immediately when a mapping is changed within the popup. (PRD: FR18)
E-FR11: Display a dedicated empty state message in the popup when there are no active localhost tabs, rather than rendering an empty list. (PRD: FR19)
E-FR12: Provide a global toggle in the popup to pause/resume the extension (prevents future title rewrites; already-renamed tabs retain their current titles). (PRD: FR27)

### NonFunctional Requirements

NFR1-4 (Performance): Title rewriting must operate in under 100ms; popup UI must render in under 200ms.
NFR5-8 (Security): Minimal permissions constraint (`tabs`, `scripting`, `storage`, and scoped localhost host matching). Zero network requests.
NFR9-11 (Reliability): Must handle tab-close race conditions silently. Titles must be successfully preserved/restored if possible.
NFR12-14 (Accessibility): Popup UI must be fully keyboard-navigable, WCAG 2.1 AA compliant, and have properly labelled DOM inputs.
NFR15-17 (Maintainability): Extension must have zero external libraries/dependencies, be less than 50KB unzipped, and keep core logic under 100 lines.

### Additional Requirements

- **Starter Template:** **Manual MV3 Vanilla JS Scaffold** (Important for Epic 1 Story 1).
- **Background Worker Type:** The background service worker must be registered with `"type": "module"` in `manifest.json` to support direct imports.
- **Architectural Constraint:** Tab title rewriting must exclusively use background worker-injected `chrome.scripting.executeScript`. Content script mutation is strictly prohibited.
- **Data Architecture:** Custom configurations must be stored as a flat `portMappings` object in `chrome.storage.sync` with port numbers as keys.
- **UI Architecture:** Popup rendering must update targeted specific DOM nodes for inline editing. Complete `innerHTML` replacement is prohibited to prevent input focus loss.
- **Open Source:** The default port map must be abstracted into a clear `port-map.js` module to simplify open source community contribution.

### FR Coverage Map (PRD FR numbering)

**Epic 1: Zero-Config Tab Rewriting**
- **FR1:** Epic 1 — Detect tab navigation to `localhost:*` / `127.0.0.1:*`
- **FR2:** Epic 1 — Detect title changes on monitored tabs (SPA navigation)
- **FR3:** Epic 1 — Detect already-open localhost tabs at install/enable
- **FR4:** Epic 1 — Extract port number from localhost URL
- **FR5:** Epic 1 — Rewrite tab title to include port number as prefix
- **FR6:** Epic 1 — Rewrite tab title to include user-defined service name
- **FR7:** Epic 1 — Preserve original page title as suffix (`⚡ PORT — Title`)
- **FR8:** Epic 1 — Re-apply title prefix after SPA updates `document.title`
- **FR9:** Epic 1 — No visible flicker on rapid SPA navigation
- **FR10:** Epic 1 — Ship with default port-to-name mapping (10+ frameworks)
- **FR14:** Epic 1 — Default port map in standalone human-readable config file
- **FR25:** Epic 1 — Single-line change sufficient to add a new port map entry

**Epic 2: Early Ship — v0.1 Launch**
- **FR23:** Epic 2 — Extension installable from Chrome Web Store
- **FR24:** Epic 2 — Source code on GitHub under MIT license

**Epic 3: Custom Mappings & Popup UI**
- **FR11:** Epic 3 — Users can define a custom name for any port
- **FR12:** Epic 3 — Users can remove a custom mapping (revert to default)
- **FR13:** Epic 3 — Custom mappings take precedence over default port map
- **FR15:** Epic 3 — Open popup from Chrome toolbar icon
- **FR16:** Epic 3 — Popup displays active localhost tabs with port + name
- **FR17:** Epic 3 — Edit port name directly within the popup
- **FR18:** Epic 3 — Name changes reflected in tab title immediately
- **FR19:** Epic 3 — Popup empty state when no localhost tabs open
- **FR20:** Epic 3 — Mappings persist across browser restarts
- **FR21:** Epic 3 — Mappings sync across user's Chrome profile/devices
- **FR22:** Epic 3 — No account creation or external services required
- **FR27:** Epic 3 — Global pause/resume toggle (future rewrites suppressed; existing tabs retain titles)

**Epic 4: Full Launch — v1.0 Release**
- **FR26:** Epic 4 — Repository includes contribution guide (CONTRIBUTING.md)

## Epic List

### Epic 1: Zero-Config Tab Rewriting (Core Engine & Immediate Value)
A developer installs the extension and immediately sees their existing and new `localhost` tabs properly labeled based on the default port map, with no configuration required.
**PRD FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR14, FR25

### Epic 2: Early Ship — v0.1 Launch
The extension is live on the Chrome Web Store and open-sourced on GitHub under the MIT license with a minimal README, making it publicly discoverable and installable immediately after Epic 1.
**PRD FRs covered:** FR23, FR24

### Epic 3: Custom Mappings & Popup UI (Power User Customization)
A developer can click the extension icon to view their active localhost tabs, instantly rename a port mapping inline, toggle the global active/paused state, and have that custom configuration persist across browser sessions.
**PRD FRs covered:** FR11, FR12, FR13, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR27

### Epic 4: Full Launch — v1.0 Release
The project is fully open-source with a contribution guide, automated CI/CD release pipeline, and an updated Chrome Web Store listing reflecting the complete v1.0 feature set.
**PRD FRs covered:** FR26

## Epic 1: Zero-Config Tab Rewriting (Core Engine & Immediate Value)

A developer installs the extension and immediately sees their existing and new `localhost` tabs properly labeled based on the default port map, with no configuration required.
**PRD FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR14, FR25

### Story 1.1: Scaffold Extension Foundation with Default Port Labeling

As a developer who just installed the extension,
I want the extension to load immediately with a working default port map,
So that my localhost tabs are labeled from the first moment the extension is active, with no setup required.

**Acceptance Criteria:**

**Given** an empty repository,
**When** the developer creates the scaffold,
**Then** a `manifest.json` exists declaring MV3, registering `background.js` as a service worker with `"type": "module"`, and requesting only `tabs`, `scripting`, and `storage` permissions scoped to `http://localhost/*` and `http://127.0.0.1/*`,
**And** a `port-map.js` exists exporting a `DEFAULT_PORT_MAP` object covering at least 10 common developer frameworks (including React, Vite, Angular, Phoenix, Django/FastAPI, Node, and Flask),
**And** adding a new port entry to `port-map.js` requires exactly one line (e.g., `5001: 'My Service'`).

### Story 1.2: Rewrite Localhost Tab Titles in Real Time

As a full-stack developer with many local tabs open,
I want newly opened and navigating localhost tab titles to be rewritten to include their port and service name,
So that I can identify each local service at a glance without clicking through tabs.

**Acceptance Criteria:**

**Given** the extension is installed,
**When** a user navigates to `localhost:3000` or `127.0.0.1:8080`,
**Then** `background.js` listens to `chrome.tabs.onUpdated` for `localhost:*` and `127.0.0.1:*` URLs exclusively,
**And** the tab title becomes `⚡ [PORT] — [DEFAULT_NAME]` within 100ms (e.g., `⚡ 3000 — React`, `⚡ 8080 — Backend`),
**And** the original page title is preserved as the suffix (e.g., a tab with title "My App — Dashboard" on port 3000 becomes `⚡ 3000 — My App — Dashboard`).

### Story 1.3: Prevent SPA Double-Rewrites (Flicker Guard)

As a developer working on a React or Next.js SPA,
I want my tab title to maintain the port prefix correctly even as my app updates `document.title` on client-side navigation,
So that I never see a doubled prefix like `⚡ 3000 — ⚡ 3000 — My App` or stale labels.

**Acceptance Criteria:**

**Given** a tab already displaying `⚡ 3000 — My App — Dashboard`,
**When** the SPA navigates client-side and updates `document.title` to `My App — Settings`,
**Then** the resulting tab title is `⚡ 3000 — My App — Settings` (prefix reapplied cleanly),
**And** the tab title never compounds into `⚡ 3000 — ⚡ 3000 — My App — Settings`.

### Story 1.4: Auto-Label Existing Tabs on Install

As a developer who discovers this extension mid-workday with 10 localhost tabs already open,
I want all my currently open localhost tabs to be labeled immediately when I install the extension,
So that I get the full value instantly without refreshing my entire environment.

**Acceptance Criteria:**

**Given** a user has multiple active `localhost` or `127.0.0.1` tabs already open,
**When** the extension is installed or reloaded,
**Then** all open localhost tabs display their port prefix (e.g., `⚡ 3000 — React`) without requiring any page refresh,
**And** tabs that are not localhost URLs are unaffected.

## Epic 2: Early Ship — v0.1 Launch

The extension is live on the Chrome Web Store and open-sourced on GitHub under the MIT license with a minimal README, making it publicly discoverable and installable immediately after Epic 1.
**PRD FRs covered:** FR23, FR24

### Story 2.1: Open-Source the Repository on GitHub

As the project maintainer,
I want the extension source code publicly available on GitHub under the MIT license with a minimal README,
So that the community can discover, install from source, and begin contributing before the popup feature is built.

**Acceptance Criteria:**

**Given** Epic 1 is complete and the extension files exist locally,
**When** the repository is published,
**Then** a public GitHub repository exists under the MIT license (`LICENSE` file present),
**And** a `README.md` covers: what the extension does, how to install from the Chrome Web Store (placeholder link), the default port map list, and how to load unpacked for local development,
**And** the README includes at least one screenshot or GIF demonstrating labeled localhost tabs in the browser tab bar,
**And** the repository is tagged `v0.1.0`.

### Story 2.2: Submit Extension to Chrome Web Store (v0.1)

As the project maintainer,
I want the extension published on the Chrome Web Store as v0.1,
So that any developer can install it in one click and the project gains real-world usage signal.

**Acceptance Criteria:**

**Given** the extension passes local testing and the GitHub repo is live (Story 2.1),
**When** the extension is submitted to the Chrome Web Store,
**Then** the store listing includes: a clear title, short description referencing the zero-config localhost tab labeling value prop, at least two screenshots (e.g., before/after tab bar comparison), and an accurate privacy policy stating no data is collected or transmitted,
**And** the extension passes Chrome Web Store automated review (no remote code execution, no broad host permissions beyond `localhost/*` and `127.0.0.1/*`),
**And** the README placeholder Web Store link is updated with the live published URL.

### Story 2.3: Structure Extension Bundle Folder for Chrome Packaging

As the project maintainer,
I want the extension’s runtime code isolated in a dedicated bundle folder,
so that Chrome can load the extension unpacked and for Web Store packaging without `_bmad` and other tooling files interfering.

**Acceptance Criteria:**
- Given the repository is checked out fresh, when I open `chrome://extensions` and click “Load unpacked…”, then I can select a single `extension/` folder.
- Tests pass cleanly when run via `node --test` with new locations.
- Zipped package includes only runtime files and ignores `_bmad`, `tests`, etc.

## Epic 3: Custom Mappings & Popup UI (Power User Customization)

A developer can click the extension icon to view their active localhost tabs, instantly rename a port mapping inline, toggle the global active/paused state, and have that custom configuration persist across browser sessions.

### Story 3.1: Render Base Popup UI & Empty States

As a developer opening the extension popup for the first time,
I want to see a clean, keyboard-navigable interface that clearly shows my active localhost ports or tells me none are open,
So that I immediately understand the extension's status without any guesswork.

**Acceptance Criteria:**

**Given** no active `localhost` tabs are open,
**When** the developer clicks the extension icon,
**Then** `popup.html` loads and displays an informational empty state ("No localhost tabs open yet") by updating a target DOM node — not an empty list,
**And** the popup is fully keyboard-navigable (all interactions reachable without a mouse).

**Given** localhost tabs are active,
**When** the developer clicks the extension icon,
**Then** the popup renders a list of active ports with their current assigned names (default or custom),
**And** the popup renders within 200ms of the icon click.

### Story 3.2: Implement Inline Name Editing & Storage Persistence

As a power-user developer managing ports without default names,
I want to edit port name mappings inline in the popup and have them save automatically,
So that my custom names persist across browser restarts without any modal or form friction.

**Acceptance Criteria:**

**Given** the popup list of active ports is rendered,
**When** a user clicks or tabs into an input field and types a custom name, then blurs the field or presses Enter,
**Then** `popup.js` updates the specific input DOM node without a full `innerHTML` replacement (keyboard focus is preserved),
**And** the custom name is merged into `chrome.storage.sync` as `{ "PORT": "Custom Name" }`, taking precedence over the default port map.

**Given** a custom mapping exists (e.g., `3000 → 'My App'`),
**When** the user clears the input field and saves (blur or Enter),
**Then** the custom override is removed from `chrome.storage.sync`,
**And** the tab title reverts to the default port map name, or the port number alone if no default exists.

### Story 3.3: Wire Storage to Real-Time Title Engine

As a power-user who has just assigned a new alias to an active port,
I want the physical tab title in my browser to reflect my edit within moments of saving,
So that I don't have to manually refresh any tabs to see my changes.

**Acceptance Criteria:**

**Given** a user successfully updates a custom mapping in Story 3.2,
**When** `chrome.storage.sync.set()` commits the change,
**Then** all matching open localhost tabs update their title to reflect the new mapping (e.g., `⚡ 3001 — Payment API`) within 100ms of the save action, without requiring any page reload.

### Story 3.4: Implement Global Pause/Resume Toggle

As a developer temporarily recording a screen-share,
I want to pause the extension's title-rewriting from the popup without uninstalling it,
So that new tabs open during the session use native browser titles, while my setup remains intact for when I resume.

**Acceptance Criteria:**

**Given** a user opens the popup,
**When** they click the Pause/Resume toggle,
**Then** an `isEnabled` boolean flag (default `true`) flips in `chrome.storage.sync`,
**And** `background.js` checks this flag before executing any `chrome.scripting.executeScript` call — if `false`, the handler returns immediately without renaming,
**And** already-renamed tabs retain their current custom titles while paused (no active reversion),
**And** when the toggle is set back to `true`, the next `chrome.tabs.onUpdated` event resumes normal title-rewriting behaviour.

*(PRD FR27 — Extension Control)*

## Epic 4: Full Launch — v1.0 Release

The project is fully open-source with a contribution guide, automated CI/CD release pipeline, and an updated Chrome Web Store listing reflecting the complete v1.0 feature set.
**PRD FRs covered:** FR26

### Story 4.1: Publish Contribution Guide (CONTRIBUTING.md)

As an open-source developer who wants to add a missing port to the default map,
I want a clear, minimal contribution guide in the repository,
So that I can open a pull request in under 10 minutes without needing to ask anyone for help.

**Acceptance Criteria:**

**Given** the GitHub repository is live (Story 2.1),
**When** `CONTRIBUTING.md` is published,
**Then** it explains in plain language: how to add a new port mapping (showing the exact one-line change in `port-map.js`), how to load the extension unpacked for local testing, and the PR review process,
**And** it includes a note that all contributions are accepted under the MIT license,
**And** a developer with no prior knowledge of the codebase can read it and open a valid port-map PR without asking any questions.

### Story 4.2: Automate Release Pipeline with GitHub Actions

As the project maintainer,
I want a GitHub Actions workflow that automatically packages and publishes the extension on a version tag push,
So that releasing a new version requires only a `git tag` command — no manual zipping or Web Store dashboard uploads.

**Acceptance Criteria:**

**Given** GitHub Actions secrets (`CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`) are configured in the repository settings,
**When** a new version tag (e.g., `v1.0.0`) is pushed to the GitHub repository,
**Then** the workflow automatically zips the extension source files (excluding dev-only files),
**And** publishes the zip to the Chrome Web Store via the Chrome Web Store Publish API,
**And** creates a GitHub Release with the zip attached and the tag as the release name.

### Story 4.3: Update Chrome Web Store Listing for v1.0

As a developer browsing the Chrome Web Store,
I want the extension listing to accurately reflect the full v1.0 feature set (including popup customization),
So that I understand the complete value before installing.

**Acceptance Criteria:**

**Given** Epic 3 is complete and v1.0 is tagged,
**When** the Chrome Web Store listing is updated,
**Then** the description, screenshots, and feature highlights reflect both zero-config labeling (v0.1) and popup customization with custom names and pause/resume (v1.0),
**And** the README is updated with two visuals: the tab bar GIF/screenshot from v0.1 (retained as the hero asset) and a new popup UI screenshot (added alongside it).