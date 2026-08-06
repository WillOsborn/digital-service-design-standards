# Roadside Assistance Mission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Sub-agents in this project have Write and Bash denied.** Files must be written in the main session. Sub-agents are read-only research only. Plan accordingly — this plan is executed inline, not delegated.

**Goal:** Author a v2.0 example set for roadside breakdown assistance that exercises the ~half of the Mission schema no existing example touches, and record where the schema fails.

**Architecture:** Four JSON artifacts in `v2.0/examples/roadside/` — two Actors, one Mission (~38 nodes, 6 phases, 5 paths), one Experience. Built incrementally: every task leaves a set that validates. The "tests" are the validator, `--check-refs`, the quality scorer, and a visual render.

**Tech Stack:** JSON Schema draft 2020-12, Ajv via `tools/validators/validate-v2.0.js`, the deterministic renderer at `tools/renderers/render-mission.js`.

**Spec:** `docs/superpowers/specs/2026-08-06-roadside-mission-design.md`
**Source material:** `research/private/roadside-assistance/2026-08-06-source-notes.md` — **gitignored, local-only.** Section references below (§3.16 etc.) point into it. If it is missing, stop and ask; do not invent content.

---

## A note on how this plan specifies content

This deliverable is **authored content**, not code. Reproducing full JSON for 38 nodes across 11 lanes inside the plan would duplicate the artifact, and the copy would drift from the original the moment either changed.

So each task gives: **exact** node IDs, names, `nodeType`s, edges and `edgeType`s; **exact** validation commands; **exact** commit commands; and a pointer to the source-notes section carrying the content. Each Mission task also includes **one fully-worked node** establishing required depth.

That is a deliberate choice, not a missing detail. The node IDs and edge topology are fully specified because later tasks depend on them; the prose is sourced from the notes because that is the evidence base.

---

## Global Constraints

- **Active schema version is v2.0.** Artifacts declare `"version": "2.0.0"` and `"$context": "https://schemas.digitalservice.design/v2.0"`.
- **`channel` takes a *type*; `name` takes the instance.** `{ "channel": "app", "name": "Provider app" }` — **never** `{ "channel": "salesforce" }`. Wrong values validate silently.
- **Canonical channel types only:** `website`, `app`, `email`, `chat`, `social_media`, `messaging_app`, `push_notification`, `phone`, `sms`, `video_call`, `in_person`, `post`, `print`. Lower `snake_case`.
- **Channel `category` follows cost to serve:** `digital` | `telecom` | `physical`. Voice and video are **`telecom`**, not physical or digital.
- **The channel object does not restrict `additionalProperties`** — a v1.1 key such as `type` or `usage_context` validates and is then **silently ignored**. Use `channel`, `usageContext`.
- **Enum values that are easy to get wrong:**
  - `serviceModel`: `self_service` | `managed` | `both`
  - `interaction`: `human` | `automated` | `ai_assisted`
  - `ownership`: `own` | `third_party` | `partner`
  - `nodeType`: `touchpoint` | `decision` | `handoff` | `wait` | `signal` | `branch` | `loop_start` | `loop_end` | `start` | `end`
  - `edgeType`: `default` | `conditional` | `error` | `timeout` | `escalation` | `loop_back`
  - `pathType`: `designed` | `observed` | `simulated` | `failure` | `edge_case`
  - `provenance.researchSources[].type`: `interview` | `survey` | `analytics` | `observation` | `existing_research` | `ai_synthesis`
  - `provenance.generationMethod`: `human_created` | `ai_assisted` | `ai_generated` | `mixed`
  - `outcome.netSentiment` and `emotions.intensity`: **integer, −2 to 2** (never a string)
- **Lane `id` must match `^[a-z][a-z0-9_-]*$`** — kebab-case, not camelCase.
- **Vantage point is the bank.** `ownership: own` means the bank. The assistance provider is `partner`. Its recovery firm and the hire supplier are further removed — record the strain, do not resolve it by fiat.
- **Pseudonyms only.** Adam Rees (cover holder), Daniel Rees (vehicle owner). No real bank, provider, place, or account detail in any JSON.
- **Git discipline:** stage explicit paths. **Never** `git add -A` or `git add .`. Never `reset`, `rebase`, `commit --amend`, or force-push.
- **`v2.0/examples/roadside/` is NOT gitignored** — unlike the source notes. These artifacts are committed.

---

## File Structure

| File | Responsibility |
|---|---|
| `v2.0/examples/roadside/actor-adam-rees.json` | Cover holder. Holds the premium account; **not** the vehicle owner. |
| `v2.0/examples/roadside/actor-daniel-rees.json` | Vehicle owner. Holds decision authority; **never contacted by the service**. |
| `v2.0/examples/roadside/mission-roadside-assistance.json` | The service graph. ~38 nodes, ~42 edges, 6 phases, 5 paths, 11 lanes. |
| `v2.0/examples/roadside/exp-adam-roadside-recovery.json` | Adam's observed run through the Mission. |
| `docs/superpowers/specs/2026-08-06-roadside-mission-design.md` | **Modify** — append the findings section (Task 10). |

---

## Node inventory

Fixed here so every task can reference IDs it does not itself create. **38 nodes.**

