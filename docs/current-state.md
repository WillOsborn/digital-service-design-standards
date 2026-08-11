# Current State

> The session handoff snapshot. `/end-session` updates this; `/start-session` reads it first.
> Keep it a **snapshot**, not a history — record material completions, delete what's superseded.
> If this file contradicts itself, the next session starts confused. Fix contradictions on sight.

**Last updated:** 2026-08-11
**Active schema version:** v2.0 (Actor / Mission / Experience)

**Branch:** `feature/roadside-mission` — **13 commits ahead of `main`, no upstream set.**
**`main` is itself 8 commits ahead of `origin/main`.** **Nothing is pushed.** 21 unpushed
commits in total. Will was asked at session end and had not yet decided; see *Decisions outstanding for Will*.

**Concurrency check:** at session end the working tree was clean, one worktree, no other
session evident. At session start run `git status -sb`. Expect `feature/roadside-mission` with
**no** `origin/` tracking line, and `main` ahead of `origin/main`. If either branch shows
`behind`, `diverged`, or commits you did not make, suspect a concurrent session and read
`git reflog` before acting.

**Branches:** `main`, `feature/roadside-mission` (local only — not on the remote).

---

## Status

**BACK-021 is complete.** The roadside assistance example set is authored, validated, rendered,
visually verified, and its findings written up. It is the fifth example domain and the first
drawn from a real, first-hand case rather than generated.

| Artifact | Quality |
|---|---|
| `v2.0/examples/roadside/actor-adam-rees.json` | 100/100 |
| `v2.0/examples/roadside/actor-daniel-rees.json` | 100/100 |
| `v2.0/examples/roadside/mission-roadside-assistance.json` | 95/100 (38 nodes, 45 edges, 6 phases, 4 paths) |
| `v2.0/examples/roadside/exp-adam-roadside-recovery.json` | 100/100 |

**The objective was met.** Vocabulary that no example exercised now carries real data:

| Dimension | Before | After |
|---|---|---|
| `nodeType` | 6 of 10 | **10 of 10** — a repo first |
| `edgeType` | 3 of 6 | **6 of 6** |
| `interaction` | **0 uses** | all three values |
| `ownership` | **0 uses** | all three values |

**All seven predicted schema gaps confirmed** against a stated threshold of five, **plus four
unpredicted gaps and seven tooling defects.** The unpredicted ones are the more valuable output
— they were only findable by authoring.

**The Mission is deliberately 95/100, not 100.** The last five points require a numeric
`frequency` on every path, meaning a proportion-of-actors figure for a single observed case.
Supplying one would fabricate a statistic and contradict the artifact's own provenance. Do not
"fix" this by adding invented numbers — it is filed as BACK-040.

**BACK-027 (channel spelling constraint) remains deliberately deferred** behind BACK-020.
Designed and specced, not implemented. See `docs/superpowers/specs/2026-08-06-channel-pattern-constraint-design.md`.

**A retrospective was written**, covering process rather than schema:
`docs/superpowers/retrospectives/2026-08-11-back-021-retrospective.md`.

---

## Immediate next action

**Decide the scope of BACK-020 before building anything.**

BACK-020 is titled "no way to express ambient/always-available help channels" — that names
**one symptom**. BACK-021 produced **eight distinct channel-modelling gaps** sharing one root
cause:

1. Ambient across the whole service (benefits app home screen; concierge number on a bank card)
2. Ambient for one node's duration (assistance line during a wait)
3. Channels that expire mid-case (partner tracking site; provider app tracking)
4. `ownership` cannot express degrees of remove — one value, four relationships
5. Channels that exist but are not signposted
6. Channels wholly outside the service that it nonetheless depends on
7. Channels used by a different person than the case holder
8. `interaction` fixed per channel, so it cannot differ between designed and observed paths

Fixing only ambient availability means returning to this within a session. And because
**BACK-027 sits behind BACK-020**, this decision now governs a much larger piece of work than
when the deferral was agreed.

