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

---

## Task 2 — Mission scaffold

*(in progress)*