| Phase | Node ID | `nodeType` |
|---|---|---|
| 1 | `hold-premium-account` | `start` |
| 1 | `benefits-surface-visible` | `touchpoint` |
| 1 | `discover-cover-incidentally` | `signal` |
| 2 | `vehicle-breaks-down` | `signal` |
| 2 | `establish-safety` | `touchpoint` |
| 2 | `owner-insurer-refuses` | `touchpoint` |
| 2 | `recall-bundled-cover` | `decision` |
| 3 | `open-benefits-app` | `touchpoint` |
| 3 | `view-cover-summary` | `touchpoint` |
| 3 | `choose-contact-route` | **`branch`** |
| 3 | `call-overseas-number` | `touchpoint` |
| 3 | `agent-deflects-to-app` | `touchpoint` |
| 3 | `install-provider-app` | `touchpoint` |
| 3 | `app-location-entry-fails` | `touchpoint` |
| 4 | `call-back-reenter-ivr` | **`loop_start`** |
| 4 | `safety-check` | `touchpoint` |
| 4 | `identity-verification` | `touchpoint` |
| 4 | `sms-location-link-fails` | `touchpoint` |
| 4 | `research-supported-location-formats` | `touchpoint` |
| 4 | `share-location-third-party` | **`loop_end`** |
| 5 | `case-created` | `touchpoint` |
| 5 | `await-recovery` | **`wait`** |
| 5 | `handoff-to-recovery-partner` | **`handoff`** |
| 5 | `partner-sms-tracking-link` | `signal` |
| 5 | `track-case-online` | `touchpoint` |
| 5 | `partner-confirms-by-phone` | `touchpoint` |
| 5 | `engineer-arrives` | `touchpoint` |
| 5 | `dropoff-location-disputed` | `decision` |
| 5 | `transport-to-partner-garage` | `touchpoint` |
| 5 | `complete-garage-paperwork` | `touchpoint` |
| 5 | `arrange-onward-travel` | `touchpoint` |
| 6 | `request-case-update` | `touchpoint` |
| 6 | `hire-car-offered` | `decision` |
| 6 | `family-finds-repairer` | `touchpoint` |
| 6 | `confirm-repairer-and-hire-car` | `touchpoint` |
| 6 | `handoff-to-hire-supplier` | **`handoff`** |
| 6 | `handoff-to-messaging-channel` | **`handoff`** |
| 6 | `receive-updates-via-messaging` | `end` |

All ten `nodeType` values are used. No existing mission achieves this.

---

## Task 1: Both Actors

**Files:**
- Create: `v2.0/examples/roadside/actor-adam-rees.json`
- Create: `v2.0/examples/roadside/actor-daniel-rees.json`

**Interfaces:**
- Consumes: nothing.
- Produces: artifact IDs `actor-adam-rees` and `actor-daniel-rees`, and context IDs `ctx-roadside-cover-holder` (Adam) and `ctx-roadside-vehicle-owner` (Daniel). Tasks 2 and 8 reference these exact strings.

**Content source:** source notes §8 (actors and relationships), §2 (how the cover came to exist).

- [ ] **Step 1: Create the directory and write `actor-adam-rees.json`**

Required top-level keys: `$context`, `$type`, `id`, `version`, `name`, `actorType`, `traits`, `contexts`, `meta`. Use `v2.0/examples/energy/actor-jake-holloway.json` as the structural reference.

Key facts this Actor must carry:
- `actorType`: `"human"`
- Holds a **paid premium bank account** whose bundled benefits include roadside cover
- Cover **follows the person, not the vehicle** — applies to any vehicle he travels in
- **Digitally confident**, but chose the phone under stress because it seemed faster
- Learned the benefit existed by **browsing while using an unrelated benefit**, weeks earlier
- **Abandons a failing channel permanently** — never returned to the app once phone and messaging worked

Its single context `ctx-roadside-cover-holder` must include a `channels` array. Worked example of one entry, establishing required depth:

```json
{
  "channel": "app",
  "category": "digital",
  "serviceModel": "self_service",
  "preference": "preferred",
  "usageContext": "Manages the bank account and its bundled benefits day to day; browses the benefits list opportunistically when visiting for something else"
}
```

Note `category`, `serviceModel` and `channel` are **required** on Actor channel entries (unlike Mission ones, which require only `channel` and `serviceModel`).

- [ ] **Step 2: Write `actor-daniel-rees.json`**

Same structure, context ID `ctx-roadside-vehicle-owner`. Key facts:
- **Owns the vehicle**; holds decision authority over anything done to it
- **Has his own motor insurance**, which refused assistance — he had not notified them of overseas travel despite holding dated cover for the trip (§3.3)
- **Was never contacted by the assistance service at any point** — every decision reached him second-hand
- Supplied the location from **his own phone** when his brother's failed (§3.17)

- [ ] **Step 3: Validate both**

```bash
node tools/validators/validate-v2.0.js v2.0/examples/roadside/ --check-refs
```

Expected: `2 passed, 0 failed`, both detected as `Actor`, quality reported. If quality is below 80, fill the thinner `traits` sub-objects rather than proceeding.

- [ ] **Step 4: Commit**

