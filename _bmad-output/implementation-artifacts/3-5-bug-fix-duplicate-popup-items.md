# Story 3.5: Fix Duplicate Items in Popup Menu

**Status:** done

## Description
As a developer using the extension popup,
I want to see exactly one entry per active localhost port in the menu,
even after I have made multiple title changes,
so that the UI remains clean and usable.

## Context
Users have reported that the extension main menu (popup) shows duplicated items after a change is made in the title text field. Initially, it's one duplicate, but it grows with each change.

## Acceptance Criteria
- [x] Opening the popup displays exactly one row per unique localhost tab/port combo.
- [x] Changing a port name inline and blurring/pressing Enter does not cause additional rows to appear in the list.
- [x] Subsequent opens of the popup show a stable list without duplication.
- [x] The "empty state" is correctly shown if all tabs are closed, even after previous duplications occurred.

## Technical Notes
- Investigate `renderTabList` in `popup.js`.
- Ensure `list.innerHTML` overwrite is working correctly and not somehow appending.
- Check if `init()` is being called multiple times or if `tabs.query` returns redundant results.

## Tasks / Subtasks
- [x] Deduplicate by port in `renderTabList`: build a unique list of ports from tabs (e.g. `Set` of ports), then render one row per port so multiple tabs on same port or duplicate query results never produce duplicate rows.
- [x] Add unit tests for `renderTabList`: one row per unique port when multiple tabs share a port; multiple rows for multiple ports.

## Dev Agent Record
- **Implementation plan:** Root cause was rendering one row per tab; multiple tabs on the same port (or duplicate tab entries from `chrome.tabs.query`) produced duplicate rows. Fix: in `extension/popup.js` `renderTabList`, derive a unique sorted list of ports with `[...new Set(tabs.map(t => new URL(t.url).port).filter(p => p !== ''))].sort(...)` and render one row per port. `list.innerHTML = ...` already overwrites; `init()` is only called once at module load; no change there.
- **Completion notes:** Implemented port-based deduplication in `renderTabList`. Added two tests in `tests/popup.test.js`: (1) two tabs same port → one row, (2) two tabs different ports → two rows. All 36 project tests pass. AC2/AC3 are satisfied because we never re-render on blur/Enter (no list change) and each open uses the same deduplication. AC4 unchanged (empty state path unchanged).

## File List
- `extension/popup.js` (modified — renderTabList deduplicates by port)
- `tests/popup.test.js` (modified — DOM mock for tab-list/empty-state, two renderTabList tests)

## Change Log
- 2026-03-17: Fix duplicate popup items by rendering one row per unique port; add unit tests for renderTabList deduplication.
