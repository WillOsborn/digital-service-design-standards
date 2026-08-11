# BACK-021 retrospective — what authoring the roadside example set taught us

**Written:** 2026-08-11
**Work reviewed:** the roadside assistance example set, authored 2026-08-06/07 on `feature/roadside-mission`
**Artifacts:** 12 commits, 5,720 lines, 4 JSON artifacts
**Evidence base:** `research/roadside-assistance/2026-08-06-authoring-log.md` (918 lines, written as the work happened)
**Findings:** `docs/superpowers/specs/2026-08-06-roadside-mission-design.md` §11

> This is a **process** retrospective. The schema and tooling findings are already recorded in
> the log and the spec, and are only summarised here. What was missing — and what this
> document exists for — is the record of *how we worked*, what slowed us down, and what
> should change before the next piece of work.

---

## 1. Headline

BACK-021 did what it was designed to do. The Mission is the first in the repo to use all ten
`nodeType` values and all six `edgeType` values, and `interaction` and `ownership` went from
**zero uses across four missions** to all three values each.

All seven predicted schema gaps were confirmed against a stated threshold of five. But the
**four unpredicted gaps** are the more valuable output, because they could only be found by
authoring — which is the argument for having built the thing rather than reasoning about the
schema in the abstract.

**The most important strategic conclusion is not in the findings section:** BACK-020 is scoped
too small. See §6.

---

## 2. The miss that writing this retrospective found

**Four of the seven confirmed predictions were never filed as backlog items.**

Predictions 2 (ownership degrees of remove), 3 (unsignposted channels), 5 (channels outside
the service) and 6 (preconditions established by another journey) appear in the spec's findings
and in the authoring log, and had **zero presence in `backlog.json`**. Prediction 7 survived
only as a *rendering* item (BACK-038), not as the schema gap it actually is.

The Task 10 step said "file backlog items for each confirmed gap". The unpredicted gaps and the
tooling defects were filed; most of the predicted ones were not.

**Likely cause:** having predicted them made them feel already-handled. The findings that were
easiest to see were the ones that fell out of the process.

**Lesson, generalised:** a closeout checklist item that says "file items for the findings" is
too loose. It should say "file one item per row of the findings table, or record explicitly why
not." Verification needs to be mechanical, not remembered.

Fixed at the end of the session — see §7.

---

## 3. What worked, and should be kept

| Practice | Why it earned its place |
|---|---|
| **Predictions stated before authoring, with a falsification threshold** | Turned the exercise from "collect impressions" into a test. The 5-of-7 bar meant a failed prediction could not be quietly dropped. Cheap to do; the single strongest methodological choice of the session. |
| **Research notes kept separate from the design spec** | Notes are evidence, spec is decision. When the SCHEMA LIMITATION notes were rewritten later, the source of truth was untouched. The notes carry a "notes win over the artifact" rule and a dated corrections log. |
| **A running authoring log, written as findings happened** | 918 lines. Reconstructed at the end it would have been perhaps 200 lines and partly wrong. Several findings (the lane-ID mismatch, the 200-char cap on limitation notes) would have been forgotten entirely. |
| **Visual verification in a browser** | Caught 23 of 38 node names truncating in Overview mode. No markup test would have. |
| **A throwaway integrity script** | Caught 3 of 4 paths being non-traversable — which the validator passed clean. Ten lines of Node, and it found a class of error the tooling cannot. |
| **Refusing to fabricate a path frequency** | Left the Mission at 95/100 rather than invent a proportion-of-actors figure for a single observed case. Produced BACK-040. |
| **Committing per task with substantive messages** | Each commit explains the finding, not just the change. The git log is now a readable narrative of what the schema could not do. |
| **Will's pushback on BACK-027 sequencing** | Prevented building schema machinery ahead of the evidence that defines its shape. See §5. |

---

## 4. What cost time — and why it was all one thing

Roughly **8 validation round-trips and ~60 individual errors** during authoring. Nearly all of
them were the same class of problem:

