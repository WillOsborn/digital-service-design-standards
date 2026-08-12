# Roadside assistance Mission — design

**Date:** 2026-08-06
**Backlog item:** BACK-021
**Status:** designed, awaiting implementation plan
**Schema version:** v2.0 (Actor / Mission / Experience)
**Source material:** `research/private/roadside-assistance/2026-08-06-source-notes.md`
— **gitignored and local-only.** It contains personal detail and is deliberately excluded
from the repository, so a fresh clone will not have it. This spec must therefore carry enough
detail to stand alone.

> The source notes are the evidence base and take precedence. If this design and the notes
> disagree, the notes are right. Do not edit the notes to match a later design decision.

---

## 1. Purpose

BACK-021 exists to test whether roughly half of the Mission schema actually works. Measured
across all four existing missions (73 nodes, 77 edges):

| Vocabulary | Usage |
|---|---|
| `interaction` (human / automated / ai_assisted) | **0** |
| `ownership` (own / third_party / partner) | **0** |
| nodeTypes `handoff`, `branch`, `loop_start`, `loop_end` | **unused** (4 of 10) |
| edgeTypes `error`, `timeout`, `escalation` | **unused** (3 of 6) |

This is not another example for variety. It is the test case for the untested half. A
secondary purpose is to establish what **BACK-020** (ambient always-available help channels)
actually needs, from real data rather than speculation.

The existing four missions were generated. This one is drawn from a first-hand, still-open
case, so where it comes out larger or messier than they are, that is a finding rather than a
defect.

---

## 2. Scope decisions

Each was decided explicitly in session.

| Decision | Choice | Reasoning |
|---|---|---|
| **Span** | Awareness → recovery complete | Starts at holding the cover and knowing it exists; ends with the car at a garage and everyone safe. Keeps the benefit-discovery barrier, which is where the service nearly failed before it started. Every node was witnessed. |
| **Vantage point** | **The bank** | Chosen deliberately as a stress test. The bank owns the account and benefits app; the assistance provider is contracted; everything beyond is further removed. Expected to strain `ownership` — see §7, prediction 2. |
| **Actors** | Two, both authored | Cover holder and vehicle owner. A beneficiary≠owner split no other example has, and it sets up cross-actor comparison later. |
| **Ambient state** | Model honestly, record what breaks | Author it the truest way the schema allows and document the distortion, rather than forcing a clean linear chain that invents causation. |
| **Size** | ~36 nodes, accepted | Larger than the 22–28 first estimated and larger than retail's 25. Confirmed acceptable. |

### Naming and privacy

The source case is a real, first-hand account given with consent. The other four example sets use invented people
(Sarah Martinez, David Chen, Maria Rodriguez, Jake Holloway), and this set will follow that
convention: **Actors are pseudonymised**, the bank and the assistance provider are described
generically in artifact content, and no real account or policy detail appears in the JSON.

**Resolved:** the source notes were moved to `research/private/`, which is gitignored, and
removed from tracking. On 2026-08-11 they were also **pseudonymised in place** — real names,
the bank, the assistance provider, the country, and named third-party products replaced with
the same pseudonyms and generic descriptions used in the published artifacts. Two residual country references in the Experience were genericised at the same time.
The repository must be treated as potentially public at any time.

**Resolved 2026-08-12.** The notes had been committed before the move, so they sat in git
history. Because the repository's privacy cannot be guaranteed, history was rewritten to purge
the file entirely and redact residual identifiers from this spec and the Experience. Only
local, unpushed commits were affected — the commits already on `origin/main` kept their SHAs,
so no force-push to shared history was needed. See `docs/current-state.md`, *Privacy posture*.

**Standing rule this established: assume the repository is not private.** Anything committed
must be safe to publish. Research notes from real people belong in `research/private/`
(gitignored) and should be written pseudonymised from the outset — editing a file later does
not unpublish it.

---

## 3. Artifacts to produce

In `v2.0/examples/roadside/`:

| File | Type | Notes |
|---|---|---|
| `mission-roadside-assistance.json` | Mission | ~36 nodes, ~40 edges, 6 phases, 5 paths |
| `actor-adam-rees.json` | Actor | Holds the premium account and the cover; **not** the vehicle owner |
| `actor-daniel-rees.json` | Actor | Owns the car; holds decision authority; **never contacted by the service** |
| `exp-adam-roadside-recovery.json` | Experience | The observed run — the real case, walked node by node |

Pseudonyms follow the existing convention of invented people, with a shared surname to carry
the sibling relationship. Artifact IDs: `actor-adam-rees`, `actor-daniel-rees`,
`mission-roadside-assistance`, `exp-adam-roadside-recovery`.