```bash
git add v2.0/examples/roadside/actor-adam-rees.json v2.0/examples/roadside/actor-daniel-rees.json
git commit -m "feat(examples): add roadside Actors — cover holder and vehicle owner

The person with the entitlement is not the person who owns the asset,
and the decision-maker was never contacted by the service. No existing
example set carries that split."
```

---

## Task 2: Mission scaffold — envelope, lanes, phases 1 and 2

**Files:**
- Create: `v2.0/examples/roadside/mission-roadside-assistance.json`

**Interfaces:**
- Consumes: `actor-adam-rees`, `actor-daniel-rees` from Task 1.
- Produces: the Mission with ID `mission-roadside-assistance`, its 11 lanes, and nodes `hold-premium-account` … `recall-bundled-cover`. Tasks 3–7 extend this same file. Task 8 references its node IDs.

**Content source:** source notes §2 (cover context), §3.1–3.4 (breakdown and first recourse).

- [ ] **Step 1: Write the envelope, lanes, and phases 1–2**

Required top-level keys: `$context`, `$type`, `id`, `version`, `title`, `goal`, `actors`, `nodes`, `edges`, `meta`. Also include `summary`, `scope`, `lanes`, `paths`, `phases`, `provenance`.

`actors`:

```json
"actors": [
  { "actorRef": "actor-adam-rees", "contextRef": "ctx-roadside-cover-holder", "role": "cover holder and primary contact" },
  { "actorRef": "actor-daniel-rees", "contextRef": "ctx-roadside-vehicle-owner", "role": "vehicle owner and decision-maker, never contacted by the service" }
]
```

`provenance` — this mission is unusual in being drawn from a first-hand account, so say so:

```json
"provenance": {
  "source": "human_created",
  "confidence": 0.9,
  "researchSources": [
    {
      "source": "First-hand account of a live roadside breakdown case (notes held privately, outside version control)",
      "type": "interview",
      "date": "2026-08-06",
      "confidence": "high"
    }
  ]
}
```

`lanes` — copy the 11-lane array verbatim from `v2.0/examples/retail/mission-online-clothes-shopping.json` so renderers and analysers work unchanged. Do not invent new lane types; if content needs one, that is a **finding to record in Task 10**, not a change to make here.

`scope.completion` must be **"Vehicle delivered to a garage able to repair it, with all occupants safely onward"** — the case was unresolved at capture and the Mission must not imply otherwise.

Add the 7 nodes for phases 1–2 from the inventory, the phase entries listing their `nodeRefs`, and these edges:

| from | to | `edgeType` |
|---|---|---|
| `hold-premium-account` | `benefits-surface-visible` | `default` |
| `benefits-surface-visible` | `discover-cover-incidentally` | `default` |
| `discover-cover-incidentally` | `vehicle-breaks-down` | `default` |
| `vehicle-breaks-down` | `establish-safety` | `default` |
| `establish-safety` | `owner-insurer-refuses` | `default` |
| `owner-insurer-refuses` | `recall-bundled-cover` | **`error`** |

The `error` edge is correct: the owner's own insurer refused, and that refusal is what routed them to the bundled cover (§3.3).

- [ ] **Step 2: Record the ambient distortion in the node itself**

`benefits-surface-visible` is the honest-modelling experiment. It is **not an event** — it is a surface that is always present. The schema has no way to say that, so model it as a `touchpoint` and put the loss on the record in its own description:

```json
{
  "nodeId": "benefits-surface-visible",
  "name": "Benefits are continuously visible",
  "nodeType": "touchpoint",
  "laneContent": {
    "description": "The benefits app home screen lists everything included, so any visit for one benefit exposes the others. SCHEMA LIMITATION: this is not a step — it is an always-available surface with no position in a sequence. Modelling it as a node between account opening and discovery implies an ordering and a causation that did not exist. See prediction 1.",
    "channels": [
      {
        "channel": "app",
        "category": "digital",
        "serviceModel": "self_service",
        "interaction": "automated",
        "ownership": "own",
        "name": "Bank benefits app",
        "usageContext": "Always available; lists all bundled benefits regardless of why the customer opened it"
      }
    ]
  }
}
```

- [ ] **Step 3: Validate**

```bash
node tools/validators/validate-v2.0.js v2.0/examples/roadside/ --check-refs
```

Expected: `3 passed, 0 failed`, the new file detected as `Mission`.

- [ ] **Step 4: Commit**

```bash
git add v2.0/examples/roadside/mission-roadside-assistance.json
git commit -m "feat(examples): scaffold roadside Mission with phases 1-2

Ambient benefit visibility modelled as a node with its own distortion
recorded in the description — the schema cannot express an
always-available surface."
```

---

## Task 3: Phase 3 — reaching the service

**Files:**
- Modify: `v2.0/examples/roadside/mission-roadside-assistance.json`

**Interfaces:**
- Consumes: `recall-bundled-cover` from Task 2.
- Produces: nodes `open-benefits-app` … `app-location-entry-fails`, and the `branch` node `choose-contact-route` that Task 7's paths diverge on.

**Content source:** source notes §3.5–3.10, §5 (first contact alternatives).

- [ ] **Step 1: Add the 7 phase-3 nodes and the phase entry**

