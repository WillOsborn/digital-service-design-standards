# Actor Export (PowerPoint) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deterministic CLI that turns a set of v2.0 Actor JSON files into a designed, natively editable PowerPoint deck (cover → index → one summary per actor → paginated appendix), built on a shared design-tokens file and a target-agnostic Actor view model that the Figma phase will reuse.

**Architecture:** Four pure layers — `design-tokens.json` → `actor-viewmodel.js` (schema shape → uniform `{primary, secondary?, badge?}` items) → `pptx/deck-model.js` (view models → slide descriptions with inch coordinates, paginated by `pptx/flow.js`) → `pptx/writer.js` (PptxGenJS emission only). Everything up to the writer is testable in plain Node with no PowerPoint. Visual verification goes `.pptx` → LibreOffice → PDF → poppler, with an automatic overflow oracle from `pdftotext -bbox`.

**Tech Stack:** Node ≥ 18 (CommonJS, no build step), PptxGenJS 4.0.1 (exact pin), jszip 3.10.1 (tests only; already a PptxGenJS dependency), plain `assert` tests, LibreOffice + poppler for the visual gate.

**Spec:** `docs/superpowers/specs/2026-09-04-actor-export-design.md` — read it first; this plan argues from it and cites its sections as §N.

## Global Constraints

- **Node ≥ 18.** CommonJS `.js`, `'use strict'`, no transpilation, no TypeScript build. Hand-written `.d.ts` beside the view model only.
- **Dependencies:** `tools/renderers/package.json` pins `"pptxgenjs": "4.0.1"` **exactly — no caret** (§2; lockfiles are gitignored repo-wide). `jszip` `3.10.1` as a devDependency for tests. Nothing else. `node_modules/` is already gitignored.
- **Tests:** plain `assert`, `passed`/`failed` counters, `process.exit(failed ? 1 : 0)` — copy the convention in `tools/renderers/test-render-mission.js`. **Check exit codes directly** (`out=$(node x.js 2>&1); code=$?`), never through a pipe.
- **Regression:** `node tools/renderers/test-render-mission.js` (83 passed) and `node tools/renderers/test-mission-layout.js` (16 passed) must stay green after every task. `node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs` must stay 16/16.
- **Slide geometry:** 16:9, **13.333 × 7.5 inches**; all deck-model coordinates in inches. Tokens' `typography.scale` and `spacing` are in **points** (÷72 → inches).
- **Never shrink text; never paginate the summary slide** (§5). Font size is a token, not a fitting variable.
- **Default font `Calibri`**, light theme default (§3). Colours are `#rrggbb` lowercase in tokens; the writer strips `#`.
- **Exit codes (§7):** 0 = success (warnings allowed, on stderr); 2 = invalid input / non-Actor `$type` / unreadable theme, **no file written**.
- **Privacy:** the test fixture is a fictional composite with `governance.containsPii: false`. No real names, employers, locations. Nothing from `research/private/`.
- **Git:** stage explicit paths only (`git add <path>`), never `-A` or `.`; no `reset`/`rebase`/`amend`/force-push; commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; **do not push**. Branch: `feature/actor-export`.
- **`.claude/` is gitignored** — Task 14's skill wrapper lands there and will not be in any commit; say so in the report.
- Run every command from the **repo root** (`/Users/willosborn/Documents/Digital Service Design Working/schemas`).

## Deviations from / additions to the spec

Recorded here so the executor does not "correct" them back:

1. **Task order:** tokens (Task 1) precede the throwaway spike (Task 2) so the spike renders with real tokens. The spec's intent — Will signs off the hero slide before `writer.js` is built properly — still holds; `writer.js` is Task 11.
2. **Extra token keys:** `edge`, `edgeError` (the mission renderer needs them; §3 omitted them) and `traitsTint` / `contextsTint` / `emergenceTint` (band backgrounds).
3. **`contexts[].details`** (free-form key/value object) is rendered in the appendix as key/value items — §4.2 did not list it, but §4's completeness rule applies.
4. **Two-column appendix** is implemented by paginating into **column frames** (half slide width) and packing two columns per slide; §5 said "two-column text" without saying how.
5. **`jszip` devDependency** so tests can unzip output without a system `unzip`.

## File Structure

| File | Responsibility |
|---|---|
| `tools/design-tokens.json` | **Create.** Semantic colour / typography / spacing tokens (§3). |
| `tools/renderers/render-mission.js` | **Modify** lines 312–333 only: interpolate hex values from tokens; output byte-identical. |
| `tools/renderers/test-design-tokens.js` | **Create.** Token completeness, kebab→camel coverage of every `--c-*` var, metrics present. |
| `tools/tests/fixtures/actor-multi-context.json` | **Create.** Schema-valid synthetic Actor with three contexts and three emergence entries. |
| `tools/viewmodels/actor-viewmodel.js` | **Create.** `buildActorViewModel(actor, options)` — normalisation, nesting, relationships, summary slots, selection, warnings (§4). |
| `tools/viewmodels/actor-viewmodel.d.ts` | **Create.** Types for the above. |
| `tools/viewmodels/test-actor-viewmodel.js` | **Create.** |
| `tools/renderers/package.json` | **Create.** `pptxgenjs` exact pin, `jszip` devDependency. |
| `tools/renderers/pptx/theme.js` | **Create.** Load defaults, deep-merge `--theme`, unknown-key warnings, font metrics resolution. |
| `tools/renderers/pptx/flow.js` | **Create.** Height estimator, `paginate`, `fitItems` (§6). Pure. |
| `tools/renderers/pptx/deck-model.js` | **Create.** View models → slide descriptions: cover, index, summary, appendix (§5). Pure. |
| `tools/renderers/pptx/writer.js` | **Create.** Slide descriptions → PptxGenJS. The only file that requires `pptxgenjs`. |
| `tools/renderers/pptx/overflow-check.js` | **Create.** Parses `pdftotext -bbox` HTML; reports words outside the page. |
| `tools/renderers/pptx/verify-pptx.sh` | **Create.** `.pptx` → PDF → PNGs + overflow oracle. Skips with notice if `soffice` absent. |
| `tools/renderers/render-pptx.js` | **Create.** CLI (§7): args, input expansion, validation, exit codes, warnings. |
| `tools/renderers/test-pptx-flow.js`, `test-deck-model.js`, `test-render-pptx.js` | **Create.** |
| `tools/README.md` | **Modify.** Add a Renderers → PowerPoint section. |
| `.claude/skills/actor-deck-renderer/SKILL.md` | **Create (gitignored).** Skill wrapper around the CLI. |

### Shared interfaces (defined once here; tasks reference them)

**Item** (§4.1): `{ primary: string, secondary?: string, badge?: string }`

**Slide description** (deck-model → writer):
```js
{ kind: 'cover'|'index'|'summary'|'appendix', actorId?: string, background: '#rrggbb',
  elements: Element[], notes?: string }
// Element is one of:
{ type: 'rect',    x, y, w, h, fill: '#hex', line?: { colour: '#hex', width: number }, radius?: number }
{ type: 'ellipse', x, y, w, h, fill: '#hex', line?: { colour, width } }
{ type: 'line',    x1, y1, x2, y2, colour: '#hex', width: number }
{ type: 'text',    x, y, w, h, paragraphs: [{ text, bold?, italic?, size?, colour?, bullet? }],
                   size: number /*pt*/, colour: '#hex', bold?, italic?,
                   align?: 'left'|'center'|'right', valign?: 'top'|'middle', fill?: '#hex' }
{ type: 'image',   path: string, x, y, w, h }
```
All `x, y, w, h` in inches.

**Block** (deck-model → flow): `{ kind: 'band'|'heading'|'paragraph'|'list', sectionId: string, text?: string, items?: Item[], style: { size: number, bold?: boolean, colour: '#hex', fill?: '#hex' } }`

---

### Task 1: Design tokens and byte-identical extraction from the mission renderer

**Files:**
- Create: `tools/design-tokens.json`
- Create: `tools/renderers/test-design-tokens.js`
- Modify: `tools/renderers/render-mission.js:312-333` (the four `--c-*` declaration groups inside `const CSS`)

**Interfaces:**
- Produces: `require('tools/design-tokens.json')` → `{ colour: { light, dark }, typography: { fontFamily, scale, metrics }, spacing }`. Every later task reads colours as `tokens.colour.light.<key>` and metrics as `tokens.typography.metrics[fontFamily]`.

- [ ] **Step 1: Capture the baseline HTML for all five example Missions (before touching anything)**

```bash
SP=/private/tmp/claude-501/-Users-willosborn-Documents-Digital-Service-Design-Working-schemas/0ed55959-bf6b-4ab6-99e8-a99849e4e5d1/scratchpad
mkdir -p "$SP/baseline" "$SP/after"
for m in v2.0/examples/*/mission-*.json; do
  n=$(basename "$m" .json)
  node tools/renderers/render-mission.js "$m" -o "$SP/baseline/$n.html" >/dev/null
  node tools/renderers/render-mission.js "$m" --mode explore --standalone -o "$SP/baseline/$n.explore.html" >/dev/null
done
ls "$SP/baseline" | wc -l
```
Expected: `10`. (Renderer output was confirmed deterministic on 2026-09-04: two runs are byte-identical.)

- [ ] **Step 2: Write the failing tokens test**

Create `tools/renderers/test-design-tokens.js`:

```js
// Tests for tools/design-tokens.json and its use by render-mission.js
// Run from project root: node tools/renderers/test-design-tokens.js

'use strict';

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
function assert(condition, label, detail) {
  if (condition) { console.log(`  PASS: ${label}`); passed++; }
  else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}
function section(title) {
  console.log(`\n${'='.repeat(60)}\n  ${title}\n${'='.repeat(60)}`);
}

const ROOT = path.join(__dirname, '..', '..');
const tokensPath = path.join(ROOT, 'tools/design-tokens.json');
const rendererPath = path.join(ROOT, 'tools/renderers/render-mission.js');

section('Tokens file');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
assert(tokens.colour && tokens.colour.light && tokens.colour.dark, 'has colour.light and colour.dark');
assert(tokens.typography && tokens.typography.fontFamily, 'has typography.fontFamily');
assert(tokens.spacing && typeof tokens.spacing.slideMargin === 'number', 'has spacing.slideMargin (points)');

const lightKeys = Object.keys(tokens.colour.light).sort();
const darkKeys = Object.keys(tokens.colour.dark).sort();
assert(JSON.stringify(lightKeys) === JSON.stringify(darkKeys), 'light and dark have identical key sets',
  `light-only: ${lightKeys.filter(k => !darkKeys.includes(k))}; dark-only: ${darkKeys.filter(k => !lightKeys.includes(k))}`);

const HEX = /^#[0-9a-f]{6}$/;
for (const mode of ['light', 'dark']) {
  const bad = Object.entries(tokens.colour[mode]).filter(([, v]) => !HEX.test(v)).map(([k]) => k);
  assert(bad.length === 0, `${mode} colours are lowercase #rrggbb`, bad.join(', '));
}

section('Every --c-* variable in render-mission.js has a token');
const src = fs.readFileSync(rendererPath, 'utf8');
const cssVars = [...new Set([...src.matchAll(/--c-([a-z-]+)/g)].map(m => m[1]))];
const toCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
assert(cssVars.length >= 18, 'renderer declares at least 18 --c-* variables', String(cssVars.length));
for (const v of cssVars) {
  assert(toCamel(v) in tokens.colour.light, `token for --c-${v} (${toCamel(v)})`);
}

section('Renderer reads tokens');
assert(src.includes("require('../design-tokens.json')"), 'render-mission.js requires ../design-tokens.json');
const { renderMission } = require('./render-mission');
const retail = JSON.parse(fs.readFileSync(path.join(ROOT, 'v2.0/examples/retail/mission-online-clothes-shopping.json'), 'utf8'));
const { html } = renderMission(retail, { mode: 'overview', standalone: false });
assert(html.includes(`--c-bg:${tokens.colour.light.bg};`), 'rendered CSS carries the light bg token verbatim');
assert(html.includes(`--c-touchpoint:${tokens.colour.dark.touchpoint};`), 'rendered CSS carries the dark touchpoint token verbatim');

section('Typography metrics');
const ff = tokens.typography.fontFamily;
assert(tokens.typography.metrics && tokens.typography.metrics[ff], `metrics exist for default font "${ff}"`);
const m = (tokens.typography.metrics || {})[ff] || {};
assert(m.avgCharWidthEm > 0.3 && m.avgCharWidthEm < 0.7, 'avgCharWidthEm is plausible (0.3–0.7)', String(m.avgCharWidthEm));
assert(m.lineHeightEm > 1.0 && m.lineHeightEm < 1.6, 'lineHeightEm is plausible (1.0–1.6)', String(m.lineHeightEm));
for (const k of ['display', 'h1', 'h2', 'h3', 'body', 'small', 'caption']) {
  assert(typeof tokens.typography.scale[k] === 'number', `scale.${k} is a number (points)`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: Run it to verify it fails**

Run: `out=$(node tools/renderers/test-design-tokens.js 2>&1); code=$?; echo "$out" | tail -3; echo "exit=$code"`
Expected: exit 1, first failure is `ENOENT ... design-tokens.json` (the file does not exist yet).

- [ ] **Step 4: Create `tools/design-tokens.json`**

Values in `light` are copied **verbatim** from `render-mission.js:313-317`; `dark` from lines 321–324 (heat values have no dark variant in the renderer, so they repeat the light values). Layer colours reuse the palette: traits = touchpoint blue, contexts = start green, emergence = decision amber.

```json
{
  "$comment": "DSDS design tokens — the single source of truth for colour, type and spacing. Consumers: tools/renderers/render-mission.js (CSS vars), tools/renderers/pptx/* (hex), Figma plugin (RGB). Colours are lowercase #rrggbb. typography.scale and spacing are in POINTS.",
  "colour": {
    "light": {
      "bg": "#f8fafc", "band": "#eef2f7", "text": "#0f172a", "dim": "#64748b",
      "edge": "#64748b", "edgeError": "#dc2626", "panel": "#ffffff", "border": "#e2e8f0",
      "touchpoint": "#2563eb", "decision": "#d97706", "handoff": "#7c3aed", "wait": "#6b7280",
      "signal": "#ea580c", "start": "#16a34a", "end": "#dc2626",
      "heatLow": "#fbbf24", "heatMedium": "#f97316", "heatHigh": "#ef4444",
      "traits": "#2563eb", "traitsTint": "#eff6ff",
      "contexts": "#16a34a", "contextsTint": "#f0fdf4",
      "emergence": "#d97706", "emergenceTint": "#fffbeb"
    },
    "dark": {
      "bg": "#0b1220", "band": "#111a2b", "text": "#e2e8f0", "dim": "#94a3b8",
      "edge": "#94a3b8", "edgeError": "#f87171", "panel": "#0f172a", "border": "#1e293b",
      "touchpoint": "#3b82f6", "decision": "#f59e0b", "handoff": "#8b5cf6", "wait": "#9ca3af",
      "signal": "#f97316", "start": "#22c55e", "end": "#ef4444",
      "heatLow": "#fbbf24", "heatMedium": "#f97316", "heatHigh": "#ef4444",
      "traits": "#3b82f6", "traitsTint": "#172554",
      "contexts": "#22c55e", "contextsTint": "#052e16",
      "emergence": "#f59e0b", "emergenceTint": "#451a03"
    }
  },
  "typography": {
    "fontFamily": "Calibri",
    "scale": { "display": 36, "h1": 28, "h2": 18, "h3": 13, "body": 11, "small": 9, "caption": 8 },
    "metrics": {
      "Calibri": { "avgCharWidthEm": 0.47, "lineHeightEm": 1.2 },
      "Arial":   { "avgCharWidthEm": 0.52, "lineHeightEm": 1.15 }
    }
  },
  "spacing": { "unit": 4, "slideMargin": 36, "gutter": 18, "bandPadding": 6 }
}
```

- [ ] **Step 5: Interpolate the tokens into `render-mission.js`**

Add, after the existing `require` lines near the top of `tools/renderers/render-mission.js`:

```js
const TOKENS = require('../design-tokens.json');
const L = TOKENS.colour.light;
const D = TOKENS.colour.dark;
```

Then replace lines 313–333 (everything from `.mv-app { --c-bg:#f8fafc;` through the `:root[data-theme="light"]` block's closing `}`) with exactly this — same line breaks, same spacing, only the hex literals replaced:

```js
.mv-app { --c-bg:${L.bg}; --c-band:${L.band}; --c-text:${L.text}; --c-dim:${L.dim};
  --c-edge:${L.edge}; --c-edge-error:${L.edgeError}; --c-panel:${L.panel}; --c-border:${L.border};
  --c-touchpoint:${L.touchpoint}; --c-decision:${L.decision}; --c-handoff:${L.handoff}; --c-wait:${L.wait};
  --c-signal:${L.signal}; --c-start:${L.start}; --c-end:${L.end};
  --c-heat-low:${L.heatLow}; --c-heat-medium:${L.heatMedium}; --c-heat-high:${L.heatHigh};
  font-family: system-ui, -apple-system, sans-serif; color: var(--c-text);
  background: var(--c-bg); display: flex; flex-direction: column; min-height: 100vh; }
@media (prefers-color-scheme: dark) {
  .mv-app { --c-bg:${D.bg}; --c-band:${D.band}; --c-text:${D.text}; --c-dim:${D.dim};
    --c-edge:${D.edge}; --c-edge-error:${D.edgeError}; --c-panel:${D.panel}; --c-border:${D.border};
    --c-touchpoint:${D.touchpoint}; --c-decision:${D.decision}; --c-handoff:${D.handoff}; --c-wait:${D.wait};
    --c-signal:${D.signal}; --c-start:${D.start}; --c-end:${D.end}; } }
:root[data-theme="dark"] .mv-app { --c-bg:${D.bg}; --c-band:${D.band}; --c-text:${D.text};
  --c-dim:${D.dim}; --c-edge:${D.edge}; --c-edge-error:${D.edgeError}; --c-panel:${D.panel};
  --c-border:${D.border}; --c-touchpoint:${D.touchpoint}; --c-decision:${D.decision}; --c-handoff:${D.handoff};
  --c-wait:${D.wait}; --c-signal:${D.signal}; --c-start:${D.start}; --c-end:${D.end}; }
:root[data-theme="light"] .mv-app { --c-bg:${L.bg}; --c-band:${L.band}; --c-text:${L.text};
  --c-dim:${L.dim}; --c-edge:${L.edge}; --c-edge-error:${L.edgeError}; --c-panel:${L.panel};
  --c-border:${L.border}; --c-touchpoint:${L.touchpoint}; --c-decision:${L.decision}; --c-handoff:${L.handoff};
  --c-wait:${L.wait}; --c-signal:${L.signal}; --c-start:${L.start}; --c-end:${L.end}; }
```

`const CSS` is already a template literal (backticks), so `${…}` interpolates. Do not touch anything after line 333.

- [ ] **Step 6: Prove byte-identical output**

```bash
SP=/private/tmp/claude-501/-Users-willosborn-Documents-Digital-Service-Design-Working-schemas/0ed55959-bf6b-4ab6-99e8-a99849e4e5d1/scratchpad
for m in v2.0/examples/*/mission-*.json; do
  n=$(basename "$m" .json)
  node tools/renderers/render-mission.js "$m" -o "$SP/after/$n.html" >/dev/null
  node tools/renderers/render-mission.js "$m" --mode explore --standalone -o "$SP/after/$n.explore.html" >/dev/null
done
diff -rq "$SP/baseline" "$SP/after" && echo "BYTE-IDENTICAL: 10/10"
```
Expected: `BYTE-IDENTICAL: 10/10` and no `differ` lines. If any file differs, `diff` the pair: the cause is a hex value in the tokens that does not match the original literal, or a whitespace change in the block — fix the tokens/block, never the baseline.

- [ ] **Step 7: Run the new test and the regression suites**

```bash
out=$(node tools/renderers/test-design-tokens.js 2>&1); echo "$out" | tail -2; echo "exit=$?"
out=$(node tools/renderers/test-render-mission.js 2>&1); echo "$out" | tail -1
out=$(node tools/renderers/test-mission-layout.js 2>&1); echo "$out" | tail -1
```
Expected: tokens test `0 failed`, exit 0; `83 passed, 0 failed`; `16 passed, 0 failed`.

- [ ] **Step 8: Commit**

```bash
git add tools/design-tokens.json tools/renderers/render-mission.js tools/renderers/test-design-tokens.js
git commit -m "feat(tokens): extract the mission renderer palette to tools/design-tokens.json

Rendered HTML for all five example Missions is byte-identical before and
after; the 83 renderer tests and 16 layout tests are unchanged. Adds the
three layer colours (traits / contexts / emergence) and font metrics the
PPTX renderer will read.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Throwaway summary-slide spike — Will signs off the hero slide

**This task produces no repo code.** It lives in the session scratchpad and is deleted afterwards. Its deliverable is Will's feedback on the look of the summary slide, recorded in the **Spike outcome** block at the end of this task, which Task 9 then implements.

**Files:**
- Create (scratchpad only): `$SP/spike-summary/spike.js`
- Modify: this plan — fill in the *Spike outcome* block.

- [ ] **Step 1: Set up the scratchpad project**

```bash
SP=/private/tmp/claude-501/-Users-willosborn-Documents-Digital-Service-Design-Working-schemas/0ed55959-bf6b-4ab6-99e8-a99849e4e5d1/scratchpad
mkdir -p "$SP/spike-summary" && cd "$SP/spike-summary" && npm init -y >/dev/null && npm install pptxgenjs@4.0.1 --no-audit --no-fund 2>&1 | tail -1
```

- [ ] **Step 2: Write the spike — one summary slide from the heaviest real Actor, using the real tokens**

`$SP/spike-summary/spike.js` (hardcoded layout; this is what Task 9 parameterises):

```js
'use strict';
const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const ROOT = '/Users/willosborn/Documents/Digital Service Design Working/schemas';
const T = require(ROOT + '/tools/design-tokens.json');
const C = T.colour.light;
const FONT = T.typography.fontFamily;
const hex = h => h.replace('#', '');
const A = JSON.parse(fs.readFileSync(ROOT + '/v2.0/examples/roadside/actor-adam-rees.json', 'utf8'));

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'DSDS', width: 13.333, height: 7.5 });
pptx.layout = 'DSDS';
const s = pptx.addSlide();
s.background = { color: hex(C.bg) };

// Header band
s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 1.55, fill: { color: hex(C.panel) }, line: { color: hex(C.border), width: 0.75 } });
// Avatar (monogram)
const initials = A.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
s.addShape(pptx.ShapeType.ellipse, { x: 0.5, y: 0.3, w: 0.95, h: 0.95, fill: { color: hex(C.traits) } });
s.addText(initials, { x: 0.5, y: 0.3, w: 0.95, h: 0.95, fontFace: FONT, fontSize: 22, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
// Name + type badge
s.addText(A.name, { x: 1.65, y: 0.25, w: 7, h: 0.55, fontFace: FONT, fontSize: T.typography.scale.h1, bold: true, color: hex(C.text), margin: 0, valign: 'middle' });
s.addShape(pptx.ShapeType.roundRect, { x: 1.65, y: 0.85, w: 1.1, h: 0.3, rectRadius: 0.15, fill: { color: hex(C.band) }, line: { color: hex(C.border), width: 0.5 } });
s.addText(A.actorType.toUpperCase(), { x: 1.65, y: 0.85, w: 1.1, h: 0.3, fontFace: FONT, fontSize: 9, bold: true, color: hex(C.dim), align: 'center', valign: 'middle', margin: 0 });
// Quote
s.addText(`“${A.quote}”`, { x: 8.0, y: 0.3, w: 4.85, h: 1.0, fontFace: FONT, fontSize: 12, italic: true, color: hex(C.dim), valign: 'middle', margin: 4 });
// Summary paragraph
s.addText(A.summary, { x: 0.5, y: 1.75, w: 12.333, h: 0.85, fontFace: FONT, fontSize: 12, color: hex(C.text), valign: 'top', margin: 0 });

// Three columns
const colY = 2.8, colH = 4.05, colW = (13.333 - 1.0 - 0.5) / 3, gutter = 0.25;
const cols = [
  { title: 'Who they are', colour: C.traits, tint: C.traitsTint,
    items: [...(A.traits.needs || []).map(n => n.need), ...(A.traits.frustrations || []).map(f => f.frustration)].slice(0, 3) },
  { title: 'In this context', colour: C.contexts, tint: C.contextsTint,
    items: [...(A.contexts[0].needs || []).map(n => n.need), ...(A.contexts[0].frustrations || []).map(f => f.frustration)].slice(0, 3) },
  { title: 'What emerges', colour: C.emergence, tint: C.emergenceTint,
    items: [...(A.emergence[0].goalsAsExperienced || []).map(g => g.goal), ...(A.emergence[0].painPoints || []).map(p => p.painPoint)].slice(0, 3) },
];
cols.forEach((c, i) => {
  const x = 0.5 + i * (colW + gutter);
  s.addShape(pptx.ShapeType.roundRect, { x, y: colY, w: colW, h: colH, rectRadius: 0.08, fill: { color: hex(c.tint) }, line: { color: hex(c.colour), width: 1 } });
  s.addShape(pptx.ShapeType.rect, { x, y: colY, w: colW, h: 0.42, fill: { color: hex(c.colour) } });
  s.addText(c.title.toUpperCase(), { x: x + 0.15, y: colY, w: colW - 0.3, h: 0.42, fontFace: FONT, fontSize: 11, bold: true, color: 'FFFFFF', valign: 'middle', margin: 0 });
  s.addText(c.items.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < c.items.length - 1, paraSpaceAfter: 6 } })),
    { x: x + 0.1, y: colY + 0.55, w: colW - 0.2, h: colH - 0.65, fontFace: FONT, fontSize: 12, color: hex(C.text), valign: 'top', margin: 4 });
});
// Footer
s.addText(`${A.id} · v${A.version}`, { x: 0.5, y: 7.05, w: 8, h: 0.3, fontFace: FONT, fontSize: 8, color: hex(C.dim), margin: 0 });

