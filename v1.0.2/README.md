# Service Design Persona Standard v1.0.2 - Planning Package

## Purpose

This folder contains planning documents for creating v1.0.2 deliverables. The implementation creates NEW self-contained schemas and supporting files - it does NOT recreate the existing project structure.

## Quick Start

1. Start a new Claude conversation
2. Copy the trigger prompt from `IMPLEMENTATION_PROMPT.md`
3. Claude will read the planning docs and execute

## Files in This Folder

| File | Purpose |
|------|---------|
| **IMPLEMENTATION_PROMPT.md** | Trigger prompt to copy into new conversation |
| **IMPLEMENTATION_PLAN.md** | Detailed task list with progress tracker |
| **ARCHITECTURE_DECISIONS.md** | Why each decision was made |
| **SCHEMA_STRUCTURE.md** | Exact JSON structure for new schemas |
| **PROJECT_CONTEXT.md** | Background and guiding principles |

## Key Principles

### CREATE Only (in v1.0.2/)
- SERVICE-DESIGN-PERSONA-STANDARD.md (specification)
- schemas/ folder with 3 self-contained schemas
- examples/ folder with updated personas
- csv-exports/ folder with example CSVs
- csv-export-specification.md
- migration-guide.md

### READ From (do not modify)
- v1.0.1/examples/personas/ - to convert existing examples
- v1.0.1/persona/ - to understand current schema structure
- v1.0.1/base/persona-base.json - to understand field definitions

### DO NOT CREATE
- tools/ folder (now exists at schemas root level, shared across versions)
- documentation/ folder (exists at schemas/ level)
- validators/ (now in ../tools/validators/)
- Any files outside v1.0.2/

## Progress Tracking

If context length is hit, the conversation can resume using the progress tracker in `IMPLEMENTATION_PLAN.md`. Each task has a checkbox that should be mentally tracked.

## Expected Output Structure

```
v1.0.2/
├── SERVICE-DESIGN-PERSONA-STANDARD.md
├── schemas/
│   ├── business-persona.json
│   ├── consumer-persona.json
│   └── employee-persona.json
├── examples/
│   ├── david-chen-business.json
│   ├── sarah-martinez-consumer.json
│   └── maria-rodriguez-employee.json
├── csv-exports/
│   ├── personas_overview.csv
│   ├── personas_goals.csv
│   ├── personas_pain_points.csv
│   └── personas_barriers.csv
├── csv-export-specification.md
└── migration-guide.md
```