- **Enums that read interchangeably but are not.** `provenance.source` rejects `human_created`;
  the adjacent `provenance.generationMethod` requires it. `ai_generated` and `mixed` are valid
  for both, so a wrong guess sometimes works.
- **Shapes that cannot be guessed.** `accessibilityProfile` is a ratings object, not a list of
  considerations. `actions` is an array. `cognitiveLoad` is an object.
- **Undocumented length caps found by failure.** 200 / 300 / 500 — and `averageDuration` at 50.
- **Lane IDs that do not match `laneContent` keys** (`design-opps` vs `designOpportunities`).

**None of these were thinking failures.** Every one was "the rule exists, but nowhere an author
would look". That is the honest measure of having no create/edit tooling, and BACK-021 was
partly designed to take that measurement — so this is a result, not a grievance.

**The `additionalProperties: true` trap caught three times, in three different schemas, by
someone actively watching for it.** Invented keys validate cleanly and are silently discarded,
with a PASS and a quality score to reassure the author. This is the most-repeated finding of
the entire exercise.

---

## 5. Process failures

### 5.1 The BACK-027 detour

A full design spec was written for the channel spelling constraint before it became clear the
work should sit *behind* BACK-020.

The principle was already in hand and already agreed: *"the renderers come last deliberately —
if BACK-020 changes the schema, anything already rendering channels has to be rebuilt."*
BACK-027 has the identical dependency, and the principle was not carried across.

The plan was adversarially reviewed — that review found the real defect that a naive pattern
catches only 18 of the 30 known-bad values — but it reviewed the **mechanism** and never the
**premise**. Will had to raise the sequencing question, and was right to be frustrated about it.

**Lesson:** when a sequencing principle is established for one item, check every queued item
against it, not just the one it was written for. Critique the premise before the mechanism.

### 5.2 A false claim repeated because it was inherited

`docs/current-state.md`, the v2.0 handoff and the `/start-session` command all stated that
sub-agents had Write and Bash denied in this project. **This was false.** The deny list is
empty; a probe sub-agent successfully used Write, Edit, an allowlisted `node` command, and
`git status` — which is not allowlisted — with no prompt on any of them.

The claim had stood for months, was repeated twice in this session before being tested, and
**contradicted the repository's own v2.0 implementation plan**, which schedules sub-agent
parallelism across three workstreams. Nobody noticed, because nobody retested.

**Lesson:** an inherited constraint that shapes how work is done should be verified before it
is relied on, especially when it is cheap to test. A claim written once is inherited forever.

### 5.3 Stating counts and facts from memory rather than checking

"Five SCHEMA LIMITATION notes" — there were 14. The number was asserted without counting.

Together with 5.1 and 5.2, the common thread is **stating something confidently from memory or
inheritance instead of checking**, when checking costs seconds.

### 5.4 Structural friction

- **Documents record facts in forms that go stale.** `current-state.md` pins "94 tests" as a
  verification baseline. The suite generates one assertion per example file, so it now reads 98
  and will drift again on the next example. The fact should be a *rule*, not a number. Same
  failure mode as 5.2, with milder consequences.
- **`backlog.json` has no edit command.** `add` takes `--description`, but nothing updates an
  existing item's description, so BACK-020 had to be updated by hand-editing the gitignored
  source of truth (backed up first, since it has no git safety net).
- **Playwright MCP wrote screenshots and a `.playwright-mcp/` directory into the repository
  root.** Neither is gitignored. Only the project's ban on `git add -A` prevented binaries
  being committed. Filed as BACK-042.
- **The plan format assumes code, not content.** Writing full JSON for 38 nodes into the plan
  would have duplicated the artifact and immediately drifted. The deviation — specifying exact
  node IDs and edge topology, but sourcing prose from the research notes — worked, and is worth
  keeping as the pattern for content-authoring plans.

---

