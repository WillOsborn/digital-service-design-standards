# Channel spelling constraint — design

**Date:** 2026-08-06
**Backlog item:** BACK-027 (accepted, P3)
**Status:** designed, **deliberately deferred — do not implement yet**
**Schema version:** v2.0, in place (no new version directory)

> **Sequencing: land this after BACK-020, not before.**
>
> BACK-020 (ambient always-available help channels) is an unresolved channel schema gap, and
> BACK-021 (the channel-switching Mission) exists to reveal what it actually needs. Building
> channel vocabulary machinery before that answer arrives risks rebuilding it — the same
> reasoning already applied to the Actor/Experience renderers in `docs/current-state.md`.
>
> The constraint would not *block* BACK-021 — the pattern is shape-only, so any snake_case
> value still validates — but it adds friction precisely during exploratory authoring: coin a
> new type, get a warning, then edit two schemas and the taxonomy to silence it.
>
> Note also that the drift this guards against is **already substantially closed**. BACK-024
> fixed all five sources that regenerated it, including the `mission-builder` skill prompt.
> This is a second lock on a door that shuts — worth having, not worth blocking on.

### Open on resumption

**§2's choice of a schema annotation over a shared module should be re-examined.** It was
recommended on the principle "single source of truth = the schema itself", but it produces
*two* copies of the 13-value list. That is the same drift shape BACK-024 spent a session
undoing, and the principle argued for schema-as-truth, not schema-duplicated-twice. The
shared-module alternative (`tools/lib/channel-vocabulary.js`, imported by both validator and
converter) carries one copy and would additionally de-duplicate the `CHANNEL_NAME_MAP` and
`TELECOM_CHANNELS` sets the converter hardcodes today. Weigh both again before implementing.

---

## 1. Problem

BACK-024 cleaned 30 malformed `channel` entries out of the v2.0 examples and closed the five
sources that regenerated them. Nothing mechanically prevents recurrence: `channel` is declared
`{ "type": "string", "maxLength": 50 }` in both schemas that carry it, so `video-call`,
`Video Call`, `web portal` and `salesforce` all validate silently and fragment every
channel-mix analysis.

`CHANNEL_TAXONOMY.md` already prescribes the rule in prose — lower `snake_case`, matching the
suggested types — and states plainly that "the field is unconstrained, so nothing will reject a
variant". This design makes the schema enforce what the taxonomy already asks for.

### What the constraint has to catch

Measured against the 30 entries actually cleaned in commit `e285fe8`:

| Bad value | Entries | Rejected by `^[a-z][a-z0-9_]*$`? |
|---|---:|---|
| `video-call` | 6 | yes |
| `in-person` | 2 | yes |
| `phone-call`, `on-site-visit`, `board-meeting`, `g-cloud`, `find-a-tender`, `legal-portal`, `kickoff-meeting`, `internal-workshops`, `shared-documents`, `structured-questionnaire` | 10 | yes |
| **`web`** | **8** | **no — passes** |
| `slack`, `salesforce`, `linkedin`, `presentation` | 4 | no — passes |

A shape-only pattern catches **18 of 30**. It misses 12, including `web` — the single largest
offender — because a one-word lowercase product name is indistinguishable from a legitimate
channel type by shape alone.

Two distinct failure modes therefore need two distinct mechanisms:

- **Malformed spelling** (`video-call`, `Video Call`) — never legitimate. Hard error.
- **Well-formed but wrong word** (`web`, `salesforce`) — sometimes legitimate, because the
  taxonomy is an open set by design. Warning.

---

## 2. Schema change

Both sites that declare `channel` — `v2.0/schemas/actor.schema.json` (~line 421, inside
`contexts[].channels[]`) and `v2.0/schemas/mission.schema.json` (~line 325, inside
`nodes[].laneContent.channels[]`) — receive identical additions:

```json
"channel": {
  "type": "string",
  "maxLength": 50,
  "pattern": "^[a-z][a-z0-9_]*$",
  "x-knownChannels": [
    "website", "app", "email", "chat", "social_media", "messaging_app",
    "push_notification", "phone", "sms", "video_call", "in_person", "post", "print"
  ]
}
```

