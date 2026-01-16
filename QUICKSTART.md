# DSDS Quickstart

Get started with Digital Service Design Standards in 5 minutes.

## Prerequisites

- **Claude Desktop** or **Claude Code** with project skills enabled
- OR: Node.js for CLI validators

## Option A: With Claude (Easiest)

### 1. Open This Folder in Claude

Open this folder as a project in Claude Desktop or Claude Code.

### 2. Start Creating

Just ask naturally:

```
"Build a persona for a first-time home buyer"
```

Claude will guide you through the process, ask relevant questions, and create a valid JSON file.

### 3. Try These Commands

| What You Want | What to Say |
|---------------|-------------|
| Create a persona | "Build a persona for [description]" |
| Create a role | "Build a role card for [context]" |
| Create a journey | "Build a journey for [experience]" |
| Visualise a journey | "Render the journey as a map" |
| Validate an artifact | "Validate [filename]" |
| See what exists | "Show me all personas" |

### 4. Scale Up (When Ready)

When you have many artifacts:

```
"Help me set up org configuration"
```

This creates `.dsds-config.json` for custom fields and standards.

---

## Option B: Without Claude

### 1. Copy an Example

```bash
cp v1.1/examples/personas/persona-sarah-martinez.json my-persona.json
```

### 2. Edit the JSON

Open `my-persona.json` and replace Sarah's details with your own.

### 3. Validate

```bash
node tools/validators/validate-v1.1.js my-persona.json
```

### 4. Fix Any Issues

The validator tells you exactly what to fix.

---

## File Structure

```
schemas/
├── QUICKSTART.md          ← You are here
├── GETTING_STARTED.md     ← Full documentation
│
├── v1.1/                  ← Current version
│   ├── schemas/           ← JSON Schema definitions
│   ├── examples/          ← Working examples to copy
│   └── SERVICE-DESIGN-*   ← Detailed specifications
│
├── documentation/         ← Guides and references
├── tools/                 ← Validators, Claude Manager
└── skills/                ← Claude skills (copy to your .claude/skills/)
```

## Key Examples

Start by looking at these:

| Type | File |
|------|------|
| Persona | `v1.1/examples/personas/persona-sarah-martinez.json` |
| Role | `v1.1/examples/roles/role-working-mom-consumer.json` |
| Pairing | `v1.1/examples/pairings/pairing-sarah-working-mom.json` |
| Journey | `v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json` |

## Next Steps

- **Learn more**: Read [GETTING_STARTED.md](GETTING_STARTED.md)
- **See skills**: Read [skills/README.md](skills/README.md)
- **Scale up**: Read [tools/claude-manager/README.md](tools/claude-manager/README.md)

---

**That's it!** Start by asking Claude to build your first persona.
