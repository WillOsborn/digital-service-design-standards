# Figma & PowerPoint export for v2.0 Actor and Experience

**Date:** 2026-08-06
**Status:** **DEFERRED — captured mid-design, not approved for implementation.**
**Reason for deferral:** Will's call, 2026-08-06 — finish the Actor/Experience renderers and
the create/edit/modify tooling for Actor, Mission and Experience *before* building export
plugins. See "Why this was deferred" below; the deferral does not invalidate the design.

This document records a brainstorming session that reached the middle of Section 2 of 4.
Sections 1 and 2 were reviewed and approved. Sections 3 and 4 were drafted but never
presented. Open questions are recorded as open — **nothing here should be read as decided
unless it appears under "Decisions taken".**

---

## Why this was deferred

The design's foundation layer (design tokens + viewmodels) is not plugin-specific. It is the
same layer the Actor and Experience renderers require. Mission already has a deterministic
CLI renderer (`tools/renderers/render-mission.js`, 45 tests); Actor and Experience have only
artifact-rendering skills with no deterministic renderer. Building the plugins first would
mean standing up that shared foundation to serve its least-established consumer.

**Consequence for later:** when this work resumes, the tokens and viewmodels may already
exist, built by the renderer work. Re-read this document against what exists rather than
assuming a greenfield start.

---

## Scope as designed

**In:** v2.0 **Actor** and **Experience**, exported to both Figma and PowerPoint.

**Out, deliberately:** Mission generation. It already has a shipped, tested CLI renderer;
a third Mission renderer would create exactly the drift this design exists to prevent.
v1.1 generators (`persona-generator.ts`, `journey-generator.ts`) are untouched throughout.

---

## Decisions taken

These were explicitly confirmed during the session.

### 1. Actor card expresses the three-layer model (confirmed)

The Figma Actor card is a **layered card with contexts as sections** — not a flat v1.1-style
persona card. Rationale: a v2.0 Actor is `traits` (11 context-free groups) + `contexts`
(an array of situated roles) + `emergence` (keyed by `contextRef`). The v1.1 700px flat card
cannot hold this without flattening away the thing v2.0 exists to express.

Rejected: a traits card plus one card per context; and a flat v1.1-shaped card.

### 2. Experience generation takes two JSON inputs (confirmed)

The Create panel takes **Experience JSON and Mission JSON** in separate paste boxes.

This is not a workaround — it matches the data model. Verified against the schema:

- `references.missionRef` is **required** by `v2.0/schemas/experience.schema.json`,
  alongside `actorRef`.
- `--check-refs` enforces it hard: every `nodes[].nodeRef` and every `path.nodeSequence`
  ID must resolve to a real node in that Mission
  (`tools/validators/validate-v2.0.js:242-251`).
- An Experience node carries **only** `nodeRef`, `laneContent`, `momentThatMatters`. It has
  no human-readable name. Node names ("Receive promotional notification") and all phase
  bands live in the Mission.

So an Experience is a *projection* — one Actor walked through one Mission — storing only what
is persona-specific and deferring service structure to the Mission. It cannot be rendered
meaningfully alone. The plugin's manifest sets `networkAccess: ["none"]`, so it cannot fetch
the Mission itself.

Rejected: a `{mission, experience}` bundle wrapper (invents a format that is not a DSDS
artifact and that nothing else produces); and reading Mission names back off the Figma
canvas (silently couples the generators, breaks on rename or edit).

### 3. Adopt the mission renderer's palette and extract it to shared tokens (confirmed)

The repo has two unrelated colour systems:

| | Palette | Coverage |
|---|---|---|
| `tools/renderers/render-mission.js` | slate/blue (`#0f172a`, `#2563eb`, `#f8fafc`) | all six v2.0 node types, barrier heat, light **and** dark |
| `figma-plugin/src/utils/colors.ts` | 2014-era Material (`#667eea`→`#764ba2`, `#2196f3`) | v1.1 only, no v2.0 node types, no dark mode |

**Decision: adopt the mission renderer's palette and extract it to `tools/design-tokens.json`**,
read by all three consumers.

The decisive argument was future changeability, and extraction is what delivers it — not the
choice of palette. Verified costs:

- **Zero** hex values appear in `tools/renderers/test-render-mission.js`; all 45 tests pass
  without asserting on any colour. Extraction cannot break them.
- All colour use in the renderer is already indirect: 71 references, all via `var(--c-*)`,
  resolved from a single `const CSS` block at `render-mission.js:236`.

Cost of a future palette change, by option: **1 file** under this decision; 3 files with
guaranteed drift if the plugin keeps its own palette. Adopting now and designing a new
identity later have the *same end state* — this route just avoids choosing colours before
seeing Actor and Experience rendered.

**Wrinkle:** Figma and PowerPoint cannot consume CSS variables — they need literal RGB at
build time. The tokens file is the source of truth; each consumer resolves it its own way
(CSS vars for HTML, `hexToRgb()` for Figma, hex strings for PptxGenJS).

### 4. Share the view model, not the layout (confirmed)

Figma and PowerPoint **cannot** share rendering code — one runs in Figma's sandbox against
`figma.createFrame()` with auto-layout, the other in Node against PptxGenJS's absolute
inch/point coordinates. An abstraction spanning both would fit neither.

Will's reinforcement of this point (2026-08-06): *Figma gives a more flexible space to work
with, whereas PPT has a limited slide and will need specific shaping to work with it. It will
likely be different.* **The PowerPoint layout must therefore be designed for the slide
constraint, not derived by squeezing the Figma layout.**

But the hard part is not rendering — it is **resolution**: turning Experience + Mission into
an ordered grid with real node names, phase bands, column order from `path.nodeSequence`, and
arrays formatted as bullets. That logic is identical for both targets, non-trivial, and will
diverge if written twice.

```
tools/design-tokens.json ──┬──→ render-mission.js      (HTML,  existing)
   colours, type scale     ├──→ render-pptx.js         (PPTX,  new)
                           └──→ figma plugin           (Figma, new)

tools/viewmodels/          ┌──→ render-pptx.js
  actor-viewmodel.js    ───┤
  experience-viewmodel.js  └──→ figma plugin generators
  (+ .d.ts for each)
```

Viewmodels are pure functions: JSON in, plain object out. No Figma, no PowerPoint, no DOM.
Fully unit-testable in plain Node.

### 5. Viewmodels live in `tools/`, not in the plugin (confirmed)

`tools/` is **tracked in git**; `tools-internal/figma-plugin/` is **gitignored**. Placing the
resolution logic in `tools/` means the valuable, hard-to-rewrite part is version-controlled
and survives a fresh clone; only Figma-specific node emission stays local-only. This
materially de-risks the gitignored plugin.

**Implementation shape:** plain CommonJS `.js` with a hand-written `.d.ts` beside each.
Node (`render-pptx.js`, tests) `require()`s the `.js` directly with no build step; the plugin
imports the same `.js`, esbuild bundles it, and `tsc --noEmit` takes types from the `.d.ts`.
One implementation, two consumers, no copying.

**Blocker found and resolved:** the plugin's `tsconfig.json` sets `"rootDir": "./src"`, which
would reject imports from outside the plugin. It is **inert** — `noEmit: true` and esbuild
performs the actual build — so it can be dropped. Widen `include` accordingly. No build effect.

### 6. PowerPoint uses PptxGenJS, building slides from scratch (assumption, uncontested)

Research (2026-08-06):

| Library | Version | License | Downloads/wk | Notes |
|---|---|---|---|---|
| **PptxGenJS** | 4.0.1 (Jun 2025) | MIT | **2.9M** | TS types built in, 4 deps, native editable shapes |
| pptx-automizer | 0.8.2 (Jun 2026) | MIT | 69k | built *on* PptxGenJS; populates an existing branded `.pptx` |
| python-pptx | — | MIT | — | equally capable, but adds Python to an all-Node repo |

Will did not flag a branded `.pptx` master, so the design proceeds with PptxGenJS building
slides from scratch. **Revisit if a corporate deck template must be honoured** — that would
favour pptx-automizer. The change is contained to the PPTX writer; tokens and viewmodels are
unaffected either way.

---

## Findings about the existing plugin

Recorded because they are non-obvious, were verified, and will still be true on resumption.

### The plugin's v2.0 support is cosmetic and currently dead code