## 6. The reframe: 21 inbox items, 4 root causes

The backlog roughly doubled this session (10 inbox items to 21). That looks like sprawl. It is
not — the new items cluster tightly.

| Cluster | Items | The actual problem |
|---|---|---|
| **A. The channel model is under-specified** | BACK-020, 035, 036, 037, plus the four unfiled predictions | A channel cannot express *availability over time*, *relationship distance*, *discoverability*, *who used it*, or *what a handoff carries*. **Eight symptoms, one cause.** |
| **B. Validation gives false assurance** | BACK-030, 031, 032, 033, 040 | The validator passes what it should not, scores what it has not checked, and never verifies graph references. |
| **C. The rules are not discoverable** | BACK-034, plus enum / length-cap / naming guidance | Authors learn the schema by failing validation. Directly explains §4. |
| **D. Renderer and housekeeping** | BACK-038, 039, 041, 042 | Real, but independent of the above. |

### The strategic consequence

**BACK-020 is scoped too small.** Its title — "no way to express ambient/always-available help
channels" — names one symptom. BACK-021 produced **eight** distinct channel-modelling gaps:

1. Ambient across the whole service (benefits app home screen; concierge number on the card)
2. Ambient for one node's duration (assistance line during the wait)
3. Channels that expire mid-case (partner tracking site; provider app tracking)
4. `ownership` cannot express degrees of remove (one value, four relationships)
5. Channels that exist but are not signposted (the provider's website)
6. Channels wholly outside the service that it depends on (search engine; location service)
7. Channels used by a different person (the location came from the vehicle owner's device)
8. `interaction` fixed per channel, so it cannot differ between designed and observed paths

Fixing only ambient availability means returning to this within a session. And because
**BACK-027 was deliberately deferred behind BACK-020**, that sequencing decision now governs a
much larger piece of work than it did when it was made.

**This is the main thing a fresh session needs to decide.**

---

## 7. Changes made at the end of this session

- The four unfiled predictions were consolidated and filed (see the backlog).
- This retrospective was written.

## 8. Changes proposed, not yet made

**Cheap:**

1. **Fix the `current-state.md` verification baseline** to state the rule — "one assertion per
   example file, so the count grows with the example set" — rather than pinning a number.
2. **Do BACK-042** (gitignore `.playwright-mcp/` and root `*.png`). Two lines.

**Higher leverage, needs a decision:**

3. **A v2.0 authoring quick-reference**, living next to the schemas: every enum, every length
   cap, every non-obvious shape, and the lane-ID/`laneContent` mapping. Would have prevented
   most of the ~60 errors in §4, and every future author hits the same wall. Arguably the
   highest-value item on this list, because it is cheap and compounding.
4. **Rescope BACK-020** into a channel-model workstream with the eight gaps in §6 as its
   evidence base, rather than fixing one symptom.
5. **Add a mechanical closeout check** to the plan template: one backlog item per findings row,
   or an explicit note of why not. See §2.
6. **Update the gitignored builder skills** (`actor-builder`, `mission-builder`,
   `experience-generator`) with the authoring traps from §4 — noting this is local-only and
   invisible to a fresh clone, which is its own unresolved problem.

---

## 9. Standing lessons worth carrying forward

1. **State predictions before doing the work, with a threshold that can fail.** Cheapest quality
   mechanism available.
2. **Keep evidence separate from decisions**, and let the evidence win.
3. **Write the log as you go.** Retrospective reconstruction loses the small findings, which are
   individually trivial and collectively expensive.
4. **Look at rendered output in a browser.** Tests pass on visibly broken layouts.
5. **Verify inherited constraints before relying on them** — especially the ones that shape how
   the work is done.
6. **When a sequencing principle is agreed, apply it to the whole queue**, not just the item it
   was written for.
7. **Record facts in the form that stays true.** A rule outlives a number.
8. **A completeness score is not a validity check.** They ran independently here, and a perfect
   score printed directly above a FAIL.
