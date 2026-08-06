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
7. **⚠️ Channels cannot be attributed to an actor** — §4.2. `node.actorRef` allows one actor
   per node; channel entries have none. Services involving carers, family, translators or
   anyone acting on another's behalf cannot be modelled. Unpredicted; likely a v2.1 item.
8. **`branch` and `decision` are structurally identical** — §3.2. Only the type string differs;
   nothing marks a branch's options as concurrently offered or service-initiated. Low priority.
9. **⚠️ `handoff` nodes have no payload field** — §5.4. No way to declare what transfers and
   what does not. This service's central failure is an entitlement that did not travel with a
   job, and it is expressible only as prose. Would make "find every handoff where entitlements
   stop travelling" a queryable question across a portfolio. **Best structural idea so far.**

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

## Task 3 — Phase 3, reaching the service (complete)

7 nodes, 8 edges. **14 nodes / 14 edges / 3 phases.** First use of `branch` and `escalation`.
No dangling edges, no orphan phase refs. Quality still 80 (paths and SLA outstanding).

Notably smoother than Tasks 1–2: no new silent-acceptance traps, because the shapes are now
known. That is itself the point — the cost of those traps is entirely front-loaded onto anyone
authoring for the first time, and none of it is discoverable from the schema alone.

### 3.1 Prediction 3 confirmed — no way to mark a channel as unsignposted

The provider's website is a real, working route to help that was never surfaced to the
customer. Authored on `view-cover-summary` with `ownership: partner`, and there is **no field
that distinguishes "this channel exists" from "the customer can find it"**. The note had to go
in `usageContext`, in prose, where nothing can query or count it.

This matters for analysis, not just tidiness: a channel-mix report counts this website as an
available digital channel. In reality it is invisible at the only moment it would be used, so
every channel-mix figure for this step is wrong in the same direction.

**Prediction 3: confirmed.**

### 3.2 `branch` and `decision` are indistinguishable in structure

`choose-contact-route` is a `branch` — the service presents two routes simultaneously.
`recall-bundled-cover` is a `decision` — the customer weighs something internally. Both are
authored identically: a node with two or more outgoing `conditional` edges carrying
`condition.description`. **The only difference is the `nodeType` string.**

Nothing marks the branch's options as *concurrently offered* rather than *mutually exclusive
outcomes*, and nothing records that a branch is service-initiated while a decision is
customer-initiated. Renderers and analysers therefore cannot treat them differently except by
reading the type label and assuming intent.

Mild, but real: a service map's most useful question is often "where does the service offer a
choice, and where does it force one?" The vocabulary exists; the structure to support it does
not. **Candidate backlog item, low priority.**

### 3.3 The deflection is the most expensive node in the map, and it is invisible to metrics

`agent-deflects-to-app` → `install-provider-app` is an `escalation` edge. Authoring it made
the cost explicit: the call ends **without a case being created**, so when the app fails the
customer restarts from nothing — new call, new menu, identity confirmed again.

The KPI authored on that node is telling. Deflection is measured by *average handling time*,
which the deflection improves. The cost lands two nodes later, on a different channel, as a
repeat contact — and nothing connects the two. A service optimising the metric would do this
more.

Not a schema gap. A genuine service-design finding that the mapping exercise surfaced, which is
what a Mission is for.

### 3.4 Prediction scoreboard

| # | Prediction | Status after Task 3 |
|---|---|---|
| 1 | Ambient / always-available channels | **evidence gathering** — 2 instances |
| 2 | `ownership` degrees of remove | **evidence gathering** — 1 instance |
| 3 | Channel exists but is not signposted | **CONFIRMED** |
| 6 | Precondition from a different journey | **CONFIRMED** |

---

## Task 4 — Phase 4, establishing location (complete)

6 nodes, 7 edges. **20 nodes / 21 edges / 4 phases.** First use of `loop_start`, `loop_end`,
`error` and `loop_back`. Still missing: `handoff`, `wait`, `end` (phases 5–6) and `timeout`
(Task 7).

### 4.1 Prediction 5 confirmed — channels outside the service, twice

