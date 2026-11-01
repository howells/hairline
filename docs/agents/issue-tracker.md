# Issue tracker: Linear

Issues and specs for this repo live in Linear, workspace `howells`, team **Hairline** (key `HAI`): https://linear.app/howells/team/HAI/overview. Use the `linear-howells` MCP tools (`mcp__linear-howells__*`) for all operations. Do not use GitHub Issues for this repo, even though the code is on GitHub.

## Conventions

- **Create an issue**: `save_issue` with `team: "HAI"`, a title, and a markdown description (real newlines, not `\n`). New issues land in `Backlog` unless a state is given.
- **Read an issue**: `get_issue` with the identifier (e.g. `HAI-12`); `list_comments` for its thread.
- **List issues**: `list_issues` with `team: "HAI"`, filtered by `label`, `state` or `assignee`.
- **Make an issue a child of a parent**: `save_issue` with `parentId` set to the parent's identifier.
- **Comment on an issue**: `save_comment` with the issue identifier and a markdown body.
- **Apply / remove labels**: `save_issue` with `id` and `addLabels` / `removeLabels` (`labels` replaces the whole set).
- **Close**: `save_issue` with `state: "Done"` (or `"Canceled"` for won't-do), plus a closing comment.

Workflow states in HAI: Backlog, Todo, In Progress, In Review, Done, Canceled, Duplicate.

## Pull requests as a triage surface

**PRs as a request surface: no.** Linear issues are the only triage surface.

## When a skill says "publish to the issue tracker"

Create a Linear issue in team HAI.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **sub-issues** as tickets.

- **Map**: one HAI issue labelled `wayfinder:map` (create it with `save_issue_label` on team HAI if missing), holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a sub-issue of the map (`parentId`), labelled `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, assign it to the driving dev.
- **Blocking**: Linear's native "blocked by" relations (`save_issue` with `blockedBy`). A ticket is unblocked when every blocker is Done or Canceled.
- **Frontier query**: the map's open sub-issues with no open blocker and no assignee; first in map order wins.
- **Claim**: assign the issue to yourself and move it to `In Progress`, the session's first write.
- **Resolve**: comment the answer, move to `Done`, then append a context pointer (gist + link) to the map's Decisions-so-far.
