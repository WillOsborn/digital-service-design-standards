---
name: journey-analyser
description: Analyses journey data to identify pain points, barrier clusters, emotional patterns, and improvement priorities. Use when reviewing a journey for insights. Triggers on "analyse journey", "journey analysis", "find pain points", "identify issues in journey", "journey insights".
allowed-tools: Read, Glob, Grep
---

# Journey Analyser Skill

## Overview

This skill analyses journey JSON files to extract insights about pain points, barrier patterns, emotional troughs, channel friction, and improvement opportunities. It provides actionable analysis rather than just displaying data.

## When to Use

- User asks to "analyse a journey" or "find pain points"
- User wants to understand where friction exists
- User needs to prioritise improvements
- User asks "what's wrong with this journey?"
- After creating or migrating a journey, to review it

## Analysis Dimensions

### 1. Emotional Analysis
- Identify emotional troughs (intensity -1 or -2)
- Find emotional peaks (intensity +2)
- Map emotional trajectory across phases
- Calculate average emotion per phase
- Identify biggest drops between steps

### 2. Barrier Analysis
- Count barriers by type
- Identify high-severity barriers (4-5)
- Find barrier clusters (multiple barriers in sequence)
- Map barriers to phases
- Look for systemic patterns

### 3. Channel Analysis
- Map channel transitions
- Identify forced channel switches
- Find channel/emotion correlations
- Check service model distribution

### 4. Opportunity Analysis
- Count opportunities vs barriers ratio
- Identify opportunity gaps (steps with barriers but no opportunities)
- Group opportunities by theme

## Process

### Step 1: Load Journey Data

```bash
# Read the journey file
cat v1.1/examples/journeys/[journey-file].json
```

### Step 2: Generate Metrics

Calculate key statistics:

```
**Journey Overview**
- Total phases: [count]
- Total steps: [count]
- Total barriers: [count]
- Total opportunities: [count]
- Barrier/Opportunity ratio: [ratio]

**Emotional Profile**
- Average intensity: [number]
- Lowest point: [step name] at [intensity]
- Highest point: [step name] at [intensity]
- Phases below neutral: [list]
```

### Step 3: Identify Pain Points

Find and rank pain points:

```
**Critical Pain Points** (barriers with severity 4-5)

1. [Step Name] - Phase: [Phase]
   - Barrier: [type] - [description]
   - Severity: [5/4]
   - Emotion at this step: [emoji] [intensity]
   - Impact: [why this matters]

2. [Next critical pain point]
```

### Step 4: Find Barrier Clusters

Look for sequences of friction:

```
**Barrier Clusters** (3+ consecutive steps with barriers)

Cluster 1: [Phase Name], Steps [X-Y]
- Step A: [barrier type]
- Step B: [barrier type]
- Step C: [barrier type]
→ Pattern: [what's causing this sequence]
→ Compound effect: [how these interact]
```

### Step 5: Emotional Trajectory

Map the emotional journey:

```
**Emotional Trajectory**

Phase 1: [Name]
  Step 1: 😊 +1 → Step 2: 😐 0 → Step 3: 😟 -1
  Trend: Declining ↘

Phase 2: [Name]
  Step 4: 😟 -1 → Step 5: 😫 -2 → Step 6: 😐 0
  Trend: Valley then recovery ↘↗

[Visual representation]
+2 |     ●
+1 | ●       ●
 0 |   ●         ●   ●
-1 |       ●           ●
-2 |         ●
   └─────────────────────
     1 2 3 4 5 6 7 8 9
```

### Step 6: Channel Analysis

Review channel patterns:

```
**Channel Distribution**
- Digital: [X] steps ([%])
- Telecom: [Y] steps ([%])
- Physical: [Z] steps ([%])

**Service Model**
- Self-service: [X] steps
- Managed: [Y] steps
- Both: [Z] steps

**Channel Transitions**
- Smooth: [list of good transitions]
- Forced: [list of jarring switches]
  → [Step A] app → [Step B] phone (emotion dropped from +1 to -1)
```

### Step 7: Prioritised Recommendations

Synthesise findings into actionable recommendations:

