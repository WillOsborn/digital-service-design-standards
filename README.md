# Digital Service Design Standards

**Professional schemas for personas, roles, journeys, and service design artifacts.**

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## What Is This?

Digital Service Design Standards (DSDS) provides structured JSON schemas for service design artifacts. Instead of every team creating personas and journeys in different formats, these standards ensure:

- **Consistency** across projects and teams
- **Reusability** of research and insights
- **Tool compatibility** for analysis and sharing
- **AI-ready** formats that work with Claude and other tools

## Getting Started

| Path | Time | Best For |
|------|------|----------|
| [QUICKSTART.md](QUICKSTART.md) | 5 min | Quick hands-on introduction |
| [GETTING_STARTED.md](GETTING_STARTED.md) | 30 min | Full setup with Claude skills |
| [Architecture](digital-service-design-v1.1-architecture.md) | Deep dive | Understanding the system design |

## Quick Start

**With Claude:**
```
"Build a persona for a first-time home buyer"
```

**Without Claude:**
```bash
# Copy an example
cp v1.1/examples/personas/persona-sarah-martinez.json my-persona.json

# Edit it, then validate
node tools/validators/validate-v1.1.js my-persona.json
```

## The Compositional Model (v1.1)

DSDS separates **who someone is** from **what they're trying to achieve**:

```
┌─────────────────┐     ┌─────────────────┐
│  Core Persona   │     │   Role Card     │
│  (who someone   │  +  │  (what they're  │
│      is)        │     │    achieving)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
             ┌───────────────┐
             │    Pairing    │
             │  (what        │
             │   emerges)    │
             └───────┬───────┘
                     │
                     ▼
             ┌───────────────┐
             │    Journey    │
             │  (experience  │
             │   over time)  │
             └───────────────┘
```

This enables powerful combinations - same persona in different roles, different personas in the same role - with reusable research.

## Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | 5-minute getting started |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Full introduction + Claude setup |
| [v1.1/README.md](v1.1/README.md) | Compositional model details |
| [documentation/](documentation/) | Guides and references |

## Tools

| Tool | Description |
|------|-------------|
| [Claude Skills](skills/) | AI-powered creation and validation |
| [Claude Manager](tools/claude-manager/) | Scale management for many artifacts |
| [Validators](tools/validators/) | CLI validation tools |

## Examples

Complete working examples in `v1.1/examples/`:

| Type | Example |
|------|---------|
| Persona | [Sarah Martinez](v1.1/examples/personas/persona-sarah-martinez.json) |
| Role | [Working Mom Consumer](v1.1/examples/roles/role-working-mom-consumer.json) |
| Pairing | [Sarah + Working Mom](v1.1/examples/pairings/pairing-sarah-working-mom.json) |
| Journey | [Clothes Shopping](v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json) |

## For Claude Users

This repository includes 14 skills that automate common tasks:

- **Build** personas, roles, pairings, journeys interactively
- **Render** visual journey maps and persona cards
- **Migrate** from images, PDFs, spreadsheets
- **Analyse** barriers and emotional patterns
- **Validate** against schemas with clear feedback

Just ask naturally - Claude will use the appropriate skill.

**To install skills:**
```bash
cp -r skills/* ~/.claude/skills/
```

See [skills/README.md](skills/README.md) for the full catalog.

## Folder Structure

```
schemas/
├── README.md              ← You are here
├── QUICKSTART.md          ← 5-minute guide
├── GETTING_STARTED.md     ← Full introduction
├── CHANGELOG.md           ← Version history
│
├── v1.1/                  ← Current version
│   ├── schemas/           ← JSON Schema definitions
│   ├── examples/          ← Working examples
│   └── SERVICE-DESIGN-*   ← Detailed specifications
│
├── skills/                ← Claude skills (copy to your .claude/skills/)
│
├── documentation/         ← Guides and references
│   ├── getting-started/   ← Tutorials
│   ├── implementation/    ← Team rollout
│   ├── BARRIER_TAXONOMY   ← 9 barrier types
│   └── CHANNEL_TAXONOMY   ← Channel classification
│
└── tools/                 ← Utilities
    ├── validators/        ← CLI validation
    └── claude-manager/    ← Scale management
```

## Using This Repository

### As a New User

1. Read [QUICKSTART.md](QUICKSTART.md)
2. Copy an example and edit it
3. Validate with `node tools/validators/validate-v1.1.js your-file.json`

### With Claude

1. Read [GETTING_STARTED.md](GETTING_STARTED.md)
2. Install skills: `cp -r skills/* ~/.claude/skills/`
3. Open this folder in Claude
4. Say "Build a persona for [your user type]"

### As a Team

1. Read [GETTING_STARTED.md](GETTING_STARTED.md)
2. Set up [Claude Manager](tools/claude-manager/) for org configuration
3. Follow [implementation guide](documentation/implementation/)

## Version History

- **v1.1** (Current) - Compositional model with Persona + Role + Pairing + Journey
- **v1.0.3** - Multi-attribute channel taxonomy
- **v1.0.2** - Enhanced persona schema

See [CHANGELOG.md](CHANGELOG.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file.

## Contributing

Contributions welcome. Please read the documentation first and open an issue to discuss changes.
