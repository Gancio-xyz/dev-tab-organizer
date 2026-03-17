# Story 4.3: Update Chrome Web Store Listing for v1.0

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer browsing the Chrome Web Store,
I want the extension listing to accurately reflect the full v1.0 feature set (including popup customization),
So that I understand the complete value before installing.

## Acceptance Criteria

1. The Chrome Web Store listing description, feature highlights, and screenshots reflect both the v0.1 zero-config labeling and the v1.0 popup customization features (custom port names, pause/resume toggle).
2. The listing includes at least one new screenshot showing the popup UI (the port list with inline name editing and the pause/resume button).
3. `README.md` is updated with two visuals: the existing tab bar GIF/screenshot from v0.1 (retained as the hero asset) and a new popup UI screenshot (added alongside it).

## Tasks / Subtasks

- [ ] Prerequisites — do NOT start until all are true (AC: 1, 2)
  - [x] All Epic 3 stories are `done` (popup UI complete, custom names, pause/resume all working)
  - [x] `manifest.json` version is bumped to `"1.0.0"` and committed
  - [ ] v1.0.0 tag is pushed (`git tag v1.0.0 && git push origin v1.0.0`)
  - [ ] Story 4.2 CI/CD pipeline has successfully published the v1.0.0 zip to the Chrome Web Store
- [ ] Take popup UI screenshot(s) for the store listing and README (AC: 2, 3)
  - [ ] Open Chrome with at least two localhost tabs running (e.g., localhost:3000 React, localhost:5173 Vite)
  - [ ] Click the extension icon to open the popup — ensure both ports appear in the list
  - [ ] The popup should show: port labels, name inputs (one with a custom override typed in), and the Pause button
  - [ ] Take a screenshot of the popup at 1280×800 or 640×400 px (PNG or JPG, max 2MB) — see Dev Notes for exact guidance
  - [ ] Save as `screenshot-popup-v1.png` (or similar) — this is used on CWS and in README
- [ ] Update Chrome Web Store Developer Console listing (AC: 1, 2)
  - [ ] Log in to `https://chrome.google.com/webstore/devconsole`
  - [ ] Find the Dev Tab Organizer listing → click **Edit**
  - [ ] Update the **detailed description** with the v1.0 content from Dev Notes
  - [ ] Upload the new popup screenshot (add alongside existing v0.1 screenshots — do NOT remove them)
  - [ ] Click **Publish update**
- [x] Update `README.md` with popup screenshot (AC: 3)
  - [x] Retain the existing tab bar screenshot/GIF as the hero visual (first image in README)
  - [x] Add the new popup UI screenshot below it, in a "Popup" or "Custom Names" section
  - [x] See Dev Notes for the exact README section to add
- [ ] Commit and push README update (AC: 3)
  - [ ] `git add README.md screenshot-popup-v1.png` (or wherever the screenshot is stored)
  - [ ] `git commit -m "docs: add popup screenshot to README for v1.0"`
  - [ ] `git push origin main`

## Dev Notes

### Prerequisites: What Must Already Be Done

This story is the final release step. It is explicitly gated on:
1. **Epic 3 complete** — popup UI (3.1), inline name editing (3.2), storage-triggered title updates (3.3), and pause/resume toggle (3.4) must all be `done`
2. **v1.0.0 tagged and published** — Story 4.2's workflow must have run successfully and published the v1.0 zip to the Chrome Web Store before the listing can be updated

The listing update edits the EXISTING CWS entry created in Story 2.2. If the v0.1 listing is not yet live, complete Story 2.2 first.

### Version Bump — Update `manifest.json` Before Tagging

```json
// manifest.json — change version before tagging v1.0.0
{
  "manifest_version": 3,
  "name": "Dev Tab Organizer",
  "version": "1.0.0",   // ← change from "0.1.0"
  ...
}
```

Commit this change, then tag:
```sh
git add manifest.json
git commit -m "chore: bump version to 1.0.0"
git tag v1.0.0
git push origin main
git push origin v1.0.0  # triggers Story 4.2 CI/CD pipeline
```

### Taking the Popup Screenshot

The screenshot should communicate the two main v1.0 features at a glance: **custom port names** and **pause/resume toggle**.

**Ideal screenshot state:**
- At least two ports visible in the popup list
- One port showing a custom override name typed into the input (e.g., port 3001 with "Payment API" in the input field)
- The "Pause" button visible at the bottom of the popup
- The popup is rendered cleanly — no browser chrome needed, just the popup itself

**How to capture the popup at the right size:**
1. Open Chrome with localhost tabs active
2. Click the extension icon to open the popup
3. Right-click the popup → **Inspect** → in DevTools, right-click the `<html>` element → **Capture node screenshot** (Chrome DevTools built-in, produces a clean popup-only image)
4. Alternatively: use macOS Cmd+Shift+4, draw a selection box around just the popup panel

**CWS screenshot requirements (same as v0.1):**
- Dimensions: exactly **1280×800 px** or **640×400 px**
- Format: PNG or JPG
- Max size: 2MB per screenshot
- Scale up to 1280×800 using macOS Preview (Tools → Adjust Size) if your capture is smaller

### Updated CWS Listing Content

Update only the **detailed description** in the Developer Console. The title and short description can remain the same.

**Short description (unchanged from v0.1):**
```
Instantly label localhost tabs by service name — ⚡ 3000 → React, ⚡ 8080 → Spring Boot. Zero config.
```