Relevant backlog: **BACK-020** (rewritten this session with the evidence), **BACK-035**
(channel-actor attribution), **BACK-036** (handoff payload), **BACK-037** (paths cannot express
channel-only variation), **BACK-043** (relationship/discoverability/provenance of use),
**BACK-044** (`interaction` fixed per channel).

**Smaller, cheaper options if something lighter is wanted:**

- **A v2.0 authoring quick-reference** — every enum, length cap, and non-obvious shape in one
  file next to the schemas. Authoring this set cost ~8 validation round-trips and ~60 errors,
  essentially all of them "the rule exists but nowhere an author would look". Cheap and
  compounding. Not yet filed as a backlog item; proposed in retrospective §8.3.
- **BACK-031** — quality score is printed for artifacts that fail validation. An Experience
  with 49 errors showed `Quality: 100/100` directly above its `FAIL`.
- **BACK-032** — the validator checks no graph references at all.
- **BACK-042** — gitignore `.playwright-mcp/` and root `*.png`. Two lines.

---

## Decisions outstanding for Will

1. **Push or not.** 21 unpushed commits across two branches. Nothing has left the machine.
2. **Whether to merge `feature/roadside-mission` into `main`** or keep it separate for review.
3. **⚠️ The source notes are in `main`'s git history.** `research/private/roadside-assistance/`
   is gitignored *now*, but the notes were committed first (`2aca628`, `4bf5300`) and later
   untracked. They contain real personal detail — bank, family members, a live insurance
   dispute, travel abroad — and `PROJECT_CONTEXT.md` records an intent to publish this
   repository.
   **Because `main` is unpushed, this is still fixable without rewriting published history.**
   Once pushed, it is not. Removing them requires a history rewrite, which this project's
   forward-only git discipline otherwise forbids — so it needs an explicit decision.

---

## In flight / uncommitted

**Nothing uncommitted.** Working tree clean, all work committed.

**Unpushed:** 21 commits (8 on `main`, 13 on `feature/roadside-mission`).

**Gitignored changes that exist only on this machine and are in no commit:**
- `.claude/commands/start-session.md` — the false sub-agent permissions guardrail was corrected.
- `.claude/commands/end-session.md` — its verification baseline numbers were stale (94 / 45 /
  12 of 12) and were corrected to the real figures.
- `research/private/roadside-assistance/2026-08-06-source-notes.md` — the interview record,
  deliberately untracked.
- `backlog.json` / `BACKLOG.md` — 14 new items this session.

---

## Open worktrees

None. Single working tree.

---

## Active plans

- `docs/superpowers/plans/2026-08-06-roadside-mission.md` — **complete.** All ten tasks done.
- `docs/superpowers/specs/2026-08-06-roadside-mission-design.md` — the design, with **§11
  Findings** added: prediction verdicts, unpredicted gaps, tooling defects, verification.
- `docs/superpowers/retrospectives/2026-08-11-back-021-retrospective.md` — **read this before
  planning the next piece of work.** Process lessons, the four-root-cause reframe of the
  backlog, and the argument for rescoping BACK-020.
- `docs/superpowers/specs/2026-08-06-channel-pattern-constraint-design.md` — **BACK-027,
  designed and deliberately deferred.** Do not implement before BACK-020. Carries an open
  question about schema-annotation vs shared-module.
- `docs/superpowers/specs/2026-08-06-figma-pptx-export-design.md` — **deferred design, no plan.**
  WS8. Read before resuming BACK-018; also read BACK-029.
- `docs/superpowers/plans/2026-05-04-v2.0-implementation.md` — the v2.0 build. WS1–WS7, WS9,
  WS10 done. WS8 deferred.
- `docs/superpowers/plans/2026-05-04-v2.0-handoff.md` — superseded by this file for *state*.
  Still the reference for **schema enum gotchas (§5)** — read before authoring example JSON.

---

## Known constraints

- **`.claude/` is gitignored.** All skills, `PROJECT_CONTEXT.md`, `VERSIONING_WORKFLOW.md` and
  the slash commands are local-only — absent from a fresh clone and unprotected by git.
