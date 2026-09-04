# Actor export — PowerPoint first, Figma second

**Date:** 2026-09-04
**Status:** **Approved for planning** (Will, 2026-09-04). Phase 1 (PowerPoint) is specified in
full. Phase 2 (Figma) is scoped and its open questions listed; it gets its own design pass
before implementation.
**Supersedes:** `2026-08-06-figma-pptx-export-design.md`. That document stays as the record of
the earlier session; its six open questions are resolved or re-scoped here.
**Backlog:** BACK-018.

---

## 1. Goals and non-goals

**Goal.** Turn a set of v2.0 **Actor** artifacts into a visually engaging, natively editable
PowerPoint deck that a service designer can present without editing, and can edit when they
must — then, in a second phase, into an editable Figma layout built on the same foundation.

**Why personas, why now.** Personas are a communication tool. A grid of fields is not
memorable; a designed artefact is. The Actor is the v2.0 primitive that most needs to leave
the repo and reach a room of stakeholders.

**In scope (phase 1):**
- `tools/design-tokens.json` — one source of truth for colour, type and spacing, read by the
  existing mission renderer, the PPTX writer and (later) the Figma plugin.
- `tools/viewmodels/actor-viewmodel.js` (+ `.d.ts`) — schema-shaped Actor JSON → uniform,
  target-agnostic view model.
- `tools/renderers/render-pptx.js` and `tools/renderers/pptx/` — a deterministic CLI that
  builds a multi-Actor deck via PptxGenJS.
- Tests for all of the above, a visual verification script, and byte-identical regression
  proof that the tokens extraction changed nothing in the mission renderer.

**Out of scope, deliberately:**
- **Experience and Mission export.** Mission already has a shipped CLI renderer; Experience
  needs Mission (and arguably Actor) as extra inputs and carries all the hard resolution
  logic. Experience export is filed as its own backlog item.
- **A deterministic Actor HTML renderer** (`render-actor.js`). The 2026-08-06 deferral asked
  for it before any export work. It is *waived for phase 1* because an HTML card is a good
  proxy for the Figma card and a poor proxy for a bounded slide; the decision is re-taken at
  the start of phase 2, where it would earn its keep (§9).
- **Master-based output** (populating a branded corporate `.pptx`). No master exists yet.
  Theming is designed so a master can be added later as a second writer (§3).
- **An `image` field on the Actor schema.** Filed as a backlog item; see §10.

---

## 2. Architecture

Four layers. Each is a pure function of the one before it and is testable in plain Node with
no PowerPoint, no Figma, no DOM.

```
Actor JSON ×N ──► validate ──► actor-viewmodel.js ──► deck-model.js ──► writer.js ──► .pptx
                 (validate-v2.0,   schema-shaped →       cover / index /    PptxGenJS;
                  refuse invalid)  uniform items          summary / appendix  draws what it
                                                          + pagination (flow) is given
                       design-tokens.json ────────────────────────────────────┘
                             └──► render-mission.js  (existing; CSS block generated from tokens)
```

**Files, all tracked in git:**

```
tools/design-tokens.json
tools/viewmodels/actor-viewmodel.js
tools/viewmodels/actor-viewmodel.d.ts
tools/viewmodels/test-actor-viewmodel.js
tools/renderers/package.json                 # "pptxgenjs": "4.0.1"  (exact pin)
tools/renderers/render-pptx.js               # CLI
tools/renderers/pptx/deck-model.js           # viewmodels → slides (cover/index/summary/appendix)
tools/renderers/pptx/flow.js                 # height estimator + pagination
tools/renderers/pptx/writer.js               # PptxGenJS emission only
tools/renderers/pptx/verify-pptx.sh          # .pptx → PDF → PNG pages + overflow oracle
tools/renderers/test-pptx-flow.js
tools/renderers/test-render-pptx.js
tools/tests/fixtures/actor-multi-context.json   # synthetic, three contexts, tests only
```

**The viewmodel absorbs schema shape; the writers never see it.** The 11 trait groups have 11
different JSON shapes (§4). Normalising them once means neither writer knows the schema, and
the flat, addressable result is what makes a Figma template-mapping route possible later.

