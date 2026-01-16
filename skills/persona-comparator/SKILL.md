---
name: persona-comparator
description: Compares two or more personas side-by-side to highlight similarities, differences, and design implications. Use when reviewing persona coverage or understanding persona diversity. Triggers on "compare personas", "persona comparison", "differences between personas", "persona coverage", "side by side".
allowed-tools: Read, Glob
---

# Persona Comparator Skill

## Overview

This skill compares two or more personas side-by-side to highlight meaningful differences, identify commonalities, and surface design implications. Useful for ensuring persona coverage and understanding user diversity.

## When to Use

- User asks to "compare personas"
- User wants to understand differences between user types
- User is checking if personas cover different segments
- User needs to design for multiple personas
- User asks "how different are these personas?"

## Comparison Dimensions

### Core Attributes
- Technology comfort (level, confidence areas, avoidance)
- Communication preferences (channels, frequency, timing)
- Decision-making style (approach, risk tolerance, influences)

### Needs & Frustrations
- Personal needs overlap/gaps
- Frustration patterns
- Priority differences

### Design Implications
- Where one design serves both
- Where designs must diverge
- Trade-off decisions

## Process

### Step 1: Load Personas

```bash
# Read persona files
cat v1.1/examples/personas/[persona-1].json
cat v1.1/examples/personas/[persona-2].json
```

Or list available personas:
```bash
ls v1.1/examples/personas/
```

### Step 2: Side-by-Side Overview

Present high-level comparison:

```
**Persona Comparison: [Name 1] vs [Name 2]**

| Attribute | [Name 1] | [Name 2] |
|-----------|----------|----------|
| Tech comfort | Intermediate | Advanced |
| Decision style | Research-oriented | Impulse |
| Risk tolerance | Moderate | High |
| Preferred channels | App, Email | App, Chat |
| Frequency pref | As needed | Real-time |

**At a glance:**
- [Name 1] is more cautious and thorough
- [Name 2] is more spontaneous and tech-confident
```

### Step 3: Technology Comparison

Detailed tech analysis:

```
**Technology Comfort**

| Aspect | [Name 1] | [Name 2] | Gap |
|--------|----------|----------|-----|
| Level | Intermediate | Advanced | 1 level |
| Confident with | Apps, shopping | Everything digital | N1 ⊂ N2 |
| Avoids | Complex settings, new platforms | Nothing significant | N1 needs support |

**Design Implication:**
- [Name 1] needs simpler flows, [Name 2] can handle complexity
- Default to [Name 1]'s level, offer power features for [Name 2]
```

### Step 4: Communication Comparison

```
**Communication Preferences**

| Aspect | [Name 1] | [Name 2] | Overlap |
|--------|----------|----------|---------|
| Channels | App, Email | App, Chat, SMS | App ✓ |
| Frequency | As needed | Real-time | Different |
| Best times | Morning, Evening | Anytime | Morning/Evening both |

**Design Implication:**
- App is universal channel (both prefer)
- Notification frequency should be configurable
- [Name 1] wants digest, [Name 2] wants instant
```

### Step 5: Decision Style Comparison

```
**Decision-Making Style**

| Aspect | [Name 1] | [Name 2] | Impact |
|--------|----------|----------|--------|
| Approach | Research-oriented | Impulse | Opposite ends |
| Risk tolerance | Moderate | High | [Name 1] more cautious |
| Influences | Reviews, Peer rec | Brand, Convenience | Different triggers |

**Design Implication:**
- [Name 1] needs: comparison tools, reviews, detailed specs
- [Name 2] needs: quick purchase path, trust signals, easy undo
- Both: clear return policy (safety net for different reasons)
```

### Step 6: Needs & Frustrations

```
**Personal Needs**

| [Name 1] Needs | [Name 2] Needs | Common? |
|----------------|----------------|---------|
| Time efficiency | Speed | ✓ Similar |
| Quality assurance | Value | ✗ Different focus |
| Family-friendly options | Personal choice | ✗ Different |
| Transparency | Simplicity | ✗ Different |

**Common ground:** Both value time/speed
**Divergence:** Quality vs Value, Family vs Personal

**Personal Frustrations**

| [Name 1] Frustrated by | [Name 2] Frustrated by | Common? |
|------------------------|------------------------|---------|
| Wasted time | Slow processes | ✓ Similar |
| Hidden costs | Complicated steps | ~ Related |
| Complex processes | Too many options | ~ Related |

**Common ground:** Process friction frustrates both
**Nuance:** [Name 1] fears surprises, [Name 2] fears complexity
```

### Step 7: Venn Diagram Summary

Visual representation of overlap:

