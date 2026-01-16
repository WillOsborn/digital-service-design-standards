# Documentation Guide

This folder contains reference documentation for Digital Service Design Standards.

---

## Start Here

| Document | Purpose | Read When |
|----------|---------|-----------|
| [../GETTING_STARTED.md](../GETTING_STARTED.md) | Quick start and learning paths | First time using the standards |
| [POSITIONING.md](POSITIONING.md) | Why these standards exist, value proposition | Understanding the big picture |
| [SCHEMA_ARCHITECTURE.md](SCHEMA_ARCHITECTURE.md) | Technical architecture and design decisions | Implementing or extending |

---

## Reference Documentation

### Taxonomies
- [BARRIER_TAXONOMY.md](BARRIER_TAXONOMY.md) - The 9 official barrier types
- [CHANNEL_TAXONOMY.md](CHANNEL_TAXONOMY.md) - Channel classification system
- [TERMINOLOGY.md](TERMINOLOGY.md) - Glossary of terms

### Technical Reference
- [CANONICAL_REFERENCES.md](CANONICAL_REFERENCES.md) - Standard reference formats
- [VALIDATORS.md](VALIDATORS.md) - Validation tools and rules
- [CUSTOMISATION_ARCHITECTURE.md](CUSTOMISATION_ARCHITECTURE.md) - Schema customisation and org-specific fields

### Guides
- [getting-started/](getting-started/) - Step-by-step tutorials
  - [README.md](getting-started/README.md) - Comprehensive introduction
  - [your-first-persona.md](getting-started/your-first-persona.md) - Creating your first persona
  - [quick-reference.md](getting-started/quick-reference.md) - Quick reference card
  - [faq-troubleshooting.md](getting-started/faq-troubleshooting.md) - FAQ and troubleshooting
- [implementation/](implementation/) - Team rollout guides
  - [implementation-guide.md](implementation/implementation-guide.md) - Full rollout process
  - [quality-checklist.md](implementation/quality-checklist.md) - Quality standards
  - [examples-and-patterns.md](implementation/examples-and-patterns.md) - Usage examples
  - [migration-guide.md](implementation/migration-guide.md) - Migrating from older versions

---

## Version-Specific Documentation

The `/v1.1/` folder contains:
- **Schemas** - JSON Schema definitions
- **Examples** - Working JSON examples
- **Standards** - Detailed specifications for each artifact type

---

## Documentation Structure

```
schemas/
├── GETTING_STARTED.md          <- Start here
├── documentation/              <- You are here (reference docs)
│   ├── README.md               <- This navigation guide
│   ├── POSITIONING.md          <- Why these standards
│   ├── SCHEMA_ARCHITECTURE.md  <- Technical design
│   ├── BARRIER_TAXONOMY.md     <- Barrier types
│   ├── CHANNEL_TAXONOMY.md     <- Channel types
│   ├── TERMINOLOGY.md          <- Glossary
│   ├── CANONICAL_REFERENCES.md <- Reference formats
│   ├── VALIDATORS.md           <- Validation tools
│   ├── CUSTOMISATION_ARCHITECTURE.md <- Org customisation
│   ├── getting-started/        <- Tutorials
│   │   ├── README.md
│   │   ├── your-first-persona.md
│   │   ├── quick-reference.md
│   │   └── faq-troubleshooting.md
│   ├── implementation/         <- Rollout guides
│   │   ├── implementation-guide.md
│   │   ├── quality-checklist.md
│   │   ├── examples-and-patterns.md
│   │   └── migration-guide.md
│   └── patterns/               <- Pattern system docs
└── v1.1/                       <- Current version
    ├── schemas/                <- JSON Schema files
    ├── examples/               <- Working examples
    └── SERVICE-DESIGN-*.md     <- Detailed specifications
```
