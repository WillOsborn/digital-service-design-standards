# DSDS Tools

Command-line tools and utilities for working with Digital Service Design Standards.

## Available Tools

### Validators

CLI tools for validating DSDS artifacts against schemas.

```bash
# Validate any v1.1 artifact (auto-detects type)
node tools/validators/validate-v1.1.js path/to/artifact.json

# Validate a persona specifically
node tools/validators/validate-persona.js path/to/persona.json

# Validate a journey
node tools/validators/validate-journey.js path/to/journey.json

# Run all tests
node tools/validators/run-all-tests.js
```

**Requirements:** Node.js 18+

**Installation:**
```bash
cd tools/validators
npm install
```

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

`render-pptx.js` validates every input first and **refuses invalid or non-Actor files (exit 2, nothing written)**. Warnings — truncated summary columns, appendix page splits, unknown theme keys, missing portraits — go to stderr (`--warnings-json file` to capture them; `--quiet` to silence). `--theme brand.json` deep-merges over `tools/design-tokens.json`; unknown keys are warned, not ignored. Portraits are looked up by actor id (`<id>.png|jpg|jpeg`) in `--images`; otherwise a monogram avatar is drawn. Fonts are not embedded — the default is Calibri.

**Visual verification** (needs LibreOffice and poppler; `brew install --cask libreoffice && brew install poppler`):

```bash
tools/renderers/pptx/verify-pptx.sh roadside.pptx      # → PDF, page-N.png, and an overflow check; exit 1 if any text leaves a slide
```
The oracle sees only text that reaches the slide edge (LibreOffice clips there), so it uses a measured 12pt inset; a box overshoot that stops mid-slide is not detectable this way — the estimator tests cover that.

**Install and test:**
```bash
cd tools/renderers && npm install && npm test
```
The design tokens (`tools/design-tokens.json`) are shared by the mission renderer, the PPTX renderer, and the Figma plugin.

### Claude Manager

Skills and templates for managing DSDS artifacts at organisational scale.

Located in `claude-manager/`, this provides:
- **Organisation configuration** - Custom field requirements, naming conventions
- **Artifact registry** - Index and search across all artifacts
- **Bulk operations** - Update multiple artifacts at once
- **Portfolio reporting** - Coverage and quality reports
- **Standards enforcement** - Compliance checking

See `claude-manager/README.md` for setup instructions.

### Build Distribution

Script to create a distributable package of DSDS.

```bash
./tools/build-distribution.sh
```

Creates a clean ZIP file without development files, suitable for sharing.

## Directory Structure

```
tools/
├── README.md              ← You are here
├── validators/            ← CLI validation tools
│   ├── validate-v1.1.js   ← Universal validator
│   ├── validate-persona.js
│   ├── validate-journey.js
│   └── run-all-tests.js
├── claude-manager/        ← Scale management
│   ├── skills/
│   └── templates/
└── build-distribution.sh  ← Package builder
```

## More Information

- [Claude Skills](../skills/) - AI-powered creation and validation
- [v1.1 Schema Standards](../v1.1/) - Schema definitions and examples
- [Getting Started](../GETTING_STARTED.md) - Full setup guide
