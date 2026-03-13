# Story 2.2: Submit Extension to Chrome Web Store (v0.1)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the project maintainer,
I want the extension published on the Chrome Web Store as v0.1,
So that any developer can install it in one click and the project gains real-world usage signal.

## Acceptance Criteria

1. The Chrome Web Store listing includes: a clear title, a short description referencing the zero-config localhost tab labeling value prop, at least two screenshots (before/after tab bar comparison), and an accurate privacy policy URL stating no data is collected or transmitted to external servers.
2. The extension passes Chrome Web Store automated review — no remote code execution, no broad host permissions beyond `localhost/*` and `127.0.0.1/*`.
3. Once approved, the README placeholder Web Store link is updated with the live published URL and a new commit is pushed.

## Tasks / Subtasks

- [ ] Prerequisites check — do NOT start packaging until all of these are true (AC: 2)
  - [ ] All Epic 1 stories are `done` (extension functions correctly end-to-end)
  - [ ] Story 2.1 is `done` (GitHub repo is public, tagged `v0.1.0`)
  - [ ] Extension loads cleanly via Load Unpacked with no errors in the service worker console
- [ ] Set up Chrome Web Store developer account (AC: 1) — one-time manual step
  - [ ] Go to `https://chrome.google.com/webstore/devconsole`
  - [ ] Pay the one-time $5 USD developer registration fee if not already done
  - [ ] Complete identity verification if prompted
- [ ] Write and host a privacy policy (AC: 1)
  - [ ] See exact privacy policy text below — it is short and accurate for this extension
  - [ ] Simplest option: create a `privacy-policy.md` in the GitHub repo and host via GitHub Pages, OR add it as a section in `README.md` and link to the raw GitHub URL
  - [ ] The privacy policy URL must be a reachable public URL (not `localhost`, not a file path)
- [ ] Build the extension zip for submission (AC: 2)
  - [ ] From the project root, run: `zip -r extension.zip . -x "tests/*" ".github/*" "*.md" ".gitignore" "_bmad*"`
  - [ ] Verify zip contents: `unzip -l extension.zip` — must contain `manifest.json`, `background.js`, `port-map.js`, `popup.html`, `popup.js`, `icons/`, must NOT contain `tests/`, `.github/`, markdown files, or planning artifacts
  - [ ] Verify total unzipped size is under 50KB (NFR15)
- [ ] Create the Chrome Web Store listing (AC: 1)
  - [ ] Log in to `https://chrome.google.com/webstore/devconsole`
  - [ ] Click **New item** → upload `extension.zip`
  - [ ] Fill in listing fields (see content below)
  - [ ] Upload at least 2 screenshots (1280×800 or 640×400 px, PNG or JPG)
  - [ ] Enter the privacy policy URL
  - [ ] Set distribution: **Public** (not unlisted)
- [ ] Submit for review (AC: 2)
  - [ ] Click **Submit for review** — review typically takes 1–3 business days
  - [ ] Do not submit multiple times — one submission triggers the review queue
- [ ] After approval — update README (AC: 3)
  - [ ] Replace the `[Install from Chrome Web Store](#)` placeholder in `README.md` with the live CWS URL
  - [ ] Commit: `docs: update README with live Chrome Web Store link`
  - [ ] Push to `origin main`

## Dev Notes

### Zip Command — Exact Exclusion List

The architecture specifies this exact command:

```bash
zip -r extension.zip . -x "tests/*" ".github/*" "*.md" ".gitignore" "_bmad*"
```

The `_bmad*` exclusion is added because the `_bmad/` and `_bmad-output/` directories should not be in the Web Store package. After zipping, always verify with `unzip -l extension.zip` before uploading. The CWS reviewer will see every file in the zip — keep it clean.

**Verify size:** `unzip -l extension.zip | tail -1` shows the total uncompressed size. Must be under 50KB (NFR15).

### Store Listing — Recommended Content

**Name (max 45 chars):**
```
Dev Tab Organizer
```

**Short description (max 132 chars):**
```
Instantly label localhost tabs by service name — ⚡ 3000 → React, ⚡ 8080 → Spring Boot. Zero config.
```

**Detailed description:**
```
Dev Tab Organizer automatically rewrites your localhost tab titles to include the port number
and service name, so you can identify each local service at a glance.

✅ Zero configuration — works immediately on install
✅ Ships with 10+ default port mappings (React, Vite, Angular, Django, Flask, and more)
✅ Preserves the original page title as a suffix
✅ Handles SPA client-side navigation without flickering or double-prefixes
✅ Minimal permissions — only accesses localhost and 127.0.0.1 tabs

HOW IT WORKS
When you navigate to localhost:3000, the tab title changes from "My App" to "⚡ 3000 — My App"
automatically. No setup, no configuration, no accounts.

DEFAULT PORT MAP
3000 → React | 5173 → Vite | 4200 → Angular | 4000 → Phoenix | 8000 → Django
5000 → Flask | 8080 → Spring Boot | 8888 → Jupyter | 1234 → Parcel | 9000 → Webpack

PRIVACY
This extension stores no personal data. Custom port name mappings are saved locally in
Chrome's built-in sync storage and never transmitted to any external server.

Source code: https://github.com/Gancio-xyz/dev-tab-organizer
```

