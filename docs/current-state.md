# Current State

> The session handoff snapshot. `/end-session` updates this; `/start-session` reads it first.
> Keep it a **snapshot**, not a history — record material completions, delete what's superseded.
> If this file contradicts itself, the next session starts confused. Fix contradictions on sight.

**Last updated:** 2026-08-06
**Active schema version:** v2.0 (Actor / Mission / Experience)
**Branch:** `feature/mission-visualiser` (no upstream tracking branch — never pushed; first push needs `git push -u origin feature/mission-visualiser`)
**HEAD at handoff:** 8353237 — the commit that adds this file lands one ahead, so a fresh `/start-session` should expect to be exactly one commit past this SHA. Anything more is a concurrent session.

---

## Status

**v2.0 is complete and green across every workstream except WS8.** Schemas, all four example sets, validators, quality scoring, converter, all 17 `.claude/skills/`, the standards docs, and — as of this session's commits — the WS7 Claude Manager org skills. Full verification passes: 12/12 examples validate at 85–100 quality, validator suite exit 0, 16 layout tests, 45 renderer tests.

**Mission visualiser** (this branch) — the deterministic Node CLI that renders a v2.0 Mission as a self-contained two-mode HTML visualisation. Plan Tasks 1–4 have landed: layout module, renderer CLI with static SVG + themes + Overview mode, Explore mode (inspect panel, lane filters, barrier heat), and Playwright-driven visual fixes including occupancy-aware loop-back routing. **Task 6 is outstanding** — `.claude/skills/mission-renderer/SKILL.md` still describes hand-authored SVG and contains no reference to `tools/renderers/render-mission.js`.

**WS8 Figma Plugin** (`tools-internal/figma-plugin/`) is untouched — still v1.1-only generation. It is the last unstarted v2.0 workstream.

---

## Immediate next action

**Task 6 of the mission visualiser plan:** rewrite `.claude/skills/mission-renderer/SKILL.md` as a thin wrapper around the CLI — run `node tools/renderers/render-mission.js` on a Mission JSON, publish the resulting fragment as an artifact — replacing the current hand-authored-SVG instructions. This is the last task standing between the visualiser and being usable through the skill rather than by hand.

After that, the branch is ready to merge and **WS8 Figma Plugin** is the remaining v2.0 work. Read `tools-internal/figma-plugin/ui.html` and `README.md` first.

---

## In flight / uncommitted

None. Working tree clean.

---

## Open worktrees

None. Single working tree on `feature/mission-visualiser`.

---

## Active plans

- `docs/superpowers/plans/2026-07-23-mission-visualiser.md` — **Tasks 1–4 landed, Task 6 outstanding.**
  ⚠️ The plan's checkboxes are all unticked (0 of 29) despite Tasks 1–4 being committed. They were never ticked during implementation. Treat the commit log as the source of truth for what's done, and tick them when next in the file.
  Spec: `docs/superpowers/specs/2026-07-23-mission-visualiser-design.md`
- `docs/superpowers/plans/2026-05-04-v2.0-implementation.md` — the v2.0 build. WS1–WS7, WS9, WS10 done. **WS8 remains.**
- `docs/superpowers/plans/2026-05-04-v2.0-handoff.md` — a prior session handoff, superseded by this file for *state*. Still the reference for **schema enum gotchas (§5)** and known issues — read §5 before authoring example JSON.

---

## Known constraints

- **`.claude/` is gitignored.** All 17 skills, `PROJECT_CONTEXT.md`, `VERSIONING_WORKFLOW.md`, and the `/start-session`, `/end-session`, `/backlog` commands are **local-only** — absent from a fresh clone or a second machine, and unprotected by git. Work landing there is invisible to every commit. Say so when it happens.
- **`BACKLOG.md` and `backlog.json` are also gitignored** — same caveat. The CLI is `node tools-internal/backlog.js` (not `tools/backlog.js`).
- **Sub-agents have Write and Bash denied** in this project. Write files in the main session; sub-agents are read-only research.
- **ajv is compiled once at module load** in the validator. Do not instantiate Ajv per call.
- Schema enum values are easy to get wrong — see §5 of the v2.0 handoff doc before authoring example JSON.

---

## Verification baseline

The `/end-session` gate. All must exit 0 with zero failures:

```bash
node tools/validators/run-all-tests.js
node tools/validators/test-v2.0-validator.js          # 90 tests
node tools/renderers/test-mission-layout.js           # 16 tests
node tools/renderers/test-render-mission.js           # 45 tests
node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs   # 12/12, 85-100 quality
```