`choose-contact-route` is a **`branch`** — the service genuinely offered two channels at once (§3.6), which is different from a `decision` where the customer weighs options internally. Its `laneContent.channels` must carry **three** entries: the provider app, the domestic phone number, and the overseas phone number. All three were presented; only one was taken.

Worked example for the `branch` node's channels:

```json
"channels": [
  {
    "channel": "app",
    "category": "digital",
    "serviceModel": "self_service",
    "interaction": "automated",
    "ownership": "partner",
    "name": "Assistance provider app",
    "usageContext": "Offered as the first option for raising a case"
  },
  {
    "channel": "phone",
    "category": "telecom",
    "serviceModel": "managed",
    "interaction": "human",
    "ownership": "partner",
    "name": "Overseas assistance number",
    "usageContext": "Offered for customers calling from outside the home country"
  },
  {
    "channel": "phone",
    "category": "telecom",
    "serviceModel": "managed",
    "interaction": "human",
    "ownership": "partner",
    "name": "Domestic assistance number",
    "usageContext": "Offered for customers calling from within the home country"
  }
]
```

Note `category: "telecom"` for both phone entries, and `ownership: "partner"` — from the **bank's** vantage point the provider is a partner, not `own`.

- [ ] **Step 2: Add the phase-3 edges**

| from | to | `edgeType` | note |
|---|---|---|---|
| `recall-bundled-cover` | `open-benefits-app` | `conditional` | condition: customer decides to try the bundled cover |
| `open-benefits-app` | `view-cover-summary` | `default` | |
| `view-cover-summary` | `choose-contact-route` | `default` | |
| `choose-contact-route` | `call-overseas-number` | `conditional` | label: "Call" — the route taken |
| `choose-contact-route` | `install-provider-app` | `conditional` | label: "Use the app" — the route offered |
| `call-overseas-number` | `agent-deflects-to-app` | `default` | |
| `agent-deflects-to-app` | `install-provider-app` | **`escalation`** | the service moved the customer to another channel mid-contact |
| `install-provider-app` | `app-location-entry-fails` | `default` | |

- [ ] **Step 3: Record the unsignposted channel**

The provider's **website** was a usable route that was never surfaced to the customer (§5). There is no schema field for "exists but is not signposted". Add it as a channel on `view-cover-summary` with the gap stated in `usageContext`:

```json
{
  "channel": "website",
  "category": "digital",
  "serviceModel": "self_service",
  "interaction": "automated",
  "ownership": "partner",
  "name": "Assistance provider website",
  "usageContext": "SCHEMA LIMITATION: this route existed and was usable, but was never signposted to the customer at this step. Nothing in the schema distinguishes an available channel from a discoverable one. See prediction 3."
}
```

- [ ] **Step 4: Validate**

```bash
node tools/validators/validate-v2.0.js v2.0/examples/roadside/mission-roadside-assistance.json
```

Expected: `PASS`, `Type: Mission`.

- [ ] **Step 5: Commit**

```bash
git add v2.0/examples/roadside/mission-roadside-assistance.json
git commit -m "feat(examples): add roadside phase 3 — reaching the service

First use of nodeType 'branch' and edgeType 'escalation'. The service
deflected to the app mid-call; the app then failed."
```

---

## Task 4: Phase 4 — establishing location

**Files:**
- Modify: `v2.0/examples/roadside/mission-roadside-assistance.json`

**Interfaces:**
- Consumes: `app-location-entry-fails` from Task 3.
- Produces: the `loop_start`/`loop_end` pair `call-back-reenter-ivr` and `share-location-third-party`.

**Content source:** source notes §3.11–3.17. **This is the strongest evidence in the map** — three attempts at one task, two failing through different channels, resolved by a third party on another person's device.

- [ ] **Step 1: Add the 6 phase-4 nodes and the phase entry**

`research-supported-location-formats` is the node covering the customer running a **search-engine query to find out what location formats the service accepts** (§3.16). Its channel is infrastructure nobody in the chain owns:

```json
{
  "channel": "website",
  "category": "digital",
  "serviceModel": "self_service",
  "interaction": "automated",
  "ownership": "third_party",
  "name": "Public search engine",
  "usageContext": "SCHEMA LIMITATION: the customer used a channel wholly outside the service to establish what the service itself supports. 'third_party' is the closest available value, but this is not a channel anyone in the delivery chain owns, contracted, or is even aware of. See prediction 5."
}
```

- [ ] **Step 2: Add the phase-4 edges, including two `error` edges and the loop**

| from | to | `edgeType` | note |
|---|---|---|---|
| `app-location-entry-fails` | `call-back-reenter-ivr` | **`escalation`** | app failure drove a return to phone |
| `call-back-reenter-ivr` | `safety-check` | `default` | |
| `safety-check` | `identity-verification` | `default` | |
| `identity-verification` | `sms-location-link-fails` | `default` | |
| `sms-location-link-fails` | `research-supported-location-formats` | **`error`** | the SMS location capture failed |
| `sms-location-link-fails` | `call-back-reenter-ivr` | **`loop_back`** | the designed retry cycle — see note |
| `research-supported-location-formats` | `share-location-third-party` | `default` | |
| `share-location-third-party` | `case-created` | `default` | created in Task 5 — **see the warning below** |