Two entries in this phase belong to organisations with **no relationship to anyone in the
delivery chain**, and both were load-bearing:

- **A public search engine**, used by the customer to establish which location formats the
  assistance provider accepts — because the service never says.
- **A third-party precise-location service**, which is what finally resolved the location.

`ownership: third_party` is the only available value. It is the same value applied to the
provider's own contracted recovery firm and hire supplier. The schema cannot separate
*"a company we pay to deliver part of this service"* from *"public infrastructure we have
never heard of and do not control"*.

**Prediction 5: confirmed.** It also strengthens prediction 2 — `third_party` is now carrying
three genuinely different relationships (competitor, subcontractor, public infrastructure).

### 4.2 ⚠️ UNPREDICTED GAP — a channel cannot be attributed to a person

**Not among the seven predictions. Found only by authoring.**

The location that resolved the case came from **the vehicle owner's phone**, not the caller's.
The vehicle owner searched, obtained the reference, and the cover holder read it aloud to the
agent. Two people, two devices, three channels, one node.

The schema has `node.actorRef` — a node can be attributed to one actor. But:

- A node has **one** `actorRef`, and this node genuinely involves two people.
- **Channel entries have no actor attribution at all.** There is no way to say "this channel
  was used by the vehicle owner" and "this one by the cover holder" within the same node.

So the fact that the service was rescued by a device belonging to someone it has never
contacted — the person who, per the Actors, holds no case reference and cannot authenticate —
**cannot be expressed in the Mission at all.** It survives only as prose in `usageContext`.

This matters beyond this example. Any service where a carer, family member, translator,
colleague or agent acts on someone's behalf has this shape, and the schema flattens all of it
to a single actor per node.

**Candidate backlog item — high value, and a genuine v2.1 candidate rather than a fix.**

### 4.3 The three location methods were not three fallbacks

Authoring this made a service-design point sharp that the narrative had blurred. The three
methods attempted were app GPS, an SMS location link, and a third-party reference. The first
two **share a dependency**: both need the device to determine its own position. So the
"fallback" was not a fallback — it was the same failure wearing a different channel.

Only the third method failed independently, and it was the one the service did not offer.

Recorded as a `barrier` of type `technology` on `sms-location-link-fails`. A useful general
principle for the standards: **a fallback that shares the primary's dependency is not a
fallback.**

### 4.4 One well-designed step, recorded deliberately

`safety-check` — the agent asks whether everyone is safe **before** identity, entitlement, or
location. It is the clearest thing the service does well, and the app does not replicate it
(the app asks for location first and never asks about safety at all).

Logged because a map made only of failures is a bad map, and because the contrast between
channels is itself the finding.

### 4.5 Prediction scoreboard

| # | Prediction | Status after Task 4 |
|---|---|---|
| 1 | Ambient / always-available channels | **evidence gathering** — 2 instances |
| 2 | `ownership` degrees of remove | **strengthening** — `third_party` now spans 3 distinct relationships |
| 3 | Channel exists but is not signposted | **CONFIRMED** |
| 5 | Third-party channels outside the service | **CONFIRMED** |
| 6 | Precondition from a different journey | **CONFIRMED** |
| — | **Channel cannot be attributed to a person** | **UNPREDICTED — CONFIRMED** |

---

## Task 5 — Phase 5, dispatch and recovery (complete)

11 nodes, 11 edges. **31 nodes / 32 edges / 5 phases.** First use of `wait` and `handoff`.
Quality **80 → 90** — the two `sla` blocks are worth 10 points. Only `end` (Task 6) and
`timeout` (Task 7) remain.

### 5.1 Prediction 4 confirmed — a channel that expires

The recovery partner's tracking site is genuinely useful between dispatch and collection, then
**silently stops working**. The customer returning to it later finds nothing — not an
explanation, just absence.

A channel attaches to a node, which says "available here". There is no way to say "and dead
afterwards", and no way to express that a channel covers **one leg of a multi-party case**.
The same applies to the provider's own app tracking, which the source notes record as equally
dead once the vehicle is collected.

**Prediction 4: confirmed.**

