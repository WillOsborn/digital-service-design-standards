# Roadside example set — authoring log

**Started:** 2026-08-06
**Plan:** `docs/superpowers/plans/2026-08-06-roadside-mission.md`
**Spec:** `docs/superpowers/specs/2026-08-06-roadside-mission-design.md`
**Source notes:** `research/private/roadside-assistance/2026-08-06-source-notes.md` (gitignored)

> A running record of what authoring this example set teaches us about the schema and tooling,
> captured **as it happens** rather than reconstructed at the end. Task 10 consolidates the
> subset that bears on the seven predictions; this file keeps everything, including the small
> mechanical traps that are individually trivial and collectively expensive.
>
> Tracked in git. Contains no personal detail — that lives in the private source notes.

---

## Prediction scoreboard

Updated as evidence arrives. Five of seven must be confirmed or the write-up must say the
reading of the schema was wrong.

| # | Prediction | Status |
|---|---|---|
| 1 | No way to express always-available / ambient channels | *pending* |
| 2 | `ownership` cannot express degrees of remove | *pending* |
| 3 | No way to record that a channel exists but is not signposted | *pending* |
| 4 | No way to express a channel that expires mid-case | *pending* |
| 5 | No way to model third-party channels outside the service | *pending* |
| 6 | No way to express a precondition established by a different journey | *pending* |
| 7 | `interaction` fixed per channel, cannot vary designed vs observed | *pending* |

---

## Task 1 — Actors (complete)

Both Actors validate at 100/100. Six commits' worth of lessons in one task.

### 1.1 The `additionalProperties` trap fired on me, not on someone else

My first `traits.accessibility` block used a `considerations` key. **It validated cleanly.**
The real shape is `{ dimensions: [{dimension, description, impact}], assistiveTech: [] }`, and
`considerations` does not exist anywhere in the schema — so the content would have been
silently discarded, with a PASS and a quality score to reassure me.

Caught only because I went and read the shape rather than trusting the pass. This is the
exact failure mode `docs/current-state.md` warns about for channel objects, and it is not
confined to channels — it applies to **every** object in the Actor schema that does not set
`additionalProperties: false`.

**Significance:** this is the strongest argument yet for the BACK-027 family of work. A
validator that says PASS while dropping your data is worse than one that says nothing.
Consider a backlog item for `additionalProperties: false` across v2.0 schemas, or a validator
warning listing unrecognised keys.

### 1.2 Two adjacent fields, overlapping vocabulary, zero overlap in valid values

- `provenance.source` accepts: `user_research`, `analytics`, `assumption`, `ai_generated`,
  `expert_review`, `observation`, `mixed`
- `provenance.generationMethod` accepts: `human_created`, `ai_assisted`, `ai_generated`,
  `mixed`

`human_created` is valid for one and invalid for the other, and they sit adjacent in the same
object. I got it wrong on the first attempt. `ai_generated` and `mixed` are valid for **both**,
which makes the trap worse — a wrong guess sometimes works.

**Action:** add to §5 of the v2.0 handoff enum gotchas.

### 1.3 `needs[].type` and `motivations[].type` are different enums

- `traits.needs[].type`: `recognition | autonomy | security | belonging | growth | mastery | efficiency | other`
- `traits.motivations[].type`: `intrinsic | extrinsic | social | achievement`

`extrinsic` reads naturally as a need type and is invalid there. Same object, sibling arrays.

### 1.4 `relationships[]` keys on `target`; Mission `actors[]` keys on `actorRef`

Two near-identical ideas — "point at another artifact" — with different key names in different
places. `relationships[]` requires `target` **and** `type`, where `type` comes from a 15-value
enum of graph edges (`serves`, `served_by`, `escalates_to`, …). Intuitive values like
`family` are invalid; the enum is about service-graph roles, not human relationships.

