# Story 4.4: Manual Workflow Dispatch for Publish Pipeline

**Status:** ready-for-dev

## Description
As a project maintainer,
I want to be able to trigger the extension publishing workflow manually from the GitHub Actions tab,
so that I can re-run a failed publish or force an update without necessarily pushing a new version tag.

## Context
The current `publish.yml` only triggers on version tag pushes (`v*.*.*`). Adding `workflow_dispatch` is a common best practice for CI/CD flexibility.

## Acceptance Criteria
- [ ] The `publish.yml` workflow includes `workflow_dispatch` in the `on:` section.
- [ ] The workflow can be seen and manually triggered from the GitHub Actions UI "Run workflow" menu.
- [ ] Manual runs correctly package the extension from the current branch. (Note: Version validation against tag might need to be bypassable or adjusted for manual runs).

## Technical Notes
- Add `workflow_dispatch:` to the `on` triggers.
- Consider making the version validation step conditional or ensuring it handles the lack of a tag gracefully.
