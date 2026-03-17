# Story 3.7: Fix Initial Name Resolution on Load

**Status:** done

## Description
As a developer opening a localhost tab,
I want the tab title to include the resolved service name (e.g., "React") immediately,
even if I haven't manually edited the mapping in the popup,
so that the extension provides immediate value from the default port map.

## Context
Alessandro reported that on initial page load (e.g., `localhost:3000`), the title only shows `⚡ 3000 — [Title]`. The word "React" only appears after a change is made in the extension menu. This is because the `onUpdated` listener in `background.js` does not currently resolve the port name for the initial rewrite.

## Acceptance Criteria
- [x] Newly opened localhost tabs display the resolved service name (or page title) according to the rewrite mode flag.
- [x] The resolution logic correctly accounts for both `DEFAULT_PORT_MAP` and any custom overrides in `chrome.storage.sync`.
- [x] SPA title updates also preserve/re-resolve the final title correctly under both modes.

## Technical Notes
- `chrome.tabs.onUpdated` in `background.js` resolves the port name using `resolvePortName` and calls a shared `applyTitleInPage` function injected via `chrome.scripting.executeScript`.
- Storage is queried for `isEnabled`, `portMappings`, and a new `rewriteMode` flag before renaming, so both defaults and overrides are honored.
- `onInstalled` and `handleStorageChange` share the same injected logic, ensuring consistent behavior across initial labeling, mapping changes, and SPA title updates.

## Dev Agent Record
- **Implementation plan:** Introduce a shared in-page helper (`applyTitleInPage(port, name, mode)`) that:
  - Strips any existing `⚡ port` prefix.
  - In `replace` mode, sets `document.title` to `⚡ port — name` (or `⚡ port` if no name).
  - In `prefix` mode, sets `document.title` to `⚡ port — <bare page title>` (ignoring the name in the final title).
  This allows a single flag (`rewriteMode`) to control whether the service name replaces the page title or we just prefix the existing title.
- **Completion notes:** Updated `onUpdated`, `onInstalled`, and `handleStorageChange` to:
  - Load `isEnabled`, `portMappings`, and `rewriteMode` from `chrome.storage.sync`.
  - Resolve the service name via `resolvePortName(port, portMappings, DEFAULT_PORT_MAP)`.
  - Inject `applyTitleInPage` with safe, JSON-serializable arguments (`port`, `nameStr`, `rewriteMode`).
  Added tests in `tests/background.test.js` to cover:
  - Prefix mode: `onUpdated` keeps the original page title and only adds the port prefix.
  - Replace mode: `onChanged` and `handleStorageChange` set titles to `⚡ port — name` and revert to defaults when overrides are removed.
  All background + popup tests pass.
