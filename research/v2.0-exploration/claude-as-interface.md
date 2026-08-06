# Claude as the Design Interface for v2.0 Artifacts

## The Idea

Instead of building a purpose-built web application for creating and editing Actors, Missions, and Experiences, use Claude itself (claude.ai, Claude Desktop, or Claude Code) as the primary interface. Service designers would work through conversation — describing personas, walking through journeys, reviewing visualizations — and Claude would produce schema-valid artifacts.

This is already partially working: the project has skills for persona-builder, journey-builder, persona-renderer, and journey-renderer that run in Claude Code and produce JSON files or React artifact visualizations.

---

## Three Interface Tiers

### Tier 1: Claude.ai (Web) — Lightest Touch

**How it works:**
- Create a Claude Project with v2.0 schemas uploaded as project knowledge
- System prompt instructs Claude to always produce schema-conformant artifacts
- Service designers create artifacts through guided conversation
- Visual renderings appear as React artifacts in the side panel
- Finished artifacts are copied out (or downloaded) as JSON/YAML

**What exists today:**
- persona-renderer and journey-renderer already produce React artifacts
- Projects can hold schema files as knowledge (~30MB per file, 200K token context)
- React artifacts support D3.js, Cytoscape.js, and React Flow via CDN

**What would need building:**
- v2.0 versions of builder skills (actor-builder, mission-builder, experience-builder)
- v2.0 renderers: Actor card, Mission graph (React Flow + ELK.js or Cytoscape.js), Experience linear view
- A system prompt template for v2.0 Projects
- Example conversations showing the workflow

**Strengths:**
- Zero setup for the service designer — just open a Claude Project
- Conversation is a natural authoring interface for narrative-heavy content
- React artifacts can render rich journey maps and persona cards
- Good for initial creation and exploration

**Limitations:**
- No file persistence between conversations (must copy/paste or download)
- No programmatic schema validation — Claude tries to conform but can miss constraint violations
- Artifacts are single-file, no cross-artifact interaction
- Cannot "open" an existing artifact file — must paste content in
- No version control integration

**Best for:** Quick exploration, initial artifact creation, stakeholder presentations

---

### Tier 2: Claude Desktop + MCP — Read/Write to Files

**How it works:**
- Claude Desktop with the filesystem MCP server configured to access the project directory
- Claude reads existing v2.0 artifacts from disk, modifies them, writes them back
- A custom MCP server provides schema validation (runs ajv against JSON Schema)
- Visual renderings still appear as artifacts in the conversation
- Files are saved directly to the git-tracked project directory

**What exists today:**
- `@modelcontextprotocol/server-filesystem` is mature (read, write, list, search)
- Claude Desktop supports MCP configuration via `claude_desktop_config.json`
- Desktop Extensions (`.mcpb`) provide one-click install for MCP servers

**What would need building:**
- A schema-validation MCP server (thin wrapper around ajv + the v2.0 schemas)
- v2.0 builder and renderer skills adapted for Desktop (same skills, file I/O via MCP)
- A `.mcpb` Desktop Extension packaging the filesystem + validator servers
- Configuration template for the project directory

**Strengths:**
- True file persistence — artifacts live in the git-tracked project directory
- Schema validation is programmatic, not just Claude's best effort
- Can read, modify, and save existing artifacts (not just create new ones)
- Full conversation context for complex modifications
- Version control via git (designer commits when ready)

