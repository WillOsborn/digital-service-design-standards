---
name: barrier-mapper
description: Aggregates and analyses barriers across multiple journeys, pairings, or the entire artifact set to find systemic issues. Use when looking for patterns across experiences. Triggers on "map barriers", "barrier patterns", "systemic issues", "cross-journey barriers", "barrier analysis across".
allowed-tools: Read, Glob, Grep, Task
---

# Barrier Mapper Skill

## Overview

This skill aggregates barriers across multiple artifacts (journeys, pairings) to identify systemic patterns, recurring friction, and organisation-wide issues. It moves beyond single-journey analysis to find patterns that span experiences.

## When to Use

- User wants to see barriers across all journeys
- User asks "what are our biggest systemic issues?"
- User needs to prioritise platform-wide improvements
- User wants to understand barrier patterns by type, phase, or channel
- User is doing quarterly/annual service review

## Analysis Scope

### Input Sources
- All journey files in `v1.1/examples/journeys/`
- All pairing files in `v1.1/examples/pairings/`
- Can filter by domain, persona, or role

### Output
- Aggregated barrier inventory
- Pattern analysis
- Systemic issue identification
- Priority recommendations

## Process

### Step 1: Gather All Barriers

Scan all relevant files:

```bash
# Find all journey files
ls v1.1/examples/journeys/*.json

# Find all pairing files
ls v1.1/examples/pairings/*.json
```

Extract barriers from each:
- Journey barriers (from `lane_content.barriers`)
- Pairing barriers (from `barriers[]` with `emergesFrom`)

### Step 2: Build Barrier Inventory

Create a comprehensive list:

```
**Barrier Inventory**

Total barriers found: [count]
- From journeys: [count] across [N] journeys
- From pairings: [count] across [N] pairings

| ID | Type | Description | Severity | Source | Phase/Context |
|----|------|-------------|----------|--------|---------------|
| B1 | knowledge | Sizing uncertainty | 4 | journey-sarah-shopping | Browsing |
| B2 | resource | Limited research time | 3 | pairing-sarah-working-mom | N/A |
| ... | ... | ... | ... | ... | ... |
```

### Step 3: Analyse by Type

Group barriers by the 9 taxonomy types:

```
**Barriers by Type**

| Type | Count | Avg Severity | % of Total | Top Sources |
|------|-------|--------------|------------|-------------|
| knowledge | 8 | 3.2 | 25% | Research phases |
| resource | 6 | 3.5 | 19% | Time-pressured roles |
| process | 5 | 2.8 | 16% | Return/support flows |
| technology | 4 | 2.5 | 13% | App interactions |
| communications | 3 | 2.3 | 9% | Status updates |
| policy | 2 | 3.0 | 6% | Returns, refunds |
| cultural | 2 | 2.0 | 6% | Help-seeking |
| governance | 1 | 3.0 | 3% | Escalation |
| vision | 1 | 4.0 | 3% | Product gaps |

**Key Insight**: Knowledge barriers are most common (25%) -
users often lack information they need to proceed confidently.
```

### Step 4: Analyse by Phase/Context

Find where barriers concentrate:

```
**Barriers by Journey Phase**

| Phase Type | Barrier Count | Avg Severity | Common Types |
|------------|---------------|--------------|--------------|
| Discovery | 4 | 2.5 | knowledge, communications |
| Consideration | 6 | 3.2 | knowledge, resource |
| Purchase/Action | 3 | 2.7 | technology, process |
| Fulfilment | 5 | 3.4 | resource, communications |
| Support/Return | 7 | 3.1 | process, policy |

**Key Insight**: Support/Return phases have most barriers (7) -
recovery flows need attention.
```

### Step 5: Analyse by Channel

Correlate barriers with channels:

```
**Barriers by Channel**

| Channel | Barrier Count | Avg Severity | Common Types |
|---------|---------------|--------------|--------------|
| app | 8 | 2.8 | technology, knowledge |
| email | 4 | 2.5 | communications |
| in_person | 5 | 3.2 | resource, process |
| phone | 3 | 3.7 | process, resource |
| website | 2 | 2.0 | knowledge |

**Key Insight**: Phone channel has highest severity (3.7) -
when people call, it's because something went wrong.
```

### Step 6: Identify Systemic Patterns

Look for recurring themes:

```
**Systemic Patterns Identified**

🔴 **Pattern 1: Information Gaps at Decision Points**
- Appears in: 3 journeys, 2 pairings
- Typical form: Knowledge barrier at consideration/purchase
- Examples:
  - Sizing uncertainty (clothes shopping)
  - Terms confusion (finance application)
  - Eligibility questions (service signup)
- Root cause: Self-service channels lack context-sensitive help
- Systemic fix: Contextual information layer across products

🟠 **Pattern 2: Time Pressure Amplifies Friction**
- Appears in: All pairings with time-constrained roles
- Typical form: Resource barriers compound other issues
- Examples:
  - Can't research thoroughly (working mom)
  - Must decide quickly (business user)
- Root cause: Processes designed for unlimited time
- Systemic fix: "Quick path" options, progressive disclosure

🟠 **Pattern 3: Recovery Flows Are Painful**
- Appears in: 2 journeys (return, complaint)
- Typical form: Process barriers in support phases
- Examples:
  - Multi-step return process
  - Repeated information requests
- Root cause: Recovery treated as exception, not core flow
- Systemic fix: One-click recovery, context preservation
```