### 5.2 Prediction 2 — `third_party` is now doing four incompatible jobs

Within one mission, `ownership: third_party` now covers:

| Actual relationship | Example in this map |
|---|---|
| A competitor with no relationship at all | The vehicle owner's own motor insurer |
| Public infrastructure nobody controls | Search engine; third-party location service |
| **The partner's partner** — two steps out | Local recovery firm |
| The partner's supplier, contracted for us | Hire supplier (Task 6) |

From the bank's vantage point every one of these is `third_party`, and they could hardly be
more different commercially, contractually or in terms of who is accountable when it goes
wrong. The vocabulary has one value where the service has four relationships.

Worth noting the vantage-point choice was deliberate — Will picked the bank specifically to
stress this. It worked: **the field does not merely lose nuance, it actively conflates a
competitor with a subcontractor.**

**Prediction 2: confirmed.**

### 5.3 Prediction 1 — a third ambient instance, of a different kind

`await-recovery` carries the assistance line as a channel, because it is reachable at any
moment during the wait. But it is not a *step* in the wait — it is a standing capability
available throughout it.

This is a different flavour from the first two instances. The benefits app home screen and the
card concierge number are ambient **across the whole service**; this one is ambient **for the
duration of a single node**. Both are unmodellable, but they are not the same shape, and
BACK-020 will need to handle both.

### 5.4 `handoff` has no payload — which is exactly this service's root cause

`handoff-to-recovery-partner` uses the `handoff` nodeType, which works fine. But **the node
type has no field for what is actually handed over.**

That is not a cosmetic gap here. The entire divergence three nodes later — the engineer
insisting on their own garage when the cover entitles the customer to be taken wherever they
need — traces to the handoff passing **a job but not an entitlement**. The dispatch payload
carries location, vehicle and contact details, and does not carry the cover terms.

I could only record that in prose, split across a `barrier` and the `data-required` lane
(where I listed the entitlements with a note that they are NOT passed). A `handoff` node
that could declare *what transfers and what does not* would make this queryable, and would let
an analyser find every handoff in a portfolio where entitlements stop travelling.

**Candidate backlog item — high value.** This is the most useful structural idea the exercise
has produced so far.

### 5.5 The divergence is invisible to everyone but the customer

Authored on `dropoff-location-disputed`, and worth stating plainly: the customer received less
than they were entitled to, and **neither the provider nor the bank will ever know**. No system
holds both the entitlement and the partner's instruction, so there is no route by which the
divergence could travel back.

The KPI authored there — *"divergences between cover terms and partner delivery that reach the
provider: currently zero, because there is no route for them to travel"* — is the honest
version. A metric reading zero because nothing can be reported is indistinguishable from a
metric reading zero because nothing went wrong.

### 5.6 Entitlements that go unused because nothing surfaces them

Onward travel and emergency accommodation were both covered and both unused. The customer read
a cover summary once, at the start, and no entitlement is ever surfaced again at the stage it
becomes relevant.

Not a schema gap — a service-design finding, and one a Mission is well suited to showing,
because the entitlement and the moment it applies are visibly at different ends of the graph.

### 5.7 Prediction scoreboard

| # | Prediction | Status after Task 5 |
|---|---|---|
| 1 | Ambient / always-available channels | **evidence gathering** — 3 instances, 2 distinct shapes |
| 2 | `ownership` degrees of remove | **CONFIRMED** — one value, four relationships |
| 3 | Channel exists but is not signposted | **CONFIRMED** |
| 4 | Channel expires mid-case | **CONFIRMED** |
| 5 | Third-party channels outside the service | **CONFIRMED** |
| 6 | Precondition from a different journey | **CONFIRMED** |
| 7 | `interaction` fixed per channel | *pending — Task 6* |
| — | Channel cannot be attributed to a person | **UNPREDICTED — CONFIRMED** |
| — | `handoff` has no payload | **UNPREDICTED — CONFIRMED** |

Five of seven already confirmed, so the falsification threshold is met with prediction 7 and
prediction 1 still to land.

---

## Task 6 — Phase 6, onward case management (complete)