- **`BACKLOG.md` and `backlog.json` are gitignored.** CLI is `node tools-internal/backlog.js`.
- **`backlog.json` is the source of truth; `BACKLOG.md` is generated.** `add` and `park` write
  only to the JSON — run `sync` or the Markdown silently keeps showing stale contents.
- **The backlog CLI cannot edit an existing item's description.** Updating BACK-020 required
  hand-editing `backlog.json`. Back it up first — it is gitignored, so there is no safety net.
- **Sub-agents work here.** Write, Edit and Bash all verified 2026-08-06 (the `deny` list in
  `.claude/settings.local.json` is empty). A long-standing note claiming they were denied was
  **wrong** and had stood for months. Caveat: verified in one permission mode only; re-probe
  rather than assume.
- **ajv is compiled once at module load** in the validator. Do not instantiate Ajv per call.
- **`additionalProperties: true` on `laneContent` and several Actor objects means invented keys
  validate cleanly and are silently discarded** — with a PASS and a quality score to reassure
  you. This caught an author three times in one session while actively watching for it. Read
  the schema shape before writing; do not trust a PASS. Filed as BACK-033.
- **Lane IDs disagree with `laneContent` property names** — declared `design-opps` vs typed
  `designOpportunities`, declared `accessibility` vs typed `accessibilityProfile`. Following the
  schema's own documented rule yields an **unvalidated** key. The roadside set uses the typed
  names deliberately. Filed as BACK-034.
- **`channel` takes a *type*, `name` takes the instance.** `{ "channel": "app", "name":
  "Salesforce CRM" }`, never `{ "channel": "salesforce" }`. Full rules in
  `documentation/CHANNEL_TAXONOMY.md`.
- **Node names truncate beyond ~28 characters** in the renderer's Overview mode. Write the short
  label; put detail in `description`.
- **Node names must be outcome-neutral** where a mission carries both designed and observed
  paths — `dropoff-location-disputed` had to be renamed once a designed path traversed it.

---

## Verification baseline

Re-measured 2026-08-11. **Check exit codes directly** (`out=$(node <test> 2>&1); code=$?`) —
piping to `tail`/`grep` reports the pipe's status, not node's.

```bash
node tools/validators/test-v2.0-validator.js    # exit 0 — 98 passed
node tools/renderers/test-mission-layout.js     # exit 0 — 16 passed
node tools/renderers/test-render-mission.js     # exit 0 — 83 passed
node tools/converters/test-converter.js         # exit 0 — 87 passed
node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs
                                                # exit 0 — 16/16, quality 85-100
node tools/validators/run-all-tests.js          # exit 1 — KNOWN FAILURE, see below
```

**`test-v2.0-validator.js` is data-dependent — do not treat its count as a fixed baseline.**
It walks `v2.0/examples/` with `readdirSync` and generates **one assertion per example file**
(`test-v2.0-validator.js:371-384`), so the total grows whenever an example is added. It read 94
before the roadside set and 98 after; the four new artifacts are the entire difference. **The
rule is the baseline, not the number.**

Quality scores are a regression signal. The other four example sets must stay at 85–100 and
byte-identical after any data-only change.

**⚠️ A quality score does not mean the artifact is valid.** Scoring and schema validation run
independently — an Experience with 49 validation errors printed `Quality: 100/100` directly
above its `FAIL`. Read the errors, not the score. Filed as BACK-031.

### Known failure: `run-all-tests.js` exits 1 (pre-existing, v1.x only)

Its **v2.0 half passes cleanly.** Its v1.x half cannot find any schema and reports 6 errors,
because the runner defaults `baseDir` to `v1.0.2/` (lines 33, 71) and expects a
`base/` + `persona/` + `journey/` + `patterns/` layout matching **no version in this repo**.
Not caused by any recent work. Fixing it needs a decision on what the runner should target, so
it is logged as **BACK-017** rather than patched. Treat the four suites above as the real gate.