Used `serves` / `served_by` for the brothers, which is defensible — Adam genuinely acts as
Daniel's service channel — but it is a service vocabulary being asked to carry a family fact.
Worth noting as a modelling limitation rather than a bug.

### 1.5 Quality 75 → 100 needs `emergence` and `governance`

Neither is schema-required, and an Actor is perfectly valid without them, but they are worth
25 points between them (15 + 10). An artifact can be **fully valid and score 75**. Anyone
authoring to "it passes" will land well short.

Scoring, for reference: required fields 30, traits depth 20, context completeness 15,
emergence 15, provenance 10, governance 10.

### 1.6 `governance` is the right home for the pseudonymisation decision

`governance.anonymisationMethod: "fictional_composite"` is exactly what these Actors are.
Together with `dataClassification`, `containsPii: false` and `legalBasis`, the privacy
decision we took in the spec is now recorded **inside the artifacts**, where it travels with
them, rather than only in a design document nobody opens.

Unexpectedly useful. Worth doing in the other four example sets, which have no `governance`
block at all — **candidate backlog item.**

### 1.7 Length caps that bite

- `traits.demographics.background`: 300 chars
- `governance.legalBasis`: 200 chars
- `emergence[].opportunities[]`: **array of plain strings**, not objects (I wrote
  `{opportunity, impact}` and all three entries failed)

None are documented anywhere an author would look before writing.

---

## Running list of candidate backlog items

Filed properly in Task 10; parked here so none is lost.

1. **`additionalProperties: false` (or an unrecognised-key warning) across v2.0 schemas** —
   §1.1. Silent data loss on a PASS.
2. **`provenance.source` vs `generationMethod` enum confusion** — §1.2. Add to the handoff's
   §5 gotchas.
3. **Add `governance` blocks to the other four example sets** — §1.6. They score 90 rather
   than 100 partly because of this, and the compliance metadata is genuinely useful.
4. **Document the quality-scoring rubric where authors will see it** — §1.5. Valid-but-75 is
   a trap for anyone authoring by validation alone.
5. **⚠️ Reconcile lane IDs with `laneContent` property names** — §2.1. `design-opps` vs
   `designOpportunities`, `accessibility` vs `accessibilityProfile`. Authors currently choose
   between correct rendering and schema validation. Already worked around in the renderer
   rather than fixed. Includes normalising the 13 `design-opps` uses in existing examples.
6. **`usageContext` 200-char cap is too tight to explain a channel's role** — §2.3.

---

## Task 2 — Mission scaffold (complete)

Envelope, 11 lanes, phases 1–2 (7 nodes, 6 edges). Validates, quality **80/100** — expected at
this stage, since paths (10 pts) and SLA (10 pts) do not land until Tasks 5 and 7.

### 2.1 ⚠️ Lane IDs and `laneContent` property names do not match

**The most serious finding so far, and it is pre-existing.**

The schema documents `lanes[].id` as *"Lane identifier used as the key in node laneContent"*.
But `laneContent` defines its typed properties under **different names**:

| Declared lane `id` | Typed `laneContent` property | Match? |
|---|---|---|
| `description` | `description` | yes |
| `channels` | `channels` | yes |
| `barriers` | `barriers` | yes |
| `design-opps` | `designOpportunities` | **no** |
| `accessibility` | `accessibilityProfile` | **no** |

So for two of the five core lanes, following the schema's own documented rule produces a key
that **is not schema-validated at all** — `laneContent` sets `additionalProperties: true`, so
the content is accepted and silently unchecked.

**The existing examples do both.** Across the four missions: `designOpportunities` 25 uses,
`design-opps` 13 uses; `accessibilityProfile` 4 uses, `accessibility` 0. Two spellings of one
lane, in one example set.

**It was already known and patched in the wrong place.** `tools/renderers/render-mission.js`
lines 704–709 carry a comment naming it explicitly — *"an authoring mismatch between the two,
e.g. a lane id of 'design-opps' next to node content keyed 'designOpportunities'"* — and the
renderer falls back to a humanised heading so nothing is dropped visually. A previous session
found this, worked around it at the render layer, and never fixed the source.