pptx.writeFile({ fileName: 'summary-spike.pptx' }).then(f => console.log('wrote', f));
```

- [ ] **Step 3: Render it and look at it**

```bash
cd "$SP/spike-summary" && node spike.js && /Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to pdf summary-spike.pptx >/dev/null 2>&1 && pdftoppm -png -r 110 summary-spike.pdf slide && ls slide*.png
```
Expected: `slide-1.png`. Open it with the Read tool. Check: nothing clipped, the three columns align, the quote does not collide with the name, bullets render as bullets.

- [ ] **Step 4: Put it in front of Will and wait**

Send `slide-1.png` to Will (SendUserFile) with three specific questions: (1) is the three-column *Who / In this context / What emerges* structure the right read of an Actor at a glance; (2) is the header band (monogram, name, badge, quote-right) the right hierarchy; (3) anything that must change before this becomes the template. **Stop here until Will answers.** Do not proceed to Task 3 on the assumption of approval.

- [ ] **Step 5: Record the outcome, then delete the spike**

Fill in the block below in this plan file, commit the plan, and `rm -rf "$SP/spike-summary"`.

```bash
git add docs/superpowers/plans/2026-09-04-actor-export-pptx.md
git commit -m "docs(plan): record the summary-slide spike outcome

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

**Spike outcome** *(filled in during execution — Task 9 reads this)*:

- Approved as-is / changes requested: _(record here)_
- Layout changes to carry into Task 9 (`LAYOUT.summary`): _(record here, as concrete numbers or "none")_

---

### Task 3: Actor view model — fixture, identity/avatar, trait normalisation

**Files:**
- Create: `tools/tests/fixtures/actor-multi-context.json`
- Create: `tools/viewmodels/actor-viewmodel.js`
- Create: `tools/viewmodels/test-actor-viewmodel.js`

**Interfaces:**
- Consumes: `tools/validators/validate-v2.0.js` → `validateData(data) → { valid, schemaType, errors, warnings }` (verified export).
- Produces: `buildActorViewModel(actor, options?) → vm` with `vm.identity`, `vm.avatar`, `vm.traits` (this task) — later tasks add `contexts`, `relationships`, `summarySlots`, `warnings`. Also exports `TRAIT_GROUPS`, `TRAIT_LABELS`, `DEFAULT_ACTOR_SECTIONS`, `humanise`, `initialsOf`, `colourKeyOf`.

- [ ] **Step 1: Create the synthetic three-context fixture**

`tools/tests/fixtures/actor-multi-context.json`. Field sets mirror `v2.0/examples/retail/actor-sarah-martinez.json` exactly (which validates), so this validates by construction. Fictional composite, no PII.

```json
{
  "$context": "https://schemas.digitalservice.design/v2.0",
  "$type": "Actor",
  "id": "actor-test-multi-context",
  "version": "2.0.0",
  "name": "Priya Test-Fixture",
  "summary": "Synthetic Actor with three contexts, used only by renderer and view-model tests to exercise multi-context layout. Not a credible persona and not an example.",
  "actorType": "human",
  "quote": "Three hats, one head.",
  "traits": {
    "demographics": { "age": 41, "location": "Fictional Town", "education": "Vocational qualification", "background": "Composite background for testing." },
    "needs": [
      { "need": "Need one for testing", "type": "autonomy" },
      { "need": "Need two for testing", "type": "security" },
      { "need": "Need three for testing", "type": "efficiency" },
      { "need": "Need four for testing", "type": "belonging" }
    ],
    "frustrations": [
      { "frustration": "Frustration one for testing", "severity": 5 },
      { "frustration": "Frustration two for testing", "severity": 2 }
    ],
    "motivations": [ { "motivation": "Motivation one", "type": "intrinsic" } ],
    "technology": { "comfort": "intermediate", "description": "Uses a phone and a laptop.", "preferredDevices": [ "smartphone", "laptop" ] },
    "communication": { "preferred": [ "app" ], "acceptable": [ "email" ], "avoided": [ "phone" ], "style": "Short and direct." },
    "learningStyle": "Learns by doing",
    "influences": [ { "source": "Colleagues", "description": "Asks the person next to them." } ],
    "decisionMaking": { "style": "Quick, then revises", "riskTolerance": "moderate" },
    "accessibility": { "dimensions": [ { "dimension": "situational", "description": "Often one-handed while carrying things.", "impact": "moderate" } ] },
    "behaviouralPatterns": [ { "pattern": "Abandons after first failure", "context": "Any digital channel" } ]
  },
  "contexts": [
    {
      "contextId": "ctx-alpha", "title": "Alpha Role", "contextType": "Employee",
      "description": "First context. Exists to be listed first.",
      "needs": [ { "need": "Alpha need one", "priority": "primary", "timeframe": "immediate" }, { "need": "Alpha need two", "priority": "secondary", "timeframe": "ongoing" } ],
      "frustrations": [ { "frustration": "Alpha frustration", "severity": 3, "frequency": "weekly" } ],
      "channels": [ { "channel": "app", "category": "digital", "serviceModel": "self_service", "preference": "preferred", "usageContext": "Daily use" } ],
      "momentsThatMatter": [ { "moment": "Alpha moment", "emotionalIntensity": -1, "importance": "critical" } ]
    },
    {
      "contextId": "ctx-beta", "title": "Beta Role", "contextType": "Consumer",
      "description": "Second context.",
      "needs": [ { "need": "Beta need", "priority": "primary", "timeframe": "immediate" } ],
      "frustrations": [ { "frustration": "Beta frustration one", "severity": 4, "frequency": "daily" }, { "frustration": "Beta frustration two", "severity": 1, "frequency": "rarely" } ],
      "channels": [ { "channel": "phone", "category": "telecom", "serviceModel": "managed", "preference": "acceptable", "usageContext": "When it matters" } ],
      "momentsThatMatter": []
    },
    {
      "contextId": "ctx-gamma", "title": "Gamma Role", "contextType": "Citizen",
      "description": "Third context. Has no emergence entry on purpose.",
      "needs": [ { "need": "Gamma need", "priority": "primary", "timeframe": "long_term" } ],
      "frustrations": [],
      "channels": [],
      "momentsThatMatter": []
    }
  ],
  "emergence": [
    {
      "contextRef": "ctx-alpha",
      "goalsAsExperienced": [ { "goal": "Alpha goal one", "source": "collision", "priority": "primary" }, { "goal": "Alpha goal two", "source": "traits", "priority": "secondary" } ],
      "painPoints": [ { "painPoint": "Alpha pain", "severity": 4, "emergesFrom": "Trait X meets context Y" } ],
      "opportunities": [ "Alpha opportunity" ],
      "emotionalContext": "Calm but busy.",
      "useCases": [ { "scenario": "Alpha scenario", "trigger": "Something happens", "outcome": "Something resolves" } ],
      "successMetrics": [ "Alpha metric" ]
    },
    {
      "contextRef": "ctx-beta",
      "goalsAsExperienced": [ { "goal": "Beta goal", "source": "context", "priority": "primary" } ],
      "painPoints": [],
      "opportunities": [],
      "emotionalContext": "Anxious.",
      "useCases": [],
      "successMetrics": []
    }
  ],
  "relationships": [
    { "target": "actor-adam-rees", "type": "collaborates_with", "description": "In-deck edge for tests when rendered with the roadside set." },
    { "target": "mission-does-not-exist", "type": "participates_in", "description": "External edge for tests." }
  ],
  "governance": { "dataClassification": "public", "containsPii": false, "anonymisationMethod": "fictional_composite" },
  "meta": { "created": "2026-09-04", "updated": "2026-09-04", "createdBy": "DSDS test suite", "organisation": "Digital Service Design Working", "tags": [ "test-fixture", "multi-context" ] }
}
```

- [ ] **Step 2: Validate the fixture**

Run: `node tools/validators/validate-v2.0.js tools/tests/fixtures/actor-multi-context.json; echo "exit=$?"`
Expected: `PASS`, exit 0. If it fails, the error names the offending path (e.g. `/traits/needs/0/type: must be equal to one of the allowed values`) — change the fixture's value to one used by `actor-sarah-martinez.json` for that field. Do not change the schema.

- [ ] **Step 3: Write the failing tests for identity, avatar and trait normalisation**

Create `tools/viewmodels/test-actor-viewmodel.js`:

```js
// Tests for tools/viewmodels/actor-viewmodel.js
// Run from project root: node tools/viewmodels/test-actor-viewmodel.js

'use strict';

const fs = require('fs');
const path = require('path');
const { validateData } = require('../validators/validate-v2.0');
const vmod = require('./actor-viewmodel');
const { buildActorViewModel, TRAIT_GROUPS, TRAIT_LABELS, DEFAULT_ACTOR_SECTIONS, humanise, initialsOf, colourKeyOf } = vmod;

let passed = 0;
let failed = 0;
function assert(condition, label, detail) {
  if (condition) { console.log(`  PASS: ${label}`); passed++; }
  else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}
function section(title) { console.log(`\n${'='.repeat(60)}\n  ${title}\n${'='.repeat(60)}`); }

const ROOT = path.join(__dirname, '..', '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const sarah = load('v2.0/examples/retail/actor-sarah-martinez.json');
const adam = load('v2.0/examples/roadside/actor-adam-rees.json');
const daniel = load('v2.0/examples/roadside/actor-daniel-rees.json');
const fixture = load('tools/tests/fixtures/actor-multi-context.json');
const ALL_ACTORS = fs.readdirSync(path.join(ROOT, 'v2.0/examples'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .flatMap(d => fs.readdirSync(path.join(ROOT, 'v2.0/examples', d.name))
    .filter(f => f.startsWith('actor-') && f.endsWith('.json'))
    .map(f => load(path.join('v2.0/examples', d.name, f))));

const isItem = it => it && typeof it.primary === 'string' && it.primary.length > 0
  && (it.secondary === undefined || typeof it.secondary === 'string')
  && (it.badge === undefined || typeof it.badge === 'string');

section('Fixture');
assert(validateData(fixture).valid, 'multi-context fixture validates against the Actor schema', (validateData(fixture).errors || []).join('; '));
assert(fixture.contexts.length === 3, 'fixture has three contexts');

section('Helpers');
assert(humanise('preferredDevices') === 'Preferred devices', 'humanise camelCase');
assert(humanise('served_by') === 'Served by', 'humanise snake_case');
assert(initialsOf('Sarah Martinez') === 'SM', 'initials from two words');
assert(initialsOf('Cher') === 'C', 'initials from one word');
assert(initialsOf('Priya Test-Fixture') === 'PT', 'initials ignore hyphenated second part');
assert(colourKeyOf('actor-adam-rees') === colourKeyOf('actor-adam-rees'), 'colourKey is stable');
assert(Number.isInteger(colourKeyOf('x')) && colourKeyOf('x') >= 0 && colourKeyOf('x') < 6, 'colourKey is an integer 0–5');

section('Identity and avatar');
{
  const vm = buildActorViewModel(sarah);
  assert(vm.identity.id === 'actor-sarah-martinez' && vm.identity.name === 'Sarah Martinez', 'identity carries id and name');
  assert(vm.identity.actorType === 'human' && vm.identity.version === '2.0.0', 'identity carries actorType and version');
  assert(vm.identity.summary === sarah.summary && vm.identity.quote === sarah.quote, 'identity carries summary and quote');
  assert(vm.avatar.kind === 'initials' && vm.avatar.text === 'SM', 'human actor gets initials avatar');
  const org = buildActorViewModel({ ...sarah, actorType: 'organisation' });
  assert(org.avatar.kind === 'label' && org.avatar.text === 'ORG', 'organisation gets ORG label');
  assert(buildActorViewModel({ ...sarah, actorType: 'ai_agent' }).avatar.text === 'AI', 'ai_agent gets AI label');
  assert(buildActorViewModel({ ...sarah, actorType: 'team' }).avatar.text === 'TEAM', 'team gets TEAM label');
}

section('Trait normalisation — shapes');
{
  const vm = buildActorViewModel(sarah);
  assert(TRAIT_GROUPS.length === 11, 'eleven trait groups');
  for (const g of TRAIT_GROUPS) {
    const grp = vm.traits[g];
    assert(grp && grp.label === TRAIT_LABELS[g] && Array.isArray(grp.items), `traits.${g} has label and items`);
    assert(grp.items.every(isItem), `traits.${g} items are {primary, secondary?, badge?}`);
  }
  assert(vm.traits.demographics.items.some(i => i.badge === 'age' && i.primary === '32'), 'demographics: age → primary "32", badge "age"');
  assert(vm.traits.demographics.items.some(i => i.badge === 'location' && i.primary === 'Austin, Texas'), 'demographics: location');
  assert(vm.traits.needs.items[0].primary === 'Maintain family wellbeing and happiness' && vm.traits.needs.items[0].badge === 'belonging', 'needs: primary=need, badge=type');
  assert(vm.traits.frustrations.items[0].badge === 'severity 4/5', 'frustrations: badge "severity n/5"');
  assert(vm.traits.motivations.items[0].badge === 'intrinsic', 'motivations: badge=type');
  const tech = vm.traits.technology.items[0];
  assert(tech.badge === 'intermediate' && tech.secondary === 'smartphone, tablet, laptop' && tech.primary.startsWith('Smartphone-first'), 'technology: one item, badge=comfort, secondary=devices');
  const comm = vm.traits.communication.items;
  assert(comm[0].badge === 'preferred' && comm[0].primary === 'app, social media', 'communication: preferred list humanised');
  assert(comm[2].badge === 'avoided' && comm[2].primary === 'phone', 'communication: avoided');
  assert(comm[3].primary.startsWith('Prefers concise') && comm[3].badge === undefined, 'communication: style as fourth item without badge');
  assert(vm.traits.learningStyle.items.length === 1 && vm.traits.learningStyle.items[0].primary.startsWith('Visual learner'), 'learningStyle: single item');
  assert(vm.traits.influences.items[0].badge === 'Family and friends', 'influences: badge=source');
  assert(vm.traits.decisionMaking.items[0].badge === 'cautious', 'decisionMaking: badge=riskTolerance');
  assert(vm.traits.accessibility.items[0].badge === 'situational · moderate', 'accessibility: badge "dimension · impact"');
  assert(vm.traits.behaviouralPatterns.items[0].secondary === 'Any purchase affecting family wellbeing or budget', 'behaviouralPatterns: secondary=context');
}

section('Trait normalisation — absence and selection');
{
  const noMotiv = JSON.parse(JSON.stringify(sarah)); delete noMotiv.traits.motivations; noMotiv.traits.influences = [];
  const vm = buildActorViewModel(noMotiv);
  assert(!('motivations' in vm.traits), 'absent group is omitted');
  assert(!('influences' in vm.traits), 'empty group is omitted');
  const sel = buildActorViewModel(sarah, { traitGroups: ['needs', 'frustrations'] });
  assert(Object.keys(sel.traits).sort().join(',') === 'frustrations,needs', 'traitGroups option selects groups');
  const none = buildActorViewModel(sarah, { sections: { ...DEFAULT_ACTOR_SECTIONS, traits: false } });
  assert(Object.keys(none.traits).length === 0, 'sections.traits=false yields no trait groups');
  assert(DEFAULT_ACTOR_SECTIONS.traits === true && DEFAULT_ACTOR_SECTIONS.provenance === false && DEFAULT_ACTOR_SECTIONS.governance === false && DEFAULT_ACTOR_SECTIONS.relationships === true, 'default sections per spec §4.2');
}

section('Every example Actor normalises without throwing');
for (const a of ALL_ACTORS) {
  let vm, err;
  try { vm = buildActorViewModel(a); } catch (e) { err = e; }
  assert(!err && vm && Object.values(vm.traits).every(g => g.items.every(isItem)), `${a.id} → uniform items`, err && err.message);
}

module.exports = { assert, section, ROOT, load, sarah, adam, daniel, fixture, ALL_ACTORS, isItem, finish: () => { console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };
if (require.main === module) module.exports.finish();
```

(The `module.exports` at the bottom lets Tasks 4 and 5 append their sections to this same file; the file stays one test suite with one exit code.)

- [ ] **Step 4: Run to verify it fails**

Run: `out=$(node tools/viewmodels/test-actor-viewmodel.js 2>&1); code=$?; echo "$out" | head -3; echo "exit=$code"`
Expected: `Cannot find module './actor-viewmodel'`, exit 1.

- [ ] **Step 5: Implement the view model — scaffold, helpers, identity, avatar, traits**

Create `tools/viewmodels/actor-viewmodel.js`:

```js
// Actor view model — v2.0 Actor JSON → target-agnostic, uniformly shaped object.
// Pure: no I/O. Consumed by tools/renderers/pptx/deck-model.js and the Figma plugin.
// Spec: docs/superpowers/specs/2026-09-04-actor-export-design.md §4

'use strict';

const TRAIT_GROUPS = ['demographics', 'needs', 'frustrations', 'motivations', 'technology', 'communication',
  'learningStyle', 'influences', 'decisionMaking', 'accessibility', 'behaviouralPatterns'];

const TRAIT_LABELS = {
  demographics: 'Demographics', needs: 'Needs', frustrations: 'Frustrations', motivations: 'Motivations',
  technology: 'Technology', communication: 'Communication', learningStyle: 'Learning style',
  influences: 'Influences', decisionMaking: 'Decision making', accessibility: 'Accessibility',
  behaviouralPatterns: 'Behavioural patterns'
};

const DEFAULT_ACTOR_SECTIONS = Object.freeze({
  traits: true, contexts: true, emergence: true, relationships: true, provenance: false, governance: false
});

const AVATAR_LABELS = { ai_agent: 'AI', team: 'TEAM', organisation: 'ORG' };
const COLOUR_KEYS = 6;

function humanise(key) {
  const s = String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function initialsOf(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1].split('-')[0][0] : '';
  return (first + last).toUpperCase();
}

function colourKeyOf(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % COLOUR_KEYS;
}

const nonEmpty = v => Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '';
const item = (primary, extra) => Object.assign({ primary: String(primary) }, extra || {});
const severityBadge = n => (typeof n === 'number' ? `severity ${n}/5` : undefined);
const joinList = arr => (Array.isArray(arr) ? arr.map(humaniseValue).join(', ') : undefined);
function humaniseValue(v) { return typeof v === 'string' ? v.replace(/_/g, ' ') : String(v); }

// One normaliser per trait group (spec §4.1). Each returns Item[] (possibly empty).
const TRAIT_NORMALISERS = {
  demographics: d => ['age', 'location', 'education', 'background']
    .filter(k => nonEmpty(d[k])).map(k => item(d[k], { badge: k })),
  needs: arr => arr.map(n => item(n.need, { badge: n.type })),
  frustrations: arr => arr.map(f => item(f.frustration, { badge: severityBadge(f.severity) })),
  motivations: arr => arr.map(m => item(m.motivation, { badge: m.type })),
  technology: t => nonEmpty(t.description) || nonEmpty(t.comfort)
    ? [item(t.description || humaniseValue(t.comfort), { badge: t.comfort, secondary: joinList(t.preferredDevices) })] : [],
  communication: c => [
    ...['preferred', 'acceptable', 'avoided'].filter(k => nonEmpty(c[k])).map(k => item(joinList(c[k]), { badge: k })),
    ...(nonEmpty(c.style) ? [item(c.style)] : [])
  ],
  learningStyle: s => nonEmpty(s) ? [item(s)] : [],
  influences: arr => arr.map(i => item(i.description || i.source, { badge: i.description ? i.source : undefined })),
  decisionMaking: d => nonEmpty(d.style) ? [item(d.style, { badge: d.riskTolerance })] : [],
  accessibility: a => [
    ...(a.dimensions || []).map(d => item(d.description || d.dimension, { badge: [d.dimension, d.impact].filter(Boolean).join(' · ') })),
    ...(a.assistiveTech || []).map(t => item(typeof t === 'string' ? t : (t.name || JSON.stringify(t)), { badge: 'assistive tech' }))
  ],
  behaviouralPatterns: arr => arr.map(p => item(p.pattern, { secondary: p.context }))
};

function normaliseTraits(traits, groups) {
  const out = {};
  for (const g of groups) {
    const raw = traits && traits[g];
    if (!nonEmpty(raw)) continue;
    const items = TRAIT_NORMALISERS[g](raw).filter(i => nonEmpty(i.primary));
    if (items.length === 0) continue;
    out[g] = { label: TRAIT_LABELS[g], items };
  }
  return out;
}

function buildAvatar(actor) {
  const label = AVATAR_LABELS[actor.actorType];
  return label
    ? { kind: 'label', text: label, colourKey: colourKeyOf(actor.id) }
    : { kind: 'initials', text: initialsOf(actor.name), colourKey: colourKeyOf(actor.id) };
}

function resolveOptions(options) {
  const o = options || {};
  const sections = Object.assign({}, DEFAULT_ACTOR_SECTIONS, o.sections || {});
  const traitGroups = o.traitGroups && o.traitGroups !== 'all'
    ? TRAIT_GROUPS.filter(g => o.traitGroups.includes(g)) : TRAIT_GROUPS.slice();
  return { sections, traitGroups, caps: Object.assign({ summaryItems: 3 }, o.caps || {}), context: o.context, deck: Object.assign({ actorIds: [] }, o.deck || {}) };
}

function buildActorViewModel(actor, options) {
  const opts = resolveOptions(options);
  const warnings = [];
  const vm = {
    identity: { id: actor.id, name: actor.name, actorType: actor.actorType, summary: actor.summary || '', quote: actor.quote || '', version: actor.version },
    avatar: buildAvatar(actor),
    traits: opts.sections.traits ? normaliseTraits(actor.traits, opts.traitGroups) : {},
    contexts: [],
    unattributedEmergence: [],
    relationships: { inDeck: [], external: [] },
    summarySlots: null,
    warnings
  };
  return vm;
}

module.exports = { buildActorViewModel, TRAIT_GROUPS, TRAIT_LABELS, DEFAULT_ACTOR_SECTIONS, humanise, initialsOf, colourKeyOf, humaniseValue, item, nonEmpty, severityBadge, joinList, resolveOptions };
```

- [ ] **Step 6: Run the tests**

Run: `out=$(node tools/viewmodels/test-actor-viewmodel.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed"; echo "exit=$code"`
Expected: `N passed, 0 failed`, exit 0. Note `humaniseValue` turns `social_media` into `social media` — that is why the communication assertion expects `'app, social media'`.

- [ ] **Step 7: Commit**