**On the `loop_back` edge.** `sms-location-link-fails` has **two** outgoing edges, which is correct and intentional: the `error` edge is what happened, and the `loop_back` edge is the service's designed behaviour — when a location method fails, return to the top of the location loop and try another. Both are real; they just belong to different paths.

Do **not** put `loop_back` between `app-location-entry-fails` and `call-back-reenter-ivr` — that pair already carries the `escalation` edge, and two edges between the same pair with different types produces a contradictory graph.

Note the retries in the observed case happened **within a single call**, not across separate calls. The loop structure represents the designed retry cycle; the observed path simply traverses it once. Say so in the `loop_start` node's description so the graph is not read as three separate phone calls.

**The edge to `case-created` cannot be added until Task 5 creates that node.** Add it at the start of Task 5, not here. If the validator is run with it present and the node absent, it will fail.

- [ ] **Step 3: Record the re-authentication cost**

`call-back-reenter-ivr` must state in its description that returning to phone meant **re-entering the menu system and re-confirming identity from scratch** — the failed deflection left no trace, and nothing carried over (§3.11–3.13). Set `nodeType` to `loop_start` and say in the description that this is the second attempt at a task already attempted through another channel.

- [ ] **Step 4: Validate**

```bash
node tools/validators/validate-v2.0.js v2.0/examples/roadside/mission-roadside-assistance.json
```

Expected: `PASS`. If it fails on a dangling edge, confirm you did not add the `case-created` edge early.

- [ ] **Step 5: Commit**

```bash
git add v2.0/examples/roadside/mission-roadside-assistance.json
git commit -m "feat(examples): add roadside phase 4 — establishing location

First use of loop_start/loop_end and edgeType 'error'. Location capture
failed twice through two channels before a third party resolved it on a
different person's device."
```

---

## Task 5: Phase 5 — dispatch and recovery

**Files:**
- Modify: `v2.0/examples/roadside/mission-roadside-assistance.json`

**Interfaces:**
- Consumes: `share-location-third-party` from Task 4.
- Produces: `case-created` … `arrange-onward-travel`, including the first `wait` and first `handoff`.

**Content source:** source notes §3.18–3.26, §7 (promise vs delivery).

- [ ] **Step 1: Add the 11 phase-5 nodes, the phase entry, and the deferred edge from Task 4**

Add `share-location-third-party` → `case-created` (`default`) now that the target exists.

`await-recovery` is the `wait` node. Give it `durationMs` reflecting the 60–90 minute estimate and an `sla` block, following the shape used by `payment` in the retail mission:

```json
{
  "nodeId": "await-recovery",
  "name": "Wait for recovery to arrive",
  "nodeType": "wait",
  "durationMs": 4500000,
  "laneContent": {
    "description": "Customer waits at the roadside. The service gave a 60-90 minute estimate and undertook to make contact if anything changed. In the observed case the estimate held and no chase was needed."
  },
  "sla": {
    "targetDuration": "60-90 minutes",
    "targetDurationMs": 5400000,
    "escalation": "Service undertakes to contact the customer if the estimate changes"
  }
}
```

- [ ] **Step 2: Add the phase-5 edges**

| from | to | `edgeType` |
|---|---|---|
| `case-created` | `await-recovery` | `default` |
| `await-recovery` | `handoff-to-recovery-partner` | `default` |
| `handoff-to-recovery-partner` | `partner-sms-tracking-link` | `default` |
| `partner-sms-tracking-link` | `track-case-online` | `default` |
| `track-case-online` | `partner-confirms-by-phone` | `default` |
| `partner-confirms-by-phone` | `engineer-arrives` | `default` |
| `engineer-arrives` | `dropoff-location-disputed` | `default` |
| `dropoff-location-disputed` | `transport-to-partner-garage` | `conditional` |
| `transport-to-partner-garage` | `complete-garage-paperwork` | `default` |
| `complete-garage-paperwork` | `arrange-onward-travel` | `default` |

- [ ] **Step 3: Record the expiring channel**

`track-case-online` carries the partner's tracking website, which **stopped being useful once the vehicle was collected** (§6). Nothing in the schema expresses a channel with a validity window:

```json
{
  "channel": "website",
  "category": "digital",
  "serviceModel": "self_service",
  "interaction": "automated",
  "ownership": "third_party",
  "name": "Recovery partner case tracking site",
  "usageContext": "SCHEMA LIMITATION: useful only between dispatch and collection. After collection it shows nothing and the customer has no way to know it has expired. Attaching a channel to a node says 'available here'; it cannot say 'and dead afterwards'. See prediction 4."
}
```

- [ ] **Step 4: Record the promise-vs-delivery divergence**

`dropoff-location-disputed` is a `decision` node whose description must state plainly: **the cover entitles the customer to be taken wherever they need, and the recovery crew said otherwise and was not challenged** (§7). Attribute the root cause correctly — this is a **knowledge barrier at the partner**, not a policy gap. Add a `barriers` entry with `type: "knowledge"` and an appropriate `severity`.

- [ ] **Step 5: Validate**

```bash
node tools/validators/validate-v2.0.js v2.0/examples/roadside/mission-roadside-assistance.json
```

