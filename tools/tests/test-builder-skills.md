# v2.0 Builder Skill Testing Protocol

> This document defines scripted test scenarios for validating the three v2.0 builder skills:
> `actor-builder`, `mission-builder`, and `experience-generator`.
>
> Each scenario is designed to test a specific skill end-to-end and produce output that
> validates against the v2.0 schemas with a quality score ≥ 70.

---

## How to run a test

1. Open a new Claude Code conversation in this project directory.
2. Invoke the skill: e.g. `/actor-builder`
3. Walk through the scripted inputs below, using **Guided mode** unless otherwise specified.
4. When the skill produces output JSON, save it to the fixture path shown.
5. Run validation:

```bash
node tools/validators/validate-v2.0.js tools/tests/fixtures/ --check-refs
```

All fixtures must pass with quality score ≥ 70.

---

## Test Scenario 1 — Actor Builder: Alex Thompson

**Skill:** `/actor-builder`
**Mode:** Guided
**Save output to:** `tools/tests/fixtures/actor-alex-thompson.json`

### Scripted inputs

| Prompt | Input |
|--------|-------|
| Name | Alex Thompson |
| Domain / sector | UK central government — benefits and welfare services |
| Actor type | Human |
| Age / background | 42, single parent, part-time retail work, community college education |
| Core needs (3-5) | 1. Certainty that benefit payments will arrive on time. 2. Clear, plain-English guidance — no jargon. 3. Ability to complete forms without specialist support. 4. Privacy — doesn't want neighbours or employer to know |
| Frustrations (2-4) | 1. Government websites that time out and lose form progress. 2. Having to repeat information already submitted. 3. Call centre hold times when something goes wrong |
| Tech comfort | Intermediate — uses a smartphone daily, comfortable with apps, but frustrated by complex web forms |
| Context title | Benefit Claimant |
| Context type | Consumer |
| Context needs | 1. Know exactly what I'm entitled to (primary). 2. Submit my claim without making an avoidable error (primary). 3. Get updates without having to call (secondary) |
| Context frustrations | 1. Severity 4 — Uncertainty about eligibility before investing time in the application. 2. Severity 3 — Errors causing delays that affect rent payments |
| Channels | Digital (web, primary, self-service), phone (fallback, assisted), face-to-face (Job Centre, occasional) |
| Emergence — goals | "Navigate the system without needing an advocate" — the collision of his capability and the system's complexity |
| Emergence — pain points | "Feels like the system assumes I'll fail" — his need for dignity meets opaque eligibility criteria |
| Provenance | Generative, based on ONS benefit claimant statistics and Citizens Advice case studies |

### Pass criteria

- [ ] Output is valid JSON (`$type: Actor`)
- [ ] Validates against `v2.0/schemas/actor.schema.json`
- [ ] Quality score ≥ 70
- [ ] Has `actorType: "human"`
- [ ] Has ≥ 3 needs in traits
- [ ] Has ≥ 1 context with needs, frustrations, and channels
- [ ] Has emergence with `goalsAsExperienced` and `painPoints` with `emergesFrom`

---

## Test Scenario 2 — Mission Builder: Apply for Housing Benefit

