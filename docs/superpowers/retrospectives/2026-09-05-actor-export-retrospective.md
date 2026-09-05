# Retrospective — Actor → PowerPoint export (BACK-018, phase 1)

**Date:** 2026-09-05
**Scope:** the work on `feature/actor-export`, merged to `main` 2026-09-05 (28 commits).
**Spec:** `docs/superpowers/specs/2026-09-04-actor-export-design.md` (incl. §13 amendments).
**Plan:** `docs/superpowers/plans/2026-09-04-actor-export-pptx.md` (all 14 tasks ticked; Task 2
*Spike outcome* and Task 13 *Calibration notes* filled in during execution).

This document records **how** the work was executed and **which decisions were taken on
Will's behalf**, so the next session (feedback iteration, then the Figma phase) does not
re-litigate them or repeat the mistakes.

---

## 1. What shipped

```
node tools/renderers/render-pptx.js v2.0/examples/roadside/ -o exports/roadside.pptx
tools/renderers/pptx/verify-pptx.sh exports/roadside.pptx     # LibreOffice → PDF → PNG + overflow oracle
```

Cover → index (2+ actors) → one summary per Actor (headings *Enduring traits / In context:
<title> / When traits meet context*, each captioned with its source, demographics strip, cap
5, full lists in speaker notes) → two-column paginated appendix with keep-with-next headings.
Refuses invalid input (exit 2, nothing written). Warnings to stderr / `--warnings-json`.
`--theme brand.json` deep-merges over `tools/design-tokens.json` with unknown-key warnings.
The mission renderer reads the same tokens with **byte-identical** output (20 renders checked).

Generated decks live in the gitignored `exports/` folder. Two are there now: the roadside pair
and all six example Actors.

## 2. How it was built

Subagent-driven development: 14 tasks, one fresh implementer per task (Sonnet — every brief
carried complete code, so implementation was transcription plus tests), a task-scoped review
after each (Sonnet for mechanical diffs, Opus for pagination/geometry/oracle logic), one
whole-branch review (Opus), one fix wave, one scoped re-review. Eight tasks needed a fix
round; none needed two.

**The pattern that matters:** almost every defect the reviews found was in the **plan's own
code**, not in its transcription. The plan was written in one pass with no ability to run
anything; the reviews are where the real engineering happened. Specifically:

| Task | What the review caught (all real, all plan-inherited) |
|---|---|
| 6 flow | a spilling band re-emitted as "(cont.)" and duplicated; sentence splitting lost characters (`...`), split `v2.0` mid-token and flattened `\n`; blocks split whenever a prefix fit instead of moving whole; an assert-nothing test |
| 8 index | negative-height summary box at 8+ off-slide relationships; `inBounds` never rejected negative sizes |
| 9 summary | context heading wrapped into a one-line band; caption wrapped into the first bullet; `organisation` badge overlapped the demographics strip |
| 10 appendix | orphaned headings at 8 of 9 column breaks (no keep-with-next); `[object Object]` on provenance |
| 12 CLI | `--sections` typos silently dropped content; JSON `null` crashed with exit 1 |
| 13 gate | the overflow oracle **failed open** on unparseable poppler output |
| final | view-model suite missing from `npm test`; trailing value-less flags ignored; zero-slide deck written with exit 0; doc drift |

Two review findings changed the design rather than the code: LibreOffice **clips text
vertically at the page box** before `pdftotext` sees it, so the oracle needs a measured inset
(12pt, with real content clearing the edge by ≥ 20pt); and the keep-with-next rule had to use
the following block's *full* height unless that block would itself split, because a
non-oversized block spills whole.

**Cost:** roughly 4.3M subagent tokens across 46 dispatches; one Opus re-review was killed by
the session rate limit and retried on Sonnet.

## 3. Rulings of record

Decisions the controller took without asking, each with what it costs if wrong. Will can
reverse any of them; the ones with visual consequences are flagged for his eye.

**Process**
1. Worked in the primary tree on a feature branch, no worktree — costs a collision only with a concurrent session.
2. Ran tasks in parallel with other tasks' reviews only when they shared no file — costs a re-run, never a conflict.
3. The spike did not block Tasks 3–8; Will's feedback landed at Task 9.

**Design (all now in spec §13 or the code)**
4. **Per-column cap 5** (Will did not answer that question; columns were ~45% empty at 3) — one number to change.
5. **Demographics are a separate slot** rendered as a header strip; `who` = trait needs + frustrations.
6. Opportunities stay in the appendix (Will: "go with your recommendation").
7. Emergence nests under its context; first context on the summary by default; 8 actors per index slide; appendix defaults to complete; refuse invalid input; exact-pin `pptxgenjs@4.0.1`; Calibri.