This brings the example set to five domains. The Experience is authored **last**, after the
Mission validates, since it references Mission node IDs.

---

## 4. Phase structure

| # | Phase | Nodes | Content |
|---|---|---|---|
| 1 | **Cover in place** | ~3 | Premium account held; benefits surface persistently; incidental discovery while using an unrelated benefit. The ambient precondition. |
| 2 | **Breakdown & first recourse** | ~4 | Vehicle stops; safety established; the vehicle owner's own insurer refuses; the bundled cover is recalled. |
| 3 | **Reaching the service** | ~7 | Benefits app → **`branch`**: provider app *or* phone (domestic / overseas numbers) → call → deflected to app → app fails → call back, re-enter IVR, re-authenticate. |
| 4 | **Establishing location** | ~6 | Safety check → identity check → GPS fails → SMS link fails → external research → third-party location service succeeds. A **`loop_start`/`loop_end`** with `error` edges. |
| 5 | **Dispatch & recovery** | ~9 | Case created; **`wait`** on a 60–90 min estimate; **`handoff`** to the recovery partner; SMS + tracking site; confirming call; engineer arrives; coverage divergence; transport; paperwork; onward travel. |
| 6 | **Onward case management** | ~7 | Update call; hire car offered and specified; repairer found off-channel by the family; update call; **`handoff`** to the hire supplier; **`handoff`** to a messaging channel. |

Phase 1 is the honest-modelling experiment: a `signal` node plus a separate `observed` path,
with the misrepresentation documented — implied sequence that did not exist, no way to say
"always available", no way to link the precondition to the unrelated journey that caused it.

Phase 4 is the strongest evidence in the map: three attempts at one task, two failing through
different channels, resolved by a third party on another person's device.

---

## 5. Vocabulary coverage targets

**nodeTypes — all ten**, which no existing mission achieves:

| Type | Where |
|---|---|
| `start` | Cover in place |
| `signal` | Incidental benefit discovery; partner SMS |
| `touchpoint` | Throughout |
| `decision` | App vs call; hire car yes/no; which repairer |
| `branch` | The app-or-call offer — two channels genuinely available at once |
| `wait` | The 60–90 minute dispatch wait |
| `handoff` | Bank→provider; provider→recovery partner; recovery→repairer; provider→hire supplier |
| `loop_start` / `loop_end` | The location-capture attempts |
| `end` | Car delivered to the repairing garage |

**edgeTypes — five of six:** `default`, `conditional`, `loop_back` (already in use), plus
`error` (GPS failure, SMS link failure, insurer refusal) and `escalation` (app failure back
to phone).

**`timeout` is the honest exception.** The estimate held; nobody chased. The service *did*
state "we'll be in touch if anything changes", so a designed escalation demonstrably exists —
that sentence is the only evidence for it, and it is enough to justify one `timeout` edge on
`path-designed-timeout`. It must **never** appear on `path-observed`. If authoring the
designed path requires inventing any further behaviour beyond that stated promise, drop it
and report `timeout` as still unexercised.

**Channel fields:** `interaction` gets **all three values** — `human` (agents, engineer),
`automated` (IVR, SMS link, tracking site), and `ai_assisted` (the messaging channel, which
opens automated and handles simple queries itself).

The `ai_assisted` case is the most informative in the set, because it is **designed but not
delivered**: the channel is AI-capable, and case complexity — an international recovery —
routed it to a human instead. So the same channel carries `ai_assisted` on the designed path
and `human` on the observed one. The schema cannot express that (§7, prediction 7), which
makes this the one place where authoring is forced to state something false. **Author it as
`ai_assisted`, matching the service's design, and record the loss.**

`ownership` is exercised throughout, and expected to strain (§7).

---

## 6. Paths

| Path | Type | Purpose |
|---|---|---|
| `path-observed` | `observed` | The real case, exactly as it happened |
| `path-designed-selfservice` | `designed` | Full app self-service: location captured first time, no phone contact |
| `path-designed-assisted` | `designed` | Straight phone route with location captured first time |
| `path-designed-timeout` | `designed` | Escalation had the estimate been breached — **explicitly never observed** |
| `path-concierge` | `designed` | Entry via the bank card concierge number rather than the benefits app |

The `designed` vs `observed` divergence is the point. Two divergences are firmly evidenced:
the service designed the repairer search but the customer did it themselves, and the cover
promises drop-off anywhere but the recovery crew did not know that. No current example
demonstrates a designed and observed path separating.

---

## 7. Predictions to test

Stated **before authoring**, so they can be confirmed or refuted rather than rationalised.
Full evidence in §9 of the source notes.

