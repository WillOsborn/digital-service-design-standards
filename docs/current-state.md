# Current State

> The session handoff snapshot. `/end-session` updates this; `/start-session` reads it first.
> Keep it a **snapshot**, not a history — record material completions, delete what's superseded.
> If this file contradicts itself, the next session starts confused. Fix contradictions on sight.

**Last updated:** 2026-08-06 (third session that day)
**Active schema version:** v2.0 (Actor / Mission / Experience)
**Branch:** `main` — **pushed and in sync with `origin/main`** at session end. All 2026-08-06 work is backed up on the remote, except the gitignored `.claude/` skill edits noted below, which no push can carry.
**Concurrency check:** local `main` and `origin/main` were **in sync** at session end. At session start run `git status -sb` — if the branch shows `behind`, `diverged`, or local commits you did not make, suspect a concurrent session and read `git reflog` before acting. (This check deliberately names neither a SHA nor a commit count: both go stale the moment the next commit lands, including this file's own.)

**Branches:** `main` only, local and remote. `feature/mission-visualiser` was merged and deleted on 2026-08-06; its history lives on in `main`.

---

## Status

**v2.0 is complete and green across every workstream except WS8.** Schemas, all four example sets, validators, quality scoring, converter, all 17 `.claude/skills/`, the standards docs, and the WS7 Claude Manager org skills. Verification: 12/12 examples validate at 85–100 quality, 94 validator tests, 16 layout tests, 83 renderer tests, 87 converter tests, all exit 0. One pre-existing failure in `run-all-tests.js` affects **v1.x only** — see *Verification baseline* below.

**Mission visualiser — complete, merged, and now reviewed by Will.** The deterministic Node CLI renders a v2.0 Mission as a self-contained two-mode HTML visualisation. Tasks 1–4 landed the layout module, renderer CLI, Explore mode, and Playwright-driven fixes. **Task 6 is done** — `.claude/skills/mission-renderer/SKILL.md` is a thin wrapper around the CLI. **Task 5 is now done too** (2026-08-06): the retail mission was published as an artifact in Explore mode, Will reviewed it, and one round of iteration landed.

Only **Task 6 Step 4** remains permanently open — committing the skill is impossible because `.claude/` is gitignored. Annotated in the plan rather than ticked.

**Channel glyphs shipped** (`f90edaa`) from Will's review. Every Mission node now shows a small monochrome glyph per distinct channel category: **shape = category** (digital / telecom / physical), **fill = serviceModel** (outline self-service, solid managed, 40% both). Monochrome deliberately — node fill already encodes `nodeType` and the overlay encodes barrier heat, so a third colour language would collide with both. Right-aligned to the node edge, **not centred**: Playwright showed centred glyphs sitting directly on the incoming edges, because edges arrive at the node's centre line in this columnar layout. Legend decodes shapes and fill rule using the same drawing code as the map; `aria-label` carries the same fact in words. Built test-first; renderer tests **45 → 83**.

**WS8 Figma Plugin — deliberately deferred, design captured.** Brainstormed to the middle of Section 2 of 4, then Will chose to sequence renderers and create/edit tooling ahead of export plugins. The full design is in `docs/superpowers/specs/2026-08-06-figma-pptx-export-design.md` (BACK-018) with six open questions listed. **Do not restart that work from scratch** — read the spec first. Also read **BACK-029** before resuming: the plugin bundles its own stale v1.1 schema copies with hardcoded channel enums.

**Channel vocabulary cleaned and locked down (BACK-022, BACK-023, BACK-024).** Three related
fixes landed this session, all verified against the full gate with quality scores unchanged:

- **`phone-call` and video calls are now `telecom`.** Voice/video was split across `physical`
  and `digital`. The rule now recorded in `CHANNEL_TAXONOMY.md`: categories follow **cost to
  serve**, not who builds the technology — a video call runs on digital-team software but
  occupies a contact-centre person, and the `digital`/`telecom` line is **synchronous human
  attention**, not transport. Email and chat queue and batch; a call does not.
- **30 of 85 channel entries held something that wasn't a channel type** — product and meeting
  names (`salesforce`, `board-meeting`, `g-cloud`) plus spelling variants (`web`, `in-person`).
  Normalised: **25 distinct values → 9, all canonical.** The instance moved to `name`, which 29
  of the 30 already carried, so no rendered heading changed.
- **All five sources that regenerate the drift are closed.** The converter could never emit
  `telecom` and passed names through verbatim (+8 regression tests, 79 → 87); `CHANNEL_TAXONOMY.md`
  was a **v1.1 document** describing `type` while v2.0 uses `channel` (retargeted to 2.0.0);
  neither v2.0 standard gave any channel guidance at all; and the `actor-builder` /
  `mission-builder` skills prompted with the wrong vocabulary (**local-only — `.claude/` is
  gitignored**).

---

## Immediate next action

**BACK-021 — build a channel-switching Mission example.** Will ended the previous session to
start fresh for maximum context, then spent this one on the channel vocabulary cleanup that
BACK-021 depends on. Someone starts online, hits a problem, moves to chat, then phone —
switching channels throughout.

**Why this matters more than it sounds.** Measured across all four mission examples
(85 channel entries incl. actors, 73 nodes, 77 edges), the vocabulary needed for channel
switching is largely the vocabulary nothing exercises:

| Vocabulary | Usage across all 4 examples |
|---|---|
| `interaction` (human / automated / ai_assisted) | **0** |
| `ownership` (own / third_party / partner) | **0** |
| `category: telecom` | **9 entries** — no longer zero (fixed this session) |
| nodeTypes `handoff`, `branch`, `loop_start`, `loop_end` | **unused** (4 of 10) |
| edgeTypes `error`, `timeout`, `escalation` | **unused** (3 of 6) |

So this is not "another example for variety" — it is the test case that shows whether half
the Mission schema actually works. Expect it to surface what **BACK-020** (ambient
always-available help channels) really needs, which is why 021 should come before 020
rather than designing that schema change speculatively.

**Sequence agreed with Will:** BACK-021 → BACK-020 → then Actor/Experience renderers. The
renderers come last deliberately: if BACK-020 changes the schema, anything already rendering
channels has to be rebuilt.

**Note there is no create/edit tooling** — authoring this Mission by hand *is* the honest
test of that gap. Read §5 of `2026-05-04-v2.0-handoff.md` for enum gotchas before writing
the JSON, and validate with `--check-refs` as you go.

**Two things from this session feed straight in:** `mission-builder` now prompts with the
correct channel vocabulary, so authoring should surface real schema gaps rather than
vocabulary drift; and the channel-vs-name rule is now documented, so write
`{ "channel": "chat", "name": "..." }`, never a product name in `channel`.

Smaller option if something lighter is wanted: **BACK-017** (`run-all-tests.js` — needs a
decision on which version the runner should target).

---

## In flight / uncommitted

None in git. Working tree clean, everything committed.

**But two gitignored changes exist only on this machine** — `.claude/skills/actor-builder/SKILL.md`
(prompted for `web`, the origin of all 8 `web` entries) and `.claude/skills/mission-builder/SKILL.md`
(asked "what channels does this step use?" with no vocabulary at all, which is how `salesforce`
and `board-meeting` were written verbatim). Both now carry the channel type list and the
channel-vs-name rule. **No commit contains them; a fresh clone will not have them.**

Everything else is committed **and pushed** — see the header.

---

## Open worktrees

None. Single working tree on `main`.

---

## Active plans

- `docs/superpowers/plans/2026-07-23-mission-visualiser.md` — **complete and merged.** 28 of 29 steps ticked. Task 5 was completed 2026-08-06 (against the retail mission rather than the energy one the plan named — annotated in place). The single remaining step is Task 6 Step 4, which is impossible: `.claude/` is gitignored.
  Spec: `docs/superpowers/specs/2026-07-23-mission-visualiser-design.md`
- `docs/superpowers/specs/2026-08-06-figma-pptx-export-design.md` — **deferred design, no plan yet.** Figma + PowerPoint export for Actor/Experience. Sections 1–2 approved, 3–4 drafted only, six open questions. Read before resuming BACK-018.
- `docs/superpowers/plans/2026-05-04-v2.0-implementation.md` — the v2.0 build. WS1–WS7, WS9, WS10 done. **WS8 (Figma Plugin) remains, now deliberately deferred** — see the spec above.
- `docs/superpowers/plans/2026-05-04-v2.0-handoff.md` — a prior session handoff, superseded by this file for *state*. Still the reference for **schema enum gotchas (§5)** and known issues — read §5 before authoring example JSON.

---

## Known constraints

- **`.claude/` is gitignored.** All 17 skills, `PROJECT_CONTEXT.md`, `VERSIONING_WORKFLOW.md`, and the `/start-session`, `/end-session`, `/backlog` commands are **local-only** — absent from a fresh clone or a second machine, and unprotected by git. Work landing there is invisible to every commit. Say so when it happens.
- **`BACKLOG.md` and `backlog.json` are also gitignored** — same caveat. The CLI is `node tools-internal/backlog.js` (not `tools/backlog.js`).
- **`backlog.json` is the source of truth; `BACKLOG.md` is generated.** `add` and `park` write only to the JSON — you must run `node tools-internal/backlog.js sync` or the Markdown silently keeps showing stale contents. `sync` regenerates the file's header from a template in `backlog.js`, so hand-edits to the top of `BACKLOG.md` are discarded — fix that template instead.
- **Sub-agents have Write and Bash denied** in this project. Write files in the main session; sub-agents are read-only research.
- **ajv is compiled once at module load** in the validator. Do not instantiate Ajv per call.
- Schema enum values are easy to get wrong — see §5 of the v2.0 handoff doc before authoring example JSON.
- **The channel object does not restrict `additionalProperties`.** A v1.1-shaped key such as
  `type` or `usage_context` validates cleanly and is then **silently ignored** — the data is
  lost with no error. Use v2.0 names (`channel`, `usageContext`).
- **`channel` takes a *type*, `name` takes the instance.** `{ "channel": "app", "name":
  "Salesforce CRM" }`, never `{ "channel": "salesforce" }`. The field is a free string so the
  wrong value validates silently and fragments every channel-mix analysis. Two entries on one
  node may share a type and differ only by `name` — correct, not a duplicate. Full rules in
  `documentation/CHANNEL_TAXONOMY.md` (now v2.0-targeted).

---

## Verification baseline

The `/end-session` gate, re-measured 2026-08-06 (third session):

```bash
node tools/validators/test-v2.0-validator.js          # exit 0 — 94 passed, 0 failed
node tools/renderers/test-mission-layout.js           # exit 0 — 16 passed, 0 failed
node tools/renderers/test-render-mission.js           # exit 0 — 83 passed, 0 failed
node tools/converters/test-converter.js               # exit 0 — 87 passed, 0 failed
node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs
                                                      # exit 0 — 12/12, 85-100 quality
node tools/validators/run-all-tests.js                # exit 1 — KNOWN FAILURE, see below
```

**`test-converter.js` belongs in the gate** — it was previously omitted. It rose 79 → 87 with
the channel translation fix: 8 tests covering telecom inference, name normalisation, the
physical fallback, and custom-channel passthrough. `test-render-mission.js` rose 45 → 83
earlier with the channel glyph work.

**Check exit codes directly** (`out=$(node <test> 2>&1); code=$?`) — piping to `tail`/`grep`
reports the pipe's exit status, not `node`'s.

**Quality scores are a regression signal.** They sat at 85–100 before and after this session's
30-entry data change, byte-identical. The scorer only tests channel *presence*, not values, so
any movement after a data-only edit means something else broke.

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