**Why not share layout between PPTX and Figma.** Confirmed from the earlier design: one
target is absolute inch coordinates on a bounded slide, the other is auto-layout on an
unbounded canvas. Will's framing: Figma is the flexible space; PowerPoint needs its own
shaping. Share the resolution (viewmodel), not the layout.

**Dependency posture.** `tools/renderers/package.json` pins `pptxgenjs` at exactly `4.0.1`
— no caret — because `package-lock.json` is gitignored repo-wide and nothing else would fix
the version. This is the first dependency `tools/renderers/` has had; `tools/validators/`
already depends on ajv, and the mission renderer's zero-dependency rule exists because
artifact sandboxes block CDN imports — a browser-runtime constraint, not a repo principle.
Node ≥ 18.

---

## 3. Design tokens and theming

`tools/design-tokens.json` is **semantic and target-neutral**. Consumers resolve it their own
way: CSS custom properties for HTML, literal hex for PptxGenJS, `hexToRgb()` for Figma.

```
{
  "colour": {
    "light": { "bg", "band", "panel", "border", "text", "dim",
               "touchpoint", "decision", "handoff", "wait", "signal", "start", "end",
               "heatLow", "heatMedium", "heatHigh",
               "traits", "contexts", "emergence" },
    "dark":  { ...same keys... }
  },
  "typography": {
    "fontFamily": "Calibri",
    "scale": { "display", "h1", "h2", "h3", "body", "small", "caption" },   // points
    "metrics": { "Calibri": { "avgCharWidthEm": 0.47, "lineHeightEm": 1.2 },
                 "Arial":   { "avgCharWidthEm": 0.52, "lineHeightEm": 1.15 } }
  },
  "spacing": { "unit", "slideMargin", "gutter", "bandPadding" }              // points
}
```

`typography.scale` and `spacing` are in **points**; each consumer converts (÷72 for inches
in PptxGenJS, ×4/3 for CSS pixels). In phase 1 the mission renderer consumes only `colour`;
its type and spacing stay in its own CSS.

- The palette is the mission renderer's existing slate/blue system (`#0f172a`, `#2563eb`,
  `#f8fafc`, light and dark), extracted verbatim. The three **layer colours** — traits blue,
  contexts green, emergence amber — come from the `actor-renderer` skill's established
  colour language.
- `render-mission.js` generates its `const CSS` block from the tokens at load time. Its
  rendered HTML for every example Mission must be **byte-identical** before and after
  (§8). None of its 83 tests assert on a hex value, so this cannot break them.
- **`--theme brand.json`** deep-merges over the defaults. **Unknown keys produce a warning.**
  This is the BACK-033 lesson applied: a typo in a brand file must never silently do
  nothing. A dark deck is just a theme that swaps the colour set; PPTX ships light by
  default.
- **Font.** Default **Calibri**: every Office install has it, and LibreOffice bundles
  **Carlito**, its metric-compatible twin, so headless verification renders faithfully.
  Fonts are not embedded in the `.pptx` (PptxGenJS cannot), so a brand font must be
  installed on the viewer's machine — the theme file is where that choice is made. The
  per-font `metrics` are what the estimator reads (§6); a brand that changes the font
  supplies its metrics or inherits Calibri's with a warning.
- **Master-based output later.** pptx-automizer is built on PptxGenJS. When a branded
  master exists, it becomes a second writer behind the same deck model — additive, not a
  rewrite. Nothing in tokens or viewmodel changes.

---

## 4. Actor view model

`buildActorViewModel(actorJson, options) → ActorViewModel`. Pure; no I/O.

```
options = {
  sections:    { traits, contexts, emergence, relationships, provenance, governance },  // booleans
  traitGroups: string[] | 'all',
  caps:        { summaryItems: 3 },
  context:     contextId | undefined,      // which context the summary shows
  deck:        { actorIds: string[] }      // for in-deck relationship resolution
}
```

### 4.1 Uniform item shape

Every list the writers draw is an array of:

```
{ primary: string, secondary?: string, badge?: string }
```

Real field names, per trait group (schema verified 2026-09-04):

