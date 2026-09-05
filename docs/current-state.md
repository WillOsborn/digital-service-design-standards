# Current State

> The session handoff snapshot. `/end-session` updates this; `/start-session` reads it first.
> Keep it a **snapshot**, not a history — record material completions, delete what's superseded.
> If this file contradicts itself, the next session starts confused. Fix contradictions on sight.

**Last updated:** 2026-09-05
**Active schema version:** v2.0 (Actor / Mission / Experience)

**Branch:** `main`, **in sync with `origin/main`** (pushed 2026-09-05 after the actor-export
merge). `feature/actor-export` was fast-forwarded into `main` and deleted. `feature/roadside-mission`
is fully merged into `main` but still exists locally and on the remote — safe to delete, not yet
done (Will's call).

**Concurrency check:** at session end the working tree was clean, one worktree, `main` in sync
with `origin`. At session start run `git status -sb`. If `main` shows `behind`, `diverged`, or
commits you did not make, suspect a concurrent session and read `git reflog` before acting.

---

## Status

**BACK-018 phase 1 — Actor → PowerPoint export — shipped and merged (2026-09-05).**

```
node tools/renderers/render-pptx.js v2.0/examples/roadside/ -o exports/roadside.pptx
tools/renderers/pptx/verify-pptx.sh exports/roadside.pptx      # visual gate: LibreOffice → PDF → PNG + overflow oracle
```

- Cover → index (2+ actors) → one summary per Actor → two-column paginated appendix.
- Summary headings (Will-approved after a spike): **Enduring traits / In context: <title> / When
  traits meet context**, each captioned with its source; demographics strip in the header; cap 5;
  full lists in speaker notes; never paginates, never shrinks.
- Validates first; refuses invalid input with exit 2 and nothing written. Warnings to stderr.
- `tools/design-tokens.json` is shared by the mission renderer (byte-identical output) and the
  exporter; `--theme brand.json` overrides with unknown-key warnings.
- `tools/viewmodels/actor-viewmodel.js` (+ `.d.ts`) is the target-neutral layer the Figma phase reuses.
- **Generated decks go in `exports/` (gitignored, added 2026-09-05).** Two are there now:
  `roadside-actors.pptx` (14 slides) and `all-example-actors.pptx` (37 slides).

All six example decks pass the visual gate with **no calibration constant changed and no font
size lowered**. The overflow oracle was proven on a canary and **fails closed**.

**BACK-021 (roadside example set)** remains complete; `feature/roadside-mission` was merged into
`main` on 2026-09-04.

**BACK-027** remains deferred behind BACK-020 (see *Schema work waiting*, below).

---

## Immediate next action

**Will's feedback on the decks, then the Figma phase.** Both are new-session work.

1. **Feedback iteration.** Open `exports/roadside-actors.pptx` in PowerPoint (LibreOffice output
   is layout-faithful, not pixel-identical). Known things to weigh: summary columns show 3–4 items
   with space below — the estimator's safety margin, not the cap, binds (**BACK-048**); the index
   at N=2 fills a quarter of the slide and its relationship connectors run in the gutter
   (**BACK-049**); whether opportunities belong on the summary after all. Layout numbers: `LAYOUT`
   in `tools/renderers/pptx/deck-model.js`; estimator constants: `FLOW` in
   `tools/renderers/pptx/flow.js`. **Never fix overflow by lowering a font size**; re-run
   `verify-pptx.sh` after any change.
2. **Figma phase** — spec §9 of `docs/superpowers/specs/2026-09-04-actor-export-design.md` lists
   what carries over and the four decisions to take first (HTML card proxy or not; archive vs
   delete the plugin's orphaned root `ui.html`; a component-mapping feasibility spike; index
   frame on a canvas). It needs its own brainstorm → spec → plan; do not implement from the
   superseded 2026-08-06 spec. `tools-internal/figma-plugin/` is gitignored and unprotected.

Read `docs/superpowers/retrospectives/2026-09-05-actor-export-retrospective.md` first — it holds
the rulings of record and the review pattern (nearly every defect was in the plan's own code).

**Schema work waiting (unchanged from 2026-08):** decide the scope of **BACK-020** — eight
channel-modelling gaps share one root cause and BACK-027 sits behind it. See BACK-020, -035, -036,
-037, -043, -044 and the BACK-021 retrospective.

---

## Decisions outstanding for Will

1. Delete `feature/roadside-mission` (local + remote)? It is fully merged.
2. The visual-judgement items in BACK-048 / BACK-049 (column fill, index at N=2, connector labels).
3. Whether the summary slide should carry opportunities (currently appendix-only, by Will's
   earlier call — revisit after use).

---

## In flight / uncommitted

**Nothing uncommitted.** Working tree clean; `main` pushed.

**Gitignored changes that exist only on this machine and are in no commit:**
- `.claude/skills/actor-deck-renderer/SKILL.md` — new skill wrapping the CLI (added 2026-09-05).
- `.claude/PROJECT_CONTEXT.md` — routing block now lists the renderers, view model, tokens and `exports/`.
- `.claude/commands/start-session.md` / `end-session.md` — corrected in the 2026-08 sessions (see git-ignored note in earlier handoffs; unchanged this session).
- `backlog.json` / `BACKLOG.md` — five new items (BACK-045…049), BACK-018 `in_progress`; synced.
- `exports/` — two generated decks.
- `research/private/roadside-assistance/2026-08-06-source-notes.md` — the interview record, deliberately untracked.

---

## Open worktrees

None. Single working tree.

---

## Active plans

- `docs/superpowers/plans/2026-09-04-actor-export-pptx.md` — **complete**, all 14 tasks ticked;
  Task 2 *Spike outcome* and Task 13 *Calibration notes* record what happened.
- `docs/superpowers/specs/2026-09-04-actor-export-design.md` — the design, **§13 amendments**
  (headings, demographics strip, cap 5) and **§9 the Figma phase scope**. Supersedes the 2026-08-06
  Figma/PPTX spec, which carries a banner and is history only.
- `docs/superpowers/retrospectives/2026-09-05-actor-export-retrospective.md` — **read before the
  next piece of export work.**
- `docs/superpowers/plans/2026-08-06-roadside-mission.md` — complete (BACK-021).
- `docs/superpowers/retrospectives/2026-08-11-back-021-retrospective.md` — process lessons and the
  case for rescoping BACK-020.
- `docs/superpowers/specs/2026-08-06-channel-pattern-constraint-design.md` — BACK-027, designed,
  deferred behind BACK-020.
- `docs/superpowers/plans/2026-05-04-v2.0-handoff.md` — superseded for *state*; still the
  reference for **schema enum gotchas (§5)** when authoring example JSON.

---

## Privacy posture — assume this repository is NOT private

**Treat `origin` as potentially public at any time.** Anything committed must be safe to publish.

- Never commit personal or client-identifying detail — names, employers, banks, providers,
  locations, dates, family circumstances, live disputes. Not in artifacts, docs, or commit messages.
- Research notes from real people go in `research/private/` (gitignored), pseudonymised from the outset.
- Example artifacts are fictional composites; record it in `governance`.
- **Generated decks go in `exports/` (gitignored)** — a deck built from real client Actors must
  never be committed. Committed plans use `<repo root>` / `<scratchpad>` rather than home-directory paths.
- Editing a file does not unpublish it. A history rewrite was needed on 2026-08-12 for exactly
  this reason; `origin/main`'s pre-rewrite commits were never altered, so no force-push was needed.
- Real names remain legitimately in `LICENSE` and as `**Owner:**` metadata.

---

## Known constraints

- **`.claude/` is gitignored.** Skills, `PROJECT_CONTEXT.md`, `VERSIONING_WORKFLOW.md` and the
  slash commands are local-only.
- **`backlog.json` is the source of truth; `BACKLOG.md` is generated** — run `sync` after any
  `add`/`park`/`update`. The CLI cannot edit an existing item's description.
- **The visual gate needs LibreOffice and poppler** (installed on this Mac via Homebrew on
  2026-09-04). `verify-pptx.sh` exits 3 (skipped) where they are absent; the headless suites do
  not need them. LibreOffice renders Calibri as Carlito (metric-compatible): layout-faithful, not
  pixel-identical.
- **The overflow oracle sees only text that reaches the slide edge** (LibreOffice clips vertically
  at the page box; hence the measured 12pt inset). A box overshoot of ~0.4–0.5in past a content
  frame lands in the footer band unseen — the estimator tests cover that case.
- **`tools/renderers/package.json` pins `pptxgenjs` at exactly `4.0.1`** because
  `package-lock.json` is gitignored repo-wide. A fresh clone needs `cd tools/renderers && npm install`
  to run `test-render-pptx.js` and the CLI; the other eight new suites need no dependencies.
- **Never lower a font size to fix overflow.** Raise `FLOW.wrapSlack`/`FLOW.safety`, adjust
  `typography.metrics`, or fix a coordinate in `LAYOUT`, then re-run the gate.
- **Sub-agents work here.** Pass an explicit `model` on every dispatch; tell reviewers the branch
  (one read the stale session-start snapshot).
- **`additionalProperties: true` on `laneContent` and several Actor objects** still means invented
  keys validate cleanly and are discarded (BACK-033). Lane IDs still disagree with `laneContent`
  property names (BACK-034). `channel` takes a *type*, `name` the instance. Node names truncate
  beyond ~28 characters in the mission renderer's Overview mode.
- **ajv is compiled once at module load** in the validator; do not instantiate per call.

---

## Verification baseline

Re-measured 2026-09-05 on `main`. **Check exit codes directly** (`out=$(node <test> 2>&1); code=$?`).

```bash
node tools/validators/test-v2.0-validator.js    # exit 0 — 98 passed (data-dependent: one assertion per example file)
node tools/renderers/test-mission-layout.js     # exit 0 — 16 passed
node tools/renderers/test-render-mission.js     # exit 0 — 83 passed
node tools/converters/test-converter.js         # exit 0 — 87 passed
node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs
                                                # exit 0 — 16/16, quality 85-100
node tools/renderers/test-design-tokens.js      # exit 0 — 38 passed
node tools/viewmodels/test-actor-viewmodel.js   # exit 0 — 124 passed
node tools/renderers/test-pptx-flow.js          # exit 0 — 78 passed
node tools/renderers/test-pptx-theme.js         # exit 0 — 17 passed
node tools/renderers/test-deck-model.js         # exit 0 — 142 passed
node tools/renderers/test-overflow-check.js     # exit 0 — 15 passed
node tools/renderers/test-render-pptx.js        # exit 0 — 50 passed (needs npm install in tools/renderers)
(cd tools/renderers && npm test)                # exit 0 — runs the nine renderer/view-model suites
tools/renderers/pptx/verify-pptx.sh <deck.pptx> # exit 0 — visual gate (LibreOffice + poppler); 3 = skipped
node tools/validators/run-all-tests.js          # exit 1 — KNOWN FAILURE, see below
```

`test-v2.0-validator.js` generates one assertion per file under `v2.0/examples/`; the synthetic
fixture lives in `tools/tests/fixtures/` and is deliberately outside that walk. Quality scores for
the five example sets must stay 85–100 and byte-identical after any data-only change.

**⚠️ A quality score does not mean the artifact is valid** (BACK-031). Read the errors.

### Known failure: `run-all-tests.js` exits 1 (pre-existing, v1.x only)

Its v2.0 half passes; its v1.x half cannot find any schema because the runner defaults `baseDir`
to `v1.0.2/` and expects a layout matching no version in this repo. Logged as **BACK-017**. Treat
the suites above as the real gate.