Expected: `PASS`.

- [ ] **Step 6: Commit**

```bash
git add v2.0/examples/roadside/mission-roadside-assistance.json
git commit -m "feat(examples): add roadside phase 5 — dispatch and recovery

First use of nodeType 'handoff'. Records an expiring channel and a
knowledge barrier at the partner, where stated cover and delivered
service diverged."
```

---

## Task 6: Phase 6 — onward case management

**Files:**
- Modify: `v2.0/examples/roadside/mission-roadside-assistance.json`

**Interfaces:**
- Consumes: `arrange-onward-travel` from Task 5.
- Produces: the final nodes including `receive-updates-via-messaging` (`end`), and the `ai_assisted` channel.

**Content source:** source notes §3.27–3.36, and the "Where AI would have come in more" subsection of §5.

- [ ] **Step 1: Add the 7 phase-6 nodes and the phase entry**

`family-finds-repairer` is the node where the **customer's family did the service's job, off-channel** — they walked into a village garage while the service was actively working the same task (§3.29). It has **no channel entry at all**, because no service channel was involved. State that explicitly in the description rather than leaving `channels` merely absent.

- [ ] **Step 2: Author the `ai_assisted` channel — the one place we must write something false**

`handoff-to-messaging-channel` carries the messaging channel. Per the spec, author it as `ai_assisted` because that is the service's design, and record the loss:

```json
{
  "channel": "messaging_app",
  "category": "digital",
  "serviceModel": "both",
  "interaction": "ai_assisted",
  "ownership": "third_party",
  "name": "Messaging conversation with the assistance provider",
  "usageContext": "Opens with an automated message and can answer simple queries itself. SCHEMA LIMITATION: on this case it was staffed by a human throughout, because an international recovery is treated as complex. The channel is ai_assisted as designed and human as delivered, and 'interaction' holds one value per channel entry with no way to vary it by path or by case complexity. Authored as designed; the observed value is lost. See prediction 7."
}
```

- [ ] **Step 3: Add the phase-6 edges**

| from | to | `edgeType` |
|---|---|---|
| `arrange-onward-travel` | `request-case-update` | `default` |
| `request-case-update` | `hire-car-offered` | `default` |
| `hire-car-offered` | `family-finds-repairer` | `conditional` |
| `family-finds-repairer` | `confirm-repairer-and-hire-car` | `default` |
| `confirm-repairer-and-hire-car` | `handoff-to-hire-supplier` | **`default`** |
| `handoff-to-hire-supplier` | `handoff-to-messaging-channel` | `default` |
| `handoff-to-messaging-channel` | `receive-updates-via-messaging` | `default` |

- [ ] **Step 4: Validate**

```bash
node tools/validators/validate-v2.0.js v2.0/examples/roadside/mission-roadside-assistance.json
```

Expected: `PASS`. All 38 nodes present.

- [ ] **Step 5: Verify all ten nodeTypes are now used**

```bash
node -e "
const m=require('./v2.0/examples/roadside/mission-roadside-assistance.json');
const NT=['touchpoint','decision','handoff','wait','signal','branch','loop_start','loop_end','start','end'];
const used=new Set(m.nodes.map(n=>n.nodeType));
console.log('nodes:',m.nodes.length,'edges:',m.edges.length);
NT.forEach(t=>console.log((used.has(t)?'  OK ':'  MISSING ')+t));
process.exit(NT.every(t=>used.has(t))?0:1);
"
```

Expected: every type `OK`, exit 0. If any is MISSING, fix before committing.

- [ ] **Step 6: Commit**

```bash
git add v2.0/examples/roadside/mission-roadside-assistance.json
git commit -m "feat(examples): add roadside phase 6 — onward case management

Completes all ten nodeTypes, a first for any mission in the set. Records
the ai_assisted channel that ran as human because the case was complex,
and the node where the customer's family did the service's job
off-channel."
```

---

## Task 7: Paths

**Files:**
- Modify: `v2.0/examples/roadside/mission-roadside-assistance.json`

**Interfaces:**
- Consumes: every node ID from Tasks 2–6.
- Produces: `paths` array with 5 entries. Task 8's Experience references `path-observed`.

**Content source:** spec §6; source notes §5 for the alternatives, §10 for what is unobserved.

- [ ] **Step 1: Author the five paths**

| `pathId` | `pathType` | Content |
|---|---|---|
| `path-observed` | `observed` | The real case: every node actually traversed, in order, including both failures and the loop. |
| `path-designed-selfservice` | `designed` | App route succeeds: `choose-contact-route` → `install-provider-app` → location captured first time → `case-created` onward. No phone contact. |
| `path-designed-assisted` | `designed` | Phone route with location captured first time: no deflection, no loop, no `error` edges. |
| `path-designed-timeout` | `designed` | The estimate is breached and the service makes contact. **See step 2.** |
| `path-concierge` | `designed` | Entry via the card-based concierge route rather than the benefits app. |

Every `nodeSequence` entry must be a node ID that exists. `path-observed` must have `frequency` omitted or set honestly — it is a single observed case, not a measured proportion.

- [ ] **Step 2: Bound the `timeout` path to the evidence**