| # | Prediction |
|---|---|
| 1 | No way to express **always-available / ambient** channels (three independent instances) |
| 2 | **`ownership` cannot express degrees of remove** — bank → provider → provider's partner → a different partner's supplier |
| 3 | No way to record that a channel **exists but is not signposted** |
| 4 | No way to express a channel that **expires mid-case** |
| 5 | No way to model **third-party channels outside the service** that it nonetheless depends on |
| 6 | No way to express a **precondition established by a different journey** |
| 7 | **`interaction` is fixed per channel and cannot vary between designed and observed paths** — the messaging channel is `ai_assisted` by design but ran as `human` because the case was international |

**If fewer than five of the seven hold, the reading of the schema was wrong and the write-up
must say so.** (The bar was four of six when six were listed; it rises with the count so that
adding a prediction cannot quietly weaken the test.)
Findings feed BACK-020 directly, and are the reason BACK-027 was deferred until after it.

---

## 8. Lanes

Reuse the 11-lane set the existing missions share — `description`, `channels`, `barriers`,
`design-opps`, `accessibility`, `frontstage`, `backstage`, `support-systems`, `data-required`,
`roles-involved`, `kpis` — so the mission renderer and analysers work unchanged. No new lane
types; if the content needs one, that is a finding to record, not a change to make mid-build.

---

## 9. Verification

```bash
node tools/validators/validate-v2.0.js v2.0/examples/roadside/ --check-refs
node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs   # expect 16/16
node tools/validators/test-v2.0-validator.js      # expect exit 0, 94 passed
node tools/renderers/test-mission-layout.js       # expect exit 0, 16 passed
node tools/renderers/test-render-mission.js       # expect exit 0, 83 passed
node tools/converters/test-converter.js           # expect exit 0, 87 passed
```

Validate incrementally with `--check-refs` while authoring rather than once at the end. Read
§5 of `docs/superpowers/plans/2026-05-04-v2.0-handoff.md` for enum gotchas before writing JSON.

Two known traps: the channel object **does not restrict `additionalProperties`**, so a v1.1
key such as `type` validates and is silently ignored; and **`channel` takes a type while
`name` takes the instance** — never a product name in `channel`.

Beyond validation, render the Mission and check it visually before calling it done. Existing
quality scores (85–100) must not move for the other four sets.

**Note:** `actors[].actorRef` in a Mission is **not** cross-checked by the validator
(BACK-030) — a dangling reference will pass silently. Verify both Actor IDs by hand.

---

## 10. Out of scope

- **Schema changes.** This example exists to *find* gaps, not fix them. Everything discovered
  is recorded and routed to BACK-020 or a new backlog item.
- **BACK-027** (channel spelling constraint) — deliberately deferred until after BACK-020.
- **BACK-030** (Mission actorRef cross-checking) — logged during this design.
- **The case's ending.** Unresolved at capture: repair, hire car return, transport, and
  closure are all still ahead. The Mission ends where the evidence does.

---

## 11. Findings

Authored 2026-08-06 on `feature/roadside-mission`. Full detail, task by task, in
`research/roadside-assistance/2026-08-06-authoring-log.md` (tracked in git).

### 11.1 Objective met

| Dimension | Before | After |
|---|---|---|
| `nodeType` | 6 of 10 | **10 of 10** — first mission in the repo to use every value |
| `edgeType` | 3 of 6 | **6 of 6** |
| `interaction` | **0 uses** | all three values |
| `ownership` | **0 uses** | all three values |

Final set: 2 Actors (100/100), Mission (95/100, 38 nodes, 45 edges, 6 phases, 4 paths),
Experience (100/100). All 16 examples validate; the other four sets are unmoved at 85–100.

### 11.2 Prediction verdicts — 7 of 7 confirmed

Threshold was five of seven. **All seven confirmed**, so the reading of the schema held.

Stated plainly rather than triumphantly: the predictions were made *after* a detailed
interview, so they were informed guesses about a service already understood in depth. They
demonstrate the analysis was consistent, not prophetic.

