# Story 2.3: Structure Extension Bundle Folder for Chrome Packaging

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the project maintainer,
I want the extension’s runtime code isolated in a dedicated bundle folder,
so that Chrome can load the extension unpacked and for Web Store packaging without `_bmad` and other tooling files interfering.

## Acceptance Criteria

1. Given the repository is checked out fresh, when I open `chrome://extensions` and click “Load unpacked…”, then I can select a single `extension/` (or equivalent) folder that contains a valid `manifest.json` and all runtime assets required by the extension, with no `_bmad` or other meta-tooling folders under that root.
2. Given the new `extension/` folder structure is in place, when I run the existing Node test suite via `node --test`, then all tests still pass and imports are correctly updated to reference the new locations (e.g., `background.js`, `port-map.js`, `popup.js`).
3. Given the new folder structure, when I follow the README instructions for local development, then the documented “Load unpacked” steps reference the `extension/` folder (or chosen name) and result in a working extension in Chrome.
4. Given I prepare a ZIP from the `extension/` folder only, when I inspect its contents, then it includes only runtime code and assets required by the extension (manifest, JS, HTML, CSS, icons, etc.) and excludes `_bmad`, `_bmad-output`, tests, and other non-runtime artifacts.

## Tasks / Subtasks

- [ ] Design target extension folder structure (AC: 1, 4)
  - [ ] Decide canonical folder name (e.g., `extension/` or `chrome-extension/`) and document it
  - [ ] Enumerate which files live inside the extension bundle (manifest, background, popup, icons, shared JS modules)
- [ ] Move runtime files into dedicated extension folder (AC: 1, 4)
  - [ ] Physically relocate `manifest.json`, `background.js`, `popup.html`, `popup.js`, `port-map.js`, and `icons/` (and any other manifest-referenced assets) under the new folder
  - [ ] Update any relative imports within the extension code to match the new layout
- [ ] Update tests and tooling references (AC: 2)
  - [ ] Update `tests/*.test.js` imports to reference the new extension file paths (e.g., `../extension/background.js`)
  - [ ] Run `node --test` and ensure all tests pass without modification to behavior
- [ ] Update documentation and developer workflow (AC: 3, 4)
  - [ ] Update `README.md` (and any relevant docs) to reference the new `Load unpacked` path and the extension folder layout
  - [ ] Add a short note for contributors about keeping `_bmad` and other tooling folders outside the extension bundle
  - [ ] Update `_bmad-output/planning-artifacts/architecture.md` Project Structure diagram to reflect the new `extension/` subfolder as the canonical runtime layout
  - [ ] Add Story 2.3 entry to `_bmad-output/planning-artifacts/epics.md` under Epic 2 to keep the epics doc as the single source of truth

## Dev Notes

- The goal is to treat the extension bundle as a clean, self-contained MV3 project under `extension/`, while the repo root remains the home for `_bmad`, `_bmad-output`, tests, docs, and other tooling.
- Keep the folder structure flat and explicit (no build step): Chrome should be able to load the folder directly without a bundler or transpilation.
- All runtime imports must remain relative within the extension folder, and `manifest.json` must reference paths relative to that folder root.
- Tests should continue to import the same modules (e.g., `background.js`, `port-map.js`) but from the new `extension/` path; avoid duplicating code between test-only and runtime locations.

### Project Structure Notes

- After this story, contributors should clearly see a separation between:
  - `extension/` (runtime extension bundle that Chrome loads and that is zipped for store submissions)
  - Repo-level tooling and docs (`_bmad`, `_bmad-output`, `tests`, `docs`, etc.).
- The story should not introduce a build pipeline; it only reorganizes files and paths to make packaging and local development more robust.

### References

- Planning: Epic 2 (“Early Ship — v0.1 Launch”) focuses on GitHub open source and Chrome Web Store distribution [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Early Ship — v0.1 Launch`].
- Architecture: MV3 background service worker must remain `"type": "module"` and use only `chrome.tabs`, `chrome.scripting`, and `chrome.storage` with localhost-scoped host permissions [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1` and `_bmad-output/planning-artifacts/architecture.md`].
- Implementation context: Existing stories already define the runtime files (`manifest.json`, `background.js`, `popup.html`, `popup.js`, `port-map.js`) and tests that will need path updates [Source: `_bmad-output/implementation-artifacts/1-1-...`, `1-2-...`, `3-1-...`, `3-2-...`, etc.].

## Dev Agent Record

### Agent Model Used

- Story created by BMAD create-story workflow (Cursor AI coding agent)

### Debug Log References

_To be filled by dev agent after implementation._

### Completion Notes List

_To be filled by dev agent after implementation._

### File List

_Files expected to be created/modified by dev agent:_

- `extension/manifest.json` (move from root and adjust paths as needed)
- `extension/background.js` (move from root, update imports as needed)
- `extension/popup.html` (move from root)
- `extension/popup.js` (move from root)
- `extension/port-map.js` (move from root)
- `extension/icons/*` (move from root `icons/`)
- `tests/*.test.js` (update imports to new paths)
- `README.md` (update “Load unpacked” and structure docs)
- `_bmad-output/planning-artifacts/architecture.md` (update Project Structure diagram)
- `_bmad-output/planning-artifacts/epics.md` (add Story 2.3 under Epic 2)