| Group | Schema shape | → items |
|---|---|---|
| `demographics` | `{age, location, education, background}` | one item per populated key: `primary` = value, `badge` = key |
| `needs` | `[{need, type}]` | `primary` = need, `badge` = type |
| `frustrations` | `[{frustration, severity}]` | `primary` = frustration, `badge` = `severity n/5` |
| `motivations` | `[{motivation, type}]` | `primary` = motivation, `badge` = type |
| `technology` | `{comfort, description, preferredDevices[]}` | `primary` = description, `badge` = comfort, `secondary` = devices joined |
| `communication` | `{preferred[], acceptable[], avoided[], style}` | three items badged preferred / acceptable / avoided, then `style` as a fourth |
| `learningStyle` | string | one item |
| `influences` | `[{source, description}]` | `primary` = description, `badge` = source |
| `decisionMaking` | `{style, riskTolerance}` | `primary` = style, `badge` = riskTolerance |
| `accessibility` | `{dimensions[], assistiveTech[]}` | one item per dimension (`primary` = description, `badge` = dimension · impact), then assistive tech |
| `behaviouralPatterns` | `[{pattern, context}]` | `primary` = pattern, `secondary` = context |

Absent or empty groups are omitted, never rendered empty. `$provenance` annotations are
dropped in phase 1.

### 4.2 Shape

```
{
  identity: { id, name, actorType, summary, quote, version },
  avatar:   { kind: 'initials' | 'label', text, colourKey },
  traits:   { [group]: { label, items[] } },                       // 4.1
  contexts: [ {
      contextId, title, contextType, description,
      needs[], frustrations[], channels[],                          // items
      momentsThatMatter[],
      emergence: {                                                 // nested, matched on contextRef
        goalsAsExperienced[], painPoints[], opportunities[],
        emotionalContext, useCases[], successMetrics[]
      } | null
  } ],
  unattributedEmergence: [ ... ],                                   // contextRef matched nothing
  relationships: { inDeck: [{target, type, description, strength}],
                   external: [ ...same ] },
  summarySlots: {
    who:      { items[], truncated, full[] },                       // demographics + needs + frustrations
    context:  { contextId, title, contextType, items[], truncated, full[], moreContexts: n },
    emerges:  { items[], truncated, full[] }                        // goalsAsExperienced + painPoints
  },
  provenance?, governance?,
  warnings: [ { code, message } ]
}
```

**Rules:**
- **Avatar.** `actorType: human` → initials from `name`; `ai_agent` / `team` / `organisation`
  → labels `AI` / `TEAM` / `ORG`. `colourKey` is a stable hash of `id`, so two actors with the
  same initials differ in colour.
- **Emergence nests under its context.** Resolves the earlier spec's open question 1. The
  traits → context → emergence causality is the v2.0 idea; the layout reads it top to bottom.
  An `emergence` entry whose `contextRef` matches no `contextId` goes to
  `unattributedEmergence` with a warning — it is never dropped silently.
- **Summary slots** are selection policy shared by both targets, so they live here, not in a
  writer. Each list is capped at `caps.summaryItems` (default 3); `truncated` is set and
  `full` retains everything for speaker notes. `context` is the first context in schema order
  unless `options.context` names one; `moreContexts` counts the rest.
- **Relationships** split on whether `target` is in `deck.actorIds`. The 15 relationship
  types are rendered as their label with underscores replaced (`served_by` → "served by").
- **Selection.** Types are named after the plugin's existing `PersonaFieldSelection` /
  `DEFAULT_*` pattern (`ActorSectionSelection`, `DEFAULT_ACTOR_SECTIONS`) so the Figma phase
  reuses them. **Defaults: every populated trait group on; provenance and governance off;
  relationships on.** This departs from the `actor-renderer` skill's off-by-default list
  (motivations, behaviouralPatterns, influences), which was tuned for a single card; the
  appendix's job is completeness.

---

## 5. Deck structure

16:9, 13.333 × 7.5 in. Light theme by default. Every content slide carries a slim footer:
actor `id` · `version` · page.

