# Story 4.2: Automate Release Pipeline with GitHub Actions

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the project maintainer,
I want a GitHub Actions workflow that automatically packages and publishes the extension on a version tag push,
So that releasing a new version requires only a `git tag` command — no manual zipping or Web Store dashboard uploads.

## Acceptance Criteria

1. When a version tag matching `v*.*.*` (e.g., `v1.0.0`) is pushed to GitHub, the workflow zips the extension source files, excluding all dev-only artifacts (`tests/`, `.github/`, `_bmad/`, `_bmad-output/`, `.cursor/`, `.agent/`, `.claude/`, `*.md`, `.gitignore`, `.DS_Store`).
2. The workflow publishes the zipped extension to the Chrome Web Store using the secrets `CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` configured in GitHub repository settings.
3. The workflow creates a GitHub Release with the `extension.zip` attached and the tag name as the release name.
4. The workflow file is located at `.github/workflows/publish.yml`.

## Tasks / Subtasks

- [x] Create `.github/workflows/` directory if it does not exist (AC: 4)
- [x] Create `.github/workflows/publish.yml` with the exact content specified in Dev Notes (AC: 1, 2, 3)
  - [x] Trigger: `on: push: tags: ['v*.*.*']`
  - [x] Step 1: `actions/checkout@v4`
  - [x] Step 2: Zip command excluding all dev-only paths (see exact exclusion list in Dev Notes)
  - [x] Step 3: `mnao305/chrome-extension-upload@v5.0.0` — publish to CWS
  - [x] Step 4: `softprops/action-gh-release@v2` — create GitHub Release with zip attached