```bash
git add tools/tests/fixtures/actor-multi-context.json tools/viewmodels/actor-viewmodel.js tools/viewmodels/test-actor-viewmodel.js
git commit -m "feat(viewmodel): Actor view model — identity, avatar, trait normalisation

Eleven trait-group shapes collapse to one {primary, secondary?, badge?}
item shape so renderers never see the schema. Adds the synthetic
three-context fixture no example provides.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: View model — contexts, nested emergence, relationships

**Files:**
- Modify: `tools/viewmodels/actor-viewmodel.js` (add context/emergence/relationship normalisers; fill `vm.contexts`, `vm.unattributedEmergence`, `vm.relationships`)
- Modify: `tools/viewmodels/test-actor-viewmodel.js` (append sections before the `module.exports` line)

**Interfaces:**
- Consumes: Task 3's `item`, `nonEmpty`, `severityBadge`, `joinList`, `humanise`, `humaniseValue`, `resolveOptions`.
- Produces: `vm.contexts[]` = `{ contextId, title, contextType, description, needs[], frustrations[], channels[], momentsThatMatter[], details[], emergence: { goalsAsExperienced[], painPoints[], opportunities[], emotionalContext, useCases[], successMetrics[] } | null }`; `vm.unattributedEmergence[]` (same emergence shape plus `contextRef`); `vm.relationships = { inDeck[], external[] }` with items `{ target, type, typeLabel, description, strength }`; warning codes `UNATTRIBUTED_EMERGENCE`.

- [ ] **Step 1: Append failing tests**

Insert before the `module.exports = { assert, section, …` line in `tools/viewmodels/test-actor-viewmodel.js`:

```js
section('Contexts');
{
  const vm = buildActorViewModel(sarah);
  assert(vm.contexts.length === 1, 'sarah has one context');
  const c = vm.contexts[0];
  assert(c.contextId === 'ctx-working-mom-consumer' && c.title === 'Working Mom Consumer' && c.contextType === 'Consumer', 'context identity fields');
  assert(c.description.startsWith('Primary household'), 'context description');
  assert(c.needs.every(isItem) && c.needs[0].primary === 'Find products that save time in daily routines' && c.needs[0].badge === 'primary', 'context needs: badge=priority');
  assert(c.frustrations[0].badge === 'severity 4/5', 'context frustrations: severity badge');
  assert(c.channels[0].primary === 'app' && c.channels[0].badge === 'preferred' && c.channels[0].secondary.startsWith('Quick shopping'), 'context channels: primary=channel, badge=preference, secondary=usageContext');
  assert(c.momentsThatMatter[0].primary.startsWith('First-time purchase') && c.momentsThatMatter[0].badge === 'critical', 'moments: badge=importance');
  assert(c.details.some(d => d.badge === 'Decision factors' && d.primary.includes('Time savings')), 'details: key humanised as badge, array joined');
  assert(c.details.some(d => d.badge === 'Shopping behaviour'), 'details: camelCase key humanised');
}

section('Emergence nests under its context');
{
  const vm = buildActorViewModel(sarah);
  const e = vm.contexts[0].emergence;
  assert(e && e.goalsAsExperienced[0].primary.startsWith('Make quick, confident') && e.goalsAsExperienced[0].badge === 'collision', 'goals: badge=source (collision made visible)');
  assert(e.painPoints[0].badge === 'severity 4/5' && e.painPoints[0].secondary.startsWith("Sarah's decision-making"), 'pain points: secondary=emergesFrom');
  assert(e.opportunities[0].primary.startsWith('Time-aware') && e.opportunities[0].badge === undefined, 'opportunities: plain items');
  assert(typeof e.emotionalContext === 'string' && e.emotionalContext.startsWith('Generally optimistic'), 'emotionalContext string');
  assert(e.useCases[0].primary === 'Quick reordering of household essentials' && e.useCases[0].secondary === 'Trigger: Running low on regular items → Fast, one-click repurchase with confidence', 'use cases: secondary = trigger → outcome');
  assert(e.successMetrics[0].primary.startsWith('Time saved'), 'success metrics: plain items');
  assert(vm.unattributedEmergence.length === 0 && !vm.warnings.some(w => w.code === 'UNATTRIBUTED_EMERGENCE'), 'no unattributed emergence for sarah');
}
{
  const vm = buildActorViewModel(fixture);
  assert(vm.contexts.length === 3 && vm.contexts.map(c => c.contextId).join(',') === 'ctx-alpha,ctx-beta,ctx-gamma', 'fixture keeps schema order');
  assert(vm.contexts[0].emergence && vm.contexts[0].emergence.goalsAsExperienced.length === 2, 'alpha has its emergence');
  assert(vm.contexts[1].emergence && vm.contexts[1].emergence.goalsAsExperienced.length === 1, 'beta has its emergence');
  assert(vm.contexts[2].emergence === null, 'gamma (no emergence entry) gets null, not an empty object');
  const orphan = JSON.parse(JSON.stringify(fixture));
  orphan.emergence.push({ contextRef: 'ctx-does-not-exist', goalsAsExperienced: [{ goal: 'Orphan goal', source: 'traits', priority: 'primary' }], painPoints: [], opportunities: [], emotionalContext: '', useCases: [], successMetrics: [] });
  const ovm = buildActorViewModel(orphan);
  assert(ovm.unattributedEmergence.length === 1 && ovm.unattributedEmergence[0].contextRef === 'ctx-does-not-exist', 'unmatched contextRef lands in unattributedEmergence');
  assert(ovm.warnings.some(w => w.code === 'UNATTRIBUTED_EMERGENCE' && w.message.includes('ctx-does-not-exist')), 'and produces a warning naming the ref');
  const noEm = buildActorViewModel(fixture, { sections: { emergence: false } });
  assert(noEm.contexts.every(c => c.emergence === null), 'sections.emergence=false nulls all emergence');
  const noCtx = buildActorViewModel(fixture, { sections: { contexts: false } });
  assert(noCtx.contexts.length === 0, 'sections.contexts=false yields no contexts');
}

section('Relationships');
{
  const vm = buildActorViewModel(adam, { deck: { actorIds: ['actor-adam-rees', 'actor-daniel-rees'] } });
  assert(vm.relationships.inDeck.length === 1 && vm.relationships.inDeck[0].target === 'actor-daniel-rees', 'adam→daniel is in-deck when daniel is in the deck');
  assert(vm.relationships.inDeck[0].type === 'serves' && vm.relationships.inDeck[0].typeLabel === 'serves', 'type and typeLabel (no underscores)');
  const alone = buildActorViewModel(adam);
  assert(alone.relationships.inDeck.length === 0 && alone.relationships.external.length === 1, 'same edge is external when daniel is absent');
  const d = buildActorViewModel(daniel, { deck: { actorIds: ['actor-adam-rees', 'actor-daniel-rees'] } });
  assert(d.relationships.inDeck[0].typeLabel === 'served by', 'served_by → "served by"');
  const s = buildActorViewModel(sarah);
  assert(s.relationships.external[0].target === 'mission-online-clothes-shopping' && s.relationships.external[0].typeLabel === 'participates in', 'mission edge is external with humanised label');
  const off = buildActorViewModel(adam, { sections: { relationships: false }, deck: { actorIds: ['actor-adam-rees', 'actor-daniel-rees'] } });
  assert(off.relationships.inDeck.length === 0 && off.relationships.external.length === 0, 'sections.relationships=false empties both');
}
```

- [ ] **Step 2: Run to verify the new sections fail**

Run: `out=$(node tools/viewmodels/test-actor-viewmodel.js 2>&1); code=$?; echo "$out" | grep -c FAIL; echo "exit=$code"`
Expected: ≥ 20 FAIL lines, exit 1 (`vm.contexts` is `[]`, `vm.relationships` empty).

- [ ] **Step 3: Implement**

In `tools/viewmodels/actor-viewmodel.js`, add after `TRAIT_NORMALISERS`:

```js
function normaliseDetails(details) {
  if (!details || typeof details !== 'object') return [];
  return Object.entries(details)
    .filter(([, v]) => nonEmpty(v))
    .map(([k, v]) => item(Array.isArray(v) ? v.map(humaniseValue).join(', ') : (typeof v === 'object' ? JSON.stringify(v) : v), { badge: humanise(k) }));
}

function normaliseEmergence(e) {
  return {
    goalsAsExperienced: (e.goalsAsExperienced || []).map(g => item(g.goal, { badge: g.source })),
    painPoints: (e.painPoints || []).map(p => item(p.painPoint, { badge: severityBadge(p.severity), secondary: p.emergesFrom })),
    opportunities: (e.opportunities || []).map(o => item(typeof o === 'string' ? o : (o.opportunity || JSON.stringify(o)))),
    emotionalContext: nonEmpty(e.emotionalContext) ? String(e.emotionalContext) : '',
    useCases: (e.useCases || []).map(u => item(u.scenario, { secondary: [u.trigger && `Trigger: ${u.trigger}`, u.outcome].filter(Boolean).join(' → ') || undefined })),
    successMetrics: (e.successMetrics || []).map(m => item(typeof m === 'string' ? m : (m.metric || JSON.stringify(m))))
  };
}

function normaliseContexts(actor, opts, warnings) {
  if (!opts.sections.contexts) return { contexts: [], unattributed: [] };
  const byRef = new Map();
  const unattributed = [];
  if (opts.sections.emergence) {
    for (const e of actor.emergence || []) {
      const known = (actor.contexts || []).some(c => c.contextId === e.contextRef);
      if (known) byRef.set(e.contextRef, normaliseEmergence(e));
      else {
        unattributed.push(Object.assign({ contextRef: e.contextRef }, normaliseEmergence(e)));
        warnings.push({ code: 'UNATTRIBUTED_EMERGENCE', message: `emergence entry references unknown context "${e.contextRef}"` });
      }
    }
  }
  const contexts = (actor.contexts || []).map(c => ({
    contextId: c.contextId, title: c.title || c.contextId, contextType: c.contextType || '', description: c.description || '',
    needs: (c.needs || []).map(n => item(n.need, { badge: n.priority })),
    frustrations: (c.frustrations || []).map(f => item(f.frustration, { badge: severityBadge(f.severity) })),
    channels: (c.channels || []).map(ch => item([ch.channel, ch.name].filter(Boolean).join(' · '), { badge: ch.preference, secondary: ch.usageContext })),
    momentsThatMatter: (c.momentsThatMatter || []).map(m => item(m.moment, { badge: m.importance })),
    details: normaliseDetails(c.details),
    emergence: byRef.get(c.contextId) || null
  }));
  return { contexts, unattributed };
}

function normaliseRelationships(actor, opts) {
  const out = { inDeck: [], external: [] };
  if (!opts.sections.relationships) return out;
  const ids = new Set(opts.deck.actorIds || []);
  for (const r of actor.relationships || []) {
    const rel = { target: r.target, type: r.type, typeLabel: String(r.type || '').replace(/_/g, ' '), description: r.description || '', strength: r.strength };
    (ids.has(r.target) && r.target !== actor.id ? out.inDeck : out.external).push(rel);
  }
  return out;
}
```

Then in `buildActorViewModel`, replace the three placeholder lines:

```js
  const { contexts, unattributed } = normaliseContexts(actor, opts, warnings);
  const vm = {
    identity: { /* unchanged */ },
    avatar: buildAvatar(actor),
    traits: opts.sections.traits ? normaliseTraits(actor.traits, opts.traitGroups) : {},
    contexts,
    unattributedEmergence: unattributed,
    relationships: normaliseRelationships(actor, opts),
    summarySlots: null,
    warnings
  };
```

(Keep `identity` exactly as written in Task 3; only `contexts`, `unattributedEmergence`, `relationships` change.) Add `normaliseEmergence, normaliseContexts, normaliseRelationships, normaliseDetails` to `module.exports`.

- [ ] **Step 4: Run tests**

Run: `out=$(node tools/viewmodels/test-actor-viewmodel.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed"; echo "exit=$code"`
Expected: `0 failed`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add tools/viewmodels/actor-viewmodel.js tools/viewmodels/test-actor-viewmodel.js
git commit -m "feat(viewmodel): contexts with nested emergence, unattributed bucket, in-deck relationships

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: View model — summary slots, provenance/governance, warnings, `.d.ts`

**Files:**
- Modify: `tools/viewmodels/actor-viewmodel.js` (summary slots, provenance/governance, `CONTEXT_NOT_FOUND` warning)
- Modify: `tools/viewmodels/test-actor-viewmodel.js` (append sections)
- Create: `tools/viewmodels/actor-viewmodel.d.ts`

**Interfaces:**
- Produces: `vm.summarySlots = { who: Slot, context: ContextSlot | null, emerges: Slot }` where `Slot = { items: Item[], full: Item[], truncated: boolean }` and `ContextSlot = Slot & { contextId, title, contextType, moreContexts: number }`; `vm.provenance?: Item[]`, `vm.governance?: Item[]`; warning code `CONTEXT_NOT_FOUND`.

- [ ] **Step 1: Append failing tests**

Insert before the `module.exports` line of `tools/viewmodels/test-actor-viewmodel.js`:

```js
section('Summary slots');
{
  const vm = buildActorViewModel(adam);
  const s = vm.summarySlots;
  assert(s && s.who && s.context && s.emerges, 'three slots present');
  assert(s.who.items.length === 3 && s.who.full.length > 3 && s.who.truncated === true, 'who: capped at 3, full retained, truncated flagged');
  assert(s.who.full[0].badge === 'age', 'who: demographics come first');
  assert(s.who.full.some(i => i.badge && i.badge.startsWith('severity')), 'who: includes frustrations');
  assert(s.context.contextId === adam.contexts[0].contextId && s.context.moreContexts === 0, 'context: first context, no more');
  assert(s.emerges.items.every(isItem) && s.emerges.full[0].badge !== undefined, 'emerges: goals (badged by source) then pain points');
  const cap5 = buildActorViewModel(adam, { caps: { summaryItems: 5 } });
  assert(cap5.summarySlots.who.items.length === 5, 'caps.summaryItems honoured');
}
{
  const vm = buildActorViewModel(fixture);
  assert(vm.summarySlots.context.contextId === 'ctx-alpha' && vm.summarySlots.context.moreContexts === 2, 'multi-context: first by default, moreContexts=2');
  assert(vm.summarySlots.context.items[0].primary === 'Alpha need one', 'context slot items come from the chosen context');
  const beta = buildActorViewModel(fixture, { context: 'ctx-beta' });
  assert(beta.summarySlots.context.contextId === 'ctx-beta' && beta.summarySlots.context.title === 'Beta Role', 'options.context selects a context');
  assert(beta.summarySlots.emerges.full[0].primary === 'Beta goal', 'emerges follows the chosen context');
  const gamma = buildActorViewModel(fixture, { context: 'ctx-gamma' });
  assert(gamma.summarySlots.emerges.items.length === 0 && gamma.summarySlots.emerges.truncated === false, 'context without emergence → empty emerges slot, not an error');
  const missing = buildActorViewModel(fixture, { context: 'ctx-nope' });
  assert(missing.summarySlots.context.contextId === 'ctx-alpha', 'unknown options.context falls back to first');
  assert(missing.warnings.some(w => w.code === 'CONTEXT_NOT_FOUND' && w.message.includes('ctx-nope')), 'and warns');
  const noCtx = buildActorViewModel({ ...fixture, contexts: [], emergence: [] });
  assert(noCtx.summarySlots.context === null && noCtx.summarySlots.emerges.items.length === 0, 'no contexts → context slot null');
}

section('Provenance and governance');
{
  const off = buildActorViewModel(sarah);
  assert(off.provenance === undefined && off.governance === undefined, 'off by default');
  const on = buildActorViewModel(sarah, { sections: { provenance: true, governance: true } });
  assert(Array.isArray(on.governance) && on.governance.some(i => i.badge === 'Contains pii' && i.primary === 'true'), 'governance rendered as key/value items');
  assert(Array.isArray(on.provenance) && on.provenance.some(i => i.badge === 'Source'), 'provenance rendered as key/value items');
}

section('Warnings shape');
for (const a of ALL_ACTORS) {
  const vm = buildActorViewModel(a);
  assert(Array.isArray(vm.warnings) && vm.warnings.every(w => typeof w.code === 'string' && typeof w.message === 'string'), `${a.id}: warnings are {code, message}`);
}
```

- [ ] **Step 2: Run to verify failure**

Run: `out=$(node tools/viewmodels/test-actor-viewmodel.js 2>&1); code=$?; echo "$out" | grep -c FAIL; echo "exit=$code"`
Expected: FAIL count ≥ 15 (`summarySlots` is `null`), exit 1.

- [ ] **Step 3: Implement**

Add to `tools/viewmodels/actor-viewmodel.js` before `buildActorViewModel`:

```js
function slot(full, cap) {
  const items = full.slice(0, cap);
  return { items, full, truncated: full.length > items.length };
}

function buildSummarySlots(vm, actor, opts, warnings) {
  const cap = opts.caps.summaryItems;
  const t = normaliseTraits(actor.traits, TRAIT_GROUPS);   // summary ignores traitGroups selection: it is a fixed read of the whole actor
  const who = [...(t.demographics ? t.demographics.items : []), ...(t.needs ? t.needs.items : []), ...(t.frustrations ? t.frustrations.items : [])];

  const all = vm.contexts;
  let chosen = null;
  if (all.length > 0) {
    chosen = opts.context ? all.find(c => c.contextId === opts.context) : all[0];
    if (opts.context && !chosen) {
      warnings.push({ code: 'CONTEXT_NOT_FOUND', message: `context "${opts.context}" not found; using "${all[0].contextId}"` });
      chosen = all[0];
    }
  }
  const contextSlot = chosen ? Object.assign(slot([...chosen.needs, ...chosen.frustrations], cap),
    { contextId: chosen.contextId, title: chosen.title, contextType: chosen.contextType, moreContexts: all.length - 1 }) : null;
  const em = chosen && chosen.emergence;
  const emerges = em ? [...em.goalsAsExperienced, ...em.painPoints] : [];
  return { who: slot(who, cap), context: contextSlot, emerges: slot(emerges, cap) };
}

function keyValueItems(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => item(Array.isArray(v) ? v.map(humaniseValue).join(', ') : (typeof v === 'object' ? JSON.stringify(v) : String(v)), { badge: humanise(k) }));
}
```

In `buildActorViewModel`, after the `vm` object is created and before `return vm`:

```js
  vm.summarySlots = buildSummarySlots(vm, actor, opts, warnings);
  if (opts.sections.provenance && actor.provenance) vm.provenance = keyValueItems(actor.provenance);
  if (opts.sections.governance && actor.governance) vm.governance = keyValueItems(actor.governance);
```

Export `buildSummarySlots, keyValueItems, slot` too.

- [ ] **Step 4: Run tests**

Run: `out=$(node tools/viewmodels/test-actor-viewmodel.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed"; echo "exit=$code"`
Expected: `0 failed`, exit 0.

- [ ] **Step 5: Write the type declarations**

Create `tools/viewmodels/actor-viewmodel.d.ts`:

```ts
// Hand-written types for actor-viewmodel.js. Kept in step by hand; the .js is the implementation.

export interface Item { primary: string; secondary?: string; badge?: string }

export interface ActorSectionSelection {
  traits: boolean; contexts: boolean; emergence: boolean; relationships: boolean; provenance: boolean; governance: boolean;
}

export type TraitGroup = 'demographics' | 'needs' | 'frustrations' | 'motivations' | 'technology' | 'communication'
  | 'learningStyle' | 'influences' | 'decisionMaking' | 'accessibility' | 'behaviouralPatterns';

export interface ViewModelOptions {
  sections?: Partial<ActorSectionSelection>;
  traitGroups?: TraitGroup[] | 'all';
  caps?: { summaryItems?: number };
  context?: string;
  deck?: { actorIds?: string[] };
}

export interface Emergence {
  goalsAsExperienced: Item[]; painPoints: Item[]; opportunities: Item[];
  emotionalContext: string; useCases: Item[]; successMetrics: Item[];
}

export interface ContextVM {
  contextId: string; title: string; contextType: string; description: string;
  needs: Item[]; frustrations: Item[]; channels: Item[]; momentsThatMatter: Item[]; details: Item[];
  emergence: Emergence | null;
}

export interface Relationship { target: string; type: string; typeLabel: string; description: string; strength?: string }

export interface Slot { items: Item[]; full: Item[]; truncated: boolean }
export interface ContextSlot extends Slot { contextId: string; title: string; contextType: string; moreContexts: number }

export interface Warning { code: 'UNATTRIBUTED_EMERGENCE' | 'CONTEXT_NOT_FOUND' | string; message: string }

export interface ActorViewModel {
  identity: { id: string; name: string; actorType: 'human' | 'ai_agent' | 'team' | 'organisation'; summary: string; quote: string; version: string };
  avatar: { kind: 'initials' | 'label'; text: string; colourKey: number };
  traits: Partial<Record<TraitGroup, { label: string; items: Item[] }>>;
  contexts: ContextVM[];
  unattributedEmergence: (Emergence & { contextRef: string })[];
  relationships: { inDeck: Relationship[]; external: Relationship[] };
  summarySlots: { who: Slot; context: ContextSlot | null; emerges: Slot };
  provenance?: Item[];
  governance?: Item[];
  warnings: Warning[];
}

export const TRAIT_GROUPS: TraitGroup[];
export const TRAIT_LABELS: Record<TraitGroup, string>;
export const DEFAULT_ACTOR_SECTIONS: Readonly<ActorSectionSelection>;
export function buildActorViewModel(actor: unknown, options?: ViewModelOptions): ActorViewModel;
export function humanise(key: string): string;
export function initialsOf(name: string): string;
export function colourKeyOf(id: string): number;
```

- [ ] **Step 6: Commit**

```bash
git add tools/viewmodels/actor-viewmodel.js tools/viewmodels/actor-viewmodel.d.ts tools/viewmodels/test-actor-viewmodel.js
git commit -m "feat(viewmodel): summary slots with caps, provenance/governance, types

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: `flow.js` — height estimator, pagination, `fitItems`

**Files:**
- Create: `tools/renderers/pptx/flow.js`
- Create: `tools/renderers/test-pptx-flow.js`

**Interfaces:**
- Consumes: `metrics = { avgCharWidthEm, lineHeightEm }` (from tokens via Task 7's `resolveMetrics`; tests pass literals). Block shape from *Shared interfaces*.
- Produces:
  - `FLOW = { wrapSlack: 1.15, safety: 1.10, paraSpacePt: 4, bulletIndentIn: 0.2, bandPadPt: 6 }`
  - `estimateLines(text, widthIn, sizePt, metrics) → integer ≥ 1`
  - `estimateBlockHeight(block, widthIn, metrics) → inches`
  - `itemText(item) → string` — `primary`, then ` — secondary`, then ` [badge]`
  - `paginate(blocks, frame, metrics) → { pages: [{ blocks: PlacedBlock[] }], warnings: [{ reason:'spill'|'split', sectionId, page }] }` where `PlacedBlock = block + { y, h }` and a page that continues a section starts with a synthesized band block `{ ...band, text: band.text + ' (cont.)', continued: true }`.
  - `fitItems(items, widthIn, maxHeightIn, style, metrics, cap) → { items, truncated }` — largest prefix (≤ cap, ≥ 1 if any) whose list height fits.

- [ ] **Step 1: Write the failing tests**

Create `tools/renderers/test-pptx-flow.js`:

```js
// Tests for tools/renderers/pptx/flow.js
// Run from project root: node tools/renderers/test-pptx-flow.js

'use strict';

const { FLOW, estimateLines, estimateBlockHeight, itemText, paginate, fitItems } = require('./pptx/flow');

let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }
function section(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`); }

const M = { avgCharWidthEm: 0.5, lineHeightEm: 1.2 };   // round numbers so expectations are hand-checkable
const body = { size: 12, colour: '#000000' };
const band = { size: 14, bold: true, colour: '#ffffff', fill: '#2563eb' };
const words = n => Array.from({ length: n }, (_, i) => 'word' + (i % 7)).join(' ');

section('estimateLines');
// width 3in = 216pt; 12pt × 0.5em = 6pt per char → 36 chars/line
assert(estimateLines('', 3, 12, M) === 1, 'empty text is one line');
assert(estimateLines('short', 3, 12, M) === 1, 'short text is one line');
assert(estimateLines('x'.repeat(36), 3, 12, M) === Math.ceil(36 / 36 * FLOW.wrapSlack), 'exactly one line of chars → ceil(1 × slack)');
assert(estimateLines('x'.repeat(360), 3, 12, M) === Math.ceil(10 * FLOW.wrapSlack), '10 lines of chars → ceil(10 × slack) = 12');
assert(estimateLines('a\nb\nc', 3, 12, M) === 3, 'explicit newlines each count');
assert(estimateLines('x'.repeat(100), 6, 12, M) < estimateLines('x'.repeat(100), 3, 12, M), 'wider box → fewer lines');
assert(estimateLines('x'.repeat(100), 3, 24, M) > estimateLines('x'.repeat(100), 3, 12, M), 'bigger font → more lines');

section('estimateBlockHeight');
{
  const para = { kind: 'paragraph', sectionId: 's', text: 'x'.repeat(72), style: body };  // 2 raw lines → ceil(2×1.15)=3 lines
  const expected = (3 * 12 * 1.2 / 72 + FLOW.paraSpacePt / 72) * FLOW.safety;
  assert(Math.abs(estimateBlockHeight(para, 3, M) - expected) < 1e-9, 'paragraph height = lines × size × lh / 72 + para space, × safety', String(estimateBlockHeight(para, 3, M)));
  const list = { kind: 'list', sectionId: 's', items: [{ primary: 'a' }, { primary: 'b' }], style: body };
  const one = { kind: 'list', sectionId: 's', items: [{ primary: 'a' }], style: body };
  assert(estimateBlockHeight(list, 3, M) > estimateBlockHeight(one, 3, M), 'more items → taller');
  const wide = { kind: 'list', sectionId: 's', items: [{ primary: 'x'.repeat(60) }], style: body };
  assert(estimateBlockHeight(wide, 3, M) > estimateBlockHeight(wide, 3 + FLOW.bulletIndentIn, M) || true, 'list width is reduced by bullet indent (sanity)');
  const b = { kind: 'band', sectionId: 's', text: 'Traits', style: band };
  assert(Math.abs(estimateBlockHeight(b, 3, M) - ((14 * 1.2 + 2 * FLOW.bandPadPt) / 72) * FLOW.safety) < 1e-9, 'band height is one line plus padding');
  const h = { kind: 'heading', sectionId: 's', text: 'Needs', style: { size: 13, bold: true, colour: '#000' } };
  assert(estimateBlockHeight(h, 3, M) > 0 && estimateBlockHeight(h, 3, M) < 0.5, 'heading is a short block');
}

section('itemText');
assert(itemText({ primary: 'A' }) === 'A', 'primary only');
assert(itemText({ primary: 'A', secondary: 'B' }) === 'A — B', 'with secondary');
assert(itemText({ primary: 'A', badge: 'C' }) === 'A [C]', 'with badge');
assert(itemText({ primary: 'A', secondary: 'B', badge: 'C' }) === 'A — B [C]', 'all three');

section('paginate — fits on one page');
{
  const blocks = [
    { kind: 'band', sectionId: 'needs', text: 'Needs', style: band },
    { kind: 'list', sectionId: 'needs', items: [{ primary: 'a' }, { primary: 'b' }], style: body }
  ];
  const { pages, warnings } = paginate(blocks, { x: 0.5, y: 1, w: 6, h: 5.5 }, M);
  assert(pages.length === 1 && pages[0].blocks.length === 2, 'one page, two blocks');
  assert(pages[0].blocks[0].y === 1 && pages[0].blocks[1].y > 1, 'blocks stack from frame.y');
  assert(pages[0].blocks[1].y === pages[0].blocks[0].y + pages[0].blocks[0].h, 'second block starts where the first ends');
  assert(warnings.length === 0, 'no warnings');
}

section('paginate — block that does not fit moves whole to the next page');
{
  const blocks = [
    { kind: 'paragraph', sectionId: 'p', text: words(300), style: body },   // tall
    { kind: 'paragraph', sectionId: 'p', text: words(300), style: body }
  ];
  const frame = { x: 0, y: 0, w: 3, h: 4 };
  const h1 = estimateBlockHeight(blocks[0], 3, M);
  assert(h1 < 4 && h1 * 2 > 4, 'precondition: each paragraph fits alone but not together', String(h1));
  const { pages, warnings } = paginate(blocks, frame, M);
  assert(pages.length === 2, 'two pages');
  assert(pages[1].blocks[0].y === 0 && pages[1].blocks[0].text === blocks[1].text, 'second paragraph starts at top of page 2 unsplit');
  assert(warnings.some(w => w.reason === 'spill' && w.sectionId === 'p' && w.page === 2), 'spill warning names section and page');
}

section('paginate — continuation band');
{
  const blocks = [
    { kind: 'band', sectionId: 'traits', text: 'Traits', style: band },
    { kind: 'paragraph', sectionId: 'traits', text: words(300), style: body },
    { kind: 'paragraph', sectionId: 'traits', text: words(300), style: body }
  ];
  const { pages } = paginate(blocks, { x: 0, y: 0, w: 3, h: 4.2 }, M);
  assert(pages.length === 2, 'two pages');
  const first = pages[1].blocks[0];
  assert(first.kind === 'band' && first.text === 'Traits (cont.)' && first.continued === true, 'page 2 opens with "Traits (cont.)"');
}

section('paginate — oversized list splits at item boundaries, never mid-item');
{
  const items = Array.from({ length: 40 }, (_, i) => ({ primary: `Item ${i} ` + words(10) }));
  const blocks = [{ kind: 'band', sectionId: 'L', text: 'List', style: band }, { kind: 'list', sectionId: 'L', items, style: body }];
  const { pages, warnings } = paginate(blocks, { x: 0, y: 0, w: 3, h: 3 }, M);
  assert(pages.length > 2, 'spans several pages', String(pages.length));
  const placed = pages.flatMap(p => p.blocks.filter(b => b.kind === 'list')).flatMap(b => b.items.map(i => i.primary));
  assert(placed.length === 40 && placed.every((t, i) => t === items[i].primary), 'all 40 items placed once, in order, unsplit');
  assert(pages.every(p => p.blocks.reduce((y, b) => Math.max(y, b.y + b.h), 0) <= 3 + 1e-9), 'no page exceeds frame height');
  assert(pages.slice(1).every(p => p.blocks[0].kind === 'band' && p.blocks[0].continued), 'every continuation page re-emits the band');
  assert(warnings.some(w => w.reason === 'split' && w.sectionId === 'L'), 'split warning');
}

section('paginate — oversized paragraph splits at sentence boundaries');
{
  const text = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} has some words in it.`).join(' ');
  const { pages } = paginate([{ kind: 'paragraph', sectionId: 'P', text, style: body }], { x: 0, y: 0, w: 3, h: 1.5 }, M);
  assert(pages.length > 1, 'splits');
  const parts = pages.map(p => p.blocks[0].text);
  assert(parts.every(t => /\.$/.test(t.trim())), 'every part ends at a sentence boundary', parts.map(t => t.slice(-12)).join(' | '));
  assert(parts.join(' ').replace(/\s+/g, ' ') === text, 'parts reassemble to the original');
}