| Slide | Count | Content | Overflow policy |
|---|---|---|---|
| **Cover** | 1 | `--title` (default `Actors · N`), source paths, generated date | never overflows |
| **Index** | 0 if N = 1; else ⌈N / 8⌉ | one card per actor: avatar, name, `actorType` badge, one-line `summary`. **In-deck relationships drawn as labelled links** between cards on the same slide; listed as text under the card when the target sits on another index slide | fixed grid, 8 per slide |
| **Summary** | 1 per actor | header band: avatar, name, type badge, `quote` · `summary` paragraph · three columns **Who they are / In this context / What emerges** from `summarySlots` · "→ see appendix" marker on any truncated column · "+N more contexts → appendix" when applicable · **full lists in speaker notes** | **never paginates, never shrinks.** Fits as many capped items as the column holds — 3, then 2, then 1, minimum 1 — and records a warning |
| **Appendix** | ≈ 5–10 per actor | same visual language at reference density: coloured section bands (traits / contexts / emergence), two-column text, slim header with avatar + name. Order: traits (one band per group) → each context, with its emergence nested → relationships → provenance / governance if selected | **paginates** via `flow.js` (§6); continuation slides repeat the band heading with "(cont.)"; never splits mid-item |

**An Actor is 841–1,337 renderable words** (measured across all six examples, excluding
provenance/governance), so a faithful appendix is the *normal* case for pagination, not an
edge case. The engaging slides — index and summary — are curated and fixed-size; only the
appendix flows.

**The hero slide is a visual judgement.** The first implementation task is a **throwaway
layout spike**: the summary slide rendered from a real Actor, screenshotted through the
verification loop (§8), and put in front of Will before `writer.js` is built properly.
Sign-off happens on real output, not on this description.

---

## 6. Pagination — `flow.js`

Content is expressed as **blocks**: `heading | paragraph | list | band`, each with a style
resolved from tokens (size, weight, colour) and a target width in inches.

**`estimateHeight(block, widthIn, style, metrics) → inches`**

```
charsPerLine = floor( widthIn × 72 / (sizePt × avgCharWidthEm) )
lines        = Σ over paragraphs/items of ceil( length / charsPerLine × wrapSlack )   // wrapSlack ≈ 1.15
height       = lines × sizePt × lineHeightEm / 72 + paragraphSpacing + bulletIndentAllowance
             × 1.10                                                                    // safety margin
```

`avgCharWidthEm` and `lineHeightEm` come from `typography.metrics[fontFamily]` (§3), so a
brand that changes the font changes the estimate.

**`paginate(blocks, frame) → slides[]`** fills the frame top-down:
- a block that does not fit starts a new slide;
- a **single** block taller than a slide splits at item boundaries (lists) or sentence
  boundaries (paragraphs) — never mid-word, never mid-item;
- a `band` heading is re-emitted with "(cont.)" on every continuation slide;
- **font size is never reduced**;
- every spill and split is recorded: `{ actorId, section, slide, reason }`.

**Calibration is empirical, not assumed.** `pdftotext -bbox` (poppler) reports the position
of every rendered word in the LibreOffice-converted PDF. The overflow oracle asserts that no
word's bottom edge lies below the slide's bottom edge on any slide of any example deck. This
is what makes "never shrinks" safe to promise, and it is the check markup tests cannot make.

---

## 7. CLI, errors, determinism

```
node tools/renderers/render-pptx.js <file|dir>... [-o deck.pptx]
    [--title "..."] [--theme brand.json] [--images dir/]
    [--sections cover,index,summary,appendix]
    [--trait-groups needs,frustrations,...] [--context <contextId>]
    [--generated-at <ISO-8601>] [--warnings-json file] [--quiet]
```

- **Inputs.** Files and directories, any mix. A directory expands to its `actor-*.json`
  sorted by filename; explicit file order is preserved. Output order is therefore
  deterministic.
- **Validation first, refuse invalid.** Each input runs through `validateData` from
  `tools/validators/validate-v2.0.js` (exported; verified). Any failure, or any `$type` other
  than `"Actor"`, lists the offenders on stderr and exits **2 with no file written**.
  Exporting from invalid data is the silent-degradation trap the CLI must not fall into.
- **Warnings** (truncation, spills, unattributed emergence, unknown theme keys, missing
  image files) go to stderr and, with `--warnings-json`, to a file. Exit code stays **0**:
  warnings are information for the author, not failures.