### Step 7: Persona/Role Patterns

Analyse by who experiences barriers:

```
**Barriers by Persona Trait**

Research-oriented personas:
- Higher knowledge barriers (want more info than provided)
- Lower technology barriers (comfortable exploring)

Time-constrained roles:
- Higher resource barriers (never enough time)
- Process barriers feel more severe

**Barriers by Role Type**

| Role Type | Barrier Count | Avg Severity | Dominant Types |
|-----------|---------------|--------------|----------------|
| Consumer | 18 | 2.9 | knowledge, process |
| Employee | 6 | 3.2 | process, technology |
| Business | 4 | 3.5 | communications, policy |
| Citizen | 2 | 3.0 | process, governance |
```

### Step 8: Priority Matrix

Create actionable prioritisation:

```
**Barrier Priority Matrix**

                    High Frequency
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    │   QUICK WINS       │   CRITICAL         │
    │   (Low severity,   │   (High severity,  │
    │    high frequency) │    high frequency) │
    │                    │                    │
Low ├────────────────────┼────────────────────┤ High
Sev │                    │                    │ Sev
    │   MONITOR          │   TARGETED FIX     │
    │   (Low severity,   │   (High severity,  │
    │    low frequency)  │    low frequency)  │
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
                    Low Frequency

**Critical (fix first):**
- Knowledge gaps at purchase decisions
- Process friction in returns

**Quick Wins (easy improvements):**
- Communication clarity in status updates
- Technology polish in app flows

**Targeted Fix (specific journeys):**
- Policy barriers in refund flows
- Governance gaps in escalation

**Monitor (watch but don't prioritise):**
- Cultural barriers in help-seeking
- Vision gaps in niche scenarios
```

### Step 9: Recommendations

Synthesise into action plan:

```
**Recommended Actions**

🔴 **Platform Initiative: Contextual Help Layer**
- Addresses: Knowledge barriers (25% of all barriers)
- Scope: All digital touchpoints
- Approach: Context-aware help, progressive disclosure
- Affected journeys: [list]
- Expected impact: Reduce knowledge barriers by 50%

🟠 **Process Redesign: Recovery Flows**
- Addresses: Process barriers in support phases
- Scope: Returns, complaints, cancellations
- Approach: One-click recovery, context preservation
- Affected journeys: [list]
- Expected impact: Improve support phase emotions by 1 point avg

🟡 **Channel Optimisation: Phone Deflection**
- Addresses: High-severity phone barriers
- Scope: Pre-call digital touchpoints
- Approach: Solve issues before they escalate to calls
- Expected impact: Reduce call volume, improve resolution
```

## Example Output

```
# Cross-Journey Barrier Analysis

## Scope
- 4 journeys analysed
- 3 pairings analysed
- 32 total barriers identified

## Summary

| Metric | Value |
|--------|-------|
| Total barriers | 32 |
| Average severity | 2.9 |
| Most common type | Knowledge (28%) |
| Highest severity type | Resource (3.6) |
| Most affected phase | Support/Return |

## Top 5 Systemic Issues

1. **Information gaps at decision points** - 9 instances
2. **Time pressure compounds friction** - 7 instances
3. **Recovery flows are painful** - 6 instances
4. **Channel transitions cause drops** - 5 instances
5. **Policy barriers feel arbitrary** - 3 instances

## Recommended Priorities

1. Implement contextual help across digital touchpoints
2. Redesign recovery flows as first-class journeys
3. Add "quick path" options for time-pressured users
4. Smooth channel transitions with context handoff
5. Humanise policy communications

## Barriers Requiring Immediate Attention

| Barrier | Severity | Journeys Affected | Recommended Fix |
|---------|----------|-------------------|-----------------|
| Sizing uncertainty | 4 | Shopping | Size recommendation AI |
| Return process complexity | 4 | Shopping, Subscription | One-click returns |
| Terms confusion | 4 | Finance | Plain language rewrite |
```

## Quality Checklist

Analysis should include:

- [ ] Complete barrier inventory with sources
- [ ] Analysis by type, phase, channel
- [ ] Systemic patterns identified (not just lists)
- [ ] Persona/role correlation
- [ ] Priority matrix
- [ ] Actionable recommendations
- [ ] Specific barriers flagged for immediate attention

## Related Skills

- `journey-analyser` - Single journey deep-dive
- `completeness-checker` - Ensure barriers are well-documented
- `journey-builder` - Act on barrier findings
