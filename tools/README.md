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