- `manifest.json` loads `src/ui.html`. That file (1338 lines, January) contains **zero**
  v2.0 references.
- The root `ui.html` (787 lines, edited 4 May) — the one with Actor/Mission/Experience
  buttons — is **not loaded by the plugin at all**.
- `code.js`, the compiled backend Figma actually runs, contains **0** occurrences of
  "actor" or "v2.0". `src/generators/` holds only `persona-generator.ts` and
  `journey-generator.ts`.
- `README.md` claims "Version 2.0.0 — Schema Versions: DSDS v2.0 + v1.1". **This claim is
  false** and should be corrected. `docs/current-state.md`'s "untouched, still v1.1-only"
  is accurate.

### The orphaned file is a regression, not an improvement

Counter-intuitive given the dates. `src/ui.html` (loaded, January) is the **more capable**
file: it has two modes, including the **Create mode** (Load JSON → Preview → Configure
Fields → Generate) that the generators need. The orphaned root `ui.html` (May) has **only**
Map mode — no Create mode at all. The May work bolted a v2.0 veneer onto an older, weaker
copy and never wired it up.

Nothing of substance is lost by setting it aside; its only unique content is type-selector
buttons that are file-path hints. **`tools-internal/` is gitignored, so a delete is
unrecoverable** — hence the archive-rather-than-delete proposal (open question below).

### Useful existing structure to build on

- `create-mode.ts` already dispatches on `detectArtifactType(data)` to a generator switch —
  a clean extension point.
- `detectArtifactType` reads `schema_info.schema_type` (v1.1). v2.0 uses `$type`. It needs a
  `$type` branch *before* the existing fallback.
- Field/lane selection is already an established pattern: `PersonaFieldSelection`,
  `JourneyLaneSelection`, `DEFAULT_*` in `types.ts:95-173`. Follow it rather than reinvent.
- `figma-helpers.ts` provides `createFrame`, `createText`, `setupAutoLayout`,
  `setHugContents`, `addDropShadow`, `loadFontSafe`.
- Scale is a non-issue in Figma: 24 nodes × 200px ≈ 4,940px wide is nothing on a canvas.

---

## Approved design detail (Sections 1–2)

### Files

**New (tracked in git):**
```
tools/design-tokens.json
tools/viewmodels/actor-viewmodel.js       + actor-viewmodel.d.ts
tools/viewmodels/experience-viewmodel.js  + experience-viewmodel.d.ts
```

**New (gitignored, local-only):**
```
tools-internal/figma-plugin/src/generators/actor-generator.ts
tools-internal/figma-plugin/src/generators/experience-generator.ts
```

**Changed:** `types.ts` (`ArtifactType` += `'actor' | 'experience'`; add `ActorFieldSelection`,
`ExperienceLaneSelection` and defaults) · `json-parser.ts` (`detectArtifactType` reads `$type`
first) · `create-mode.ts` (two generator cases, two preview cases) · `src/ui.html` (v2.0 types
in Create mode) · `tsconfig.json` (drop inert `rootDir`, widen `include`) · `README.md`
(correct the false v2.0 claim).

### Actor card layout

Vertical auto-layout frame, ~840px wide, **hugging contents** so it grows with the data:

| Band | Content |
|---|---|
| Header | `name`, `actorType` badge, `summary`, `quote` |
| **TRAITS** | the 11 `traits` groups in a two-column grid — stated once, context-free |
| **CONTEXT** *(repeats)* | `title` + `contextType` + `description`, then that context's `needs` / `frustrations` |
| ↳ **EMERGES** | the `emergence` entry matching this `contextRef` — `goalsAsExperienced` tagged by `source` (traits / context / collision), and `painPoints` with their `emergesFrom` |

Emergence nests *under* its context so the traits → context → emergence causality reads
top-to-bottom. The `source` tag is what makes "collision" visible — the v2.0 idea made literal.

### Experience swimlane layout

The Experience **declares its own lanes**, each with a `type` (`list` / `text` / `emotion` /
`barrier`), so the generator is data-driven and renders whatever lanes the artifact carries,
including custom ones. This mirrors the plugin's existing v1.1 `getCustomLanes` behaviour.