**Updated detailed description (replaces v0.1 version):**
```
Dev Tab Organizer automatically rewrites your localhost tab titles to include the port number
and service name, so you can identify each local service at a glance.

✅ Zero configuration — works immediately on install with 10+ default port mappings
✅ Custom names — rename any port inline from the popup (e.g., 3001 → "Payment API")
✅ Persistent mappings — custom names sync across browser restarts and Chrome profile devices
✅ Pause/Resume — temporarily suppress title rewriting without uninstalling
✅ Handles SPA navigation — no flickering or double-prefixes on client-side route changes
✅ Minimal permissions — only accesses localhost and 127.0.0.1 tabs, zero network requests

HOW IT WORKS
When you navigate to localhost:3000, the tab title changes from "My App" to "⚡ 3000 — My App"
automatically. Open the popup to rename ports, clear custom names to revert to defaults,
or pause the extension during screen recordings.

DEFAULT PORT MAP
3000 → React | 5173 → Vite | 4200 → Angular | 4000 → Phoenix | 8000 → Django
5000 → Flask | 8080 → Spring Boot | 8888 → Jupyter | 1234 → Parcel | 9000 → Webpack

PRIVACY
This extension stores no personal data. Custom port name mappings are saved locally in
Chrome's built-in sync storage and never transmitted to any external server.

Source code: https://github.com/Gancio-xyz/dev-tab-organizer
```

### README Update — Exact Section to Add

The `README.md` already has a tab bar screenshot or GIF from Story 2.1. Keep that as the first/hero visual. Add a new section below it:

```markdown
## Popup — Custom Names & Pause/Resume

Click the extension icon to open the popup:

![Popup UI showing custom port names and pause button](screenshot-popup-v1.png)

- **Rename any port** by clicking its input and typing a custom name — saved automatically on blur or Enter
- **Clear a custom name** to revert to the default mapping
- **Pause** the extension temporarily (e.g., during screen recordings) — existing titles are retained

```

Place this section after the main feature description and before any "Contributing" or "Development" sections. Adjust the screenshot filename to match the actual file committed.

**Screenshot file location:** Commit the popup screenshot at the repository root (same level as `README.md`). Do NOT put it in `icons/` — that folder is for extension icons only. Name it something descriptive like `screenshot-popup-v1.png`.

### What NOT to Change in the CWS Listing

- **Do NOT remove** the v0.1 screenshots (before/after tab bar comparison) — keep them as-is
- **Do NOT change** the extension title — "Dev Tab Organizer" stays
- **Do NOT change** the privacy policy — it is still accurate for v1.0
- **Do NOT change** the short description — it still accurately describes the core value prop
- **Do NOT submit a new extension** — this is an update to the existing listed extension

### No New Extension Code in This Story

This story involves:
1. A `manifest.json` version bump commit (only the `"version"` field)
2. Manual actions in the Chrome Web Store Developer Console
3. One `README.md` commit adding the popup screenshot section

**Do NOT modify:** `background.js`, `popup.js`, `popup.html`, `port-map.js`, `popup.css`, any test files, `.github/workflows/publish.yml`, or any `_bmad-output/` files.

### What This Story Completes

Completing this story marks:
- Epic 4 `done` (all three stories complete)
- The project at `v1.0.0` — publicly listed on the Chrome Web Store with full feature coverage
- All 4 epics progressing toward completion
- FR26 coverage confirmed (CONTRIBUTING.md from Story 4.1)
- FR23 updated listing (this story)

### References

- Epics: Story 4.3 ACs — description + screenshots for v1.0, README update with two visuals [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.3`]
- Story 2.2: original CWS submission — listing content, screenshot specs, privacy policy [Source: `_bmad-output/implementation-artifacts/2-2-submit-extension-to-chrome-web-store-v0-1.md`]
- Story 4.2: CI/CD pipeline that publishes the extension zip — prerequisite for this story [Source: `_bmad-output/implementation-artifacts/4-2-automate-release-pipeline-with-github-actions.md`]
- PRD: FR23 (extension installable from Chrome Web Store), FR18 (name changes reflected immediately) [Source: `_bmad-output/planning-artifacts/epics.md#Epic 4 FR Coverage Map`]
- Architecture: zip exclusion list (confirms `*.md` and `screenshot-popup-v1.png` are in repo but excluded from CWS zip) [Source: `_bmad-output/planning-artifacts/architecture.md#File Organization Patterns`]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_None_

### Completion Notes List

- **Automated:** Bumped `extension/manifest.json` to `"1.0.0"` and committed. Created local tag `v1.0.0`. Added README section "Popup — Custom Names & Pause/Resume" with image ref to `screenshot-popup-v1.png`. Created `cws-listing-v1.md` at repo root with exact CWS detailed description and short description for copy-paste in Developer Console.
- **Manual steps required (cannot be automated):** (1) Push tag and branch: `git push origin main && git push origin v1.0.0` (ensures 4.2 CI can publish the zip). (2) Confirm Story 4.2 has run and published v1.0.0 to CWS. (3) Take popup screenshot per Dev Notes, save as `screenshot-popup-v1.png` at repo root. (4) Update CWS listing at https://chrome.google.com/webstore/devconsole using copy in `cws-listing-v1.md`; upload the new screenshot; publish. (5) Run `git add README.md screenshot-popup-v1.png && git commit -m "docs: add popup screenshot to README for v1.0" && git push origin main` (or add screenshot to the existing docs commit and push).

### File List

_Files created/modified by dev agent:_

- `extension/manifest.json` (modified — version set to `"1.0.0"`)
- `README.md` (modified — added Popup section with screenshot ref)
- `cws-listing-v1.md` (created — CWS copy for v1.0 listing)
- `screenshot-popup-v1.png` (to be added by you — popup UI screenshot at repo root)

## Change Log

- 2026-03-17: Version bump (extension/manifest.json → 1.0.0), README Popup section added, CWS listing copy added (cws-listing-v1.md). Tag v1.0.0 created locally. Remaining: push tag/branch, take popup screenshot, update CWS console, commit screenshot and push.
