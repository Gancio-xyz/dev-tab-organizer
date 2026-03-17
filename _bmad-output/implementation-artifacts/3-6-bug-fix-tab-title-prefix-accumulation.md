# Story 3.6: Fix Tab Title Prefix Accumulation

**Status:** done

## Description
As a developer using the extension,
I want my tab titles to have exactly one `⚡ [port]` prefix,
even if the page title is dynamically updated or I change the port mapping,
so that the tab bar remains readable.

## Context
A bug exists where the prefix is prepended repeatedly if the existing title does not exactly match the separator pattern (e.g., `⚡ 3000` becomes `⚡ 3000 — ⚡ 3000`). This happens because the current regex in `background.js` expects a ` — ` separator which may be missing in short titles.

## Acceptance Criteria
- [x] Tab titles never contain more than one `⚡` emoji or port number.
- [x] The `stripPrefix` function (and equivalent regex in `executeScript`) correctly identifies valid prefixes even without a dash separator.
- [x] Dynamic title updates by SPAs do not result in prefix doubling.
- [x] Changing a port mapping in the popup correctly replaces the old prefix with the new one.

## Technical Notes
- Update the regex in `background.js` and `popup.js` (if applicable) to be more robust: `/^⚡\s+\d+\s*(?:—\s*)?/`.
- Ensure `bare` title extraction handles cases both with and without the separator.

## Implementation (done)
- Introduced `PREFIX_REGEX = /^(?:⚡\s+\d+\s*(?:—\s*)?)+/` in `background.js` to match one or more prefix runs (optional `—`), so titles like `⚡ 3000` or `⚡ 3000 — ⚡ 3000` are stripped correctly and never rewritten with a doubled prefix.
- Updated `stripPrefix()` to use `PREFIX_REGEX` and `.trim()` on the result.
- Updated both `executeScript` inline regexes (onInstalled and onUpdated) to the same pattern so content script stripping matches `stripPrefix`.
- Added tests: prefix without separator, doubled prefix, multiple prefix runs.
- `popup.js` does not perform prefix stripping; no change there.