```
              |  Discovery      |  Browsing & Selection     | ...   <- phase bands  (Mission)
              | Receive promo | Open app | Browse cats | ...        <- node names   (Mission)
 Actions      | • Phone buzzes  | ...                               <- list    → bullets
 Thoughts     | "Oh, StyleMart… | ...                               <- text    → paragraph
 Emotions     |   ● intrigued   | ...                               <- emotion → chip + intensity
 Barriers     |                 | ...                               <- barrier → coloured chips
 Need@Step    | ...                                                 <- text
 Pain@Step    | ...                                                 <- text
 Opportunities| ...                                                 <- list
                                              [ OUTCOME: netSentiment +1, wouldRepeat ]
```

Column order from `path.nodeSequence`; names and phase bands from the Mission;
`momentThatMatters` marks its columns.

---

## Drafted but never presented (Sections 3–4)

**Not reviewed by Will. Treat as raw proposals, not decisions.**

### Section 3 — PowerPoint (draft)

Proposed CLI, mirroring `render-mission.js`:

```
node tools/renderers/render-pptx.js <artifact.json> [--mission <m.json>] -o <out.pptx>
```

**Slide decomposition** — the crux, given Will's point that the slide is a bounded space
needing its own shaping:

- *Experience:* title slide → **one slide per phase** (5 for the retail example; phases come
  from the Mission and are the natural narrative unit) → outcome slide. If the Mission
  declares no phases, chunk by a fixed node count.
- *Actor:* title slide → traits slide → **one slide per context**, each carrying that
  context's needs/frustrations and its emergence. Mirrors the Figma card's layered structure
  while respecting the slide boundary.

Alternatives not worked through: fixed N nodes per slide; a single oversized slide (rejected —
unusable).

### Section 4 — Error handling and testing (draft)

**Error handling:**
- Invalid JSON → clear message, no partial output.
- Missing Mission for an Experience → **PPTX errors out** (a CLI is scriptable; silent
  degradation in a pipeline is worse); **Figma warns and degrades** to raw `nodeRef` IDs
  (interactive, the user may be mid-iteration). This asymmetry is deliberate and should be
  challenged on review.
- `nodeRef` absent from the Mission → list the unresolved refs, continue using the ID as label.
- Missing optional fields → omit the section rather than render an empty one.
- Figma font loading → existing `loadFontSafe` already handles this.

**Testing:**
- Viewmodels: unit tests in plain Node following the existing convention in
  `test-render-mission.js` (plain `assert`, pass/fail counters, exit code). This is where the
  real logic lives, so this is where the real coverage goes.
- Design tokens: assert every token a consumer reads actually exists.
- PPTX: generate from all four example sets; unzip the output and assert on slide count and
  expected XML content.
- **Regression: the existing 45 renderer tests must still pass after token extraction.**
- **Honest limitation: the Figma generators cannot be tested headlessly.** They get a
  typecheck plus a manual test checklist. This is a real gap in the plan, not an oversight.

---

## Open questions

Genuinely unresolved — asked but not answered, or never reached.

1. **Is nesting emergence under each context the right read**, versus a separate emergence
   band collecting all contexts? (Asked; deferral intervened.)
2. **Archive or delete the orphaned root `ui.html`?** Archiving was proposed because
   `tools-internal/` is gitignored and a delete is unrecoverable. (Asked; unanswered.)
3. **Slide decomposition for PowerPoint** — never presented for review.
4. **The error-handling asymmetry** (CLI fails hard, Figma degrades) — never presented.
5. **Does a branded `.pptx` master exist?** If so, reconsider pptx-automizer over PptxGenJS.
6. **Actor identity in the Experience header.** An Experience carries `references.actorRef`
   (a string) but not the Actor's name. Showing "Sarah Martinez" rather than
   `actor-sarah-martinez` would need the Actor JSON as a *third* input. Unresolved — the
   current design shows `title` plus refs as metadata.

---

## Resumption checklist

1. Re-read against what the renderer work actually built — tokens and viewmodels may already
   exist, with different shapes than proposed here.
2. Re-verify the plugin findings above; `tools-internal/` is gitignored and unprotected, so
   it may have changed without any commit recording it.
3. Resolve the six open questions before writing code.
4. Only then invoke `writing-plans`.