**Skill:** `/mission-builder`
**Mode:** Standard (mission-builder has no modes — it's always structured)
**Save output to:** `tools/tests/fixtures/mission-apply-housing-benefit.json`

### Scripted inputs

| Prompt | Input |
|--------|-------|
| Mission title | Apply for Housing Benefit |
| Goal | Enable citizens to successfully apply for Housing Benefit and receive a timely, correct decision |
| Primary channel | Digital (GOV.UK) with phone fallback |
| Nodes to include | 1. Start: Discover eligibility. 2. Eligibility checker (touchpoint). 3. Decision: Eligible? 4. Create account (touchpoint). 5. Gather evidence (touchpoint — wait for documents). 6. Complete application form (touchpoint). 7. Submit (touchpoint). 8. Decision: All evidence received? 9. Wait: Council processing. 10. Decision: Approved? 11. Notification sent (signal). 12. Backdated payment (end — success). 13. Rejection letter (end — fail). 14. Appeals information (touchpoint) |
| Phases | Discovery, Application, Review, Decision |
| Paths | Happy path (apply → approve, frequency 0.65), Incomplete path (missing evidence → chase → resubmit, frequency 0.25), Rejected path (apply → reject → appeal, frequency 0.10) |
| Frontstage | GOV.UK eligibility checker, Application form, Document upload portal, Notification emails |
| Backstage | Council assessment team, Benefits management system, Fraud detection rules |
| Support systems | National Identity Register, Council Tax records, HMRC earnings data |
| Key barriers | Digital exclusion (some claimants don't have internet access), Evidence gaps (claimants unsure what documents are acceptable) |
| SLA | Application form submission: target 90% completed in < 45 minutes |
| Accessibility | Cognitive load: many complex eligibility questions presented sequentially — should be chunked and saved |

### Pass criteria

- [ ] Output is valid JSON (`$type: Mission`)
- [ ] Validates against `v2.0/schemas/mission.schema.json`
- [ ] Quality score ≥ 70
- [ ] Has ≥ 10 nodes
- [ ] Has ≥ 2 decision nodes
- [ ] Has ≥ 3 paths with frequency values
- [ ] Has frontstage, backstage, support-systems lanes populated
- [ ] Has ≥ 1 node with SLA

---

## Test Scenario 3 — Experience Generator: Alex Thompson applies for Housing Benefit

**Skill:** `/experience-generator`
**Prerequisites:** Both fixtures above must exist and validate.
**Save output to:** `tools/tests/fixtures/exp-alex-housing-benefit.json`

### Scripted inputs

| Prompt | Input |
|--------|-------|
| Actor to use | `actor-alex-thompson.json` (the fixture from Scenario 1) |
| Mission to use | `mission-apply-housing-benefit.json` (the fixture from Scenario 2) |
| Path to walk | Happy path (apply → approved) |
| Key needAtStep moments | 1. Eligibility checker: "I need to know if it's worth starting before I give all my details". 2. Evidence gathering: "I need a clear list of exactly what documents will be accepted". 3. Processing wait: "I need to know the claim is actually being looked at, not lost" |
| Key painAtStep moments | 1. Application form: "The form keeps using official terms I have to look up". 2. Decision wait: "Two weeks without any update makes me worry I'll miss rent" |
| Emotional arc | Starts uncertain/tentative, rises to cautious optimism at submission, dips to anxiety during wait, peaks with relief at approval |
| Outcome | Approved — first payment within 14 days. Would recommend GOV.UK route over phone to friends in same situation. |

### Pass criteria

- [ ] Output is valid JSON (`$type: Experience`)
- [ ] Validates against `v2.0/schemas/experience.schema.json`
- [ ] Quality score ≥ 70
- [ ] `references.actorRef` matches actor fixture ID
- [ ] `references.missionRef` matches mission fixture ID
- [ ] Has `needAtStep` on ≥ 3 nodes
- [ ] Has `painAtStep` on ≥ 2 nodes
- [ ] Has thoughts and emotions on ≥ 75% of nodes
- [ ] Has `outcome` section
- [ ] Passes `--check-refs` validation against the fixture set

---

## Running all three together

After creating all three fixtures:

```bash
# Validate all three as a set with cross-reference checking
node tools/validators/validate-v2.0.js tools/tests/fixtures/ --check-refs

# Expected output:
# - 3 files, all PASS
# - Quality scores ≥ 70 each
# - No cross-ref errors
```

If all three pass, move them to `v2.0/examples/government/`:

```bash
mkdir -p v2.0/examples/government
cp tools/tests/fixtures/actor-alex-thompson.json v2.0/examples/government/
cp tools/tests/fixtures/mission-apply-housing-benefit.json v2.0/examples/government/
cp tools/tests/fixtures/exp-alex-housing-benefit.json v2.0/examples/government/
git add v2.0/examples/government/
git commit -m "feat(v2.0): add Alex Thompson government benefits example set"
```

---

## Notes

- Skills are in `.claude/skills/` (gitignored — local only)
- The validator is at `tools/validators/validate-v2.0.js`
- Quality scoring rubric: see `tools/validators/v2.0-quality-scoring.js`
- These fixtures serve as regression tests for builder skill output quality