```
**Priority Improvements**

🔴 Critical (address immediately)
1. [Specific recommendation]
   - Affects: [step/phase]
   - Current barrier: [what's wrong]
   - Suggested fix: [what to do]
   - Expected impact: [emotional/efficiency improvement]

🟠 Important (significant improvement)
2. [Recommendation]
   - ...

🟡 Nice to have (polish)
3. [Recommendation]
   - ...
```

## Analysis Templates

### Emotional Drop Analysis
```
**Significant Emotional Drops** (2+ point decrease)

[Step A] → [Step B]
- Drop: +1 → -1 (2 points)
- What changed: [channel switch / barrier introduced / etc.]
- Root cause: [analysis]
```

### Barrier Type Distribution
```
**Barriers by Type**

| Type          | Count | Avg Severity | Phases Affected |
|---------------|-------|--------------|-----------------|
| knowledge     | 3     | 2.3          | Research, Purchase |
| resource      | 2     | 4.0          | Delivery |
| technology    | 1     | 3.0          | Purchase |
```

### Opportunity Gap Analysis
```
**Steps with Barriers but No Opportunities**

These represent missed improvement documentation:

1. [Step Name] - has [barrier type] barrier, no opportunity noted
2. [Step Name] - has [barrier type] barrier, no opportunity noted

Consider: What could address these barriers?
```

## Example Output

```
# Journey Analysis: Sarah Martinez Clothes Shopping

## Overview
- 8 phases, 24 steps
- 12 barriers (avg severity: 2.6)
- 15 opportunities
- Barrier/Opportunity ratio: 0.8 (good - more opportunities than barriers)

## Emotional Summary
- Average: +0.3 (slightly positive)
- Lowest: "Fit Disappointment" at -2 (Phase: Delivery & Try-on)
- Highest: "Finds Perfect Dress" at +2 (Phase: Browsing & Selection)

## Critical Pain Points

🔴 **1. Sizing Uncertainty** (Severity 4)
- Phase: Browsing & Selection
- Step: "Evaluates Fit"
- Type: Knowledge barrier
- Impact: Creates downstream return, emotional trough, wasted time
- Opportunity noted: Yes - "AI-powered size recommendations"

🔴 **2. Fit Disappointment** (Severity 4)
- Phase: Delivery & Try-on
- Step: "Tries On Dress"
- Type: Expectation gap
- Impact: Emotional low point of journey, triggers return flow
- Linked to: Sizing uncertainty upstream

## Barrier Clusters

**Return Process Friction** (Steps 19-22)
- Decision to return → Initiates return → Packages item → Ships return
- 4 consecutive steps with barriers
- Pattern: Process complexity compounds
- Each step has resource or process barrier

## Channel Analysis

| Channel | Steps | Emotion Avg |
|---------|-------|-------------|
| App | 15 | +0.5 |
| Email | 4 | +0.2 |
| In-person | 3 | -0.3 |
| Website | 2 | +0.4 |

**Insight**: In-person interactions have lower emotional average -
these are delivery/return scenarios where friction occurs.

## Priority Recommendations

🔴 **1. Address sizing uncertainty upstream**
- Implement size recommendation engine
- Show fit confidence scores
- Add customer photos/reviews by body type
- Expected: Reduce returns by 30-40%

🟠 **2. Streamline return initiation**
- One-tap return from order history
- Pre-populated return labels
- Expected: Reduce return friction, maintain positive exit

🟡 **3. Improve try-on experience**
- Set expectations before delivery
- "How to get best fit" guidance
- Expected: Reduce disappointment intensity

## Opportunity Gaps

Steps with barriers but no documented opportunities:
- "Waits for Delivery" - has resource barrier (waiting), no opportunity
- "Tracks Package" - has communications barrier, no opportunity

Consider adding opportunities for these friction points.
```

## Quality Checklist

Analysis should include:

- [ ] Quantitative overview (counts, ratios, averages)
- [ ] Emotional trajectory visualisation
- [ ] Critical pain points identified and ranked
- [ ] Barrier clusters identified
- [ ] Channel patterns analysed
- [ ] Prioritised recommendations
- [ ] Opportunity gaps noted
- [ ] Actionable next steps

## Related Skills

- `journey-renderer` - Visualise the journey being analysed
- `barrier-mapper` - Cross-journey barrier analysis
- `journey-builder` - Create/improve journey based on analysis