- **`--generated-at`** fixes the cover date so test output is stable. PptxGenJS stamps its
  own timestamps in `docProps/`, so tests assert on **slide XML**, never on whole-file bytes.
- **`--images dir/`**: `<actor-id>.png` or `.jpg` replaces the monogram wherever the avatar
  appears. No schema change; images never enter the artifact.
- **`-o`** defaults to `<stem>.pptx` in the working directory, where `<stem>` is the first
  input's file basename without extension, or its directory name for a directory input
  (`v2.0/examples/roadside/` → `roadside.pptx`).
- Invalid JSON → message naming the file and position, exit 2. Missing `--theme` file →
  exit 2.

---

## 8. Testing and verification

**Convention:** plain `assert`, pass/fail counters, non-zero exit on failure — as
`test-render-mission.js`. Exit codes are checked directly, never through a pipe.

| Suite | Covers |
|---|---|
| `tools/viewmodels/test-actor-viewmodel.js` | all six example Actors + `actor-multi-context.json`: per-group item normalisation (§4.1), emergence nesting and the unattributed bucket, in-deck vs external relationships, caps/`truncated`/`full`, `moreContexts`, avatar rules, selection defaults, warnings |
| `tools/renderers/test-pptx-flow.js` | estimator on strings with known line counts; pagination: new slide on non-fit, "(cont.)" headings, oversized-block splitting at item/sentence boundaries, never mid-item, warning records, font size unchanged |
| `tools/renderers/test-render-pptx.js` | a deck per example set and for the fixture; unzip; **slide-count formula** = cover + (index slides if N ≥ 2) + N summaries + Σ appendix pages; per-slide text presence; speaker notes present on summaries; **no text present that is not in the source**; `--sections` and `--trait-groups` honoured; exit 2 paths |
| Tokens | every token a consumer reads exists; `--theme` merge; unknown-key warning |
| **Regression** | mission renderer suites unchanged (83 + 16); rendered HTML for all five example Missions **byte-identical** before and after the tokens extraction |

**Visual gate — `tools/renderers/pptx/verify-pptx.sh <deck.pptx>`:**
`.pptx` → PDF (`soffice --headless --convert-to pdf`) → PNG per page (`pdftoppm`) → overflow
oracle (`pdftotext -bbox`, §6). Requires LibreOffice and poppler, so it is **not** part of the
headless suite; it skips with a notice when `soffice` is absent. It *is* the gate before any
"done" claim and belongs in the end-session checklist. Final sign-off remains Will opening
the deck in PowerPoint: LibreOffice output is layout-faithful (Carlito/Calibri are
metric-compatible), not pixel-identical.

**Machine prerequisites installed 2026-09-04 (this Mac):** LibreOffice (Homebrew cask) and
poppler. A fresh machine needs both for the visual gate only; the headless suite has no such
dependency.

---

## 9. Phase 2 — Figma (scoped, not designed)

