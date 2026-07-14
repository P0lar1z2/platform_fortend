# Raventik Agent Notes

This file is the default project guidance for Raventik-related work unless a
more specific repository-level instruction overrides it.

## Scope

- Treat this file as durable guidance for Raventik frontend, backend, and data
  workflow work.
- Keep repository-specific technical details close to the relevant repository,
  but keep cross-project operating rules here.
- When context is unclear, inspect the local repository, current branch, and
  working tree before editing.

## Git Discipline

- Do not commit, push, merge, deploy, or create branches unless the user
  explicitly asks for that action.
- Use lightweight GitHub Flow unless the user specifies another workflow:
  `dev` is the integration branch, and each independently reviewable feature or
  fix should use a short-lived feature branch.
- Keep branch names short and behavior-focused. Do not add a personal-name
  prefix unless the user explicitly asks.
- Keep one behavioral theme per branch and one focused commit per independently
  reversible behavior.
- Inspect `git status --short --branch` before editing and before committing.
- Never discard, reset, or overwrite user changes without explicit approval.
- If the working tree contains unrelated changes, stage only the files that
  belong to the current request.

## Commit Messages

- Commit messages must be bilingual: Chinese and English.
- Use professional, direct language that explains what changed and why.
- Prefer Conventional Commit-style subjects, for example:
  `feat(watch): add transaction image preview / 增加交易图片放大预览`.
- For non-obvious changes, include a commit body that records behavioral impact,
  validation, and any important trade-offs.

## Frontend Verification

- Every user-facing frontend change must be verified in a real browser when
  practical.
- For visible UI or interaction changes, verify the affected desktop flow and a
  mobile viewport flow before reporting completion.
- If browser verification cannot be completed, explicitly report the gap and
  the reason.

## Mobile First Verification

- Every user-facing UI or interaction change must consider mobile behavior,
  especially iOS-sized viewports.
- Controls must remain tappable on touch screens.
- Text must not collapse into vertical characters, overflow its container, or
  overlap adjacent UI.
- Dialogs, popovers, menus, and image previews must fit the viewport and expose
  reliable close behavior.
- Scrolling behavior must remain usable on mobile; modal scroll locking should
  restore the previous page state after close.

## Process Cleanup

- Actively clean up helper processes started for a task when they are no longer
  needed, especially temporary Vite servers, headless browsers, test watchers,
  proxies, and one-off scripts.
- Keep a development server running only when the user still needs a live URL or
  when the in-app browser is using that localhost page.
- Before terminating a process, identify it from its command line or parent
  process. Do not terminate unrelated user browsers, editors, or services.

## Protect Existing Work

- Preserve unrelated user edits and generated artifacts.
- If a file has user changes that overlap the requested work, read it carefully
  and work with those changes instead of reverting them.
- Keep edits scoped to the requested behavior and the code paths needed to
  verify it.