- [x] Manual verification (AC: 1, 2, 3, 4)
  - [x] Confirm file exists at `.github/workflows/publish.yml`
  - [x] Confirm YAML is valid (no syntax errors) — paste into [yaml.org/start.html](https://yaml.org/start.html) or use `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/publish.yml'))" ` to validate locally
  - [x] Confirm the zip exclusion list covers all non-extension files in the project root (check against `ls -la` output)
  - [x] Confirm secret names match exactly: `CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`

## Dev Notes

### This Story Is Infrastructure Only

**No source code changes.** Do NOT modify `background.js`, `popup.js`, `popup.html`, `port-map.js`, `manifest.json`, or any test file. The only output is one new YAML file: `.github/workflows/publish.yml`.

### Current `.github/` Directory State

The `.github/` directory exists at the project root but currently contains only a `skills/` subdirectory (used by the BMAD tooling). The `workflows/` subdirectory does NOT yet exist — create it as part of this story.

```
.github/
├── skills/     ← exists, do NOT touch
└── workflows/  ← CREATE this directory
    └── publish.yml  ← CREATE this file
```

### Complete `publish.yml` Content — Write This Exactly

```yaml
name: Publish to Chrome Web Store

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Zip extension
        run: |
          zip -r extension.zip . \
            -x "tests/*" \
            -x ".github/*" \
            -x "_bmad/*" \
            -x "_bmad-output/*" \
            -x ".cursor/*" \
            -x ".agent/*" \
            -x ".claude/*" \
            -x ".git/*" \
            -x "*.md" \
            -x ".gitignore" \
            -x ".DS_Store" \
            -x "extension.zip"

      - name: Publish to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v5.0.0
        with:
          file-path: extension.zip
          extension-id: ${{ secrets.CWS_EXTENSION_ID }}
          client-id: ${{ secrets.CWS_CLIENT_ID }}
          client-secret: ${{ secrets.CWS_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CWS_REFRESH_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: extension.zip
          generate_release_notes: true
```

### Zip Exclusion List — What Goes In vs. What Stays Out

The Chrome Web Store extension bundle must contain ONLY the files Chrome needs to run the extension. Everything else must be excluded.

**Included in zip (Chrome extension files):**
```
manifest.json       ← required by Chrome
background.js       ← service worker
port-map.js         ← ES module (imported by background.js and popup.js)
popup.html          ← popup UI markup
popup.js            ← popup logic
popup.css           ← popup styles (added in Story 3.1)
icons/              ← icon assets (icon-16.png, icon-48.png, icon-128.png)
```

**Excluded from zip (dev-only):**

| Pattern | Reason |
|---------|--------|
| `tests/*` | Unit tests — not needed by Chrome runtime |
| `.github/*` | CI/CD workflows + BMAD skills — not needed by Chrome |
| `_bmad/*` | BMAD workflow tooling — project management only |
| `_bmad-output/*` | Planning artifacts, stories — not needed by Chrome |
| `.cursor/*` | IDE config — not needed by Chrome |
| `.agent/*` | Agent config — not needed by Chrome |
| `.claude/*` | Agent config — not needed by Chrome |
| `.git/*` | Git history — not needed by Chrome |
| `*.md` | All Markdown files (README, CONTRIBUTING, etc.) |
| `.gitignore` | Git config |
| `.DS_Store` | macOS metadata |
| `extension.zip` | The zip itself (avoid recursive include) |

### Secret Names — Exact Strings Required

The workflow uses these four secrets, which must be configured in the GitHub repository settings under **Settings → Secrets and variables → Actions**:

| Secret Name | What It Is |
|-------------|-----------|
| `CWS_EXTENSION_ID` | The Chrome Web Store extension ID (found in CWS Developer Dashboard URL, e.g., `abcdefghijklmnopqrstuvwxyzabcdef`) |
| `CWS_CLIENT_ID` | OAuth 2.0 Client ID from Google API Console |
| `CWS_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google API Console |
| `CWS_REFRESH_TOKEN` | OAuth 2.0 Refresh Token obtained via Google OAuth flow |

**Note on secret name discrepancy:** The epics document references `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN` (without `CWS_` prefix and without `EXTENSION_ID`). The architecture document (the authoritative source) specifies `CWS_*` names and includes `CWS_EXTENSION_ID`. Use the architecture spec — `CWS_*` names are more descriptive and include the required extension ID secret.

### Actions Used — Versions and Sources

**`actions/checkout@v4`** — Official GitHub Actions checkout. Checks out the repository. Pin to `v4` (stable major version tag).

**`mnao305/chrome-extension-upload@v5.0.0`** — Publishes a zipped Chrome extension to the Chrome Web Store using the CWS Publish API. This action:
- Uploads the zip to the CWS as a draft
- Publishes it immediately after upload
- Requires `extension-id`, `client-id`, `client-secret`, `refresh-token`
- Source: [github.com/mnao305/chrome-extension-upload](https://github.com/mnao305/chrome-extension-upload)

**`softprops/action-gh-release@v2`** — Creates a GitHub Release from the tag that triggered the workflow. This action:
- Uses the pushed tag name as the release name automatically (from `github.ref_name`)
- Attaches the specified `files` to the release
- `generate_release_notes: true` auto-generates release notes from merged PRs since the last tag
- Source: [github.com/softprops/action-gh-release](https://github.com/softprops/action-gh-release)

### How a Release Is Triggered

```sh
# On the maintainer's local machine:
# 1. Update version in manifest.json (e.g., "version": "1.0.0")
# 2. Commit the version bump
git add manifest.json
git commit -m "chore: bump version to 1.0.0"

# 3. Create and push the tag — this triggers the workflow
git tag v1.0.0
git push origin v1.0.0
```

The workflow fires on `push` to a tag matching `v*.*.*`. It does NOT fire on regular branch pushes.

### One-Time OAuth Setup (Not Part of This Story)

The secrets require a one-time OAuth setup against the Google API Console. This is a manual human step done once by the project maintainer — it is NOT implemented as code. The workflow file assumes secrets are already configured.

For reference, the setup process involves:
1. Creating a Google API project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enabling the Chrome Web Store API
3. Creating OAuth 2.0 credentials (Client ID + Client Secret)
4. Running the OAuth flow to obtain a Refresh Token
5. Entering all four values in GitHub → Settings → Secrets

This is documented in the `mnao305/chrome-extension-upload` README.

### Validate YAML Locally Before Committing

YAML indentation errors are silent and only discovered when the workflow runs. Validate the file locally:

```sh
# Option 1: Python (available on macOS without install)
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/publish.yml')); print('✅ YAML valid')"

# Option 2: If GitHub CLI is installed
gh workflow list  # validates workflows after push
```

### No Tests for This Story

This story creates a YAML CI/CD configuration file. There are no automated tests to write. The verification is:
1. YAML syntax is valid (use the Python command above)
2. File is at the correct path
3. Secret names match exactly
4. Exclusion list is complete

### Files Modified by This Story

| File | Change |
|------|--------|
| `.github/workflows/publish.yml` | Create — complete GitHub Actions workflow |

**Do NOT touch:** any source files (`background.js`, `popup.js`, `popup.html`, `port-map.js`, `popup.css`), `manifest.json`, any `tests/` files, or any `_bmad-output/` files.

### References

- Epics: Story 4.2 ACs — tag-triggered zip + CWS publish + GitHub Release [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.2`]
- Architecture: CI/CD section — trigger, steps, secrets (Gap 2 resolution) [Source: `_bmad-output/planning-artifacts/architecture.md#Gap Analysis & Resolutions`]
- Architecture: zip exclusion list (`tests/`, `.github/`, `*.md`, `.gitignore`) [Source: `_bmad-output/planning-artifacts/architecture.md#File Organization Patterns`]
- Architecture: `publish.yml` at `.github/workflows/` [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]

## Dev Agent Record

### Agent Model Used

Gemini (Antigravity)

### Debug Log References

_None_

### Completion Notes List

- Created `.github/workflows/publish.yml` with the exact steps to build and publish the extension pipeline.
- Added step to zip the extension while excluding dev dependencies like `tests/`, `_bmad/`, `.github/`, etc.
- Configured publishing to the Chrome Web Store using `mnao305/chrome-extension-upload@v5.0.0` action.
- Added step to create a GitHub Release with the extension zip using `softprops/action-gh-release@v2`.
- Validated YAML file syntax locally via Python snippet.
- Manual verification completed: file exists, syntax valid, exclusion list complete, secrets match exactly.

### File List

_Files created/modified by dev agent:_

- `.github/workflows/publish.yml` (create — GitHub Actions release workflow)