7 nodes, 7 edges. **38 nodes / 39 edges / 6 phases** — exactly the plan's figure. Quality 90.

**All ten `nodeType` values are now used**, which no existing mission achieves. `interaction`
uses all three values; `ownership` uses all three. Only `timeout` remains, and it is Task 7's.

### 6.1 Prediction 7 confirmed — and it forced the one deliberate falsehood

The messaging channel is `ai_assisted` **as designed** and was `human` **as delivered**,
because international cases route to a person. `interaction` holds one value per channel entry.
Paths are a separate structure entirely, so there is no way to vary a channel attribute by
path.

Per the spec, authored as `ai_assisted` — matching the service's design — with the loss noted.
**This is the only place in 38 nodes where the artifact knowingly states something that did not
happen.**

The underlying gap is broader than the field. The AI/human split here is **conditional on case
attributes**: simple cases get automation, complex ones get people. That is a triage rule, and
the schema has no vocabulary for a channel whose behaviour depends on the case rather than the
step. The two jobs AI would have taken on a simpler case — status updates and information
gathering — are the same two that consumed three phone calls in this one.

**Prediction 7: confirmed.**

### 6.2 A node with no channel at all is expressible, and says something

`family-finds-repairer` deliberately carries **no `channels` array**. No service channel was
involved: the family walked into a village garage while the provider was still searching its
own network.

Absence works here, but it is ambiguous — a reader cannot tell "no channel was involved" from
"nobody filled this in". I stated it explicitly in the `description` because there is no other
way. A lane value meaning *deliberately none* would remove the ambiguity, and would let an
analyser count the steps where customers act entirely outside the service.

Worth pairing with the more interesting half: **the map can show the customer doing this work,
but cannot show that the service was doing it simultaneously.** Two parties working the same
task in parallel, unaware of each other, is a common service failure and there is no way to
draw it.

### 6.3 The 200-character `usageContext` cap bit again, on the same kind of content

Third occurrence, and every one has been a `SCHEMA LIMITATION:` note. The pattern is now
unambiguous: the field is sized for "when and why this channel is used", and any attempt to
record *why the model is wrong* exceeds it. Compressing the `ai_assisted` note cost real
nuance — the surviving text no longer says the channel answers simple queries itself.

This is a small mechanical cap with a real consequence: **the artifact cannot carry its own
critique at channel level.** Reinforces log item 6.

### 6.4 Vocabulary coverage achieved

| Dimension | Result |
|---|---|
| `nodeType` | **10 of 10** — first mission in the repo to use every value |
| `edgeType` | 5 of 6 — `timeout` outstanding, Task 7 |
| `interaction` | **3 of 3** — `human`, `automated`, `ai_assisted` |
| `ownership` | **3 of 3** — `own`, `partner`, `third_party` |

Both previously-unused channel fields now carry real data. The BACK-021 objective is met.

### 6.5 Prediction scoreboard

| # | Prediction | Status after Task 6 |
|---|---|---|
| 1 | Ambient / always-available channels | **CONFIRMED** — 3 instances, 2 distinct shapes |
| 2 | `ownership` degrees of remove | **CONFIRMED** — one value, four relationships |
| 3 | Channel exists but is not signposted | **CONFIRMED** |
| 4 | Channel expires mid-case | **CONFIRMED** |
| 5 | Third-party channels outside the service | **CONFIRMED** |
| 6 | Precondition from a different journey | **CONFIRMED** |
| 7 | `interaction` fixed per channel | **CONFIRMED** |
| — | Channel cannot be attributed to a person | **UNPREDICTED — CONFIRMED** |
| — | `handoff` has no payload | **UNPREDICTED — CONFIRMED** |
| — | No way to mark "deliberately no channel" | **UNPREDICTED — CONFIRMED** |

**Seven of seven confirmed, plus three unpredicted gaps.** The falsification threshold was five
of seven; the reading of the schema held. That is worth stating carefully rather than
triumphantly — the predictions were made *after* a detailed interview, so they were informed
guesses about a service already understood in depth, not blind ones.

---

## Task 7 — Paths

*(pending — checkpoint with Will first)*