The estimate **held** in the real case. The only evidence a designed escalation exists at all is that the service undertook to make contact if anything changed (§3.19). That justifies exactly **one** `timeout` edge, on `path-designed-timeout` only.

Add this edge to the `edges` array:

| from | to | `edgeType` | condition |
|---|---|---|---|
| `await-recovery` | `request-case-update` | **`timeout`** | "Estimated arrival window is exceeded" |

**`timeout` must never appear on `path-observed`.** If authoring this path requires inventing any service behaviour beyond that stated undertaking, delete the path and record in Task 10 that `timeout` remains unexercised. That is an acceptable outcome.

- [ ] **Step 3: Validate**

```bash
node tools/validators/validate-v2.0.js v2.0/examples/roadside/ --check-refs
```

Expected: `3 passed, 0 failed`.

- [ ] **Step 4: Verify edgeType coverage**

```bash
node -e "
const m=require('./v2.0/examples/roadside/mission-roadside-assistance.json');
const ET=['default','conditional','error','timeout','escalation','loop_back'];
const used=new Set(m.edges.map(e=>e.edgeType));
ET.forEach(t=>console.log((used.has(t)?'  OK ':'  MISSING ')+t));
const ids=new Set(m.nodes.map(n=>n.nodeId));
const bad=m.edges.filter(e=>!ids.has(e.from)||!ids.has(e.to));
console.log('dangling edges:',bad.length); bad.forEach(e=>console.log('  ',e.from,'->',e.to));
(m.paths||[]).forEach(p=>{
  const miss=p.nodeSequence.filter(n=>!ids.has(n));
  console.log(p.pathId, p.pathType, miss.length?('MISSING: '+miss.join(',')):'ok');
});
"
```

Expected: all six edgeTypes `OK`, zero dangling edges, every path `ok`. **The validator does not check edge or path node references** — this step is the only thing that will catch a typo in a node ID.

- [ ] **Step 5: Commit**

```bash
git add v2.0/examples/roadside/mission-roadside-assistance.json
git commit -m "feat(examples): add roadside paths — designed vs observed

Five paths including the observed run and four designed alternatives.
'timeout' is confined to one designed path, justified solely by the
service's undertaking to make contact if the estimate changed. It never
appears on the observed path, because the estimate held."
```

---

## Task 8: The Experience

**Files:**
- Create: `v2.0/examples/roadside/exp-adam-roadside-recovery.json`

**Interfaces:**
- Consumes: `actor-adam-rees`, `ctx-roadside-cover-holder`, `mission-roadside-assistance`, and the node IDs on `path-observed`.
- Produces: the fourth artifact. Nothing consumes it.

**Content source:** the whole of source notes §3. Use `v2.0/examples/energy/exp-jake-energy-switch.json` as the structural reference.

- [ ] **Step 1: Write the Experience**

Required: `$context`, `$type`, `id`, `version`, `title`, `references`, `path`, `nodes`, `meta`.

```json
"references": {
  "actorRef": "actor-adam-rees",
  "contextRef": "ctx-roadside-cover-holder",
  "missionRef": "mission-roadside-assistance"
}
```

`path.nodeSequence` must match `path-observed` from Task 7 exactly.

Per-node content carries the **persona-specific** material — thoughts, emotions, and barriers with `emergesFrom`. Service-level facts stay in the Mission. Emotional low points to reflect from the notes: the insurer refusal (§3.3), the app failing when it was the recommended route (§3.10), and having to re-authenticate after the deflection (§3.11–3.13). The recovery of confidence comes at §3.17 when the location finally transmits.

**`emotions.intensity` and `outcome.netSentiment` are integers from −2 to 2.** Never strings.

`outcome.netSentiment` should be mildly positive, not negative: the service worked, the estimate held, and the messaging channel has been genuinely useful — the friction was real but the outcome was not a failure.

- [ ] **Step 2: Validate with cross-references**

```bash
node tools/validators/validate-v2.0.js v2.0/examples/roadside/ --check-refs
```

Expected: `4 passed, 0 failed`. Cross-ref errors here mean `actorRef`, `contextRef`, `missionRef`, or a `nodeSequence` ID does not resolve — **this is the one artifact type where the validator does check references.**

- [ ] **Step 3: Commit**

```bash
git add v2.0/examples/roadside/exp-adam-roadside-recovery.json
git commit -m "feat(examples): add Adam's observed roadside Experience

The real run through the mission, including both location-capture
failures and the re-authentication cost of the mid-call deflection."
```

---

## Task 9: Render and verify visually

**Files:** none created. Output goes to the scratchpad, not the repo.

- [ ] **Step 1: Render the Mission**

```bash
node tools/renderers/render-mission.js v2.0/examples/roadside/mission-roadside-assistance.json -o /tmp/roadside-mission.html --standalone --mode explore
```

The flag is `-o`, not `--out`. Full usage:
`node render-mission.js <mission.json> [-o out.html] [--standalone] [--mode overview|explore]`

Render `--mode overview` as well and check both — they are different layout paths, and a mission this large can break one while the other holds.

- [ ] **Step 2: Open it in a browser and look at it**

**Markup tests pass on visibly broken layouts.** Do not skip this and do not substitute a DOM assertion for looking.