**Category:** Developer Tools

**Language:** English

### Privacy Policy — Exact Text

The Chrome Web Store requires a privacy policy for extensions using `storage`, `tabs`, and `scripting` permissions. This is the accurate policy for this extension:

```markdown
# Privacy Policy — Dev Tab Organizer

**Last updated: March 2026**

Dev Tab Organizer does not collect, transmit, or share any personal data.

The extension:
- Reads tab URLs and titles solely to detect localhost tabs and rewrite their titles
- Stores custom port name mappings in Chrome's built-in sync storage (`chrome.storage.sync`)
  — this data stays within your Chrome profile and is never sent to any external server
- Makes no network requests of any kind
- Has no analytics, tracking, or telemetry

The extension only accesses `localhost` and `127.0.0.1` URLs as declared in its permissions.

Questions: open an issue at https://github.com/Gancio-xyz/dev-tab-organizer
```

**Hosting the privacy policy:** The simplest approach is to add this as a section at the bottom of `README.md`. The raw GitHub URL format is:
```
https://raw.githubusercontent.com/Gancio-xyz/dev-tab-organizer/main/README.md
```
Or even better — create a dedicated `privacy-policy.md` file in the repo and enable GitHub Pages, or just use the direct GitHub rendering URL:
```
https://github.com/Gancio-xyz/dev-tab-organizer/blob/main/privacy-policy.md
```
The GitHub blob URL renders markdown in a readable format and is a stable public URL acceptable to the Chrome Web Store.

### Screenshots — Exact CWS Requirements

Chrome Web Store requires screenshots at exactly **1280×800 px** or **640×400 px**, PNG or JPG format, max 2MB each.

**Two screenshots required (per AC):**

1. **Before/after comparison:** Side-by-side or sequential showing the Chrome tab bar before (generic "localhost:3000") and after (labeled "⚡ 3000 — React"). Can be a single wide image split in two, or two separate screenshots.

2. **Multi-tab view:** Several localhost tabs open simultaneously all showing their labeled names (e.g., `⚡ 3000 — React`, `⚡ 5173 — Vite`, `⚡ 8080 — Spring Boot`). This demonstrates the primary value prop most compellingly.

**Taking screenshots at the right size:**
- Open Chrome DevTools → Device toolbar (Ctrl+Shift+M) is not needed — just set Chrome window width to ~1280px
- Take a screenshot of the tab bar area using macOS screenshot tool (Cmd+Shift+4 for selection)
- Resize to 1280×800 in Preview or any image editor if needed

**Promotional tile (optional but recommended):** 440×280 px PNG. Even a simple branded image helps visibility on the store.

### CWS Automated Review — What It Checks

The extension will be reviewed against these criteria (all should pass based on current architecture):

| Check | Status | Why |
|---|---|---|
| No remote code execution | ✅ Pass | No `eval()`, no remote scripts, no `unsafe-eval` in CSP |
| Permissions minimality | ✅ Pass | Only `tabs`, `scripting`, `storage` — no `<all_urls>`, no `webRequest` |
| Host permissions scope | ✅ Pass | Only `localhost/*` and `127.0.0.1/*` |
| No external network requests | ✅ Pass | Zero network calls in the codebase |
| `manifest_version: 3` | ✅ Pass | Architecture explicitly uses MV3 |
| Valid manifest | ✅ Pass | Validated by Load Unpacked during development |

**If review is rejected:** The most common rejection reasons for new submissions are: (1) missing or broken privacy policy URL, (2) screenshots not meeting size requirements, (3) description not matching functionality. Read the rejection email carefully — CWS provides specific reasons.

### Previous Story Context (Story 2.1)

Story 2.1 established:
- GitHub repo is public at `github.com/Gancio-xyz/dev-tab-organizer`
- `LICENSE` (MIT) and `README.md` exist
- `v0.1.0` tag is pushed
- README has a placeholder `[Install from Chrome Web Store](#)` link → this story replaces it with the live URL after approval

### No Code Changes in This Story

This story involves zero extension code changes. All tasks are:
1. Preparing packaging artifacts (zip)
2. Manual actions on the Chrome Web Store Developer Console
3. One final `README.md` commit after approval to replace the placeholder URL

### References

- Architecture: zip command and exclusion list [Source: `_bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment`]
- Architecture: permissions scope (`tabs`, `scripting`, `storage`, localhost only) [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Architecture: `publish.yml` CI/CD for future automation (Story 4.2) — not used here [Source: `_bmad-output/planning-artifacts/architecture.md#Gap Analysis & Resolutions` — Gap 2]
- Epics: Story 2.2 ACs [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.2`]
- PRD FRs covered: FR23 (extension installable from Chrome Web Store) [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2 FR Coverage Map`]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_None yet_

### Completion Notes List

_To be filled by dev agent after implementation_

### File List

_Files created/modified by dev agent:_

- `privacy-policy.md` (create — or add section to `README.md`)
- `README.md` (modify — update placeholder CWS link with live URL, after approval)
- `extension.zip` (create locally for upload — do NOT commit to git)