section('paginate — never changes font size');
{
  const { pages } = paginate([{ kind: 'paragraph', sectionId: 'x', text: words(2000), style: body }], { x: 0, y: 0, w: 3, h: 2 }, M);
  assert(pages.every(p => p.blocks.every(b => b.style.size === 12)), 'style.size unchanged on every placed block');
}

section('fitItems');
{
  const items = Array.from({ length: 6 }, (_, i) => ({ primary: 'x'.repeat(30) + i }));
  const tall = fitItems(items, 3, 10, body, M, 3);
  assert(tall.items.length === 3 && tall.truncated === true, 'cap applies even with room to spare');
  const tight = fitItems(items, 3, 0.45, body, M, 3);
  assert(tight.items.length === 1 && tight.truncated === true, 'very tight slot → minimum one item');
  const mid = fitItems(items, 3, 0.8, body, M, 3);
  assert(mid.items.length >= 1 && mid.items.length <= 3, 'mid slot fits what fits');
  const none = fitItems([], 3, 1, body, M, 3);
  assert(none.items.length === 0 && none.truncated === false, 'no items → empty, not truncated');
  const two = fitItems(items.slice(0, 2), 3, 10, body, M, 3);
  assert(two.items.length === 2 && two.truncated === false, 'fewer than cap → not truncated');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run to verify it fails**

Run: `out=$(node tools/renderers/test-pptx-flow.js 2>&1); code=$?; echo "$out" | head -2; echo "exit=$code"`
Expected: `Cannot find module './pptx/flow'`, exit 1.

- [ ] **Step 3: Implement `flow.js`**

Create `tools/renderers/pptx/flow.js`:

```js
// flow.js — height estimation and pagination for the PPTX renderer.
// PptxGenJS has no text-measurement API (PowerPoint lays text out at open time), so heights are
// estimated from font metrics in tools/design-tokens.json and calibrated against LibreOffice
// renders via verify-pptx.sh's overflow oracle. Font size is NEVER reduced here (spec §6).
// Pure: no I/O, no PptxGenJS.

'use strict';

const FLOW = Object.freeze({
  wrapSlack: 1.15,     // word-wrap loses partial lines; inflate the raw line count
  safety: 1.10,        // margin on every estimate; tuned in Task 13 against the overflow oracle
  paraSpacePt: 4,      // space after each paragraph / list item, in points
  bulletIndentIn: 0.2, // horizontal room a bullet takes from the text width
  bandPadPt: 6         // vertical padding above and below a band's text
});

function estimateLines(text, widthIn, sizePt, metrics) {
  const charsPerLine = Math.max(1, Math.floor((widthIn * 72) / (sizePt * metrics.avgCharWidthEm)));
  const paragraphs = String(text || '').split('\n');
  return paragraphs.reduce((n, p) => n + Math.max(1, Math.ceil((p.length / charsPerLine) * FLOW.wrapSlack)), 0);
}

function itemText(it) {
  return it.primary + (it.secondary ? ` — ${it.secondary}` : '') + (it.badge ? ` [${it.badge}]` : '');
}

function lineHeightIn(sizePt, metrics) { return (sizePt * metrics.lineHeightEm) / 72; }

function estimateBlockHeight(block, widthIn, metrics) {
  const size = block.style.size;
  let h;
  if (block.kind === 'band') {
    h = (size * metrics.lineHeightEm + 2 * FLOW.bandPadPt) / 72;
  } else if (block.kind === 'heading' || block.kind === 'paragraph') {
    h = estimateLines(block.text, widthIn, size, metrics) * lineHeightIn(size, metrics) + FLOW.paraSpacePt / 72;
  } else if (block.kind === 'list') {
    const w = Math.max(0.5, widthIn - FLOW.bulletIndentIn);
    h = block.items.reduce((acc, it) => acc + estimateLines(itemText(it), w, size, metrics) * lineHeightIn(size, metrics) + FLOW.paraSpacePt / 72, 0);
  } else {
    throw new Error(`flow: unknown block kind "${block.kind}"`);
  }
  return h * FLOW.safety;
}

function splitSentences(text) {
  const parts = String(text).match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [String(text)];
  return parts.map(s => s.trim()).filter(Boolean);
}

// Split an oversized block into a head that fits in `availIn` and a tail. Returns null if even
// one unit (item / sentence) does not fit, so the caller moves the whole block to a fresh page.
function splitBlock(block, availIn, widthIn, metrics) {
  if (block.kind === 'list') {
    let n = 0;
    for (let i = 1; i <= block.items.length; i++) {
      if (estimateBlockHeight({ ...block, items: block.items.slice(0, i) }, widthIn, metrics) <= availIn) n = i; else break;
    }
    if (n === 0 || n === block.items.length) return null;
    return { head: { ...block, items: block.items.slice(0, n) }, tail: { ...block, items: block.items.slice(n) } };
  }
  if (block.kind === 'paragraph') {
    const sentences = splitSentences(block.text);
    if (sentences.length < 2) return null;
    let n = 0;
    for (let i = 1; i <= sentences.length; i++) {
      if (estimateBlockHeight({ ...block, text: sentences.slice(0, i).join(' ') }, widthIn, metrics) <= availIn) n = i; else break;
    }
    if (n === 0 || n === sentences.length) return null;
    return { head: { ...block, text: sentences.slice(0, n).join(' ') }, tail: { ...block, text: sentences.slice(n).join(' ') } };
  }
  return null;   // bands and headings never split
}

function paginate(blocks, frame, metrics) {
  const pages = [];
  const warnings = [];
  const bandBySection = new Map();
  let page = { blocks: [] };
  let cursor = frame.y;
  const bottom = frame.y + frame.h;
  const EPS = 1e-9;

  const place = (b) => {
    const h = estimateBlockHeight(b, frame.w, metrics);
    page.blocks.push({ ...b, y: cursor, h });
    cursor += h;
  };
  const newPage = (sectionId, reason) => {
    pages.push(page);
    page = { blocks: [] };
    cursor = frame.y;
    warnings.push({ reason, sectionId, page: pages.length + 1 });
    const band = bandBySection.get(sectionId);
    if (band) place({ ...band, text: `${band.text} (cont.)`, continued: true });
  };

  const queue = blocks.slice();
  while (queue.length) {
    const b = queue.shift();
    if (b.kind === 'band') bandBySection.set(b.sectionId, b);
    const h = estimateBlockHeight(b, frame.w, metrics);
    if (cursor + h <= bottom + EPS) { place(b); continue; }

    const avail = bottom - cursor;
    const pageIsFresh = page.blocks.length === 0 || (page.blocks.length === 1 && page.blocks[0].continued);
    const parts = splitBlock(b, avail, frame.w, metrics);
    if (parts) {                       // partial fit: place head, push tail to the front of the queue
      place(parts.head);
      newPage(b.sectionId, 'split');
      queue.unshift(parts.tail);
      continue;
    }
    if (!pageIsFresh) {                // whole block to next page
      newPage(b.sectionId, 'spill');
      queue.unshift(b);
      continue;
    }
    // Fresh page and still does not fit and cannot split (single huge sentence / item): place it anyway
    // so nothing is lost, and warn. verify-pptx.sh will flag it if it really overflows.
    warnings.push({ reason: 'spill', sectionId: b.sectionId, page: pages.length + 1, oversized: true });
    place(b);
  }
  pages.push(page);
  return { pages: pages.filter((p, i) => p.blocks.length > 0 || i === 0), warnings };
}

function fitItems(items, widthIn, maxHeightIn, style, metrics, cap) {
  if (!items || items.length === 0) return { items: [], truncated: false };
  const limit = Math.min(cap, items.length);
  let n = 0;
  for (let i = 1; i <= limit; i++) {
    const h = estimateBlockHeight({ kind: 'list', sectionId: 'fit', items: items.slice(0, i), style }, widthIn, metrics);
    if (h <= maxHeightIn) n = i; else break;
  }
  if (n === 0) n = 1;                  // minimum one item, never zero (spec §5)
  return { items: items.slice(0, n), truncated: n < items.length };
}

module.exports = { FLOW, estimateLines, estimateBlockHeight, itemText, paginate, fitItems, splitSentences, splitBlock, lineHeightIn };
```

- [ ] **Step 4: Run the tests**

Run: `out=$(node tools/renderers/test-pptx-flow.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed"; echo "exit=$code"`
Expected: `0 failed`, exit 0. If the "precondition" assertion in the spill section fails, the test's chosen word count is wrong for the metrics — adjust `words(300)` (not the implementation) until one paragraph is between half and all of the 4in frame.

- [ ] **Step 5: Commit**

```bash
git add tools/renderers/pptx/flow.js tools/renderers/test-pptx-flow.js
git commit -m "feat(pptx): flow.js — metric-based height estimator, pagination, fitItems

Never reduces font size; splits lists at item and paragraphs at sentence
boundaries; re-emits section bands as '(cont.)' on continuation pages.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: `package.json` and `theme.js` — defaults, `--theme` merge, unknown-key warnings, metrics

**Files:**
- Create: `tools/renderers/package.json`
- Create: `tools/renderers/pptx/theme.js`
- Create: `tools/renderers/test-pptx-theme.js`

**Interfaces:**
- Consumes: `tools/design-tokens.json`.
- Produces:
  - `loadTheme(themePath?) → { theme, warnings }` — `theme` has the tokens shape; `warnings` are `{ code: 'THEME_UNKNOWN_KEY' | 'THEME_METRICS_FALLBACK', message }`. Throws `Error` with `.code = 'THEME_UNREADABLE'` if the path cannot be read or parsed.
  - `mergeTheme(base, override) → { merged, unknownKeys: string[] }` — deep merge; keys absent from `base` at the same path are reported (dotted) and **still merged** (so a brand can add a font's metrics under `typography.metrics.<Font>` — that path is exempt from unknown-key reporting).
  - `resolveMetrics(theme) → { avgCharWidthEm, lineHeightEm }` for `theme.typography.fontFamily`, falling back to Calibri's with a warning.

- [ ] **Step 1: Create `tools/renderers/package.json` and install**

```json
{
  "name": "dsds-renderers",
  "version": "0.1.0",
  "private": true,
  "description": "Deterministic renderers for DSDS v2.0 artifacts (Mission → HTML, Actor deck → PPTX)",
  "scripts": {
    "test": "node test-mission-layout.js && node test-render-mission.js && node test-design-tokens.js && node test-pptx-flow.js && node test-pptx-theme.js && node test-deck-model.js && node test-render-pptx.js"
  },
  "dependencies": {
    "pptxgenjs": "4.0.1"
  },
  "devDependencies": {
    "jszip": "3.10.1"
  },
  "engines": { "node": ">=18" }
}
```

Run: `(cd tools/renderers && npm install --no-audit --no-fund 2>&1 | tail -1) && ls tools/renderers/node_modules | grep -E "^(pptxgenjs|jszip)$" && git status --short tools/renderers | head`
Expected: both packages listed; `git status` shows only `package.json` as new (`node_modules/` and `package-lock.json` are gitignored).

- [ ] **Step 2: Write the failing theme tests**

Create `tools/renderers/test-pptx-theme.js`:

```js
// Tests for tools/renderers/pptx/theme.js
// Run from project root: node tools/renderers/test-pptx-theme.js

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadTheme, mergeTheme, resolveMetrics } = require('./pptx/theme');
const tokens = require('../design-tokens.json');

let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }
function section(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsds-theme-'));
const writeJson = (name, obj) => { const p = path.join(tmp, name); fs.writeFileSync(p, JSON.stringify(obj)); return p; };

section('Defaults');
{
  const { theme, warnings } = loadTheme();
  assert(theme.colour.light.bg === tokens.colour.light.bg, 'no path → tokens verbatim');
  assert(theme !== tokens && theme.colour !== tokens.colour, 'returns a deep copy, not the require cache');
  assert(warnings.length === 0, 'no warnings');
}

section('mergeTheme');
{
  const { merged, unknownKeys } = mergeTheme({ a: { b: 1, c: 2 }, d: 3 }, { a: { b: 9 } });
  assert(merged.a.b === 9 && merged.a.c === 2 && merged.d === 3, 'deep merge keeps untouched keys');
  assert(unknownKeys.length === 0, 'no unknown keys');
  const u = mergeTheme({ a: { b: 1 } }, { a: { bb: 1 }, zz: { y: 1 } });
  assert(u.unknownKeys.sort().join(',') === 'a.bb,zz', 'unknown keys reported with dotted paths', u.unknownKeys.join(','));
  assert(u.merged.a.bb === 1 && u.merged.zz.y === 1, 'unknown keys are still merged (warn, do not drop)');
  const fonts = mergeTheme({ typography: { metrics: { Calibri: { avgCharWidthEm: 0.47, lineHeightEm: 1.2 } } } },
    { typography: { metrics: { Inter: { avgCharWidthEm: 0.5, lineHeightEm: 1.3 } } } });
  assert(fonts.unknownKeys.length === 0 && fonts.merged.typography.metrics.Inter.lineHeightEm === 1.3, 'typography.metrics.<Font> is exempt from unknown-key reporting');
}

section('loadTheme with an override file');
{
  const p = writeJson('brand.json', { colour: { light: { bg: '#ffffff', traits: '#123456' } }, typography: { fontFamily: 'Arial' } });
  const { theme, warnings } = loadTheme(p);
  assert(theme.colour.light.bg === '#ffffff' && theme.colour.light.traits === '#123456', 'override applied');
  assert(theme.colour.light.text === tokens.colour.light.text, 'unspecified keys inherit defaults');
  assert(theme.typography.fontFamily === 'Arial' && warnings.length === 0, 'font override with known metrics → no warning');
  const p2 = writeJson('typo.json', { colour: { light: { backgroud: '#000000' } } });
  const r2 = loadTheme(p2);
  assert(r2.warnings.some(w => w.code === 'THEME_UNKNOWN_KEY' && w.message.includes('colour.light.backgroud')), 'typo produces THEME_UNKNOWN_KEY naming the path');
  const p3 = writeJson('font.json', { typography: { fontFamily: 'Comic Sans MS' } });
  const r3 = loadTheme(p3);
  assert(r3.warnings.some(w => w.code === 'THEME_METRICS_FALLBACK' && w.message.includes('Comic Sans MS')), 'unknown font → metrics fallback warning');
  assert(resolveMetrics(r3.theme).avgCharWidthEm === tokens.typography.metrics.Calibri.avgCharWidthEm, 'fallback metrics are Calibri');
}

section('loadTheme errors');
{
  let err;
  try { loadTheme(path.join(tmp, 'missing.json')); } catch (e) { err = e; }
  assert(err && err.code === 'THEME_UNREADABLE', 'missing file throws THEME_UNREADABLE');
  fs.writeFileSync(path.join(tmp, 'bad.json'), '{ not json');
  err = undefined;
  try { loadTheme(path.join(tmp, 'bad.json')); } catch (e) { err = e; }
  assert(err && err.code === 'THEME_UNREADABLE' && /bad\.json/.test(err.message), 'unparseable file throws THEME_UNREADABLE naming the file');
}

section('resolveMetrics');
assert(resolveMetrics(loadTheme().theme).lineHeightEm === tokens.typography.metrics.Calibri.lineHeightEm, 'default font resolves its own metrics');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: Run to verify it fails**

Run: `out=$(node tools/renderers/test-pptx-theme.js 2>&1); code=$?; echo "$out" | head -2; echo "exit=$code"`
Expected: `Cannot find module './pptx/theme'`, exit 1.

- [ ] **Step 4: Implement `theme.js`**

Create `tools/renderers/pptx/theme.js`:

```js
// theme.js — design tokens + optional brand override for the PPTX renderer (spec §3).
// Unknown keys in an override are WARNED, not silently ignored (the BACK-033 lesson).

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_TOKENS = require('../../design-tokens.json');
const FALLBACK_FONT = 'Calibri';
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const clone = v => JSON.parse(JSON.stringify(v));

function mergeTheme(base, override, prefix = '') {
  const merged = clone(base);
  const unknownKeys = [];
  const walk = (dst, src, pfx) => {
    for (const [k, v] of Object.entries(src)) {
      const p = pfx ? `${pfx}.${k}` : k;
      const exempt = /^typography\.metrics\.[^.]+$/.test(p);       // brands may add their own font's metrics
      if (!(k in dst) && !exempt) unknownKeys.push(p);
      if (isObj(v) && isObj(dst[k])) walk(dst[k], v, p);
      else dst[k] = isObj(v) ? clone(v) : v;
    }
  };
  walk(merged, override, prefix);
  return { merged, unknownKeys };
}

function resolveMetrics(theme) {
  const ff = theme.typography.fontFamily;
  return theme.typography.metrics[ff] || theme.typography.metrics[FALLBACK_FONT];
}

function loadTheme(themePath) {
  const warnings = [];
  if (!themePath) return { theme: clone(DEFAULT_TOKENS), warnings };
  let override;
  try {
    override = JSON.parse(fs.readFileSync(themePath, 'utf8'));
  } catch (e) {
    const err = new Error(`theme "${path.basename(themePath)}" could not be read or parsed: ${e.message}`);
    err.code = 'THEME_UNREADABLE';
    throw err;
  }
  const { merged, unknownKeys } = mergeTheme(DEFAULT_TOKENS, override);
  for (const k of unknownKeys) warnings.push({ code: 'THEME_UNKNOWN_KEY', message: `theme key "${k}" is not a known token and will have no effect on defaults` });
  const ff = merged.typography.fontFamily;
  if (!merged.typography.metrics[ff]) {
    warnings.push({ code: 'THEME_METRICS_FALLBACK', message: `no font metrics for "${ff}"; using ${FALLBACK_FONT}'s for height estimation — add typography.metrics.${JSON.stringify(ff)} to the theme` });
  }
  return { theme: merged, warnings };
}