Check specifically:
- All 38 nodes are present and none overlap
- The `branch` at `choose-contact-route` renders as a genuine fork, and both outgoing edges are distinguishable
- The `loop_start`/`loop_end` pair reads as a loop rather than as two unrelated nodes
- Channel glyphs appear; `telecom` entries are distinguishable from `digital` and `physical`
- The six phases are visually separated and in order
- Nothing is clipped at the canvas edges

- [ ] **Step 3: Fix what looks wrong**

If the layout breaks, the fault may be the renderer rather than the data — this is the largest and most branch-heavy mission yet, so it is a genuine stress test. **Diagnose before editing anything.** If the renderer is at fault, record it as a finding and a backlog item; do not distort the mission to flatter the renderer.

- [ ] **Step 4: Commit any data fixes**

```bash
git add v2.0/examples/roadside/mission-roadside-assistance.json
git commit -m "fix(examples): correct roadside mission after visual review"
```

Skip if nothing changed.

---

## Task 10: Findings, backlog, and the full gate

**Files:**
- Modify: `docs/superpowers/specs/2026-08-06-roadside-mission-design.md`

- [ ] **Step 1: Test each of the seven predictions against what actually happened**

Append a `## 11. Findings` section to the spec. For **each** of the seven predictions in §7, record **confirmed** or **refuted**, with the specific node or field that demonstrates it.

The seven, restated:
1. No way to express always-available / ambient channels
2. `ownership` cannot express degrees of remove
3. No way to record that a channel exists but is not signposted
4. No way to express a channel that expires mid-case
5. No way to model third-party channels outside the service
6. No way to express a precondition established by a different journey
7. `interaction` is fixed per channel and cannot vary between designed and observed paths

- [ ] **Step 2: Apply the falsification rule**

**If fewer than five of the seven are confirmed, the findings section must state plainly that the reading of the schema was wrong**, and say which predictions failed and why. Do not quietly drop refuted predictions — a refuted prediction is a result.

Also record any gap found that was **not** predicted. Prime candidate: whether `ownership` from the bank's vantage point collapsed into near-universal `third_party`, and whether that made the field useless or merely awkward.

- [ ] **Step 3: Record what remained unexercised**

State explicitly whether `timeout` ended up used, and on which path. If Task 7 step 2 dropped it, say so.

- [ ] **Step 4: File backlog items for each confirmed gap**

```bash
node tools-internal/backlog.js add "<gap title>" --category schema --source observation --description "<what the schema cannot express, with the node that demonstrates it>" --rationale "Found while authoring the roadside mission (BACK-021)."
node tools-internal/backlog.js sync
```

Gaps 1 and 4 both belong to **BACK-020** — add them to that item's description rather than creating duplicates.

- [ ] **Step 5: Run the full verification gate**

Check exit codes directly — piping to `tail` or `grep` reports the **pipe's** status, not node's.

```bash
for t in tools/validators/test-v2.0-validator.js tools/renderers/test-mission-layout.js tools/renderers/test-render-mission.js tools/converters/test-converter.js; do
  out=$(node "$t" 2>&1); code=$?
  echo "$t -> exit $code"
  [ $code -ne 0 ] && echo "$out"
done
node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs; echo "examples -> exit $?"
```

Expected: all four suites exit 0 (94, 16, 83, 87 passed), and **16/16 examples pass**.

**`run-all-tests.js` exits 1 and that is expected** — a pre-existing v1.x path failure unrelated to this work (BACK-017). Do not try to fix it here.

- [ ] **Step 6: Confirm the other four example sets did not move**

Quality scores for retail, healthcare, sales and energy must be **unchanged at 85–100**. This work adds files and touches nothing existing, so any movement means something unrelated broke — investigate before committing.

- [ ] **Step 7: Close out the backlog item**

```bash
node tools-internal/backlog.js update BACK-021 completed --outcome "Roadside assistance example set authored: 2 Actors, Mission (38 nodes, all 10 nodeTypes, 5 paths), Experience. <N> of 7 predicted schema gaps confirmed; findings in docs/superpowers/specs/2026-08-06-roadside-mission-design.md"
node tools-internal/backlog.js sync
```

- [ ] **Step 8: Commit**

```bash
git add docs/superpowers/specs/2026-08-06-roadside-mission-design.md
git commit -m "docs(spec): record roadside mission findings

<N> of 7 predicted schema gaps confirmed against real authored data.
Gaps feed BACK-020; BACK-027 stays deferred behind it."
```

---

## Definition of done

- [ ] Four artifacts exist in `v2.0/examples/roadside/` and all validate with `--check-refs`
- [ ] `node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs` reports **16/16**
- [ ] All ten `nodeType` values used; `edgeType` coverage recorded (five or six of six)
- [ ] `interaction` uses all three values; `ownership` used throughout
- [ ] Zero dangling edge or path node references (Task 7 step 4)
- [ ] The Mission has been **rendered and looked at in a browser**
- [ ] All seven predictions marked confirmed or refuted, with the falsification rule applied
- [ ] Backlog items filed for confirmed gaps; BACK-021 closed
- [ ] Four test suites exit 0; other four example sets unchanged at 85–100
