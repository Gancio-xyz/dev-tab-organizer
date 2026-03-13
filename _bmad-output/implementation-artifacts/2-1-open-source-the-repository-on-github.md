# Story 2.1: Open-Source the Repository on GitHub

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the project maintainer,
I want the extension source code publicly available on GitHub under the MIT license with a minimal README,
So that the community can discover, install from source, and begin contributing before the popup feature is built.

## Acceptance Criteria

1. A public GitHub repository exists under the MIT license (`LICENSE` file present at project root).
2. `README.md` covers: what the extension does, how to install from the Chrome Web Store (placeholder link until Story 2.2), the full default port map list, and step-by-step instructions to load unpacked for local development.
3. `README.md` includes at least one screenshot or GIF demonstrating labeled localhost tabs in the browser tab bar.
4. The repository is tagged `v0.1.0` and the tag is pushed to remote.

## Tasks / Subtasks

- [ ] Verify the GitHub repository is set to **Public** (AC: 1)
  - [ ] The remote is already configured: `git@github.com:Gancio-xyz/dev-tab-organizer.git`
  - [ ] Go to `https://github.com/Gancio-xyz/dev-tab-organizer` → Settings → scroll to "Danger Zone" → confirm visibility is Public (or change it)
  - [ ] **Do not create a new remote** — origin is already set correctly
- [ ] Create `LICENSE` file at project root (AC: 1)
  - [ ] Use standard MIT License text
  - [ ] Set year to `2026`
  - [ ] Set copyright holder name (your full name or GitHub username)
- [ ] Create `README.md` at project root (AC: 2, 3)
  - [ ] **Hero headline** — one-line value prop (e.g., "Automatically label your localhost tabs by service name")
  - [ ] **What it does** — 2–3 sentences explaining the zero-config tab labeling behavior
  - [ ] **Screenshot / GIF** section — at minimum one image showing `⚡ PORT — Title` in the Chrome tab bar (see screenshot guidance below)
  - [ ] **Default port map** — table or list of all entries shipped in `port-map.js`
  - [ ] **Installation** section — Chrome Web Store install link (placeholder: `[Install from Chrome Web Store](#)`)
  - [ ] **Load unpacked (dev)** section — exact steps to load from source
  - [ ] **Add a custom port mapping** — brief note directing users to the popup (coming in v1.0)
- [ ] Commit `LICENSE` and `README.md` with a meaningful message (AC: 1, 2, 3)
- [ ] Push all commits to `origin` (AC: 4)
- [ ] Create and push tag `v0.1.0` (AC: 4)
  - [ ] `git tag v0.1.0`
  - [ ] `git push origin v0.1.0`

## Dev Notes

### Git Remote Already Exists — Do NOT Recreate

The repository remote is already configured:
```
origin  git@github.com:Gancio-xyz/dev-tab-organizer.git
```
Do not run `git remote add origin` — it will fail with "remote already exists". The only required git actions are verifying the repo is public on GitHub, committing the two new files, and tagging.

### `LICENSE` — Exact MIT Text

Create `LICENSE` (no file extension) at the project root with this content, substituting your name and the year:

```
MIT License

Copyright (c) 2026 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `README.md` — Required Structure and Content

The README must satisfy all AC bullet points. Suggested structure:

```markdown
# Dev Tab Organizer ⚡

> Automatically label your localhost tabs by service name — zero config, instant value.

[screenshot or GIF here]

## What it does

Tired of squinting at 10 identical "localhost" tabs? Dev Tab Organizer rewrites each
localhost tab title to include the port number and service name: `⚡ 3000 — React`,
`⚡ 8080 — Spring Boot`, `⚡ 5173 — Vite`. Works instantly on install — no setup required.

## Install