**Consequence for an author:** you must choose between correct rendering and schema
validation, and cannot have both.

- Lane-id key (`design-opps`) → renders in declared order with the declared label, **unvalidated**
- Typed key (`designOpportunities`) → **validated**, renders via the fallback path with a guessed type

**Decision taken here:** use the **typed property names**, because validation matters more than
heading order, and they are the majority usage. Recorded so the choice is not mistaken for
carelessness later.

**Candidate backlog item — high value.** Either rename the typed properties to match the lane
ids, or rename the declared lane ids, or make `laneContent` accept both. Whatever the fix, it
should also normalise the 13 `design-opps` uses in the existing examples.

### 2.2 The `additionalProperties` trap fired a second time, on a different schema

Same failure as §1.1, now in the Mission. I wrote `accessibility: { considerations: [...],
wcagRelevant: false }`. It validated. The real `accessibilityProfile` is a **ratings object** —
`{visual, auditory, motor, cognitive:{...}, emotional}`, integers 1–5 — nothing like what I
wrote. Every word would have been silently discarded.

Twice in two tasks, in two different schemas, by someone actively watching for it.

Note one exception: `accessibilityProfile.cognitive` **does** set `additionalProperties: false`.
So the schema is strict exactly one level down and permissive everywhere above it, which is
arguably worse than being uniformly permissive — it creates a false impression of rigour.

### 2.3 `usageContext` caps at 200 characters — the schema constrains its own critique

Two channel entries failed for exceeding it. This matters beyond the mechanics: the plan's
approach is to record schema limitations **in the data**, and `usageContext` is the only field
available on a channel entry. At 200 characters it cannot hold an explanation of what the
schema cannot express, so the notes have to be compressed to near-telegraphic form and the
real reasoning pushed here.

For reference: node `description` and barrier `description` allow 500; `usageContext` and
`priorKnowledgeRequired`/`supportAvailable` allow 200; `designOpportunities[]` allows 300.

### 2.4 Evidence accumulating on the predictions

- **Prediction 1 (ambient channels)** — two instances authored already: the benefits app home
  screen and the concierge number on the card. Both had to be modelled as steps in a sequence
  they do not belong to. The card entry is the starker of the two: a number printed on a
  physical object in the customer's wallet, reachable at any point in any journey, forced into
  a position between "hold an account" and "notice the benefit".
- **Prediction 2 (`ownership` degrees of remove)** — first evidence. The vehicle owner's own
  insurer, an organisation with **no relationship to the bank whatsoever**, gets `third_party` —
  the same value that will shortly be applied to the assistance partner's own recovery firm and
  hire supplier. The field cannot separate a competitor from a subcontractor.
- **Prediction 6 (precondition from another journey)** — confirmed in authoring. The incidental
  discovery happened weeks earlier during an unrelated benefit claim; the graph can only place
  it immediately before the trigger, inventing both proximity and causation.

| # | Prediction | Status after Task 2 |
|---|---|---|
| 1 | Ambient / always-available channels | **evidence gathering** — 2 instances |
| 2 | `ownership` degrees of remove | **evidence gathering** — 1 instance |
| 6 | Precondition from a different journey | **confirmed** |

### 2.5 Smaller notes

- `phaseId` must match `^phase-[a-z0-9_-]+$` — the `phase-` prefix is mandatory, unlike lane ids.
- Mission scoring: required fields 20, node count/type variety 15, edge connectivity 15, lanes
  declared and populated 15, blueprint depth 15, **paths with frequency 10**, **SLA on key
  nodes 10**. A complete mission with no `paths` and no `sla` tops out at 80.
- `governance` is not in the other four missions either — same gap as the Actors (§1.6).

---

## Task 3 — Phase 3

*(in progress)*
