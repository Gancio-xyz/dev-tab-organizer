# Story 4.4: Manual Workflow Dispatch for Publish Pipeline

**Status:** review

## Description
As a project maintainer,
I want to be able to trigger the extension publishing workflow manually from the GitHub Actions tab,
so that I can re-run a failed publish or force an update without necessarily pushing a new version tag.

## Context
The current `publish.yml` only triggers on version tag pushes (`v*.*.*`). Adding `workflow_dispatch` is a common best practice for CI/CD flexibility.

## Acceptance Criteria
- [x] The `publish.yml` workflow includes `workflow_dispatch` in the `on:` section.
- [x] The workflow can be seen and manually triggered from the GitHub Actions UI "Run workflow" menu.
- [x] Manual runs correctly package the extension from the current branch. (Note: Version validation against tag might need to be bypassable or adjusted for manual runs).

## Technical Notes
- Add `workflow_dispatch:` to the `on` triggers.
- Consider making the version validation step conditional or ensuring it handles the lack of a tag gracefully.

## Tasks / Subtasks
- [x] Add `workflow_dispatch:` to `on:` in `.github/workflows/publish.yml`.
- [x] Make "Validate manifest version matches tag" step conditional with `if: github.event_name == 'push'` so manual runs skip tag validation.

## Dev Agent Record
- **Implementation:** Added `workflow_dispatch:` under `on:`. Version validation step runs only on `push` (tag) events so manual runs package and publish from the current branch without requiring a tag.
- **Completion Notes:** Story 4.4 complete. All ACs satisfied. Manual trigger available in Actions UI; manual runs zip and publish from current branch; version check only on tag push.

## File List
- .github/workflows/publish.yml (modified)

## Change Log
- 2026-03-17: Implemented manual workflow dispatch; added workflow_dispatch trigger and conditional version validation for manual runs.