[Install from Chrome Web Store](#) ← placeholder, updated in Story 2.2

## Default Port Map

| Port | Service |
|------|---------|
| 1234 | Parcel |
| 3000 | React |
| 3001 | Node / API |
| 4000 | Phoenix |
| 4200 | Angular |
| 5000 | Flask |
| 5173 | Vite |
| 8000 | Django |
| 8080 | Spring Boot |
| 8888 | Jupyter |
| 9000 | Webpack |

Don't see your stack? Adding a new entry is one line in `port-map.js`.

## Load unpacked (local development)

1. Clone this repository: `git clone git@github.com:Gancio-xyz/dev-tab-organizer.git`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the cloned repository folder
5. Open any `localhost:PORT` tab — the title updates immediately

## License

MIT — see [LICENSE](./LICENSE)
```

**What to omit at this stage (comes later):**
- Custom port mapping instructions → popup UI not built until Epic 3; a brief "coming in v1.0" note is fine
- CONTRIBUTING.md link → Epic 4, Story 4.1
- CI/CD badge → Story 4.2

### Screenshot / GIF Guidance (AC: 3)

The AC requires at least one visual. Options in order of effort:

1. **Screenshot (fastest):** With extension loaded, open 2–3 `localhost:PORT` tabs. Take a screenshot of the Chrome tab bar showing `⚡ 3000 — React`, `⚡ 5173 — Vite`, etc. Crop to just the tab bar strip. Save as `assets/screenshot-tab-bar.png` (create `assets/` directory) and reference in README: `![Labeled localhost tabs](./assets/screenshot-tab-bar.png)`.

2. **GIF (more compelling):** Use any screen recorder (QuickTime + GIF conversion, or Kap on macOS) to capture: open `localhost:3000` → tab title changes. 3–5 seconds is enough. Save as `assets/demo.gif`.

**Minimum viable:** A static screenshot is sufficient to ship. The GIF is a nice-to-have for the Web Store listing (Story 2.2).

**Important:** The screenshot REQUIRES Epic 1 to be complete first — you need a working extension to capture real tab labels. If Epic 1 is not yet done, create a placeholder README with a `<!-- TODO: add screenshot -->` comment and add the real image when Epic 1 is complete before tagging.

### Tag `v0.1.0` — Exact Commands

```bash
# Commit the new files first
git add LICENSE README.md assets/
git commit -m "chore: add MIT license, README, and v0.1.0 screenshot"

# Create and push the tag
git tag v0.1.0
git push origin main        # push commits
git push origin v0.1.0      # push tag separately
```

**Note:** Tags are NOT pushed with `git push origin` alone — you must explicitly push the tag with `git push origin v0.1.0` or `git push --tags`.

### Default Port Map — Sync with `port-map.js`

The README port map table MUST exactly match the entries in `port-map.js` as implemented in Story 1.1. Do not list ports in the README that aren't in `port-map.js`, and do not omit entries that are in `port-map.js`. The README is documentation of the actual shipped code — keep them in sync.

### Architecture File List

The project structure defined in the architecture includes `README.md` and `LICENSE` at the root. Creating these files finalizes the intended structure. `CONTRIBUTING.md` is **not** part of this story — it is Story 4.1.

### Dependency — Epic 1 Must Be Complete

This story explicitly gates on "Epic 1 is complete" (per AC). Specifically:
- `background.js`, `port-map.js`, `popup.html`, `popup.js`, `manifest.json`, `icons/` must all exist and work
- The extension must be loadable via "Load unpacked" for the screenshot to be genuine
- Do not skip or fake the screenshot — it is a required AC

If starting this story while Epic 1 stories are still in-progress, create `LICENSE` and the `README.md` shell (without screenshot) first, then add the screenshot asset and finalize the commit + tag only when Epic 1 is `done`.

### Previous Story Context (Stories 1.1–1.4)

- All Epic 1 stories are `ready-for-dev` — implementation is beginning (Story 1.1 is `in-progress`)
- Files that will exist after Epic 1: `manifest.json`, `background.js`, `port-map.js`, `popup.html`, `popup.js`, `icons/`, `tests/`, `.gitignore`
- `README.md` and `LICENSE` are the only new files in this story — no extension code changes

### What Story 2.2 Does (Do Not Overlap)

Story 2.2 handles Chrome Web Store submission. This story (2.1) only covers the GitHub open-sourcing. The Chrome Web Store link in the README is intentionally a placeholder `#` — Story 2.2 updates it with the live URL.

### References

- Architecture: project file list including `README.md`, `LICENSE` [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Architecture: Chrome Web Store zip excludes `*.md` — README is excluded from the extension zip [Source: `_bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment`]
- Epics: Story 2.1 ACs [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.1`]
- PRD FRs covered: FR24 (source code on GitHub under MIT license) [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2 FR Coverage Map`]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_None yet_

### Completion Notes List

_To be filled by dev agent after implementation_

### File List

_Files created/modified by dev agent:_

- `LICENSE` (create)
- `README.md` (create)
- `assets/screenshot-tab-bar.png` or `assets/demo.gif` (create — screenshot/GIF of labeled tabs)