```
**Persona Overlap**

        ┌─────────────────────────────────────┐
        │           [Name 1] Only             │
        │  • Research before buying           │
        │  • Quality over speed               │
        │  • Email communication              │
        │  • Family considerations            │
        │                                     │
        │      ┌───────────────────┐          │
        │      │     OVERLAP       │          │
        │      │  • Mobile app     │          │
        │      │  • Time matters   │          │
        │      │  • Easy returns   │          │
        │      │  • Clear pricing  │          │
        │      └───────────────────┘          │
        │                                     │
        │           [Name 2] Only             │
        │  • Quick decisions                  │
        │  • High tech comfort                │
        │  • Chat/instant contact             │
        │  • Brand-driven choices             │
        └─────────────────────────────────────┘
```

### Step 8: Design Implications

Synthesise into actionable guidance:

```
**Design Recommendations**

✅ **Universal (serves both):**
- Mobile-first app experience
- Clear, upfront pricing
- Easy return process
- Fast core flows

⚙️ **Configurable (preferences differ):**
- Notification frequency (digest vs real-time)
- Information density (summary vs detailed)
- Purchase flow (quick buy vs review steps)

🔀 **Branching (mutually exclusive):**
- Product detail depth: [Name 1] wants specs, [Name 2] wants highlights
- Recommendation approach: [Name 1] = reviews, [Name 2] = "popular now"

⚠️ **Trade-offs to decide:**
- Default to simple (serves [Name 2]) or comprehensive (serves [Name 1])?
- Recommendation: Default simple, progressive disclosure for depth
```

### Step 9: Coverage Analysis

If comparing for coverage:

```
**Persona Coverage Analysis**

These personas represent different user segments:

| Dimension | [Name 1] | [Name 2] | Coverage Gap? |
|-----------|----------|----------|---------------|
| Tech comfort | Intermediate | Advanced | Missing: Beginner |
| Decision style | Research | Impulse | Missing: Consensus |
| Life stage | Family | Individual | Missing: Elderly? |

**Recommendation:** Consider adding a persona for:
- Low-tech-comfort users (different accessibility needs)
- Consensus-seeking decision makers (multiple stakeholders)
```

## Multi-Persona Comparison

When comparing 3+ personas:

```
**Multi-Persona Matrix**

| Attribute | Sarah | Marcus | Emma | Lisa |
|-----------|-------|--------|------|------|
| Tech | Int. | Adv. | Beg. | Adv. |
| Decision | Research | Process | Consensus | Impulse |
| Risk | Mod. | Low | Low | High |
| Channels | App,Email | Email,Ticket | Phone,Person | App,Chat |

**Clusters:**
- Tech-confident: Marcus, Lisa (can handle complexity)
- Tech-cautious: Sarah, Emma (need simpler paths)
- Deliberate: Sarah, Marcus (want information)
- Quick: Lisa (wants speed)
- Supported: Emma (wants human help)
```

## Example Output

```
# Persona Comparison: Sarah Martinez vs Marcus Thompson

## Quick Summary

| | Sarah | Marcus |
|--|-------|--------|
| Archetype | Cautious Researcher | Efficient Processor |
| Tech | Intermediate | Advanced |
| Decides by | Reviews & Research | Process & Policy |
| Risk | Moderate | Low |
| Primary channel | Mobile App | Email/Ticketing |

## Key Differences

1. **Decision approach**: Sarah researches exhaustively; Marcus follows established processes
2. **Risk attitude**: Sarah takes calculated risks; Marcus avoids any uncertainty
3. **Channel preference**: Sarah prefers self-service; Marcus prefers documented trails

## Common Ground

- Both value time efficiency
- Both frustrated by unclear processes
- Both prefer email for important communications
- Both want predictable outcomes

## Design Implications

**For both:**
- Clear process steps with progress indicators
- Email confirmations for key actions
- Predictable, documented outcomes

**For Sarah specifically:**
- Comparison tools, reviews, detailed product info
- Flexible options, ability to change decisions
- Quick access to support if needed

**For Marcus specifically:**
- Clear approval workflows
- Audit trails and documentation
- Integration with existing systems
- Minimal decision points

## Serving Both in One Design

| Feature | Sarah's Use | Marcus's Use |
|---------|-------------|--------------|
| Progress tracker | "Where am I?" | "What's documented?" |
| Reviews section | Decision input | Validation of choice |
| Email receipts | Reference | Audit trail |
| Help button | Quick answers | Escalation path |
```

## Quality Checklist

Comparison should include:

- [ ] Side-by-side attribute table
- [ ] Technology comfort comparison
- [ ] Communication preferences comparison
- [ ] Decision style comparison
- [ ] Needs/frustrations overlap analysis
- [ ] Visual overlap summary (Venn)
- [ ] Design implications
- [ ] Universal vs configurable vs branching features
- [ ] Coverage gaps (if relevant)

## Related Skills

- `persona-builder` - Create additional personas to fill gaps
- `persona-renderer` - Visualise individual personas
- `pairing-builder` - See how personas interact with roles