**Limitations:**
- Requires Node.js and MCP setup on the designer's machine
- Every file write operation prompts for user approval (by design, but adds friction)
- Still no cross-artifact rendering (can't show Actor + Mission + Experience together)
- MCP filesystem reads files as text — Claude parses in context, not via a structured API

**Best for:** Day-to-day artifact management, editing existing artifacts, team workflows with git

---

### Tier 3: Claude Code — Full Development Workflow

**How it works:**
- Claude Code (CLI or IDE extension) with direct filesystem access
- Skills handle the full workflow: create, validate, render, compare, commit
- No MCP indirection — direct file read/write and shell commands
- Can run validators, generate renderings, and commit to git in a single conversation

**What exists today:**
- All current skills (persona-builder, journey-builder, renderers, validators) run in Claude Code
- Direct filesystem access, git integration, shell commands
- Can chain operations: create artifact → validate → render → commit

**What would need building:**
- v2.0 versions of all builder skills (actor-builder, mission-builder, experience-builder)
- v2.0 renderers (graph visualization for Missions, linear view for Experiences)
- An experience-generator skill: takes Actor + Mission, produces Experience through guided conversation
- A mission-explorer skill: visualizes the mission graph, lets you select paths, generates Experiences
- Updated validators for v2.0 schemas

**Strengths:**
- Most powerful — full filesystem, git, shell, validation in one interface
- Can orchestrate multi-artifact workflows (create Actor → create Mission → generate Experience → render all three)
- Skills provide structured guidance without limiting flexibility
- Already the environment where schema development happens

**Limitations:**
- Requires Claude Code subscription and CLI/IDE setup
- No persistent visual artifacts between tool calls (text output resets)
- More developer-oriented than designer-oriented
- Rendering is via file output (HTML/SVG), not inline artifacts like claude.ai

**Best for:** Schema development, bulk operations, CI integration, technical team members

---

## Visualization Approach

The Mission graph is the most complex visualization challenge. Research evaluated five libraries:

| Library | Works in Claude.ai React artifact | Phase grouping | Detail panels | Path highlighting | Recommendation |
|---------|-----------------------------------|----------------|---------------|-------------------|----------------|
| React Flow + ELK.js | Yes | Custom nodes | Native (React components) | Yes | **Best for React artifacts** |
| Cytoscape.js + dagre | Yes (via CDN in HTML artifact) | Compound nodes | Click handlers | Yes | **Best for plain HTML** |
| D3.js + dagre | Yes | Manual | Manual | Yes | Capable but high effort |
| Mermaid.js | Yes | No | No | No | Too limited |
| ELK.js alone | Layout only | — | — | — | Needs a rendering layer |

**Recommended approach:**
- **Mission graph:** React Flow + ELK.js in a React artifact. Nodes styled by type (touchpoint=blue, decision=diamond, wait=dashed, signal=orange, end=green). Edges labelled with conditions. Phases as visual groupings. Click a node to see details. Highlight a specific path.
- **Experience linear view:** Horizontal swimlane (extending the existing journey-renderer). Phases as columns, lanes as rows (actions, thoughts, emotions, channels, barriers). Emotion line graph across the top.
- **Actor card:** Layered card view (extending persona-renderer). Traits section, expandable contexts, emergence insights with source attribution.

---

## Recommended Workflow

For most service design teams, the workflow would span tiers:

```
1. EXPLORE (Claude.ai)
   Designer opens a v2.0 Project, describes a new service
   → Claude generates draft Actor + Mission through conversation
   → Mission graph rendered as React artifact for review
   → Designer iterates via conversation

2. FORMALIZE (Claude Desktop or Claude Code)
   Designer saves artifacts to project directory via MCP or CLI
   → Schema validation runs automatically
   → Artifacts committed to git
   → Experience artifacts generated from Actor + Mission pairs

3. PRESENT (Claude.ai)
   Designer opens artifacts in a Claude.ai conversation
   → Renders Actor cards, Mission graphs, Experience swimlanes
   → Shares published artifacts with stakeholders via URL
```

The key insight: **Claude is both the authoring tool and the rendering tool.** The schema is the contract between them. A service designer never needs to edit JSON/YAML directly unless they choose to — conversation is the primary interface, and Claude produces schema-valid output.

---

## What Needs Building (Prioritized)

### Phase 1: Core Skills (works in all tiers)
1. **actor-builder** — guided Actor creation through conversation (traits → contexts → emergence)
2. **mission-builder** — guided Mission creation (graph construction through iterative node/edge definition)
3. **experience-generator** — takes Actor + Mission references, generates Experience through conversation about the actor's journey through each node
4. **actor-renderer** — React artifact showing layered Actor card
5. **mission-renderer** — React artifact showing interactive Mission graph (React Flow + ELK.js)
6. **experience-renderer** — React artifact showing linear swimlane view

### Phase 2: Integration (Claude Desktop / Claude Code)
7. **v2.0 schema validator** — validates artifacts against v2.0 JSON Schemas (MCP server or CLI tool)
8. **context-library** — manages shared contexts that can be referenced across Actors
9. **experience-comparator** — renders multiple Experiences through the same Mission side-by-side

### Phase 3: Advanced
10. **mission-explorer** — interactive Mission graph where you can select a path and generate an Experience for it
11. **portfolio-analyser** — cross-artifact graph queries (e.g., "find all missions where actors encounter technology barriers")
12. **v1.1-to-v2.0 converter** — automated migration tool

---

## Open Questions

1. **Claude.ai artifact size limits.** A Mission graph with 30 nodes, each with detail panels, may push the artifact size boundary. Needs testing with a real React Flow + ELK.js implementation.

2. **MCP approval friction.** Every file write in Claude Desktop requires user approval. For rapid iteration (save, validate, re-save), this could be frustrating. Investigate whether batch-write tools or auto-approve for specific directories could help.

3. **Cross-artifact rendering.** Currently no way to show Actor + Mission + Experience together in one artifact. A "dashboard" artifact that loads all three inline would be useful but is constrained by the single-file artifact model.

4. **Offline/export.** Published claude.ai artifacts are URL-shareable, but stakeholders may need offline versions. The renderer skills should also output standalone HTML files that can be opened without Claude.