**Layout / pagination**
8. Bands register only when placed; sentence boundaries are exact string slices (`Dr. Smith` may still split at its space — a heuristic, not a mid-word cut); blocks move whole unless taller than a fresh page; keep-with-next for bands/headings using the next block's full height unless it will split — costs blank space at column bottoms.
9. Heading bands and caption rows are sized from the estimator (max two lines, then `…`); context type moved from the heading into the caption; strip placed after the badge; quote and single-sentence text get word-boundary fallbacks; off-slide relationships capped at 3 lines on an index card; the cover has no footer; a context with a title and no content still shows its band.
10. Index relationship labels moved off the card text into the row gutter (calibration) — **visual judgement for Will**; two same-row pairs can put two labels in one gutter band.

**CLI / gate**
11. Unknown `--sections` names warn; zero enabled sections, non-object JSON, trailing value-less flags and zero-slide decks all refuse with exit 2.
12. The oracle fails closed on unparseable poppler output; uses a 12pt inset; documents that it sees only edge-reaching overflow (a box overshoot of up to ~0.4–0.5in past a content frame lands in the footer band unseen — the estimator tests cover that case).
13. One final fix wave; everything else filed, not fixed (BACK-048, BACK-049).

**Parked with a ruling**
14. No `Array.isArray` guards in the view model: the input contract is a schema-valid Actor, the CLI validates first, and the `.d.ts` now states the contract.

## 4. Deferred and filed

- **BACK-045** optional `image` field on Actor (deferred schema change; portraits are PII).
- **BACK-046** Experience export to PowerPoint and Figma (the other half of the 2026-08-06 spec).
- **BACK-047** v2.0 authoring quick-reference (from the BACK-021 retrospective).
- **BACK-048** summary columns underfilled — the estimator's safety margin, not the cap, now binds (a 78-char bullet is estimated at 3 lines, renders at 2); a calibration pass could recover 2–3 bullets per column.
- **BACK-049** index layout at N=2 (three-quarters empty), connector-label clutter, provenance/governance unreachable from the CLI, `buildSummarySlots` ignoring `sections.traits`.
- Small deferred minors live in the reviews' Minor lists (magic geometry outside `LAYOUT`, `IMAGE_MISSING` message omits `.jpeg`, ellipsis after trailing punctuation, `humaniseValue` dropping nested arrays inside objects, warning-unit mismatch in `SUMMARY_TRUNCATED`). None affects output on the example sets.

## 5. Entry points for the next session

**Feedback iteration.** Open the decks in `exports/` in PowerPoint (LibreOffice output is
layout-faithful, not pixel-identical — Calibri vs Carlito). Things to look at: the summary
columns' empty space (BACK-048), the index at N=2 and its gutter connectors (BACK-049), speaker
notes usefulness, whether opportunities belong on the summary after all. Layout numbers live
in `LAYOUT` in `tools/renderers/pptx/deck-model.js`; estimator constants in `FLOW` in
`tools/renderers/pptx/flow.js`; never lower a font size to fix overflow — raise a constant or
fix a coordinate, then re-run `verify-pptx.sh`.

**Figma phase (spec §9).** Carries over unchanged: tokens (`hexToRgb` at the plugin edge), the
view model (bundle the `.js`, take types from the `.d.ts`), `ActorSectionSelection`, the
`--images` sidecar convention, the multi-actor index idea. Decide first: whether to build
`render-actor.js` (HTML) as the card's visual proxy; archive-vs-delete of the plugin's orphaned
root `ui.html`; a feasibility spike for component/template mapping; what the index frame
draws for in-deck relationships on a canvas. The plugin findings in the superseded 2026-08-06
spec (Create-mode structure, `detectArtifactType` reading `$type`, inert `rootDir`) were
re-verified 2026-09-04 and still hold. `tools-internal/figma-plugin/` is gitignored — nothing
there is protected by git.

## 6. Process lessons

- **Plans written blind need reviews that run code.** Every Opus review that probed with
  `node -e` found something the tests had not; the two Sonnet reviews that only read the diff
  found nothing. Budget for probing reviewers on layout and pagination work.
- **Prove the oracle before trusting it.** The canary step in the plan is what exposed the
  page-box clip; without it the gate would have passed everything forever.
- **Tell reviewers the branch.** One reviewer read the session-start git snapshot in its
  context and reported the wrong branch; verify live before reacting.
- **Precondition assertions beat expected values.** The flow tests that assert "the heading
  alone fits, heading + first item does not" *before* asserting the outcome are the ones that
  caught the keep-with-next amendment.
- **RED-phase counts are not reliable** when a test file has no per-section try/catch — the
  first undefined-property access aborts the run. Exit codes still signal correctly.
- **Session limits are real.** Pass an explicit model on every dispatch; use Sonnet wherever
  the brief carries complete code; keep controller context for coordination.
