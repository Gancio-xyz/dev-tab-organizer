# Story 3.9: Dark Mode and Improve UI Layout

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer using the extension in low-light or dark-themed environments,
I want the popup to support dark mode and a clearer, more polished layout,
So that the UI is comfortable to use and matches my system or preference without eye strain.

## Acceptance Criteria

1. **Given** the extension popup is open, **when** the user's system or browser uses a dark color scheme (`prefers-color-scheme: dark`), **then** the popup renders with a dark theme (dark background, light text, sufficient contrast per WCAG 2.1 AA), **and** all interactive elements (inputs, buttons, toggle) remain keyboard-navigable and clearly visible. Focus states (keyboard focus rings) must be at least 3:1 contrast against the background in both light and dark themes. All existing popup DOM IDs and classes from Story 3.8 remain; only CSS and optional root `class`/`data-theme` may change.
2. **Given** dark mode is system-driven only in this story, **when** the popup is open, **then** theme follows `prefers-color-scheme` only — no stored theme preference or override. A future story may add an optional theme control (e.g. Light/Dark/System); that control must remain secondary to the main popup task (viewing/editing port mappings).
3. **Given** the current popup layout, **when** this story is implemented, **then** the overall layout is improved with clear visual hierarchy: (1) the tab list reads as one block, (2) Pause, Update titles, and Rewrite-mode read as a second, control block with clear separation (e.g. spacing or divider), and (3) the empty state uses the same spacing and typography as the list area. Empty state, tab rows, and controls are consistently styled and easy to scan in both themes.

*(PRD/Architecture: "Dark mode popup theming" — Post-MVP; NFR12–14 Accessibility: contrast and labelled inputs remain required.)*

## Tasks / Subtasks

- [x] Implement dark theme via CSS (AC #1)
  - [x] Use `prefers-color-scheme: dark` media query in `popup.css` to apply dark palette when system is dark.
  - [x] Ensure text/background contrast meets WCAG 2.1 AA (e.g. 4.5:1 for normal text; 3:1 for large text/UI components). Ensure focus rings are ≥3:1 against background in both themes.
  - [x] Style all controls: `.tab-row`, `.emoji-input`, `.tab-name-input`, `#toggle-btn`, `#update-titles-btn`, `#empty-state`, rewrite-mode label/checkbox. Do not remove or rename any existing DOM IDs/classes from Story 3.8.
- [x] System-only theme (AC #2)
  - [x] Document in Dev Notes / README or code comment: dark mode follows `prefers-color-scheme` only; no storage, no theme override in this story. Future theme control (if added) stays secondary to main popup task.
- [x] Improve UI layout (AC #3)
  - [x] Refine spacing and visual hierarchy in `popup.css`: tab list as one block; Pause / Update titles / Rewrite-mode as a second control block with clear separation (e.g. section spacing or divider). Empty state same spacing/typography as list area.
  - [x] Ensure empty state, tab rows, and controls look consistent in both light and dark themes.
- [x] Verify accessibility: focus rings (≥3:1), labels, and keyboard nav unchanged (NFR12–14).

## Dev Notes

### Architecture Compliance

- **Popup rendering:** Vanilla JS only; targeted DOM node updates. No full `innerHTML` re-renders after initial render (architecture: in-place mutation only). Adding a theme class to `<html>` or `<body>` and using CSS is the intended approach — no new frameworks.
- **Storage:** This story is system-only: no theme preference stored. Do not add `themePreference` or any new key. Do not change the `portMappings` schema or keys.
- **Files to touch:** `extension/popup.css` (required: dark theme via media query, layout/hierarchy). `extension/popup.html` optional (e.g. wrapper for layout only; no theme class needed for system-only). Do not change `popup.js` for theme logic. Do not modify `background.js`, `port-map.js`, or title-rewriting logic.
- **Naming:** Keep existing DOM IDs and classes (`#tab-list`, `#empty-state`, `.tab-row`, `.emoji-input`, `.tab-name-input`, `#toggle-btn`, etc.). Add new classes only as needed for layout/theming (e.g. `.popup-section`, `[data-theme="dark"]`).

### Technical Requirements

- **CSS-only dark mode (minimum):** Use `@media (prefers-color-scheme: dark)` in `popup.css` to define dark palette. No JS required for system-driven dark mode.
- **Contrast:** In both themes, text and interactive elements must meet WCAG 2.1 AA. Focus states (keyboard focus rings) must be at least 3:1 contrast against the background in both themes.
- **Layout improvements:** Improve hierarchy and grouping without breaking existing structure. Prefer margin/padding and optional wrapper divs; avoid removing or renaming existing IDs/classes used by `popup.js`.
- **Bundle size:** NFR15 (under 50KB unzipped). Adding a few dozen lines of CSS is acceptable; no new dependencies.

### File Structure

- `extension/popup.css` — Primary file: add dark theme via `@media (prefers-color-scheme: dark)`, then layout/hierarchy (tab list block, control block, empty state). Keep selectors aligned with current HTML from Story 3.8. Do not remove or rename existing IDs/classes.
- `extension/popup.html` — Optional: add wrapper/section elements for layout only if needed; no theme class required for system-only. Ensure no existing IDs/labels are removed.
- `extension/popup.js` — No changes for this story (system-only dark mode; no theme preference read/write). Do not change `renderTabList`, `normalizePortMappings`, or storage keys.

### Previous Story Intelligence (Story 3.8)

- **Storage:** `portMappings` is now normalized to `{ [port]: { name, emoji } }` with backward compat for string values. This story does not persist theme; a future story could add `themePreference` in storage with a secondary UI control.
- **Popup structure:** Each tab row has `.tab-row`, `.emoji-input`, label, `.tab-name-input`; list is `#tab-list`; empty state is `#empty-state`. Toggle is `#toggle-btn` with `aria-pressed`. Rewrite-mode checkbox exists. Reuse these; do not remove or rename.
- **Testing:** `tests/popup.test.js` covers render paths and DOM. No new popup.js behavior in this story (system-only); CSS theming can be verified manually. No new tests required unless adding a class/attribute that JS could set (we are not).

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — Popup in-place DOM updates; storage schema; NFR12–14 accessibility.
- [Source: _bmad-output/planning-artifacts/prd.md] — NFR12–14 (keyboard, WCAG 2.1 AA, labels); Post-MVP "Dark mode popup theming".
- [Source: _bmad-output/implementation-artifacts/3-8-improve-popup-menu-with-icons.md] — Current row structure, `normalizePortMappings`, storage shape.

## Dev Agent Record

### Agent Model Used

—

### Debug Log References

—

### Completion Notes List

- Dark theme implemented via `@media (prefers-color-scheme: dark)` in `popup.css` with WCAG 2.1 AA–aligned contrast (e.g. #e0e0e0 on #1e1e1e, focus #6eb3ff). All controls styled in both themes; focus rings ≥3:1.
- System-only theme documented in `popup.css` header comment, `popup.html` section comment, and README one-liner. No storage or theme preference.
- Layout: two `<section>` wrappers in `popup.html` (`.popup-section--list`, `.popup-section--controls`) for clear hierarchy; control block has `border-top` and `padding-top` separation. Empty state uses same padding/typography as list area.
- All existing DOM IDs/classes preserved; no changes to `popup.js`. All 58 tests pass.

### File List

- extension/popup.html (modified — layout sections)
- extension/popup.css (modified — dark theme, layout hierarchy)
- README.md (modified — theme note)