`pattern` is enforced by Ajv and fails validation.

`x-knownChannels` is **not** a JSON Schema keyword and validates nothing. The validator is
configured `strict: false` (`validate-v2.0.js:29`), so Ajv ignores it without complaint. It
exists so the vocabulary check has a list to read at runtime, keeping the schema the single
source of truth and honouring the recorded principle that validators must not hardcode field
values.

`experience.schema.json` is untouched — it has no `channels` array; its only `channel` mention
is a lane-type enum value.

The 13 values are exactly the suggested types tabulated in `CHANNEL_TAXONOMY.md`.

**The list is duplicated across two schema files, which is a drift risk** — the precise failure
BACK-024 spent a session undoing. A test asserts the two arrays are identical, so the copies
cannot silently diverge. Keeping them in step with the taxonomy's table stays a manual step,
called out in §6.

### Why an annotation rather than an enum

An `enum` would catch all 30 errors and needs no validator work, but it closes a set the
taxonomy explicitly declares open ("Use these common types, or define your own. Custom types
are fully supported."). Reopening it would require reinstating a `custom_type` escape hatch,
which v1.0.3 deliberately removed. The annotation keeps the set open while still allowing the
tooling to advise.

---

## 3. Validator change

New function `validateChannelVocabulary(data, schema)` in `tools/validators/validate-v2.0.js`,
following the existing `validateLaneTypes` pattern (line 94 onwards): returns `string[]`, its
output joins the existing `warnings` array in the result object, and it never affects `valid`
or the process exit code.

**Vocabulary discovery.** Recursively walk the loaded schema for any object carrying an
`x-knownChannels` key and union the arrays found. Do *not* hardcode the property paths — actor
nests channels under `contexts`, mission under `nodes[].laneContent`, and hardcoded paths would
break silently the day either schema is restructured. If no annotation is found, the check
returns no warnings rather than erroring, so an older schema stays usable.

**Value discovery.** Recursively walk the artifact for `channels` arrays and read the `channel`
property of each item. This covers both artifact shapes with one traversal.

**Warning text** names the offending value and, where the converter's alias map knows a
mapping, the likely fix:

```
channel "web" is not a known channel type — did you mean "website"?
(custom types are allowed; see documentation/CHANNEL_TAXONOMY.md)
```

Suggestions are drawn from `CHANNEL_NAME_MAP` in the converter, so `web`, `video-call`,
`in-person`, `phone-call`, `voice`, `text` and `social-media` all get a named fix rather than a
bare complaint. Values with no known mapping warn without a suggestion.

---

## 4. Converter change

`convert-v1.1-to-v2.0.js` currently passes unrecognised channel values through untouched
(`normaliseChannelName`, line 59). Once the pattern exists, a v1.1 artifact carrying
`Video Call` or `web portal` would convert into v2.0 output that fails validation — the
converter would start producing invalid artifacts.

`normaliseChannelName` gains a slugify fallback, applied only after the alias map misses:

1. lowercase and trim
2. `[\s-]+` → `_`
3. strip any character outside `[a-z0-9_]`
4. strip leading characters until the string starts with a letter
5. if nothing survives, return the original value unchanged and warn (the validator will then
   reject it, which is correct — an unrepresentable value must not be silently invented)

`Video Call` → `video_call`, `web portal` → `web_portal`, `G-Cloud` → `g_cloud`. The alias map
still takes precedence, so `web` → `website` rather than `web`. Every slugified value is
reported so a migration never silently renames a channel.

Post-condition: every `channel` the converter emits either matches the pattern or was
explicitly reported as unconvertible.

---

## 5. Testing

Test-first, extending the two existing suites.

**`tools/validators/test-v2.0-validator.js`** (94 tests today):
- pattern rejects `video-call`, `Video Call`, `web portal`, `in-person`, `_website`, `2fa`
- pattern accepts all 13 canonical types
- well-formed unknown value (`web`) produces a warning, and the artifact still validates
- the warning text contains the suggested replacement where one exists
- an unknown value with no mapping warns without a suggestion
- warnings do not change `valid`
- vocabulary discovery finds the annotation in both actor and mission schemas
- a schema with no `x-knownChannels` produces no warnings rather than throwing
- **actor and mission `x-knownChannels` arrays are identical** (guards the duplication in §2)

**`tools/converters/test-converter.js`** (87 tests today):
- `Video Call` → `video_call`, `web portal` → `web_portal`
- alias map wins over slugify (`web` → `website`, not `web`)
- already-canonical values pass through byte-identical
- every value the converter emits matches `^[a-z][a-z0-9_]*$`
- an unconvertible value is returned unchanged and reported

---

## 6. Documentation

Five sites assert that nothing rejects a bad channel value. All become false:

| File | Line | What changes |
|---|---:|---|
| `documentation/CHANNEL_TAXONOMY.md` | 53 | "Nothing enforces this" → the shape is enforced; the word choice is not |
| `documentation/CHANNEL_TAXONOMY.md` | 354–355 | "free string and custom values validate" → custom values validate but warn |
| `documentation/CHANNEL_TAXONOMY.md` | 363 | "The field is unconstrained, so nothing will reject a variant" → variants are now rejected |
| `v2.0/standards/SERVICE-DESIGN-ACTOR-STANDARD.md` | 170 | same correction |
| `v2.0/standards/SERVICE-DESIGN-MISSION-STANDARD.md` | 96 | same correction |

The taxonomy's "Extending the taxonomy" section gains the rule in two lines: a new type must be
lower `snake_case`; it will validate and warn until added to **both** schemas'
`x-knownChannels` arrays *and* the suggested-types table here. Those three places are the
manual step the identity test in §5 cannot cover.

---

## 7. Versioning

Landing in place on v2.0 — no new version directory. v2.0 has no consumers outside this
repository and all 12 examples already conform, so the tightening breaks nothing in practice.

There is **no schema-level version field to bump**. The `version` property in each schema
(`actor.schema.json:29`) constrains the *artifact's* declared version to `^2\.0\.[0-9]+$`; it
does not record the schema's own revision. Example artifacts stay at `2.0.0` — still valid
under that pattern, and bumping 12 files would add diff noise for no functional gain.

`CHANGELOG.md` gains a `[2.0.1]` section recording the constraint. Because the changelog stops
at `[1.0.3]` and has no v2.0 entry at all, a bare `[2.0.1]` would be orphaned — so a short
`[2.0.0]` stub is added above it naming the Actor/Mission/Experience architecture. Full v1.1
and v2.0 history remains BACK-025's job; this is the minimum needed to keep the new entry
coherent.

---

## 8. Verification

The change is expected to land green with no data migration. All 9 channel values currently in
use across the examples — `app`, `in_person`, `website`, `email`, `video_call`, `social_media`,
`phone`, `chat`, `messaging_app` — are canonical, match the pattern, and appear in
`x-knownChannels`.

```bash
node tools/validators/test-v2.0-validator.js     # expect exit 0, > 94 passed
node tools/renderers/test-mission-layout.js      # expect exit 0, 16 passed
node tools/renderers/test-render-mission.js      # expect exit 0, 83 passed
node tools/converters/test-converter.js          # expect exit 0, > 87 passed
node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs
                                                 # expect exit 0, 12/12, zero warnings
```

Quality scores must stay at 85–100 and byte-identical. The scorer tests channel *presence*,
not values, so any movement means something unrelated broke.

Check exit codes directly (`out=$(node <test> 2>&1); code=$?`) — piping to `tail` or `grep`
reports the pipe's status, not node's.

---

## 9. Out of scope

- **v1.1 schemas and examples.** BACK-028 covers the 5 v1.1 entries using `digital` and
  `voice` as channel values. The converter's slugify fallback is the only v1.1-facing change
  here.
- **Full CHANGELOG reconstruction.** BACK-025.
- **The Figma plugin's bundled stale schema copies.** BACK-029.
- **`website/`'s stale v1.0.3 taxonomy.** BACK-026.
- **Renderers.** No renderer reads channel spelling; the glyph logic keys off `category` and
  `serviceModel`.