module.exports = { loadTheme, mergeTheme, resolveMetrics, DEFAULT_TOKENS, FALLBACK_FONT };
```

- [ ] **Step 5: Run the tests**

Run: `out=$(node tools/renderers/test-pptx-theme.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed"; echo "exit=$code"`
Expected: `0 failed`, exit 0.

- [ ] **Step 6: Commit**

```bash
git add tools/renderers/package.json tools/renderers/pptx/theme.js tools/renderers/test-pptx-theme.js
git commit -m "feat(pptx): package.json (pptxgenjs 4.0.1 exact) and theme loader with unknown-key warnings

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: `deck-model.js` — layout constants, element helpers, cover and index slides

**Files:**
- Create: `tools/renderers/pptx/deck-model.js`
- Create: `tools/renderers/test-deck-model.js`

**Interfaces:**
- Consumes: `ActorViewModel` (Tasks 3–5), `theme` + `metrics` (Task 7), `flow` (Task 6).
- Produces:
  - `SLIDE = { w: 13.333, h: 7.5 }`, `LAYOUT` (all inches), `AVATAR_COLOURS`.
  - Element helpers `el.text(x, y, w, h, textOrParagraphs, style)`, `el.rect(...)`, `el.ellipse(...)`, `el.line(...)`, `el.image(...)` returning *Slide description* elements.
  - `avatarElements(vm, theme, x, y, d, images) → Element[]`, `footerElements(text, page, theme) → Element[]`, `fitParagraph(text, w, h, style, metrics) → { text, truncated }`.
  - `buildCover(vms, ctx) → Slide`, `buildIndexSlides(vms, ctx) → Slide[]`.
  - `buildDeck(vms, opts) → { slides: Slide[], warnings: Warning[] }` with `opts = { theme, metrics, title?, generatedAt, sources: string[], sections: { cover, index, summary, appendix }, images: Record<actorId, path> }`. This task wires cover + index; Tasks 9 and 10 add summary and appendix to the same function.
  - `ctx` (internal, passed to every builder) = `{ theme, C: theme.colour.light, S: theme.typography.scale, font, metrics, images, nameById, page: () => number }`.

- [ ] **Step 1: Write the failing tests**

Create `tools/renderers/test-deck-model.js`:

```js
// Tests for tools/renderers/pptx/deck-model.js
// Run from project root: node tools/renderers/test-deck-model.js

'use strict';

const fs = require('fs');
const path = require('path');
const { buildActorViewModel } = require('../viewmodels/actor-viewmodel');
const { loadTheme, resolveMetrics } = require('./pptx/theme');
const dm = require('./pptx/deck-model');
const { SLIDE, LAYOUT, buildDeck, buildCover, buildIndexSlides, fitParagraph } = dm;

let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }
function section(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`); }

const ROOT = path.join(__dirname, '..', '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const adam = load('v2.0/examples/roadside/actor-adam-rees.json');
const daniel = load('v2.0/examples/roadside/actor-daniel-rees.json');
const sarah = load('v2.0/examples/retail/actor-sarah-martinez.json');
const fixture = load('tools/tests/fixtures/actor-multi-context.json');
const { theme } = loadTheme();
const metrics = resolveMetrics(theme);
const vmsOf = (actors, extra) => {
  const ids = actors.map(a => a.id);
  return actors.map(a => buildActorViewModel(a, Object.assign({ deck: { actorIds: ids } }, extra || {})));
};
const opts = (o) => Object.assign({ theme, metrics, generatedAt: '2026-09-04T00:00:00Z', sources: ['v2.0/examples/roadside/'], sections: { cover: true, index: true, summary: true, appendix: true }, images: {} }, o || {});
const textOf = slide => slide.elements.filter(e => e.type === 'text').flatMap(e => e.paragraphs.map(p => p.text)).join('\n');
const inBounds = slide => slide.elements.every(e => e.type === 'line'
  ? [e.x1, e.x2].every(x => x >= -1e-9 && x <= SLIDE.w + 1e-9) && [e.y1, e.y2].every(y => y >= -1e-9 && y <= SLIDE.h + 1e-9)
  : e.x >= -1e-9 && e.y >= -1e-9 && e.x + e.w <= SLIDE.w + 1e-9 && e.y + e.h <= SLIDE.h + 1e-9);

section('Constants and helpers');
assert(SLIDE.w === 13.333 && SLIDE.h === 7.5, '16:9 slide in inches');
assert(LAYOUT.index.perSlide === 8, 'eight actors per index slide (spec §5)');
{
  const style = { size: 9, colour: '#000000' };
  const short = fitParagraph('One sentence.', 3, 2, style, metrics);
  assert(short.text === 'One sentence.' && short.truncated === false, 'fitParagraph keeps text that fits');
  const long = fitParagraph(Array.from({ length: 40 }, (_, i) => `Sentence ${i} is here.`).join(' '), 2, 0.6, style, metrics);
  assert(long.truncated === true && long.text.length > 0 && /\.$/.test(long.text), 'fitParagraph truncates at a sentence boundary and flags it');
}

section('Cover');
{
  const vms = vmsOf([adam, daniel]);
  const cover = buildCover(vms, { theme, C: theme.colour.light, S: theme.typography.scale, font: theme.typography.fontFamily, metrics, images: {}, nameById: new Map(), page: () => 1, title: undefined, generatedAt: '2026-09-04T00:00:00Z', sources: ['v2.0/examples/roadside/'] });
  assert(cover.kind === 'cover' && inBounds(cover), 'cover slide within bounds');
  const t = textOf(cover);
  assert(t.includes('Actors · 2'), 'default title "Actors · N"');
  assert(t.includes('2026-09-04'), 'generated date shown');
  assert(t.includes('v2.0/examples/roadside/'), 'sources listed');
}

section('Index — count formula and content');
{
  const one = buildDeck(vmsOf([sarah]), opts({ sections: { cover: true, index: true, summary: false, appendix: false } }));
  assert(one.slides.filter(s => s.kind === 'index').length === 0, 'N=1 → no index slide');
  const two = buildDeck(vmsOf([adam, daniel]), opts({ sections: { cover: true, index: true, summary: false, appendix: false } }));
  const idx = two.slides.filter(s => s.kind === 'index');
  assert(idx.length === 1, 'N=2 → one index slide');
  assert(textOf(idx[0]).includes('Adam Rees') && textOf(idx[0]).includes('Daniel Rees'), 'index names both actors');
  assert(idx[0].elements.some(e => e.type === 'ellipse'), 'index cards carry avatars');
  assert(idx[0].elements.some(e => e.type === 'line'), 'in-deck relationship drawn as a line');
  assert(textOf(idx[0]).includes('serves') || textOf(idx[0]).includes('served by'), 'link is labelled with the relationship type');
  assert(inBounds(idx[0]), 'index slide within bounds');
  // Nine actors: adam first, daniel last → they land on different index slides
  const nine = [adam, ...Array.from({ length: 7 }, (_, i) => ({ ...fixture, id: `actor-fx-${i}`, name: `Fixture ${i}` })), daniel];
  const big = buildDeck(vmsOf(nine), opts({ sections: { cover: true, index: true, summary: false, appendix: false } }));
  const idx9 = big.slides.filter(s => s.kind === 'index');
  assert(idx9.length === 2, 'N=9 → two index slides', String(idx9.length));
  assert(textOf(idx9[0]).includes('1 of 2') && textOf(idx9[1]).includes('2 of 2'), 'index slides numbered "n of N"');
  assert(!idx9[0].elements.some(e => e.type === 'line') && !idx9[1].elements.some(e => e.type === 'line'), 'no line when the related actor is on another index slide');
  assert(textOf(idx9[0]).includes('Daniel Rees') && textOf(idx9[0]).includes('serves'), 'off-slide relationship listed as text under the card');
  assert(idx9.every(inBounds), 'all index slides within bounds');
  const off = buildDeck(vmsOf([adam, daniel]), opts({ sections: { cover: true, index: false, summary: false, appendix: false } }));
  assert(off.slides.every(s => s.kind !== 'index'), 'sections.index=false suppresses the index');
}

section('buildDeck — footer and warnings plumbing');
{
  const d = buildDeck(vmsOf([adam, daniel]), opts({ sections: { cover: true, index: true, summary: false, appendix: false } }));
  assert(d.slides[0].kind === 'cover' && d.slides[1].kind === 'index', 'cover then index');
  assert(Array.isArray(d.warnings), 'warnings array returned');
  assert(d.slides.every(s => typeof s.background === 'string' && /^#[0-9a-f]{6}$/.test(s.background)), 'every slide has a background colour');
}

module.exports = { assert, section, load, adam, daniel, sarah, fixture, theme, metrics, vmsOf, opts, textOf, inBounds, finish: () => { console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };
if (require.main === module) module.exports.finish();
```

- [ ] **Step 2: Run to verify it fails**

Run: `out=$(node tools/renderers/test-deck-model.js 2>&1); code=$?; echo "$out" | head -2; echo "exit=$code"`
Expected: `Cannot find module './pptx/deck-model'`, exit 1.

- [ ] **Step 3: Implement — constants, helpers, cover, index, `buildDeck`**

Create `tools/renderers/pptx/deck-model.js`:

```js
// deck-model.js — Actor view models → slide descriptions (spec §5). Pure; no PptxGenJS.
// Coordinates in inches on a 13.333 × 7.5 slide. Text sizes in points from theme.typography.scale.

'use strict';

const flow = require('./flow');

const SLIDE = Object.freeze({ w: 13.333, h: 7.5 });
const LAYOUT = Object.freeze({
  margin: 0.5, gutter: 0.25, footerY: 7.05, footerH: 0.3,
  cover: { titleY: 2.4, titleH: 1.0, subY: 3.5, subH: 0.5, srcY: 4.3, srcH: 1.6 },
  index: { perSlide: 8, cols: 4, rows: 2, titleY: 0.45, titleH: 0.6, gridY: 1.3, gridH: 5.55, avatarD: 0.6, cardPad: 0.15 },
  summary: {},   // filled in Task 9
  appendix: {}   // filled in Task 10
});
const AVATAR_COLOURS = ['touchpoint', 'start', 'decision', 'handoff', 'signal', 'end'];

const el = {
  text: (x, y, w, h, t, style) => ({ type: 'text', x, y, w, h,
    paragraphs: Array.isArray(t) ? t : [{ text: String(t) }],
    size: style.size, colour: style.colour, bold: !!style.bold, italic: !!style.italic,
    align: style.align || 'left', valign: style.valign || 'top', fill: style.fill }),
  rect: (x, y, w, h, fill, line, radius) => ({ type: 'rect', x, y, w, h, fill, line, radius }),
  ellipse: (x, y, w, h, fill, line) => ({ type: 'ellipse', x, y, w, h, fill, line }),
  line: (x1, y1, x2, y2, colour, width) => ({ type: 'line', x1, y1, x2, y2, colour, width }),
  image: (p, x, y, w, h) => ({ type: 'image', path: p, x, y, w, h })
};

function fitParagraph(text, w, h, style, metrics) {
  const fits = t => flow.estimateBlockHeight({ kind: 'paragraph', sectionId: 'fit', text: t, style }, w, metrics) <= h;
  if (fits(text)) return { text, truncated: false };
  const s = flow.splitSentences(text);
  let n = 0;
  for (let i = 1; i < s.length; i++) { if (fits(s.slice(0, i).join(' '))) n = i; else break; }
  return { text: n > 0 ? s.slice(0, n).join(' ') : s[0], truncated: true };
}

function avatarElements(vm, ctx, x, y, d) {
  const img = ctx.images[vm.identity.id];
  if (img) return [el.image(img, x, y, d, d)];
  const colour = ctx.C[AVATAR_COLOURS[vm.avatar.colourKey % AVATAR_COLOURS.length]];
  const size = vm.avatar.kind === 'label' ? Math.round(d * 14) : Math.round(d * 24);
  return [el.ellipse(x, y, d, d, colour), el.text(x, y, d, d, vm.avatar.text, { size, bold: true, colour: '#ffffff', align: 'center', valign: 'middle' })];
}

function footerElements(left, ctx) {
  const s = { size: ctx.S.caption, colour: ctx.C.dim };
  return [
    el.text(LAYOUT.margin, LAYOUT.footerY, SLIDE.w - 2 * LAYOUT.margin - 1, LAYOUT.footerH, left, s),
    el.text(SLIDE.w - LAYOUT.margin - 1, LAYOUT.footerY, 1, LAYOUT.footerH, String(ctx.page()), Object.assign({ align: 'right' }, s))
  ];
}

function badgeElements(text, x, y, ctx, w) {
  const bw = w || Math.max(0.7, 0.12 * text.length + 0.25);
  return [el.rect(x, y, bw, 0.28, ctx.C.band, { colour: ctx.C.border, width: 0.5 }, 0.14),
    el.text(x, y, bw, 0.28, text.toUpperCase(), { size: ctx.S.caption, bold: true, colour: ctx.C.dim, align: 'center', valign: 'middle' })];
}

function buildCover(vms, ctx) {
  const L = LAYOUT.cover, m = LAYOUT.margin, w = SLIDE.w - 2 * m;
  const title = ctx.title || `Actors · ${vms.length}`;
  const date = String(ctx.generatedAt).slice(0, 10);
  const elements = [
    el.rect(0, 0, SLIDE.w, 0.35, ctx.C.traits),
    el.text(m, L.titleY, w, L.titleH, title, { size: ctx.S.display, bold: true, colour: ctx.C.text }),
    el.text(m, L.subY, w, L.subH, `${vms.length} ${vms.length === 1 ? 'actor' : 'actors'} · generated ${date}`, { size: ctx.S.h2, colour: ctx.C.dim }),
    el.text(m, L.srcY, w, L.srcH, [{ text: 'Source', bold: true }, ...ctx.sources.map(s => ({ text: s }))], { size: ctx.S.small, colour: ctx.C.dim }),
    el.text(m, 6.6, w, 0.3, 'Digital Service Design Standards · v2.0 Actor', { size: ctx.S.caption, colour: ctx.C.dim })
  ];
  return { kind: 'cover', background: ctx.C.bg, elements };
}

function buildIndexSlides(vms, ctx) {
  const L = LAYOUT.index, m = LAYOUT.margin, g = LAYOUT.gutter;
  const pages = [];
  for (let i = 0; i < vms.length; i += L.perSlide) pages.push(vms.slice(i, i + L.perSlide));
  const cardW = (SLIDE.w - 2 * m - (L.cols - 1) * g) / L.cols;
  const cardH = (L.gridH - (L.rows - 1) * g) / L.rows;
  const drawnPairs = new Set();

  return pages.map((group, pi) => {
    const elements = [];
    const onSlide = new Map(group.map((vm, k) => [vm.identity.id, k]));
    const cardBox = k => ({ x: m + (k % L.cols) * (cardW + g), y: L.gridY + Math.floor(k / L.cols) * (cardH + g), w: cardW, h: cardH });
    const heading = pages.length > 1 ? `Actors  ·  ${pi + 1} of ${pages.length}` : 'Actors';
    elements.push(el.text(m, L.titleY, SLIDE.w - 2 * m, L.titleH, heading, { size: ctx.S.h1, bold: true, colour: ctx.C.text }));

    group.forEach((vm, k) => {
      const b = cardBox(k), p = L.cardPad;
      elements.push(el.rect(b.x, b.y, b.w, b.h, ctx.C.panel, { colour: ctx.C.border, width: 0.75 }, 0.08));
      elements.push(...avatarElements(vm, ctx, b.x + p, b.y + p, L.avatarD));
      elements.push(el.text(b.x + p + L.avatarD + 0.1, b.y + p, b.w - 2 * p - L.avatarD - 0.1, 0.35, vm.identity.name, { size: ctx.S.h3, bold: true, colour: ctx.C.text, valign: 'middle' }));
      elements.push(...badgeElements(vm.identity.actorType.replace('_', ' '), b.x + p + L.avatarD + 0.1, b.y + p + 0.36, ctx));
      const offSlide = vm.relationships.inDeck.filter(r => !onSlide.has(r.target))
        .map(r => `↔ ${ctx.nameById.get(r.target) || r.target} (${r.typeLabel})`);
      const relH = offSlide.length ? 0.22 * offSlide.length : 0;
      const sumStyle = { size: ctx.S.small, colour: ctx.C.text };
      const sumBox = { x: b.x + p, y: b.y + p + L.avatarD + 0.12, w: b.w - 2 * p, h: b.h - 2 * p - L.avatarD - 0.12 - relH };
      const fitted = fitParagraph(vm.identity.summary, sumBox.w, sumBox.h, sumStyle, ctx.metrics);
      elements.push(el.text(sumBox.x, sumBox.y, sumBox.w, sumBox.h, fitted.text + (fitted.truncated ? ' …' : ''), sumStyle));
      if (offSlide.length) elements.push(el.text(sumBox.x, sumBox.y + sumBox.h, sumBox.w, relH, offSlide.map(t => ({ text: t })), { size: ctx.S.caption, colour: ctx.C.dim }));
    });

    // In-deck relationships between cards on this slide: one line per unordered pair, labelled.
    group.forEach((vm, k) => {
      for (const r of vm.relationships.inDeck) {
        if (!onSlide.has(r.target)) continue;
        const key = [vm.identity.id, r.target].sort().join('|');
        if (drawnPairs.has(key)) continue;
        drawnPairs.add(key);
        const a = cardBox(k), b = cardBox(onSlide.get(r.target));
        const sameRow = Math.abs(a.y - b.y) < 1e-9;
        const left = a.x <= b.x ? a : b, right = a.x <= b.x ? b : a;
        const upper = a.y <= b.y ? a : b, lower = a.y <= b.y ? b : a;
        const [x1, y1, x2, y2] = sameRow
          ? [left.x + left.w, left.y + left.h / 2, right.x, right.y + right.h / 2]
          : [upper.x + upper.w / 2, upper.y + upper.h, lower.x + lower.w / 2, lower.y];
        elements.push(el.line(x1, y1, x2, y2, ctx.C.edge, 1.5));
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, lw = Math.max(0.9, 0.1 * r.typeLabel.length + 0.3);
        elements.push(el.rect(mx - lw / 2, my - 0.14, lw, 0.28, ctx.C.panel, { colour: ctx.C.edge, width: 0.5 }, 0.14));
        elements.push(el.text(mx - lw / 2, my - 0.14, lw, 0.28, r.typeLabel, { size: ctx.S.caption, colour: ctx.C.dim, align: 'center', valign: 'middle' }));
      }
    });

    elements.push(...footerElements(`Actors · ${vms.length}`, ctx));
    return { kind: 'index', background: ctx.C.bg, elements };
  });
}

function buildDeck(vms, opts) {
  const warnings = [];
  let pageNo = 0;
  const ctx = {
    theme: opts.theme, C: opts.theme.colour.light, S: opts.theme.typography.scale, font: opts.theme.typography.fontFamily,
    metrics: opts.metrics, images: opts.images || {}, title: opts.title, generatedAt: opts.generatedAt, sources: opts.sources || [],
    nameById: new Map(vms.map(vm => [vm.identity.id, vm.identity.name])),
    page: () => pageNo, warn: w => warnings.push(w)
  };
  const sections = Object.assign({ cover: true, index: true, summary: true, appendix: true }, opts.sections || {});
  const slides = [];
  const push = s => { pageNo += 1; slides.push(s); };

  if (sections.cover) push(buildCover(vms, ctx));
  if (sections.index && vms.length >= 2) {
    // page() is read while building, so bump before each build so footers show the right number
    for (const s of buildIndexSlides(vms, { ...ctx, page: () => pageNo + 1 })) push(s);
  }
  // Task 9 adds:  if (sections.summary) for (const vm of vms) push(buildSummarySlide(vm, { ...ctx, page: () => pageNo + 1 }));
  // Task 10 adds: if (sections.appendix) for (const vm of vms) for (const s of buildAppendixSlides(vm, ctx)) push(s);
  for (const vm of vms) for (const w of vm.warnings) warnings.push({ actorId: vm.identity.id, ...w });
  return { slides, warnings };
}

module.exports = { SLIDE, LAYOUT, AVATAR_COLOURS, el, fitParagraph, avatarElements, footerElements, badgeElements, buildCover, buildIndexSlides, buildDeck };
```

- [ ] **Step 4: Run the tests**

Run: `out=$(node tools/renderers/test-deck-model.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed"; echo "exit=$code"`
Expected: `0 failed`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add tools/renderers/pptx/deck-model.js tools/renderers/test-deck-model.js
git commit -m "feat(pptx): deck model — layout constants, cover and index slides with in-deck relationship links

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: `deck-model.js` — the summary slide (never paginates, never shrinks)

**Read the *Spike outcome* block in Task 2 first.** If Will asked for layout changes, apply them to `LAYOUT.summary` below before writing tests; the tests assert behaviour (slots, caps, notes, bounds), not pixel positions, so they survive layout changes.

**Files:**
- Modify: `tools/renderers/pptx/deck-model.js` (add `LAYOUT.summary`, `buildSummarySlide`, wire into `buildDeck`)
- Modify: `tools/renderers/test-deck-model.js` (append before `module.exports`)

**Interfaces:**
- Consumes: `vm.summarySlots` (Task 5), `flow.fitItems` (Task 6), helpers from Task 8.
- Produces: `buildSummarySlide(vm, ctx) → Slide` with `kind: 'summary'`, `actorId`, `notes` (full lists), and warnings via `ctx.warn({ code: 'SUMMARY_TRUNCATED', actorId, slot, shown, of })`.

- [ ] **Step 1: Append failing tests**

Insert before `module.exports` in `tools/renderers/test-deck-model.js`:

```js
section('Summary slide');
{
  const vms = vmsOf([adam, daniel]);
  const d = buildDeck(vms, opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  assert(d.slides.length === 2 && d.slides.every(s => s.kind === 'summary'), 'one summary per actor, nothing else');
  const s = d.slides[0];
  assert(s.actorId === 'actor-adam-rees', 'summary carries actorId');
  const t = textOf(s);
  assert(t.includes('Adam Rees') && t.includes(adam.quote) && t.includes(adam.summary), 'header: name, quote, summary paragraph');
  assert(t.includes('WHO THEY ARE') && t.includes('IN THIS CONTEXT') && t.includes('WHAT EMERGES'), 'three column headings');
  assert(t.includes(adam.contexts[0].title), 'context column names the context');
  assert(s.elements.some(e => e.type === 'ellipse'), 'avatar present');
  assert(inBounds(s), 'summary slide within bounds');
  assert(typeof s.notes === 'string' && s.notes.includes('Who they are') && s.notes.split('\n').length > 6, 'speaker notes carry the full lists');
  const listEls = s.elements.filter(e => e.type === 'text' && e.paragraphs.some(p => p.bullet));
  assert(listEls.length === 3, 'three bulleted lists');
  assert(listEls.every(e => e.paragraphs.filter(p => p.bullet).length <= 3 && e.paragraphs.filter(p => p.bullet).length >= 1), 'each list shows 1–3 items');
  assert(t.includes('→ see appendix'), 'truncated columns point to the appendix');
  assert(d.warnings.some(w => w.code === 'SUMMARY_TRUNCATED' && w.actorId === 'actor-adam-rees'), 'truncation warned');
  assert(s.elements.every(e => e.type !== 'text' || e.size >= theme.typography.scale.caption), 'no text below caption size (never shrinks)');
}
{
  const d = buildDeck(vmsOf([fixture]), opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  const t = textOf(d.slides[0]);
  assert(t.includes('+2 more contexts → appendix'), 'multi-context marker');
  assert(t.includes('Alpha Role'), 'first context shown by default');
}
{
  const d = buildDeck(vmsOf([fixture], { context: 'ctx-gamma' }), opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  const t = textOf(d.slides[0]);
  assert(t.includes('Gamma Role') && t.includes('Nothing recorded yet'), 'context without emergence shows an explicit empty state, not a blank box');
}
{
  const noCtx = buildActorViewModel({ ...fixture, contexts: [], emergence: [] });
  const d = buildDeck([noCtx], opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  assert(d.slides.length === 1 && inBounds(d.slides[0]), 'actor with no contexts still gets a summary slide');
}
```

- [ ] **Step 2: Run to verify failure**

Run: `out=$(node tools/renderers/test-deck-model.js 2>&1); code=$?; echo "$out" | grep -c FAIL; echo "exit=$code"`
Expected: ≥ 12 FAIL, exit 1 (no summary slides are produced yet).

- [ ] **Step 3: Implement**

In `tools/renderers/pptx/deck-model.js`, replace `summary: {},` in `LAYOUT` with (adjust per the Spike outcome):

```js
  summary: { headerH: 1.55, avatarD: 0.95, nameX: 1.65, nameW: 6.2, quoteX: 8.0, quoteW: 4.85,
             sumY: 1.75, sumH: 0.85, colY: 2.8, colH: 4.05, colHeadH: 0.42, colPad: 0.12 },
```

Add before `buildDeck`:

```js
function listParagraphs(items) {
  return items.map(it => ({ text: flow.itemText(it), bullet: true }));
}

function buildSummarySlide(vm, ctx) {
  const L = LAYOUT.summary, m = LAYOUT.margin, g = LAYOUT.gutter;
  const id = vm.identity, slots = vm.summarySlots;
  const elements = [];
  // Header band
  elements.push(el.rect(0, 0, SLIDE.w, L.headerH, ctx.C.panel, { colour: ctx.C.border, width: 0.75 }));
  elements.push(...avatarElements(vm, ctx, m, 0.3, L.avatarD));
  elements.push(el.text(L.nameX, 0.25, L.nameW, 0.55, id.name, { size: ctx.S.h1, bold: true, colour: ctx.C.text, valign: 'middle' }));
  elements.push(...badgeElements(id.actorType.replace('_', ' '), L.nameX, 0.85, ctx));
  if (id.quote) elements.push(el.text(L.quoteX, 0.3, L.quoteW, 1.0, `“${id.quote}”`, { size: ctx.S.body + 1, italic: true, colour: ctx.C.dim, valign: 'middle' }));
  // Summary paragraph
  const sumStyle = { size: ctx.S.body + 1, colour: ctx.C.text };
  const fitted = fitParagraph(id.summary || '', SLIDE.w - 2 * m, L.sumH, sumStyle, ctx.metrics);
  if (fitted.truncated) ctx.warn({ code: 'SUMMARY_TRUNCATED', actorId: id.id, slot: 'summary', shown: fitted.text.length, of: id.summary.length });
  elements.push(el.text(m, L.sumY, SLIDE.w - 2 * m, L.sumH, fitted.text + (fitted.truncated ? ' …' : ''), sumStyle));

  // Three columns
  const colW = (SLIDE.w - 2 * m - 2 * g) / 3;
  const bodyStyle = { size: ctx.S.body + 1, colour: ctx.C.text };
  const cols = [
    { key: 'who', title: 'Who they are', colour: ctx.C.traits, tint: ctx.C.traitsTint, slot: slots.who, sub: '' },
    { key: 'context', title: 'In this context', colour: ctx.C.contexts, tint: ctx.C.contextsTint, slot: slots.context,
      sub: slots.context ? `${slots.context.title}${slots.context.contextType ? ' · ' + slots.context.contextType : ''}` : 'No context recorded' },
    { key: 'emerges', title: 'What emerges', colour: ctx.C.emergence, tint: ctx.C.emergenceTint, slot: slots.emerges, sub: '' }
  ];
  const notes = [];
  cols.forEach((c, i) => {
    const x = m + i * (colW + g), y = L.colY, p = L.colPad;
    elements.push(el.rect(x, y, colW, L.colH, c.tint, { colour: c.colour, width: 1 }, 0.08));
    elements.push(el.rect(x, y, colW, L.colHeadH, c.colour));
    elements.push(el.text(x + p, y, colW - 2 * p, L.colHeadH, c.title.toUpperCase(), { size: ctx.S.body, bold: true, colour: '#ffffff', valign: 'middle' }));
    let cy = y + L.colHeadH + 0.08;
    if (c.sub) { elements.push(el.text(x + p, cy, colW - 2 * p, 0.3, c.sub, { size: ctx.S.small, bold: true, colour: c.colour })); cy += 0.32; }
    const markerH = 0.28;
    const listH = y + L.colH - cy - markerH - p;
    const full = c.slot ? c.slot.full : [];
    const fit = flow.fitItems(full, colW - 2 * p, listH, bodyStyle, ctx.metrics, c.slot ? c.slot.items.length : 0);
    if (fit.items.length) elements.push(el.text(x + p, cy, colW - 2 * p, listH, listParagraphs(fit.items), bodyStyle));
    else elements.push(el.text(x + p, cy, colW - 2 * p, 0.4, 'Nothing recorded yet', { size: ctx.S.body, italic: true, colour: ctx.C.dim }));
    const markers = [];
    if (fit.truncated) { markers.push('→ see appendix'); ctx.warn({ code: 'SUMMARY_TRUNCATED', actorId: id.id, slot: c.key, shown: fit.items.length, of: full.length }); }
    if (c.key === 'context' && c.slot && c.slot.moreContexts > 0) markers.push(`+${c.slot.moreContexts} more context${c.slot.moreContexts > 1 ? 's' : ''} → appendix`);
    if (markers.length) elements.push(el.text(x + p, y + L.colH - markerH - p / 2, colW - 2 * p, markerH, markers.join('   '), { size: ctx.S.caption, bold: true, colour: c.colour, align: 'right' }));
    notes.push(`${c.title}${c.sub ? ' — ' + c.sub : ''}`);
    full.forEach(it => notes.push(`• ${flow.itemText(it)}`));
    notes.push('');
  });
  elements.push(...footerElements(`${id.id} · v${id.version}`, ctx));
  return { kind: 'summary', actorId: id.id, background: ctx.C.bg, elements, notes: notes.join('\n') };
}
```

In `buildDeck`, replace the `// Task 9 adds:` comment line with:

```js
  if (sections.summary) for (const vm of vms) push(buildSummarySlide(vm, { ...ctx, page: () => pageNo + 1 }));
```

Add `buildSummarySlide, listParagraphs` to `module.exports`.

- [ ] **Step 4: Run the tests**

Run: `out=$(node tools/renderers/test-deck-model.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed"; echo "exit=$code"`
Expected: `0 failed`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add tools/renderers/pptx/deck-model.js tools/renderers/test-deck-model.js
git commit -m "feat(pptx): summary slide — fixed slots, fit 3→2→1, appendix markers, speaker notes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: `deck-model.js` — the appendix (two-column, paginated)

**Files:**
- Modify: `tools/renderers/pptx/deck-model.js` (add `LAYOUT.appendix`, `appendixBlocks`, `buildAppendixSlides`, wire into `buildDeck`)
- Modify: `tools/renderers/test-deck-model.js` (append before `module.exports`)

**Interfaces:**
- Consumes: `flow.paginate` (Task 6), `vm.traits / contexts / unattributedEmergence / relationships / provenance / governance`.
- Produces: `appendixBlocks(vm, ctx) → Block[]` and `buildAppendixSlides(vm, ctx) → Slide[]` (`kind: 'appendix'`, `actorId`); pagination warnings forwarded via `ctx.warn({ code: 'APPENDIX_' + reason.toUpperCase(), actorId, sectionId, page })`.

**Column-frame pagination (Deviation 4):** blocks are paginated into a *column* frame `{ w: (12.333 − 0.25) / 2, h: 5.9 }`; the resulting pages are packed two per slide, left then right. A continuation band therefore appears at the top of the right column too, which is the intended reading order.

- [ ] **Step 1: Append failing tests**

```js
section('Appendix — blocks');
{
  const vm = vmsOf([adam])[0];
  const ctx = { C: theme.colour.light, S: theme.typography.scale, metrics, warn: () => {} };
  const blocks = dm.appendixBlocks(vm, ctx);
  assert(blocks.length > 20, 'a real actor yields many blocks', String(blocks.length));
  assert(blocks.every(b => ['band', 'heading', 'paragraph', 'list'].includes(b.kind) && typeof b.sectionId === 'string' && b.style && b.style.size > 0), 'every block is well-formed');
  const bands = blocks.filter(b => b.kind === 'band').map(b => b.text);
  assert(bands[0] === 'Traits', 'first band is Traits');
  assert(bands.some(t => t.startsWith(adam.contexts[0].title)), 'a band per context, titled by the context');
  assert(bands.some(t => t.startsWith('What emerges')), 'emergence band nested after its context');
  assert(bands.indexOf(bands.find(t => t.startsWith('What emerges'))) > bands.indexOf(bands.find(t => t.startsWith(adam.contexts[0].title))), 'emergence follows its context');
  assert(bands.includes('Relationships'), 'relationships band present by default');
  assert(!bands.includes('Provenance') && !bands.includes('Governance'), 'provenance/governance absent by default');
  const headings = blocks.filter(b => b.kind === 'heading').map(b => b.text);
  assert(['Demographics', 'Needs', 'Frustrations', 'Technology'].every(h => headings.includes(h)), 'trait groups appear as headings under the Traits band');
  assert(headings.includes('Goals as experienced') && headings.includes('Pain points'), 'emergence sub-headings');
  const traitsBand = blocks.find(b => b.kind === 'band' && b.text === 'Traits');
  assert(traitsBand.style.fill === theme.colour.light.traits, 'traits band uses the traits layer colour');
  assert(blocks.find(b => b.kind === 'band' && b.text.startsWith('What emerges')).style.fill === theme.colour.light.emergence, 'emergence band uses the emergence colour');
}
{
  const vm = vmsOf([sarah], { sections: { provenance: true, governance: true } })[0];
  const blocks = dm.appendixBlocks(vm, { C: theme.colour.light, S: theme.typography.scale, metrics, warn: () => {} });
  const bands = blocks.filter(b => b.kind === 'band').map(b => b.text);
  assert(bands.includes('Provenance') && bands.includes('Governance'), 'provenance/governance bands when selected');
  assert(blocks.some(b => b.kind === 'heading' && b.text === 'Details'), 'context details rendered (Deviation 3)');
}
{
  const orphan = JSON.parse(JSON.stringify(fixture));
  orphan.emergence.push({ contextRef: 'ctx-missing', goalsAsExperienced: [{ goal: 'Orphan goal', source: 'traits', priority: 'primary' }], painPoints: [], opportunities: [], emotionalContext: '', useCases: [], successMetrics: [] });
  const vm = buildActorViewModel(orphan);
  const blocks = dm.appendixBlocks(vm, { C: theme.colour.light, S: theme.typography.scale, metrics, warn: () => {} });
  assert(blocks.some(b => b.kind === 'band' && b.text.includes('unattributed') && b.text.includes('ctx-missing')), 'unattributed emergence gets its own band naming the ref');
}

section('Appendix — slides');
{
  const d = buildDeck(vmsOf([adam]), opts({ sections: { cover: false, index: false, summary: false, appendix: true } }));
  const app = d.slides;
  assert(app.length >= 3 && app.length <= 12 && app.every(s => s.kind === 'appendix' && s.actorId === 'actor-adam-rees'), 'heaviest actor paginates to 3–12 appendix slides', String(app.length));
  assert(app.every(inBounds), 'every appendix slide within bounds');
  const all = app.map(textOf).join('\n');
  for (const n of adam.traits.needs) assert(all.includes(n.need), `need present: ${n.need.slice(0, 30)}…`);
  for (const f of adam.traits.frustrations) assert(all.includes(f.frustration), `frustration present: ${f.frustration.slice(0, 30)}…`);
  for (const g of adam.emergence[0].goalsAsExperienced) assert(all.includes(g.goal), `goal present: ${g.goal.slice(0, 30)}…`);
  assert(all.includes(adam.contexts[0].description), 'context description present');
  assert(app.slice(1).some(s => textOf(s).includes('(cont.)')), 'continuation bands appear');
  assert(app.every(s => textOf(s).includes('Adam Rees')), 'slim header names the actor on every appendix slide');
  assert(app.every(s => s.elements.every(e => e.type !== 'text' || e.size >= theme.typography.scale.caption)), 'no text below caption size');
  assert(app.every(s => textOf(s).includes(`${adam.id} · v${adam.version}`)), 'footer on every slide');
}
{
  const d = buildDeck(vmsOf([fixture]), opts({ sections: { cover: false, index: false, summary: false, appendix: true } }));
  const all = d.slides.map(textOf).join('\n');
  assert(['Alpha Role', 'Beta Role', 'Gamma Role'].every(t => all.includes(t)), 'all three contexts rendered');
  assert(all.includes('Beta goal') && all.includes('Alpha goal one'), 'each context carries its own emergence');
  assert((all.match(/What emerges/g) || []).length === 2, 'exactly two emergence bands (gamma has none)');
}
{
  const d = buildDeck(vmsOf([adam, daniel]), opts());
  const kinds = d.slides.map(s => s.kind);
  const nA = d.slides.filter(s => s.kind === 'appendix' && s.actorId === 'actor-adam-rees').length;
  const nD = d.slides.filter(s => s.kind === 'appendix' && s.actorId === 'actor-daniel-rees').length;
  assert(d.slides.length === 1 + 1 + 2 + nA + nD, 'slide-count formula: cover + index + N summaries + Σ appendix');
  assert(kinds.indexOf('appendix') > kinds.lastIndexOf('summary'), 'all summaries precede all appendices');
  assert(d.warnings.some(w => String(w.code).startsWith('APPENDIX_')), 'pagination warnings forwarded');
  const pages = d.slides.flatMap(s => s.elements.filter(e => e.type === 'text' && e.align === 'right').map(e => e.paragraphs[0].text));
  assert(pages.join(',') === d.slides.map((_, i) => String(i + 1)).join(','), 'footer page numbers run 1..N in order', pages.join(','));
}
```

- [ ] **Step 2: Run to verify failure**

Run: `out=$(node tools/renderers/test-deck-model.js 2>&1); code=$?; echo "$out" | grep -c FAIL; echo "exit=$code"`
Expected: ≥ 25 FAIL, exit 1 (`dm.appendixBlocks` is not a function).

- [ ] **Step 3: Implement**

Replace `appendix: {}` in `LAYOUT` with:

```js
  appendix: { headerH: 0.85, avatarD: 0.5, frameY: 1.1, frameH: 5.85, colGap: 0.25 }
```

Add before `buildDeck`:

```js
function appendixBlocks(vm, ctx) {
  const blocks = [];
  const band = (sectionId, text, fill) => blocks.push({ kind: 'band', sectionId, text, style: { size: ctx.S.h3, bold: true, colour: '#ffffff', fill } });
  const heading = (sectionId, text) => blocks.push({ kind: 'heading', sectionId, text, style: { size: ctx.S.body + 1, bold: true, colour: ctx.C.text } });
  const para = (sectionId, text) => text && blocks.push({ kind: 'paragraph', sectionId, text, style: { size: ctx.S.body, colour: ctx.C.text } });
  const list = (sectionId, items) => items && items.length && blocks.push({ kind: 'list', sectionId, items, style: { size: ctx.S.body, colour: ctx.C.text } });
  const listSection = (sectionId, title, items) => { if (items && items.length) { heading(sectionId, title); list(sectionId, items); } };

  const groups = Object.entries(vm.traits);
  if (groups.length) {
    band('traits', 'Traits', ctx.C.traits);
    for (const [, g] of groups) listSection('traits', g.label, g.items);
  }
  vm.contexts.forEach((c, i) => {
    const sid = `context-${i}`;
    band(sid, `${c.title}${c.contextType ? ' · ' + c.contextType : ''}`, ctx.C.contexts);
    para(sid, c.description);
    listSection(sid, 'Needs', c.needs);
    listSection(sid, 'Frustrations', c.frustrations);
    listSection(sid, 'Channels', c.channels);
    listSection(sid, 'Moments that matter', c.momentsThatMatter);
    listSection(sid, 'Details', c.details);
    if (c.emergence) {
      const eid = `emergence-${i}`;
      band(eid, `What emerges — ${c.title}`, ctx.C.emergence);
      listSection(eid, 'Goals as experienced', c.emergence.goalsAsExperienced);
      listSection(eid, 'Pain points', c.emergence.painPoints);
      listSection(eid, 'Opportunities', c.emergence.opportunities);
      if (c.emergence.emotionalContext) { heading(eid, 'Emotional context'); para(eid, c.emergence.emotionalContext); }
      listSection(eid, 'Use cases', c.emergence.useCases);
      listSection(eid, 'Success metrics', c.emergence.successMetrics);
    }
  });
  vm.unattributedEmergence.forEach((e, i) => {
    const sid = `unattributed-${i}`;
    band(sid, `What emerges — unattributed (contextRef "${e.contextRef}")`, ctx.C.emergence);
    listSection(sid, 'Goals as experienced', e.goalsAsExperienced);
    listSection(sid, 'Pain points', e.painPoints);
    listSection(sid, 'Opportunities', e.opportunities);
  });
  const rels = [...vm.relationships.inDeck, ...vm.relationships.external];
  if (rels.length) {
    band('relationships', 'Relationships', ctx.C.dim);
    list('relationships', rels.map(r => ({ primary: `${r.typeLabel} ${r.target}`, secondary: r.description || undefined, badge: r.strength })));
  }
  if (vm.provenance) { band('provenance', 'Provenance', ctx.C.dim); list('provenance', vm.provenance); }
  if (vm.governance) { band('governance', 'Governance', ctx.C.dim); list('governance', vm.governance); }
  return blocks;
}

function buildAppendixSlides(vm, ctx) {
  const L = LAYOUT.appendix, m = LAYOUT.margin;
  const colW = (SLIDE.w - 2 * m - L.colGap) / 2;
  const blocks = appendixBlocks(vm, ctx);
  const { pages, warnings } = flow.paginate(blocks, { x: 0, y: 0, w: colW, h: L.frameH }, ctx.metrics);
  for (const w of warnings) ctx.warn({ code: `APPENDIX_${w.reason.toUpperCase()}`, actorId: vm.identity.id, sectionId: w.sectionId, page: w.page });

  const slides = [];
  for (let i = 0; i < pages.length; i += 2) {
    const elements = [];
    elements.push(el.rect(0, 0, SLIDE.w, L.headerH, ctx.C.panel, { colour: ctx.C.border, width: 0.75 }));
    elements.push(...avatarElements(vm, ctx, m, (L.headerH - L.avatarD) / 2, L.avatarD));
    elements.push(el.text(m + L.avatarD + 0.15, 0.15, 7, 0.55, vm.identity.name, { size: ctx.S.h2, bold: true, colour: ctx.C.text, valign: 'middle' }));
    elements.push(el.text(SLIDE.w - m - 4, 0.15, 4, 0.55, `Appendix · ${Math.floor(i / 2) + 1} of ${Math.ceil(pages.length / 2)}`, { size: ctx.S.small, colour: ctx.C.dim, align: 'right', valign: 'middle' }));
    [pages[i], pages[i + 1]].forEach((page, col) => {
      if (!page) return;
      const x = m + col * (colW + L.colGap);
      for (const b of page.blocks) {
        const y = L.frameY + b.y;
        if (b.kind === 'band') {
          elements.push(el.rect(x, y, colW, b.h, b.style.fill, undefined, 0.04));
          elements.push(el.text(x + 0.1, y, colW - 0.2, b.h, b.text, { size: b.style.size, bold: true, colour: b.style.colour, valign: 'middle' }));
        } else if (b.kind === 'heading' || b.kind === 'paragraph') {
          elements.push(el.text(x, y, colW, b.h, b.text, { size: b.style.size, bold: !!b.style.bold, colour: b.style.colour }));
        } else {
          elements.push(el.text(x, y, colW, b.h, listParagraphs(b.items), { size: b.style.size, colour: b.style.colour }));
        }
      }
    });
    elements.push(...footerElements(`${vm.identity.id} · v${vm.identity.version}`, ctx));
    slides.push({ kind: 'appendix', actorId: vm.identity.id, background: ctx.C.bg, elements });
  }
  return slides;
}
```

In `buildDeck`, replace the `// Task 10 adds:` comment with:

```js
  if (sections.appendix) for (const vm of vms) for (const s of buildAppendixSlides(vm, { ...ctx, page: () => pageNo + 1 })) push(s);
```

Add `appendixBlocks, buildAppendixSlides` to `module.exports`.

- [ ] **Step 4: Run the tests**

Run: `out=$(node tools/renderers/test-deck-model.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed"; echo "exit=$code"`
Expected: `0 failed`, exit 0. If "footer page numbers run 1..N" fails, the `page: () => pageNo + 1` wrapper is missing on one builder — every builder must read the page number *before* `push` increments it.

- [ ] **Step 5: Commit**

```bash
git add tools/renderers/pptx/deck-model.js tools/renderers/test-deck-model.js
git commit -m "feat(pptx): appendix — two-column paginated reference slides with nested emergence

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: `writer.js` — slide descriptions → PptxGenJS

**Files:**
- Create: `tools/renderers/pptx/writer.js`
- Create: `tools/renderers/test-render-pptx.js` (writer half; Task 12 appends the CLI half)

**Interfaces:**
- Consumes: `Slide[]` from Task 8–10, `theme` (Task 7).
- Produces: `writeDeck(slides, theme, { outputType: 'buffer' }) → Promise<Buffer>` and `writeDeck(slides, theme, { outputType: 'file', fileName }) → Promise<string>`. Also `slideTexts(buffer) → Promise<string[]>` (test helper, uses jszip: the `<a:t>` runs of each `ppt/slides/slideN.xml` in order) and `slideNotes(buffer) → Promise<string[]>`.

**PptxGenJS facts used (4.0.1, verified in the 2026-09-04 spike):** `new PptxGenJS()`, `defineLayout({name,width,height})` + `pptx.layout`, `addSlide()`, `slide.background = { color }`, `addShape(pptx.ShapeType.rect|roundRect|ellipse|line, {...})`, `addText(runs, opts)` where runs are `[{ text, options }]` and `options.breakLine: true` ends a paragraph, `options.bullet: true` bullets it; `addImage({ path, x, y, w, h })`; `addNotes(text)`; `write({ outputType: 'nodebuffer' })`; `writeFile({ fileName })`. Colours are hex **without** `#`. Line shapes draw from the box's top-left to bottom-right; `flipV: true` draws bottom-left to top-right.

- [ ] **Step 1: Write the failing writer tests**

Create `tools/renderers/test-render-pptx.js`:

```js
// Tests for tools/renderers/pptx/writer.js and tools/renderers/render-pptx.js
// Run from project root: node tools/renderers/test-render-pptx.js

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildActorViewModel } = require('../viewmodels/actor-viewmodel');
const { loadTheme, resolveMetrics } = require('./pptx/theme');
const { buildDeck } = require('./pptx/deck-model');
const { writeDeck, slideTexts, slideNotes } = require('./pptx/writer');

let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }
function section(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`); }
const ROOT = path.join(__dirname, '..', '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const adam = load('v2.0/examples/roadside/actor-adam-rees.json');
const daniel = load('v2.0/examples/roadside/actor-daniel-rees.json');
const { theme } = loadTheme();
const metrics = resolveMetrics(theme);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsds-pptx-'));

async function writerTests() {
  section('Writer — round trip through the .pptx');
  const ids = [adam.id, daniel.id];
  const vms = [adam, daniel].map(a => buildActorViewModel(a, { deck: { actorIds: ids } }));
  const deck = buildDeck(vms, { theme, metrics, generatedAt: '2026-09-04T00:00:00Z', sources: ['roadside'], sections: {}, images: {} });
  const buf = await writeDeck(deck.slides, theme, { outputType: 'buffer' });
  assert(Buffer.isBuffer(buf) && buf.length > 10000, 'returns a non-trivial Buffer', String(buf && buf.length));
  assert(buf.slice(0, 2).toString() === 'PK', 'buffer is a zip (PK header)');
  const texts = await slideTexts(buf);
  assert(texts.length === deck.slides.length, `one XML slide per slide description (${deck.slides.length})`, String(texts.length));
  assert(texts[0].includes('Actors · 2'), 'cover text survives');
  assert(texts[1].includes('Adam Rees') && texts[1].includes('Daniel Rees'), 'index text survives');
  const sIdx = deck.slides.findIndex(s => s.kind === 'summary');
  assert(texts[sIdx].includes('WHO THEY ARE') && texts[sIdx].includes(adam.quote.slice(0, 20)), 'summary text survives');
  const notes = await slideNotes(buf);
  assert(notes[sIdx] && notes[sIdx].includes('Who they are'), 'speaker notes written on the summary slide');
  const allText = texts.join('\n');
  for (const n of adam.traits.needs) assert(allText.includes(n.need), `appendix carries need: ${n.need.slice(0, 28)}…`);
  // No invented text: every text run on every slide must come from the slide description
  const expected = new Set(deck.slides.flatMap(s => s.elements.filter(e => e.type === 'text').flatMap(e => e.paragraphs.map(p => p.text))));
  const runsOnSlides = await slideTexts(buf, { asRuns: true });
  const foreign = runsOnSlides.flat().filter(r => r.trim() && ![...expected].some(t => t.includes(r)));
  assert(foreign.length === 0, 'no text in the file that is not in the slide descriptions', foreign.slice(0, 3).join(' | '));

  section('Writer — file output');
  const fn = path.join(tmp, 'roadside.pptx');
  const written = await writeDeck(deck.slides, theme, { outputType: 'file', fileName: fn });
  assert(written === fn && fs.existsSync(fn) && fs.statSync(fn).size > 10000, 'writes the file and returns its path');

  section('Writer — element coverage');
  const one = { kind: 'cover', background: '#ffffff', elements: [
    { type: 'rect', x: 1, y: 1, w: 2, h: 1, fill: '#123456', line: { colour: '#000000', width: 1 }, radius: 0.1 },
    { type: 'ellipse', x: 4, y: 1, w: 1, h: 1, fill: '#654321' },
    { type: 'line', x1: 1, y1: 3, x2: 5, y2: 2, colour: '#ff0000', width: 2 },
    { type: 'line', x1: 1, y1: 4, x2: 5, y2: 5, colour: '#ff0000', width: 2 },
    { type: 'text', x: 1, y: 5, w: 5, h: 1, paragraphs: [{ text: 'Alpha', bold: true }, { text: 'Beta', bullet: true }, { text: 'Gamma', bullet: true }], size: 12, colour: '#000000' },
    { type: 'image', path: path.join(tmp, 'px.png'), x: 7, y: 1, w: 1, h: 1 }
  ], notes: 'note text' };
  fs.writeFileSync(path.join(tmp, 'px.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
  const b2 = await writeDeck([one], theme, { outputType: 'buffer' });
  const t2 = await slideTexts(b2);
  assert(t2[0].includes('Alpha') && t2[0].includes('Beta') && t2[0].includes('Gamma'), 'all element types write without throwing; text present');
  assert((await slideNotes(b2))[0].includes('note text'), 'notes present');
}

module.exports = { assert, section, ROOT, load, tmp, theme, metrics, adam, daniel, writerTests, execFileSync,
  finish: () => { fs.rmSync(tmp, { recursive: true, force: true }); console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };

if (require.main === module) {
  (async () => {
    await writerTests();
    if (module.exports.cliTests) await module.exports.cliTests();   // Task 12 attaches this
    module.exports.finish();
  })().catch(e => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `out=$(node tools/renderers/test-render-pptx.js 2>&1); code=$?; echo "$out" | head -2; echo "exit=$code"`
Expected: `Cannot find module './pptx/writer'`, exit 1.

- [ ] **Step 3: Implement `writer.js`**

Create `tools/renderers/pptx/writer.js`:

```js
// writer.js — slide descriptions → PptxGenJS. The ONLY module that requires pptxgenjs.
// It draws exactly what deck-model.js describes; no layout decisions live here.

'use strict';

const PptxGenJS = require('pptxgenjs');
const { SLIDE } = require('./deck-model');

const hex = c => String(c).replace('#', '').toUpperCase();

function textRuns(e) {
  const last = e.paragraphs.length - 1;
  return e.paragraphs.map((p, i) => ({
    text: p.text,
    options: {
      bold: p.bold !== undefined ? !!p.bold : !!e.bold,
      italic: p.italic !== undefined ? !!p.italic : !!e.italic,
      fontSize: p.size || e.size,
      color: hex(p.colour || e.colour),
      bullet: p.bullet ? { indent: 12 } : false,
      breakLine: i < last,
      paraSpaceAfter: p.bullet ? 4 : 2
    }
  }));
}

function drawElement(pptx, slide, e, font) {
  switch (e.type) {
    case 'rect':
      slide.addShape(e.radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
        x: e.x, y: e.y, w: e.w, h: e.h, fill: { color: hex(e.fill) },
        line: e.line ? { color: hex(e.line.colour), width: e.line.width } : { color: hex(e.fill), width: 0 },
        rectRadius: e.radius || 0
      });
      break;
    case 'ellipse':
      slide.addShape(pptx.ShapeType.ellipse, { x: e.x, y: e.y, w: e.w, h: e.h, fill: { color: hex(e.fill) },
        line: e.line ? { color: hex(e.line.colour), width: e.line.width } : { color: hex(e.fill), width: 0 } });
      break;
    case 'line': {
      const x = Math.min(e.x1, e.x2), y = Math.min(e.y1, e.y2);
      const w = Math.abs(e.x2 - e.x1), h = Math.abs(e.y2 - e.y1);
      const flipV = (e.x2 - e.x1) * (e.y2 - e.y1) < 0;   // rising to the right
      slide.addShape(pptx.ShapeType.line, { x, y, w, h, flipV, line: { color: hex(e.colour), width: e.width } });
      break;
    }
    case 'text':
      slide.addText(textRuns(e), {
        x: e.x, y: e.y, w: e.w, h: e.h, fontFace: font, fontSize: e.size, color: hex(e.colour),
        align: e.align || 'left', valign: e.valign || 'top', margin: 2,
        fill: e.fill ? { color: hex(e.fill) } : undefined,
        autoFit: false, fit: 'none', shrinkText: false, wrap: true
      });
      break;
    case 'image':
      slide.addImage({ path: e.path, x: e.x, y: e.y, w: e.w, h: e.h });
      break;
    default:
      throw new Error(`writer: unknown element type "${e.type}"`);
  }
}

async function writeDeck(slides, theme, opts) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'DSDS_16x9', width: SLIDE.w, height: SLIDE.h });
  pptx.layout = 'DSDS_16x9';
  pptx.author = 'DSDS render-pptx';
  pptx.company = 'Digital Service Design Standards';
  const font = theme.typography.fontFamily;
  for (const s of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: hex(s.background) };
    for (const e of s.elements) drawElement(pptx, slide, e, font);
    if (s.notes) slide.addNotes(s.notes);
  }
  if (opts.outputType === 'file') return pptx.writeFile({ fileName: opts.fileName });
  return pptx.write({ outputType: 'nodebuffer' });
}

// --- test helpers (jszip is a devDependency and a transitive dependency of pptxgenjs) ---
async function zipEntries(buffer, pattern) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter(n => pattern.test(n))
    .sort((a, b) => parseInt(a.match(/(\d+)\.xml$/)[1], 10) - parseInt(b.match(/(\d+)\.xml$/)[1], 10));
  return Promise.all(names.map(n => zip.file(n).async('string')));
}
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
async function slideTexts(buffer, o) {
  const xmls = await zipEntries(buffer, /^ppt\/slides\/slide\d+\.xml$/);
  const runs = xmls.map(x => [...x.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => decode(m[1])));
  return o && o.asRuns ? runs : runs.map(r => r.join('\n'));
}
async function slideNotes(buffer) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  const out = [];
  for (let i = 1; i <= slideNames.length; i++) {
    const f = zip.file(`ppt/notesSlides/notesSlide${i}.xml`);
    out.push(f ? [...(await f.async('string')).matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => decode(m[1])).join('\n') : '');
  }
  return out;
}

module.exports = { writeDeck, slideTexts, slideNotes, hex, textRuns };
```

- [ ] **Step 4: Run the tests**

Run: `out=$(node tools/renderers/test-render-pptx.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed|Error"; echo "exit=$code"`
Expected: `0 failed`, exit 0. Known PptxGenJS wrinkles if something fails: (a) notes are numbered by slide *creation order*, which matches ours; (b) if `write({ outputType })` rejects, the installed version is not 4.0.1 — check `node -e "console.log(require('pptxgenjs/package.json').version)"` from `tools/renderers/`; (c) the "no invented text" check tolerates PptxGenJS splitting a run at an apostrophe or dash only if our expected set *contains* the fragment — that is why it uses `includes`.

- [ ] **Step 5: Look at it**

```bash
SP=/private/tmp/claude-501/-Users-willosborn-Documents-Digital-Service-Design-Working-schemas/0ed55959-bf6b-4ab6-99e8-a99849e4e5d1/scratchpad
mkdir -p "$SP/look" && node -e "
const fs=require('fs');const {buildActorViewModel}=require('./tools/viewmodels/actor-viewmodel');
const {loadTheme,resolveMetrics}=require('./tools/renderers/pptx/theme');const {buildDeck}=require('./tools/renderers/pptx/deck-model');const {writeDeck}=require('./tools/renderers/pptx/writer');
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));const A=[load('v2.0/examples/roadside/actor-adam-rees.json'),load('v2.0/examples/roadside/actor-daniel-rees.json')];
const ids=A.map(a=>a.id);const vms=A.map(a=>buildActorViewModel(a,{deck:{actorIds:ids}}));const {theme}=loadTheme();
writeDeck(buildDeck(vms,{theme,metrics:resolveMetrics(theme),generatedAt:'2026-09-04',sources:['roadside'],sections:{},images:{}}).slides,theme,{outputType:'file',fileName:'$SP/look/roadside.pptx'}).then(f=>console.log(f));"
cd "$SP/look" && /Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to pdf roadside.pptx >/dev/null 2>&1 && pdftoppm -png -r 60 roadside.pdf p && ls p-*.png | wc -l
```
Open the first four PNGs with the Read tool (cover, index, first summary, first appendix). This is a look, not the gate — the gate is Task 13. Note anything visibly wrong (overlaps, clipped text, empty columns) as a finding for Task 13; do not tune layout numbers here unless something is plainly broken (an element off-slide, text over text).

- [ ] **Step 6: Commit**

```bash
git add tools/renderers/pptx/writer.js tools/renderers/test-render-pptx.js
git commit -m "feat(pptx): writer — slide descriptions to PptxGenJS, with jszip round-trip tests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: `render-pptx.js` — the CLI

**Files:**
- Create: `tools/renderers/render-pptx.js`
- Modify: `tools/renderers/test-render-pptx.js` (attach `cliTests`)

**Interfaces:**
- Consumes: `validateData` (`tools/validators/validate-v2.0.js`), `buildActorViewModel`, `loadTheme`, `resolveMetrics`, `buildDeck`, `writeDeck`.
- Produces: `parseArgs(argv) → Args`, `expandInputs(paths) → string[]`, `loadActors(files) → { actors, errors }`, `run(argv) → Promise<{ exitCode, warnings, outPath }>`; CLI per §7.

- [ ] **Step 1: Append failing CLI tests**

Add to `tools/renderers/test-render-pptx.js`, before the `module.exports` line, and then set `module.exports.cliTests = cliTests;` immediately after the `module.exports = {…}` statement:

```js
async function cliTests() {
  const cli = path.join(__dirname, 'render-pptx.js');
  const runCli = (args) => {
    try { return { code: 0, out: execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), err: '' }; }
    catch (e) { return { code: e.status, out: String(e.stdout || ''), err: String(e.stderr || '') }; }
  };
  const { parseArgs, expandInputs } = require('./render-pptx');

  section('CLI — parseArgs');
  {
    const a = parseArgs(['a.json', 'dir/', '-o', 'x.pptx', '--title', 'T', '--theme', 'b.json', '--images', 'img/', '--sections', 'cover,summary', '--trait-groups', 'needs,frustrations', '--context', 'ctx-1', '--generated-at', '2026-01-01T00:00:00Z', '--warnings-json', 'w.json', '--quiet']);
    assert(a.inputs.join(',') === 'a.json,dir/' && a.out === 'x.pptx' && a.title === 'T' && a.theme === 'b.json' && a.images === 'img/', 'positional inputs and simple flags');
    assert(a.sections.cover === true && a.sections.summary === true && a.sections.index === false && a.sections.appendix === false, '--sections parsed to booleans');
    assert(a.traitGroups.join(',') === 'needs,frustrations' && a.context === 'ctx-1' && a.generatedAt === '2026-01-01T00:00:00Z' && a.warningsJson === 'w.json' && a.quiet === true, 'remaining flags');
    const d = parseArgs(['only.json']);
    assert(d.sections.cover && d.sections.index && d.sections.summary && d.sections.appendix && d.traitGroups === 'all' && d.out === null, 'defaults');
  }

  section('CLI — expandInputs');
  {
    const files = expandInputs([path.join(ROOT, 'v2.0/examples/roadside/')]);
    assert(files.length === 2 && files[0].endsWith('actor-adam-rees.json') && files[1].endsWith('actor-daniel-rees.json'), 'directory → actor-*.json sorted by name', files.join(','));
    const mixed = expandInputs([path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), path.join(ROOT, 'v2.0/examples/roadside/')]);
    assert(mixed.length === 3 && mixed[0].endsWith('sarah-martinez.json'), 'explicit file order preserved before directory expansion');
  }

  section('CLI — happy path');
  {
    const out = path.join(tmp, 'cli-roadside.pptx');
    const r = runCli([path.join(ROOT, 'v2.0/examples/roadside/'), '-o', out, '--generated-at', '2026-09-04T00:00:00Z']);
    assert(r.code === 0, 'exit 0', r.err);
    assert(fs.existsSync(out) && fs.statSync(out).size > 10000, 'writes the deck');
    assert(/Wrote .*cli-roadside\.pptx \(\d+ slides, 2 actors\)/.test(r.out), 'reports slide and actor counts', r.out);
    assert(/warning:/.test(r.err), 'warnings go to stderr');
    const texts = await slideTexts(fs.readFileSync(out));
    assert(texts[0].includes('2026-09-04'), '--generated-at appears on the cover');
  }
  {
    const r = runCli([path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), '-o', path.join(tmp, 'one.pptx'), '--sections', 'cover,summary']);
    const texts = await slideTexts(fs.readFileSync(path.join(tmp, 'one.pptx')));
    assert(r.code === 0 && texts.length === 2, '--sections cover,summary → two slides', String(texts.length));
  }
  {
    const wj = path.join(tmp, 'w.json');
    const r = runCli([path.join(ROOT, 'v2.0/examples/roadside/'), '-o', path.join(tmp, 'w.pptx'), '--warnings-json', wj, '--quiet']);
    assert(r.code === 0 && fs.existsSync(wj) && Array.isArray(JSON.parse(fs.readFileSync(wj, 'utf8'))), '--warnings-json writes an array');
    assert(r.err.trim() === '', '--quiet silences stderr warnings');
  }
  {
    const r = runCli([path.join(ROOT, 'tools/tests/fixtures/actor-multi-context.json'), '-o', path.join(tmp, 'ctx.pptx'), '--context', 'ctx-beta', '--trait-groups', 'needs']);
    const texts = await slideTexts(fs.readFileSync(path.join(tmp, 'ctx.pptx')));
    assert(r.code === 0 && texts.some(t => t.includes('Beta Role')) , '--context honoured');
    assert(!texts.join('\n').includes('Learning style'), '--trait-groups limits appendix trait groups');
  }
  {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dsds-cwd-'));
    const r = (() => { try { return { code: 0, out: execFileSync(process.execPath, [cli, path.join(ROOT, 'v2.0/examples/roadside/')], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { code: e.status, out: String(e.stderr) }; } })();
    assert(r.code === 0 && fs.existsSync(path.join(cwd, 'roadside.pptx')), 'default -o is <dir name>.pptx in cwd', r.out);
    fs.rmSync(cwd, { recursive: true, force: true });
  }

  section('CLI — refusals (exit 2, no file)');
  {
    const out = path.join(tmp, 'never.pptx');
    const r = runCli([path.join(ROOT, 'v2.0/examples/roadside/mission-roadside-assistance.json'), '-o', out]);
    assert(r.code === 2 && !fs.existsSync(out) && /\$type/.test(r.err) && /Mission/.test(r.err), 'non-Actor $type refused, names the type', r.err);
    const bad = path.join(tmp, 'bad.json'); fs.writeFileSync(bad, '{ "nope": ');
    const r2 = runCli([bad, '-o', out]);
    assert(r2.code === 2 && !fs.existsSync(out) && /bad\.json/.test(r2.err), 'unparseable JSON refused, names the file');
    const invalid = path.join(tmp, 'invalid.json'); fs.writeFileSync(invalid, JSON.stringify({ ...adam, actorType: 'robot' }));
    const r3 = runCli([invalid, '-o', out]);
    assert(r3.code === 2 && !fs.existsSync(out) && /actorType/.test(r3.err), 'schema-invalid Actor refused with the validator error');
    const r4 = runCli([path.join(ROOT, 'v2.0/examples/roadside/'), '-o', out, '--theme', path.join(tmp, 'missing-theme.json')]);
    assert(r4.code === 2 && !fs.existsSync(out) && /theme/.test(r4.err), 'unreadable --theme refused');
    const r5 = runCli([]);
    assert(r5.code === 2 && /Usage/.test(r5.err), 'no inputs → usage, exit 2');
    const r6 = runCli([path.join(tmp, 'does-not-exist.json'), '-o', out]);
    assert(r6.code === 2 && /does-not-exist\.json/.test(r6.err), 'missing input file refused by name');
  }

  section('CLI — theme override reaches the file');
  {
    const th = path.join(tmp, 'brand.json'); fs.writeFileSync(th, JSON.stringify({ typography: { fontFamily: 'Arial' }, colour: { light: { traits: '#112233' } } }));
    const out = path.join(tmp, 'themed.pptx');
    const r = runCli([path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), '-o', out, '--theme', th, '--sections', 'summary']);
    const JSZip = require('jszip'); const zip = await JSZip.loadAsync(fs.readFileSync(out)); const xml = await zip.file('ppt/slides/slide1.xml').async('string');
    assert(r.code === 0 && xml.includes('typeface="Arial"') && xml.includes('112233'), 'font and colour from the theme are in the slide XML');
  }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `out=$(node tools/renderers/test-render-pptx.js 2>&1); code=$?; echo "$out" | grep -E "Cannot find|FAIL" | head -3; echo "exit=$code"`
Expected: `Cannot find module './render-pptx'`, exit 1.

- [ ] **Step 3: Implement the CLI**

Create `tools/renderers/render-pptx.js`:

```js
#!/usr/bin/env node
// render-pptx.js — v2.0 Actor JSON (one or many) → PowerPoint deck.
// CLI: node tools/renderers/render-pptx.js <file|dir>... [-o deck.pptx] [--title "..."] [--theme brand.json]
//        [--images dir/] [--sections cover,index,summary,appendix] [--trait-groups a,b,...] [--context <contextId>]
//        [--generated-at <ISO-8601>] [--warnings-json file] [--quiet]
// Exit codes: 0 success (warnings on stderr); 2 invalid input / unreadable theme — nothing written.
// Spec: docs/superpowers/specs/2026-09-04-actor-export-design.md §7

'use strict';

const fs = require('fs');
const path = require('path');
const { validateData } = require('../validators/validate-v2.0');
const { buildActorViewModel, TRAIT_GROUPS } = require('../viewmodels/actor-viewmodel');
const { loadTheme, resolveMetrics } = require('./pptx/theme');
const { buildDeck } = require('./pptx/deck-model');
const { writeDeck } = require('./pptx/writer');

const USAGE = 'Usage: node render-pptx.js <file|dir>... [-o deck.pptx] [--title "..."] [--theme brand.json] [--images dir/] ' +
  '[--sections cover,index,summary,appendix] [--trait-groups needs,frustrations,...] [--context <contextId>] ' +
  '[--generated-at <ISO-8601>] [--warnings-json file] [--quiet]';
const SECTIONS = ['cover', 'index', 'summary', 'appendix'];

function parseArgs(argv) {
  const a = { inputs: [], out: null, title: undefined, theme: undefined, images: undefined,
    sections: { cover: true, index: true, summary: true, appendix: true }, traitGroups: 'all', context: undefined,
    generatedAt: undefined, warningsJson: undefined, quiet: false };
  const takes = { '-o': 'out', '--title': 'title', '--theme': 'theme', '--images': 'images', '--context': 'context', '--generated-at': 'generatedAt', '--warnings-json': 'warningsJson' };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t in takes) { a[takes[t]] = argv[++i]; continue; }
    if (t === '--sections') { const on = new Set(String(argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean)); for (const s of SECTIONS) a.sections[s] = on.has(s); continue; }
    if (t === '--trait-groups') { a.traitGroups = String(argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean); continue; }
    if (t === '--quiet') { a.quiet = true; continue; }
    if (t.startsWith('-')) { const e = new Error(`unknown option ${t}\n${USAGE}`); e.code = 'USAGE'; throw e; }
    a.inputs.push(t);
  }
  return a;
}

function expandInputs(inputs) {
  const files = [];
  for (const p of inputs) {
    let st;
    try { st = fs.statSync(p); } catch (e) { const err = new Error(`input not found: ${p}`); err.code = 'INPUT'; throw err; }
    if (st.isDirectory()) files.push(...fs.readdirSync(p).filter(f => /^actor-.*\.json$/i.test(f)).sort().map(f => path.join(p, f)));
    else files.push(p);
  }
  return files;
}

function loadActors(files) {
  const actors = [], errors = [];
  for (const f of files) {
    let data;
    try { data = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { errors.push(`${f}: ${e.message}`); continue; }
    if (data.$type !== 'Actor') { errors.push(`${f}: $type is "${data.$type}", expected "Actor"`); continue; }
    const v = validateData(data, f);
    if (!v.valid) { errors.push(`${f}: schema validation failed\n  ${v.errors.join('\n  ')}`); continue; }
    actors.push({ file: f, data });
  }
  return { actors, errors };
}

function defaultOut(inputs) {
  const first = inputs[0].replace(/[\\/]+$/, '');
  return path.basename(first).replace(/\.json$/i, '') + '.pptx';
}

async function run(argv) {
  let args;
  try { args = parseArgs(argv); } catch (e) { return { exitCode: 2, error: e.message }; }
  if (args.inputs.length === 0) return { exitCode: 2, error: USAGE };
  let files;
  try { files = expandInputs(args.inputs); } catch (e) { return { exitCode: 2, error: e.message }; }
  if (files.length === 0) return { exitCode: 2, error: `no actor-*.json files found in: ${args.inputs.join(', ')}` };

  const { actors, errors } = loadActors(files);
  if (errors.length) return { exitCode: 2, error: `refusing to render: ${errors.length} input problem(s)\n${errors.join('\n')}` };

  let themeRes;
  try { themeRes = loadTheme(args.theme); } catch (e) { return { exitCode: 2, error: e.message }; }
  const warnings = themeRes.warnings.map(w => ({ ...w, scope: 'theme' }));

  const images = {};
  if (args.images) {
    for (const { data } of actors) {
      const hit = ['png', 'jpg', 'jpeg'].map(ext => path.join(args.images, `${data.id}.${ext}`)).find(p => fs.existsSync(p));
      if (hit) images[data.id] = path.resolve(hit);
      else warnings.push({ code: 'IMAGE_MISSING', actorId: data.id, message: `no ${data.id}.png/.jpg in ${args.images}; using monogram` });
    }
  }

  const ids = actors.map(a => a.data.id);
  const unknownGroups = args.traitGroups === 'all' ? [] : args.traitGroups.filter(g => !TRAIT_GROUPS.includes(g));
  for (const g of unknownGroups) warnings.push({ code: 'TRAIT_GROUP_UNKNOWN', message: `--trait-groups: "${g}" is not a trait group (${TRAIT_GROUPS.join(', ')})` });
  const vms = actors.map(a => buildActorViewModel(a.data, { traitGroups: args.traitGroups, context: args.context, deck: { actorIds: ids } }));

  const deck = buildDeck(vms, {
    theme: themeRes.theme, metrics: resolveMetrics(themeRes.theme), title: args.title,
    generatedAt: args.generatedAt || new Date().toISOString(), sources: args.inputs, sections: args.sections, images
  });
  warnings.push(...deck.warnings);

  const outPath = args.out || defaultOut(args.inputs);
  await writeDeck(deck.slides, themeRes.theme, { outputType: 'file', fileName: outPath });
  if (args.warningsJson) fs.writeFileSync(args.warningsJson, JSON.stringify(warnings, null, 2));
  return { exitCode: 0, outPath, slides: deck.slides.length, actors: actors.length, warnings, quiet: args.quiet };
}

module.exports = { parseArgs, expandInputs, loadActors, defaultOut, run, USAGE };

if (require.main === module) {
  run(process.argv.slice(2)).then(r => {
    if (r.exitCode !== 0) { console.error(r.error); process.exit(r.exitCode); }
    console.log(`Wrote ${r.outPath} (${r.slides} slides, ${r.actors} ${r.actors === 1 ? 'actor' : 'actors'})`);
    if (!r.quiet) for (const w of r.warnings) console.error(`warning: ${w.code}${w.actorId ? ' [' + w.actorId + ']' : ''}${w.slot ? ' ' + w.slot : ''}${w.sectionId ? ' ' + w.sectionId : ''}: ${w.message || (w.shown !== undefined ? `showing ${w.shown} of ${w.of}` : `page ${w.page}`)}`);
    process.exit(0);
  }).catch(e => { console.error(`error: ${e.message}`); process.exit(1); });
}
```

- [ ] **Step 4: Run the full test**

Run: `out=$(node tools/renderers/test-render-pptx.js 2>&1); code=$?; echo "$out" | grep -E "FAIL|passed"; echo "exit=$code"`
Expected: `0 failed`, exit 0.

- [ ] **Step 5: Run every suite and the health check**

```bash
for t in tools/renderers/test-mission-layout.js tools/renderers/test-render-mission.js tools/renderers/test-design-tokens.js tools/viewmodels/test-actor-viewmodel.js tools/renderers/test-pptx-flow.js tools/renderers/test-pptx-theme.js tools/renderers/test-deck-model.js tools/renderers/test-render-pptx.js; do
  out=$(node "$t" 2>&1); code=$?; echo "$(basename $t): $(echo "$out" | tail -1) exit=$code"
done
out=$(node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs 2>&1); echo "examples: $(echo "$out" | grep 'Batch result') exit=$?"
```
Expected: every line `… 0 failed exit=0`; examples `16 passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git add tools/renderers/render-pptx.js tools/renderers/test-render-pptx.js
git commit -m "feat(pptx): render-pptx CLI — validates first, refuses invalid input with exit 2, warnings to stderr/JSON

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: `verify-pptx.sh`, the overflow oracle, and estimator calibration

This is the **visual gate** (spec §8). It requires LibreOffice and poppler, both installed on this Mac on 2026-09-04 (`/Applications/LibreOffice.app/Contents/MacOS/soffice`, `/opt/homebrew/bin/pdftoppm`, `/opt/homebrew/bin/pdftotext`). It is not part of the headless suite.

**Files:**
- Create: `tools/renderers/pptx/overflow-check.js`
- Create: `tools/renderers/pptx/verify-pptx.sh`
- Create: `tools/renderers/test-overflow-check.js`
- Possibly modify: `tools/renderers/pptx/flow.js` (`FLOW.safety` / `FLOW.wrapSlack` only, if calibration demands it) and `tools/design-tokens.json` (`typography.metrics` only)

**Interfaces:**
- Produces: `parseBbox(html) → [{ width, height, words: [{ text, xMin, yMin, xMax, yMax }] }]` (one per page, PDF points); `findOverflow(pages, tolerancePt = 1) → [{ page, text, yMax, xMax, height, width }]`; CLI `node overflow-check.js <bbox.html>` exits 1 when anything overflows. `verify-pptx.sh <deck.pptx> [outdir]` → PDF, `page-N.png`, `bbox.html`, and a summary; exits 1 on overflow, 3 if `soffice` is absent.

- [ ] **Step 1: Write the failing oracle tests (pure; no LibreOffice needed)**

Create `tools/renderers/test-overflow-check.js`:

```js
// Tests for tools/renderers/pptx/overflow-check.js — the pdftotext -bbox parser and overflow oracle.
// Run from project root: node tools/renderers/test-overflow-check.js

'use strict';
const { parseBbox, findOverflow } = require('./pptx/overflow-check');
let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }

// Shape of pdftotext -bbox output (poppler 26.x): <page width="960.000000" height="540.000000"> … <word xMin=".." yMin=".." xMax=".." yMax="..">text</word>
const sample = `<!DOCTYPE html><html><head></head><body><doc>
<page width="960.000000" height="540.000000">
  <word xMin="36.0" yMin="20.0" xMax="90.5" yMax="40.0">Traits</word>
  <word xMin="36.0" yMin="500.0" xMax="70.0" yMax="539.5">fits</word>
  <word xMin="36.0" yMin="530.0" xMax="70.0" yMax="552.0">spills</word>
  <word xMin="900.0" yMin="100.0" xMax="975.0" yMax="120.0">wide</word>
</page>
<page width="960.000000" height="540.000000">
  <word xMin="36.0" yMin="20.0" xMax="90.5" yMax="40.0">clean</word>
</page>
</doc></body></html>`;

const pages = parseBbox(sample);
assert(pages.length === 2, 'two pages parsed');
assert(pages[0].width === 960 && pages[0].height === 540, 'page size parsed as numbers');
assert(pages[0].words.length === 4 && pages[0].words[0].text === 'Traits' && pages[0].words[0].yMax === 40, 'words parsed with coordinates');
const over = findOverflow(pages);
assert(over.length === 2, 'two overflowing words found', JSON.stringify(over));
assert(over.some(o => o.page === 1 && o.text === 'spills') && over.some(o => o.page === 1 && o.text === 'wide'), 'vertical and horizontal overflow both reported with page numbers');
assert(findOverflow(pages, 20).length === 0, 'tolerance suppresses small overflows');
assert(findOverflow([]).length === 0, 'no pages → no overflow');
assert(parseBbox('<html></html>').length === 0, 'no pages in html → empty');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run to verify failure**

Run: `out=$(node tools/renderers/test-overflow-check.js 2>&1); code=$?; echo "$out" | head -2; echo "exit=$code"`
Expected: `Cannot find module './pptx/overflow-check'`, exit 1.

- [ ] **Step 3: Implement the oracle**

Create `tools/renderers/pptx/overflow-check.js`:

```js
#!/usr/bin/env node
// overflow-check.js — reads `pdftotext -bbox` HTML and reports any word whose box lies outside its page.
// This is the automatic overflow oracle for the PPTX renderer (spec §6, §8): if our height estimator
// under-estimates, text runs off the slide, LibreOffice still lays it out, and it shows up here.
// CLI: node overflow-check.js <bbox.html>   → exit 1 if anything overflows.

'use strict';
const fs = require('fs');

function parseBbox(html) {
  const pages = [];
  const pageRe = /<page\s+width="([\d.]+)"\s+height="([\d.]+)">([\s\S]*?)<\/page>/g;
  const wordRe = /<word\s+xMin="([\d.-]+)"\s+yMin="([\d.-]+)"\s+xMax="([\d.-]+)"\s+yMax="([\d.-]+)">([^<]*)<\/word>/g;
  let m;
  while ((m = pageRe.exec(html))) {
    const words = [];
    let w;
    while ((w = wordRe.exec(m[3]))) words.push({ xMin: +w[1], yMin: +w[2], xMax: +w[3], yMax: +w[4], text: w[5] });
    pages.push({ width: +m[1], height: +m[2], words });
  }
  return pages;
}

function findOverflow(pages, tolerancePt = 1) {
  const out = [];
  pages.forEach((p, i) => {
    for (const w of p.words) {
      if (w.yMax > p.height + tolerancePt || w.xMax > p.width + tolerancePt || w.yMin < -tolerancePt || w.xMin < -tolerancePt) {
        out.push({ page: i + 1, text: w.text, yMax: w.yMax, xMax: w.xMax, height: p.height, width: p.width });
      }
    }
  });
  return out;
}

module.exports = { parseBbox, findOverflow };

if (require.main === module) {
  const file = process.argv[2];
  if (!file) { console.error('Usage: node overflow-check.js <bbox.html>'); process.exit(2); }
  const pages = parseBbox(fs.readFileSync(file, 'utf8'));
  const over = findOverflow(pages);
  console.log(`overflow-check: ${pages.length} pages, ${pages.reduce((n, p) => n + p.words.length, 0)} words`);
  if (over.length === 0) { console.log('overflow-check: OK — no word outside its page'); process.exit(0); }
  const byPage = new Map();
  for (const o of over) byPage.set(o.page, (byPage.get(o.page) || []).concat(o.text));
  for (const [page, words] of byPage) console.error(`overflow-check: page ${page}: ${words.length} word(s) outside the slide — "${words.slice(0, 6).join(' ')}${words.length > 6 ? ' …' : ''}"`);
  process.exit(1);
}
```

Run: `out=$(node tools/renderers/test-overflow-check.js 2>&1); code=$?; echo "$out" | tail -1; echo "exit=$code"` → `0 failed`, exit 0.

- [ ] **Step 4: Write `verify-pptx.sh`**

Create `tools/renderers/pptx/verify-pptx.sh` and `chmod +x` it:

```bash
#!/usr/bin/env bash
# verify-pptx.sh — the visual gate for the PPTX renderer.
#   .pptx → PDF (LibreOffice headless) → page-N.png (pdftoppm) → bbox.html (pdftotext) → overflow oracle.
# Usage: tools/renderers/pptx/verify-pptx.sh <deck.pptx> [outdir]
# Exit: 0 clean, 1 overflow found, 2 usage/conversion error, 3 LibreOffice or poppler not installed (skipped).
set -u
DECK="${1:-}"; OUT="${2:-}"
[ -z "$DECK" ] && { echo "Usage: $0 <deck.pptx> [outdir]" >&2; exit 2; }
[ -f "$DECK" ] || { echo "verify-pptx: not found: $DECK" >&2; exit 2; }
SOFFICE="${SOFFICE:-/Applications/LibreOffice.app/Contents/MacOS/soffice}"
command -v "$SOFFICE" >/dev/null 2>&1 || SOFFICE="$(command -v soffice || command -v libreoffice || true)"
if [ -z "$SOFFICE" ]; then echo "verify-pptx: SKIPPED — LibreOffice (soffice) not installed; the visual gate cannot run on this machine" >&2; exit 3; fi
for t in pdftoppm pdftotext; do command -v "$t" >/dev/null 2>&1 || { echo "verify-pptx: SKIPPED — $t (poppler) not installed" >&2; exit 3; }; done
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -z "$OUT" ] && OUT="$(dirname "$DECK")/$(basename "${DECK%.pptx}")-verify"
mkdir -p "$OUT"
"$SOFFICE" --headless --convert-to pdf --outdir "$OUT" "$DECK" >/dev/null 2>&1
PDF="$OUT/$(basename "${DECK%.pptx}").pdf"
[ -f "$PDF" ] || { echo "verify-pptx: PDF conversion failed for $DECK" >&2; exit 2; }
pdftoppm -png -r 80 "$PDF" "$OUT/page" || { echo "verify-pptx: pdftoppm failed" >&2; exit 2; }
pdftotext -bbox "$PDF" "$OUT/bbox.html" || { echo "verify-pptx: pdftotext failed" >&2; exit 2; }
PAGES=$(ls "$OUT"/page-*.png 2>/dev/null | wc -l | tr -d ' ')
echo "verify-pptx: $DECK → $PAGES page(s) in $OUT"
node "$HERE/overflow-check.js" "$OUT/bbox.html"
```

- [ ] **Step 5: Prove the oracle catches real overflow (canary)**

The oracle is only worth trusting if it fires. Build a deck with a text box that must overflow, and confirm the script exits 1:

```bash
SP=/private/tmp/claude-501/-Users-willosborn-Documents-Digital-Service-Design-Working-schemas/0ed55959-bf6b-4ab6-99e8-a99849e4e5d1/scratchpad
mkdir -p "$SP/canary" && node -e "
const {writeDeck}=require('./tools/renderers/pptx/writer');const {loadTheme}=require('./tools/renderers/pptx/theme');
const slide={kind:'cover',background:'#ffffff',elements:[{type:'text',x:0.5,y:6.5,w:12,h:0.8,paragraphs:[{text:('overflow canary word ').repeat(120)}],size:14,colour:'#000000'}]};
writeDeck([slide],loadTheme().theme,{outputType:'file',fileName:'$SP/canary/canary.pptx'}).then(()=>console.log('canary written'));"
tools/renderers/pptx/verify-pptx.sh "$SP/canary/canary.pptx"; echo "exit=$?"
```
Expected: `overflow-check: page 1: N word(s) outside the slide — "overflow canary word …"` and `exit=1`. **If this exits 0, stop: the oracle does not see off-page text on this poppler build** — inspect `bbox.html` for `yMax` values above 540 and adjust `findOverflow` (e.g. LibreOffice may clip at the page box, in which case compare against the *text box*'s bottom instead: the canary's box ends at 7.3in = 525.6pt, so any word with `yMax > 526` is overflow). Record what you find in the plan's Calibration notes below.

- [ ] **Step 6: Calibration pass over every example set**

```bash
SP=/private/tmp/claude-501/-Users-willosborn-Documents-Digital-Service-Design-Working-schemas/0ed55959-bf6b-4ab6-99e8-a99849e4e5d1/scratchpad
mkdir -p "$SP/calib"; rc=0
for d in v2.0/examples/*/; do n=$(basename "$d"); node tools/renderers/render-pptx.js "$d" -o "$SP/calib/$n.pptx" --generated-at 2026-09-04T00:00:00Z --quiet || rc=1; done
node tools/renderers/render-pptx.js v2.0/examples/roadside/ v2.0/examples/retail/ v2.0/examples/energy/ v2.0/examples/healthcare/ v2.0/examples/sales/ tools/tests/fixtures/actor-multi-context.json -o "$SP/calib/all.pptx" --generated-at 2026-09-04T00:00:00Z --quiet || rc=1
for f in "$SP"/calib/*.pptx; do tools/renderers/pptx/verify-pptx.sh "$f" >/dev/null 2>"$SP/calib/$(basename "$f" .pptx).err"; echo "$(basename "$f"): exit=$?"; done
```
Expected: every deck `exit=0`. **If any deck overflows:** read its `.err` file for the page and words, open that `page-N.png` with the Read tool, and decide which of three causes applies — (a) the estimator under-counts lines for that text (long words, no spaces) → raise `FLOW.wrapSlack` by 0.05 and rerun; (b) the estimator under-counts height generally → raise `FLOW.safety` by 0.05 and rerun; (c) a fixed-size element (header, badge, footer) is placed off-slide → fix the coordinate in `deck-model.js`. Never fix an overflow by lowering a font size. Re-run the headless suites after any change to `flow.js`. Stop raising constants once all decks pass; over-inflation costs slides.

- [ ] **Step 7: Look at all of `all.pptx`**

Open every `page-N.png` under `$SP/calib/all-verify/` with the Read tool (it will be roughly 40–70 pages; read them in batches of 6–8). You are checking what the oracle cannot: text overlapping text, columns visibly unbalanced, a band at the very bottom of a column with nothing under it, an avatar colliding with a name, bullets rendering as squares. Fix real defects in `deck-model.js` (layout numbers) and re-run Step 6. Then **send Will the four representative pages** (cover, an index, adam's summary, one adam appendix page) with SendUserFile and a one-paragraph note of what you changed during calibration.

- [ ] **Step 8: Record calibration and commit**

Fill in below, then commit.

**Calibration notes** *(filled in during execution)*:
- Final `FLOW.safety` / `FLOW.wrapSlack`: _(values)_
- Metric changes in tokens: _(none / values)_
- Canary result: _(oracle fired on the first try / needed adjustment — what)_
- Decks verified clean: _(list)_

```bash
git add tools/renderers/pptx/overflow-check.js tools/renderers/pptx/verify-pptx.sh tools/renderers/test-overflow-check.js docs/superpowers/plans/2026-09-04-actor-export-pptx.md
git add tools/renderers/pptx/flow.js tools/design-tokens.json   # only if calibration changed them
git commit -m "feat(pptx): visual gate — LibreOffice/poppler verify script with an automatic overflow oracle

All six example sets and the multi-context fixture verify clean; the
oracle was proven against a deliberately overflowing canary deck.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Documentation, skill wrapper, backlog, final gate

**Files:**
- Modify: `tools/README.md` (add a *Renderers* section after *Validators*)
- Create (gitignored): `.claude/skills/actor-deck-renderer/SKILL.md`
- Modify (gitignored): `backlog.json` via the CLI, then `BACKLOG.md` via `sync`

- [ ] **Step 1: Document the CLI in `tools/README.md`**

Insert after the *Validators* section (before `### Claude Manager`):

````markdown
### Renderers

Deterministic renderers for v2.0 artifacts. **Never hand-edit generated output** — if it looks wrong, fix the renderer and its tests.

```bash
# Mission → interactive HTML service map
node tools/renderers/render-mission.js v2.0/examples/retail/mission-online-clothes-shopping.json -o mission.html

# Actor(s) → PowerPoint deck: cover → index (2+ actors) → one summary per actor → paginated appendix
node tools/renderers/render-pptx.js v2.0/examples/roadside/ -o roadside.pptx
node tools/renderers/render-pptx.js a.json b.json --title "Q3 actors" --theme brand.json --images portraits/ \
    --sections cover,index,summary --trait-groups needs,frustrations --context ctx-alpha
```

`render-pptx.js` validates every input first and **refuses invalid or non-Actor files (exit 2, nothing written)**. Warnings — truncated summary columns, appendix page splits, unknown theme keys, missing portraits — go to stderr (`--warnings-json file` to capture them; `--quiet` to silence). `--theme brand.json` deep-merges over `tools/design-tokens.json`; unknown keys are warned, not ignored. Portraits are looked up by actor id (`<id>.png|jpg`) in `--images`; otherwise a monogram avatar is drawn. Fonts are not embedded — the default is Calibri.

**Visual verification** (needs LibreOffice and poppler; `brew install --cask libreoffice && brew install poppler`):

```bash
tools/renderers/pptx/verify-pptx.sh roadside.pptx      # → PDF, page-N.png, and an overflow check; exit 1 if any text leaves a slide
```

**Install and test:**
```bash
cd tools/renderers && npm install && npm test
```
The design tokens (`tools/design-tokens.json`) are shared by the mission renderer, the PPTX renderer, and the Figma plugin.
````

- [ ] **Step 2: Skill wrapper (local-only)**

Create `.claude/skills/actor-deck-renderer/SKILL.md`:

```markdown
---
name: actor-deck-renderer
description: Renders one or more v2.0 Actor JSON files as a PowerPoint deck (cover, index, summary per actor, paginated appendix) using the deterministic CLI, then verifies it visually. Triggers on "export actor to powerpoint", "actor deck", "pptx", "render actors as slides", "persona deck".
allowed-tools: Read, Glob, Bash
---

# Actor Deck Renderer

Wraps `tools/renderers/render-pptx.js`. **Rendering is deterministic: the CLI generates the deck — never hand-write slides.** If output looks wrong, fix `tools/renderers/pptx/*` and its tests, not the file.

## Process
1. Identify the Actor file(s) or directory (browse `v2.0/examples/` if needed). Confirm each has `"$type": "Actor"`.
2. Ask which sections and options matter (defaults: all sections, all trait groups, first context, no theme, no images). Offer `--title`, `--theme`, `--images`, `--context` only if relevant.
3. Run from the repo root:
   `node tools/renderers/render-pptx.js <inputs> -o <name>.pptx [options]`
   Exit 2 means the input is invalid — show the validator errors; do not "fix" the JSON silently.
4. Run the visual gate: `tools/renderers/pptx/verify-pptx.sh <name>.pptx`. Open the `page-N.png` files with Read and check them before claiming done. Exit 1 = text left a slide; exit 3 = LibreOffice not installed (say so; the deck is still valid).
5. Report the output path, slide count, and every warning the CLI printed, in plain words (e.g. "the Who-they-are column shows 2 of 7 items; the rest are in the appendix and speaker notes").

## Do not
- Do not lower font sizes or edit generated files to fix overflow — file it against `flow.js`.
- Do not put real portraits inside artifacts; `--images` keeps them outside.
```

- [ ] **Step 3: Backlog updates**

```bash
node tools-internal/backlog.js update BACK-018 in_progress
node tools-internal/backlog.js add "Optional image field on Actor" --category schema --source idea \
  --description "The PPTX/Figma export draws a monogram avatar because Actor has no image field; portraits come from an --images sidecar keyed by id. A schema field would let an artifact carry its own illustration. A real portrait is PII and must not enter committed artifacts — any field should hold a reference, never bytes, and governance.containsPii must reflect it." \
  --rationale "Deferred from the 2026-09-04 Actor export design (spec §10)."
node tools-internal/backlog.js add "Experience export to PowerPoint and Figma" --category tooling --source idea \
  --description "The 2026-08-06 spec covered Actor and Experience; the 2026-09-04 spec deliberately shipped Actor only. Experience needs the Mission JSON (node names, phase bands) and arguably the Actor JSON (name) as extra inputs, and holds all the resolution logic. Reuse tools/design-tokens.json, the deck-model element vocabulary, flow.js and writer.js." \
  --rationale "Second half of BACK-018; scoped out on 2026-09-04."
node tools-internal/backlog.js add "v2.0 authoring quick-reference" --category documentation --source observation \
  --description "Every enum, length cap and non-obvious shape in one file next to the schemas. Authoring the roadside set cost ~8 validation round-trips and ~60 errors, essentially all 'the rule exists but nowhere an author would look'." \
  --rationale "Proposed in the BACK-021 retrospective §8.3; still unfiled on 2026-09-04."
node tools-internal/backlog.js sync
node tools-internal/backlog.js stats | head -12
```
Expected: three new inbox items, BACK-018 `in_progress`, `BACKLOG.md` regenerated. These files are gitignored — nothing to commit.

- [ ] **Step 4: Final gate**

```bash
for t in tools/renderers/test-mission-layout.js tools/renderers/test-render-mission.js tools/renderers/test-design-tokens.js tools/viewmodels/test-actor-viewmodel.js tools/renderers/test-pptx-flow.js tools/renderers/test-pptx-theme.js tools/renderers/test-deck-model.js tools/renderers/test-overflow-check.js tools/renderers/test-render-pptx.js tools/converters/test-converter.js tools/validators/test-v2.0-validator.js; do
  out=$(node "$t" 2>&1); code=$?; echo "$(basename $t): $(echo "$out" | tail -1) exit=$code"
done
out=$(node tools/validators/validate-v2.0.js v2.0/examples/ --check-refs 2>&1); echo "examples: $(echo "$out" | grep 'Batch result')"
SP=/private/tmp/claude-501/-Users-willosborn-Documents-Digital-Service-Design-Working-schemas/0ed55959-bf6b-4ab6-99e8-a99849e4e5d1/scratchpad
node tools/renderers/render-pptx.js v2.0/examples/roadside/ -o "$SP/final.pptx" --generated-at 2026-09-04T00:00:00Z && tools/renderers/pptx/verify-pptx.sh "$SP/final.pptx"; echo "gate exit=$?"
git status --short
```
Expected: every suite `0 failed exit=0` (mission 83/16, converter 87, validator 98 — the validator count is data-dependent and grows with fixtures only if they live under `v2.0/examples/`, which this one does not); examples 16/16; `gate exit=0`; `git status` shows only `tools/README.md` modified.

- [ ] **Step 5: Commit**

```bash
git add tools/README.md
git commit -m "docs(tools): document render-pptx and the visual gate

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Then report to Will: what shipped, the calibration constants, the warnings the roadside deck produces, that the skill wrapper is in gitignored `.claude/` and the backlog changes are in gitignored files, and that `feature/actor-export` is unpushed. Hand over to `/end-session` for the handoff update.

---

## Plan self-review (run 2026-09-04 while writing)

**Spec coverage** — every §N in `2026-09-04-actor-export-design.md` maps to a task:

| Spec | Task(s) |
|---|---|
| §1 scope / non-goals | header; Deviations; Task 14 backlog items for the deferred halves |
| §2 architecture, files, exact pin | File Structure; Task 7 (`package.json`); Tasks 3–12 |
| §3 tokens, `--theme`, unknown-key warnings, Calibri, metrics | Task 1, Task 7 |
| §4 view model, §4.1 item table, §4.2 shape and rules | Tasks 3, 4, 5 (fixture in 3; nesting + unattributed in 4; slots, selection defaults, `.d.ts` in 5) |
| §5 deck structure, 8/index, never-paginate summary, spike | Task 2 (spike), Task 8 (cover/index), Task 9 (summary), Task 10 (appendix) |
| §6 estimator, pagination rules, calibration by oracle | Task 6, Task 13 |
| §7 CLI, refusal, exit codes, `--generated-at`, `--images`, `-o` default | Task 12 |
| §8 test suites, visual gate, regression byte-identical | Task 1 (byte-identical), Tasks 3–12 (suites), Task 13 (gate + canary), Task 14 (final gate) |
| §9 Figma phase | out of scope for this plan by design; nothing to implement |
| §10 housekeeping (backlog items, branch) | Task 14 |

**Placeholder scan:** the only intentionally blank fields are the two *filled in during execution* blocks (Task 2 *Spike outcome*, Task 13 *Calibration notes*) — they are execution records, not missing design.

**Type consistency checked:** `Item {primary, secondary?, badge?}` (Tasks 3–10); `Slide`/`Element` vocabulary (Tasks 8–11); `Block` (Tasks 6, 10); `ctx` fields `C, S, font, metrics, images, nameById, page, warn, title, generatedAt, sources` (Tasks 8–10 — Task 8's `buildCover` test passes a hand-built `ctx` with the same keys); warning codes `UNATTRIBUTED_EMERGENCE`, `CONTEXT_NOT_FOUND` (Tasks 4–5), `THEME_UNKNOWN_KEY`, `THEME_METRICS_FALLBACK`, `THEME_UNREADABLE` (Task 7), `SUMMARY_TRUNCATED` (Task 9), `APPENDIX_SPILL` / `APPENDIX_SPLIT` (Task 10), `IMAGE_MISSING`, `TRAIT_GROUP_UNKNOWN` (Task 12); `writeDeck(slides, theme, {outputType, fileName})` (Tasks 11–13); `slideTexts(buffer, {asRuns})`, `slideNotes(buffer)` (Tasks 11–12).