**Carries over unchanged:** `design-tokens.json` (via `hexToRgb`), `actor-viewmodel.js`
(bundled by the plugin's esbuild; types from the `.d.ts`), the selection types, the
`--images` sidecar convention, and the multi-actor idea — a page with an index frame plus
one card per actor.

**Decided now, for that phase:**
- The Actor card is the layered card with contexts as sections and emergence nested under
  each — the earlier spec's approved layout, now consistent with §4.
- The generator builds **from scratch by default**; **template/component mapping is an
  optional later route**, which the flat viewmodel keeps open. Its feasibility is verified by
  a spike before anyone relies on it.
- The plugin's `detectArtifactType` reads `$type` before its v1.1 fallback; the `tsconfig`
  `rootDir` is dropped (inert; esbuild builds) so the plugin can import from `tools/`.

**To decide at the start of phase 2, not before:**
1. Whether to build `render-actor.js` (HTML) as the card's visual proxy and as the
   deterministic replacement for the hand-written `actor-renderer` skill.
2. Archive or delete the orphaned root `ui.html` (`tools-internal/` is gitignored; a delete
   is unrecoverable).
3. What the index frame draws for in-deck relationships on a canvas.
4. The manual test checklist, since Figma generators cannot be tested headlessly.

---

## 10. Housekeeping

- **Superseded spec:** `2026-08-06-figma-pptx-export-design.md` carries a banner pointing
  here. Its findings about the plugin were re-verified 2026-09-04 and still hold (plugin
  untouched since 2026-01-15 / 2026-05-04).
- **Backlog items to file:** optional `image` field on Actor (deferred schema change; note
  that a real portrait is PII and belongs outside committed artifacts); Experience export
  (the other half of the earlier spec, now explicitly out of scope); v2.0 authoring
  quick-reference (proposed in the BACK-021 retrospective §8.3, still unfiled).
- **Branch:** `feature/actor-export`, from `main` after `feature/roadside-mission` was
  fast-forwarded in on 2026-09-04.

---

## 11. Decisions log

Recorded so the next session does not re-litigate them. Each was either put to Will or
filled by the author and offered for objection.

| Decision | Rationale |
|---|---|
| PowerPoint before Figma | testable headlessly; tracked in git; a CLI pattern the repo already has |
| Actor only; Experience later | Experience needs Mission (+Actor) as extra inputs and holds all the resolution logic |
| Waive the "HTML renderer first" deferral for phase 1 | an HTML card proxies the Figma card, not a bounded slide |
| Tokens + `--theme` now; master-based output later | cheap now, expensive to retrofit; pptx-automizer is additive on PptxGenJS |
| Positioned text boxes, not tables, for designed slides | personas must be memorable; free table pagination was optimising the wrong thing |
| Content-driven pagination with a legibility floor; no shrink-to-fit | shrink degrades invisibly and bottoms out unreadable on the heaviest Actors |
| Summary never paginates; appendix does | keeps the hero slide a designed artefact |
| Section-level + trait-group selection, all on by default | sections are where meaningful choices are; doubles as the manual overflow escape hatch |
| `relationships` in: in-deck on the index, external in the appendix | the roadside pair (`serves` / `served_by`) is exactly what an index should show |
| Monogram avatar + `--images` sidecar; no schema change | keeps portraits (PII) out of committed artifacts |
| Emergence nested under its context | the causality is the v2.0 idea |
| First context on the summary; `--context` to choose | multi-context actors need a rule; none of the six examples has more than one |
| 8 actors per index slide | grid legibility |
| Appendix defaults to complete | its job is completeness; the skill's defaults were for one card |
| Refuse invalid input, exit 2 | a scriptable CLI must not degrade silently |
| Exact-pin `pptxgenjs@4.0.1` | lockfiles are gitignored |
| Calibri default | universal in Office; Carlito makes verification faithful |
| Synthetic three-context fixture in `tools/tests/fixtures/` | a real example would carry the credibility burden; a fixture can be contrived |

---

## 12. Verified facts this design rests on

Spiked 2026-09-04 in the session scratchpad; nothing kept.

- **PptxGenJS 4.0.1** exposes `addText`, `addShape`, `addImage`, `addNotes`, `addTable`,
  `defineLayout`. It has **no text-measurement API** — PowerPoint lays text out at open time
  — hence §6. Its table `autoPage` works (10 trait rows → 2 slides, visually confirmed) but
  is not used for designed slides.
- **Headless verification works end to end** on this Mac: `.pptx` → `soffice --headless
  --convert-to pdf` → `pdftoppm` → pages inspectable as images. Fonts substitute
  (Carlito for Calibri, Arial native), so layout is faithful, pixels are not.
- **Every Actor example has exactly one context.** Multi-context is v2.0's differentiator
  and is unexercised by any example — hence the fixture.
- **Actors carry no image field**; the v1.1 Figma generator used an initial-letter avatar.
- `validate-v2.0.js` exports `{ validateFile, validateData, detectSchemaType, checkCrossRefs }`.
- `$type` is the literal `"Actor"`; `actorType` ∈ `human | ai_agent | team | organisation`.
- `relationship` = `{ target, type, description, strength }`, 15 typed values.
- No root `package.json`; dependencies are colocated (`tools/validators/`, the plugin);
  `package-lock.json` is gitignored.
