# Current State

> The session handoff snapshot. `/end-session` updates this; `/start-session` reads it first.
> Keep it a **snapshot**, not a history — record material completions, delete what's superseded.
> If this file contradicts itself, the next session starts confused. Fix contradictions on sight.

**Last updated:** 2026-08-06
**Active schema version:** v2.0 (Actor / Mission / Experience)
**Branch:** `main` — the mission visualiser work was fast-forwarded in and pushed on 2026-08-06. `origin/main` now carries all of v2.0 (it previously sat at v1.1 only, 28 commits behind).
**Concurrency check:** local `main` and `origin/main` were **in sync** at session end. At session start run `git status -sb` — if the branch has diverged, or local commits exist that you did not make, suspect a concurrent session and read `git reflog` before acting. (This check deliberately names no SHA: a SHA recorded here goes stale the moment the next commit lands, including this file's own.)

**Branches:** `main` only, local and remote. `feature/mission-visualiser` was merged and deleted on 2026-08-06; its history lives on in `main`.

---

## Status

**v2.0 is complete and green across every workstream except WS8.** Schemas, all four example sets, validators, quality scoring, converter, all 17 `.claude/skills/`, the standards docs, and — as of this session's commits — the WS7 Claude Manager org skills. Verification: 12/12 examples validate at 85–100 quality, 94 validator tests, 16 layout tests, 45 renderer tests, all exit 0. One pre-existing failure in `run-all-tests.js` affects **v1.x only** — see *Verification baseline* below.

**Mission visualiser — complete and merged.** The deterministic Node CLI renders a v2.0 Mission as a self-contained two-mode HTML visualisation. Tasks 1–4 landed the layout module, renderer CLI (static SVG, both themes, Overview), Explore mode (inspect panel, lane filters, barrier heat), and Playwright-driven fixes including occupancy-aware loop-back routing. **Task 6 is done** — `.claude/skills/mission-renderer/SKILL.md` is now a thin wrapper that runs `tools/renderers/render-mission.js` and publishes the fragment as an artifact, with `Bash`/`Artifact` added to its `allowed-tools` (the old version lacked them and could not have run the CLI).

Two plan steps remain permanently open, deliberately:
- **Task 5** (publish artifact + user iteration) — blocks on Will's feedback on a published artifact, which has not happened. Do this whenever a real mission needs sharing.
- **Task 6 Step 4** (commit the skill) — impossible; `.claude/` is gitignored, so the rewrite is local-only. Annotated in the plan rather than ticked.

**WS8 Figma Plugin** (`tools-internal/figma-plugin/`) is untouched — still v1.1-only generation. It is the last unstarted v2.0 workstream.

---

## Immediate next action

**WS8 Figma Plugin** — the last unstarted v2.0 workstream, and now the only substantial one left. `tools-internal/figma-plugin/` still generates v1.1 artifacts only. **Read `ui.html` and `README.md` first** to understand what exists before changing anything; add v2.0 Actor/Mission/Experience export alongside v1.1 rather than replacing it. Note the plugin runs in a sandboxed iframe — output is JSON the user copies out.

Smaller options if you want something lighter: fix `run-all-tests.js` (BACK-017, needs a decision on target version), or run Task 5 by publishing a mission artifact for real feedback.

---

## In flight / uncommitted

None. Working tree clean.

---

## Open worktrees

None. Single working tree on `feature/mission-visualiser`.

---

## Active plans

- `docs/superpowers/plans/2026-07-23-mission-visualiser.md` — **complete and merged.** 24 of 29 steps ticked; the 5 remaining are Task 5 (awaits Will's artifact feedback) and Task 6 Step 4 (impossible — gitignored). Checkbox state now matches the commit log.
  Spec: `docs/superpowers/specs/2026-07-23-mission-visualiser-design.md`
- `docs/superpowers/plans/2026-05-04-v2.0-implementation.md` — the v2.0 build. WS1–WS7, WS9, WS10 done. **WS8 remains** — the only substantial v2.0 work left.
- `docs/superpowers/plans/2026-05-04-v2.0-handoff.md` — a prior session handoff, superseded by this file for *state*. Still the reference for **schema enum gotchas (§5)** and known issues — read §5 before authoring example JSON.

---

## Known constraints

- **`.claude/` is gitignored.** All 17 skills, `PROJECT_CONTEXT.md`, `VERSIONING_WORKFLOW.md`, and the `/start-session`, `/end-session`, `/backlog` commands are **local-only** — absent from a fresh clone or a second machine, and unprotected by git. Work landing there is invisible to every commit. Say so when it happens.
- **`BACKLOG.md` and `backlog.json` are also gitignored** — same caveat. The CLI is `node tools-internal/backlog.js` (not `tools/backlog.js`).
- **`backlog.json` is the source of truth; `BACKLOG.md` is generated.** `add` and `park` write only to the JSON — you must run `node tools-internal/backlog.js sync` or the Markdown silently keeps showing stale contents. `sync` regenerates the file's header from a template in `backlog.js`, so hand-edits to the top of `BACKLOG.md` are discarded — fix that template instead.
- **Sub-agents have Write and Bash denied** in this project. Write files in the main session; sub-agents are read-only research.
- **ajv is compiled once at module load** in the validator. Do not instantiate Ajv per call.
- Schema enum values are easy to get wrong — see §5 of the v2.0 handoff doc before authoring example JSON.

---

## Verification baseline

The `/end-session` gate, as measured 2026-08-06:

```bash
node tools/validators/test-v2.0-validator.js          # exit 0 — 94 passed, 0 failed
node tools/renderers/test-mission-layout.js           # exit 0 — 16 passed, 0 failed
node tools/renderers/test-render-mission.js           # exit 0 — 45 passed, 0 failed
node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs
                                                      # exit 0 — 12/12, 85-100 quality
node tools/validators/run-all-tests.js                # exit 1 — KNOWN FAILURE, see below
```

### ⚠️ Known failure: `run-all-tests.js` exits 1 (pre-existing, v1.x only)

Its **v2.0 half passes cleanly** (12 examples, 0 failed). Its **v1.x half cannot find
any schema** and reports 6 errors:

```
❌ base/persona-base.json - MISSING
❌ persona/business-persona.json - MISSING
❌ persona/consumer-persona.json - MISSING
❌ persona/employee-persona.json - MISSING
❌ journey/journey-schema.json - MISSING
❌ patterns/pattern-schema.json - MISSING
```

**Cause:** the runner defaults `baseDir` to `v1.0.2/` (lines 33 and 71) and expects a
`base/` + `persona/` + `journey/` + `patterns/` subdirectory layout that **matches no
version in this repo**. v1.0.2 keeps its four schemas flat in `v1.0.2/schemas/`; v1.1
uses `v1.1/schemas/` with different filenames (`core-persona.schema.json`,
`pairing.schema.json`, `role-card.schema.json`, `journey-schema.json`). The layout the
runner wants appears to be a v1.0.0/v1.0.1-era expectation never updated — note its own
header comment claims "v1.1 schemas and v2.0 schemas" while the default points at
v1.0.2. Separately, `patterns/` is gitignored, so `pattern-schema.json` would be missing
on any fresh clone regardless.

**Not caused by any recent work.** Fixing it needs a decision on what the runner should
target (v1.1? v1.0.2? both?), so it is logged rather than patched. Until then, **treat
the four suites above as the real gate** and `run-all-tests.js` exit 1 as expected.