| # | Prediction | Verdict | Demonstrated by |
|---|---|---|---|
| 1 | No way to express ambient / always-available channels | **CONFIRMED** | Benefits app home screen, concierge number on the card, assistance line during the wait — **three instances in two distinct shapes**: ambient across the whole service, and ambient for one node's duration |
| 2 | `ownership` cannot express degrees of remove | **CONFIRMED** | `third_party` carries **four incompatible relationships** in one mission: a competitor (the owner's insurer), public infrastructure (search engine, location service), the partner's partner (recovery firm), the partner's supplier (hire car) |
| 3 | No way to record a channel that exists but is not signposted | **CONFIRMED** | The provider's website on `view-cover-summary` — counted as an available digital channel in any channel-mix report, invisible at the only moment it would be used |
| 4 | No way to express a channel that expires mid-case | **CONFIRMED** | The partner tracking site on `track-case-online`, dead after collection with nothing to say so |
| 5 | No way to model third-party channels outside the service | **CONFIRMED** | A search engine used to discover what the service accepts, and the location service that resolved the case |
| 6 | No way to express a precondition from another journey | **CONFIRMED** | `discover-cover-incidentally` — weeks earlier, during an unrelated benefit claim |
| 7 | `interaction` fixed per channel, cannot vary designed vs observed | **CONFIRMED** | The messaging channel: `ai_assisted` by design, `human` as delivered because international cases route to people |

### 11.3 Gaps found that were NOT predicted

More valuable than the confirmations, because they could only be found by authoring.

1. **A channel cannot be attributed to a person.** The location that resolved the case came
   from the vehicle owner's device. `node.actorRef` allows one actor per node; channel entries
   carry none. **Any service involving a carer, family member, translator or anyone acting on
   another's behalf is unmodellable.**
2. **`handoff` nodes have no payload.** This service's central failure — the recovery crew not
   knowing the cover terms — is exactly a handoff that passed *a job but not an entitlement*.
   Expressible only as prose. A declarable payload would make *"find every handoff where
   entitlements stop travelling"* queryable across a portfolio. **The best structural idea the
   exercise produced.**
3. **No way to mark "deliberately no channel".** `family-finds-repairer` has none, but absence
   cannot distinguish *the customer acted outside the service* from *nobody filled this in* —
   and the map cannot show that the provider was working the same task simultaneously.
4. **Paths cannot express channel-only variation.** A planned fifth path (entry via the card
   concierge) was **dropped as inexpressible**: it traverses identical nodes and differs only
   by channel. In the schema built to map channel switching, that is a significant hole.

### 11.4 Tooling defects found

| # | Defect | Severity |
|---|---|---|
| 1 | **Quality score is reported for invalid artifacts.** An Experience with 49 validation errors printed `Quality: 100/100` directly above `FAIL`. Score checks presence, never validity. | **High** — the score is the number people read |
| 2 | **Validator checks no graph references.** Edge endpoints, path `nodeSequence`, path traversability and phase `nodeRefs` are all unchecked. Three of four paths were non-traversable and validated cleanly. | **High** — same class as BACK-030 |
| 3 | **`additionalProperties: true` allows silent data loss.** Caught three times across Actor, Mission and Experience: invented keys validate and are discarded, with a PASS and a score to reassure the author. | **High** |
| 4 | **Lane IDs disagree with `laneContent` property names.** `design-opps` vs `designOpportunities`, `accessibility` vs `accessibilityProfile`. Following the schema's own documented rule yields an unvalidated key. Existing examples use both spellings (25 vs 13). Already worked around in the renderer, never fixed at source. | **High** |
| 5 | **Renderer ignores `interaction` and `ownership`.** The two fields this example existed to exercise appear nowhere in the output. | Medium — direct follow-on |
| 6 | **Cross-column edge labels are struck through** by unrelated edges sharing a gutter. Renderer fault; the mission was not distorted to accommodate it. | Medium |
| 7 | **Quality scorer penalises honesty.** Full marks require a `frequency` on every path; on a single observed case that means inventing a statistic. Mission left at 95 rather than fabricate one. | Medium |

### 11.5 Authoring guidance worth adding to the standards

- **Node names must be outcome-neutral.** `dropoff-location-disputed` had to be renamed once a
  designed path traversed it. The outcome belongs to the path and the barriers, not the node ID.
- **Node names truncate beyond ~28 characters** in Overview mode. 23 of 38 needed shortening.
  Write the short label; put detail in `description`.
- **A fallback sharing the primary's dependency is not a fallback.** Two of three location
  methods needed the same device position fix.

### 11.6 Verification

```
test-v2.0-validator.js   exit 0 — 98 passed   (was 94; the suite generates one assertion
                                               per example file, so +4 is the new artifacts)
test-mission-layout.js   exit 0 — 16 passed
test-render-mission.js   exit 0 — 83 passed
test-converter.js        exit 0 — 87 passed
validate-v2.0.js v2.0/examples/ --check-refs
                         exit 0 — 16/16, quality 85–100 (other four sets unchanged)
```

`run-all-tests.js` still exits 1 — the pre-existing v1.x path failure, BACK-017, untouched.

**Note the 94 baseline in `docs/current-state.md` is data-dependent** and will drift again
whenever examples are added. It should describe the rule, not pin a number.
