---
name: portfolio-reporter
description: Generates reports on the DSDS artifact portfolio - coverage analysis, quality summaries, barrier aggregation, and health metrics. Use for governance, planning, and status updates. Triggers on "portfolio report", "coverage report", "quality summary", "health check", "what's our status", "artifact stats".
allowed-tools: Read, Glob, Write
---

# Portfolio Reporter Skill

## Overview

This skill generates reports across the entire DSDS artifact collection. It provides coverage analysis, quality summaries, barrier aggregation, and overall health metrics for governance and planning.

## When to Use

- User asks for "portfolio status" or "coverage report"
- Governance review meetings
- Planning which artifacts to create next
- Quality assessment across the collection
- Identifying systemic issues (barrier patterns)
- Executive summaries

## Report Types

### 1. Portfolio Summary

High-level overview of what exists:

```
# DSDS Portfolio Summary
Generated: 2026-01-15

## Artifact Counts
| Type | Count | Avg Completeness | With Relationships |
|------|-------|------------------|-------------------|
| Personas | 12 | 78% | 10 (83%) |
| Roles | 8 | 72% | 6 (75%) |
| Pairings | 6 | 80% | 6 (100%) |
| Journeys | 21 | 75% | 21 (100%) |

## Health Score: B (76%)

**Strengths:**
- Good journey coverage
- All pairings connected

**Gaps:**
- 2 personas without journeys
- 2 roles without pairings
- Average completeness below 80%
```

### 2. Coverage Report

Which artifacts are connected vs orphaned:

```
# Coverage Report
Generated: 2026-01-15

## Persona Coverage

✅ **Personas WITH journeys (10):**
| Persona | Journeys | Pairings |
|---------|----------|----------|
| persona-sarah-martinez | 1 | 1 |
| persona-marcus-thompson | 2 | 1 |
...

⚠️ **Personas WITHOUT journeys (2):**
| Persona | Name | Created | Notes |
|---------|------|---------|-------|
| persona-first-time-buyer | Alex Chen | 2026-01-05 | No journeys yet |
| persona-enterprise-client | BigCorp PM | 2026-01-10 | Draft status |

## Role Coverage

✅ **Roles WITH pairings (6):**
...

⚠️ **Roles WITHOUT pairings (2):**
| Role | Name | Notes |
|------|------|-------|
| role-it-administrator | IT Administrator | New, needs pairing |
| role-support-caller | Support Caller | Consider if needed |

## Recommendations
1. Create journey for persona-first-time-buyer (high priority - created 10 days ago)
2. Create pairing for role-it-administrator
3. Review if role-support-caller is needed
```

### 3. Quality Report

Completeness and quality scores:

```
# Quality Report
Generated: 2026-01-15

## Overall Quality: B (76%)

## By Artifact Type

### Personas (78% average)
| Grade | Count | Artifacts |
|-------|-------|-----------|
| A (90%+) | 3 | sarah-martinez, marcus-thompson, vip-client |
| B (75-89%) | 5 | first-time-buyer, enterprise-client, ... |
| C (60-74%) | 3 | draft-persona-1, draft-persona-2, ... |
| D (<60%) | 1 | incomplete-persona |

### Journeys (75% average)
...

## Common Quality Issues

1. **Missing research sources** (15 artifacts)
   - Affects credibility and traceability
   - Consider adding research links

2. **Brief descriptions** (8 artifacts)
   - Under 50 characters
   - Add context for usability

3. **Empty opportunity fields** (12 journey steps)
   - Barriers noted but no improvements
   - Review for opportunity documentation

## Lowest Quality Artifacts (need attention)
| Artifact | Score | Key Issues |
|----------|-------|------------|
| persona-incomplete | 45% | Missing needs, frustrations |
| journey-draft-v1 | 52% | No emotions, sparse thoughts |
```

### 4. Barrier Analysis Report

Aggregated view of barriers across journeys:

```
# Barrier Analysis Report
Generated: 2026-01-15

## Summary
- Total barriers: 87 across 21 journeys
- Average per journey: 4.1
- Average severity: 2.8

## By Type
| Type | Count | Avg Severity | Top Journeys |
|------|-------|--------------|--------------|
| knowledge | 24 (28%) | 3.1 | onboarding, purchase |
| process | 18 (21%) | 2.9 | support, returns |
| resource | 15 (17%) | 3.4 | all time-constrained |
| technology | 12 (14%) | 2.5 | mobile journeys |
| communications | 8 (9%) | 2.3 | status updates |
| policy | 5 (6%) | 3.2 | returns, cancellation |
| cultural | 3 (3%) | 2.0 | help-seeking |
| governance | 1 (1%) | 4.0 | escalation |
| vision | 1 (1%) | 3.0 | product gaps |

## Systemic Issues (appear in 3+ journeys)

🔴 **1. Sizing/Fit Uncertainty**
- Type: knowledge
- Appears in: 5 journeys
- Avg severity: 3.8
- Pattern: Customers can't determine fit/sizing before purchase
- Recommendation: Size recommendation system

🔴 **2. Status Visibility**
- Type: communications
- Appears in: 4 journeys
- Avg severity: 2.5
- Pattern: Unclear what's happening during wait periods
- Recommendation: Real-time status updates

🟠 **3. Return Process Complexity**
- Type: process
- Appears in: 3 journeys
- Avg severity: 3.0
- Pattern: Too many steps to initiate returns
- Recommendation: One-click return initiation

## Highest Severity Barriers
| Journey | Step | Type | Severity | Description |
|---------|------|------|----------|-------------|
| journey-returns | Packages Item | process | 5 | No pickup option |
| journey-complaint | Escalation | governance | 4 | No clear owner |
```

### 5. Custom Field Report

Analysis by org-specific fields:

```
# Custom Field Report
Generated: 2026-01-15

## customer_segment Distribution

| Segment | Personas | Journeys | Avg Quality |
|---------|----------|----------|-------------|
| Premium | 4 | 8 | 82% |
| Standard | 5 | 10 | 76% |
| Basic | 2 | 2 | 68% |
| Enterprise | 1 | 1 | 85% |

**Insight:** Basic segment is under-represented and lower quality.

## department Distribution

| Department | Personas | Roles | Journeys |
|------------|----------|-------|----------|
| Retail | 6 | 4 | 12 |
| IT | 2 | 2 | 4 |
| Finance | 2 | 1 | 3 |
| Support | 2 | 1 | 2 |

**Insight:** Retail well-covered. Finance and Support may need more artifacts.

## Compliance

✅ **100% compliant** with required custom fields:
- All personas have customer_segment
- All journeys have product_area

⚠️ **Optional field adoption:**
- crm_id: 60% of personas (7/12)
- squad_owner: 40% of journeys (8/21)
```

### 6. Freshness Report

When artifacts were last updated:

```
# Freshness Report
Generated: 2026-01-15

## Recently Updated (last 30 days)
| Artifact | Last Modified | Modified By |
|----------|---------------|-------------|
| journey-new-onboarding | 2026-01-14 | - |
| persona-sarah-martinez | 2026-01-10 | - |

## Potentially Stale (90+ days)
| Artifact | Last Modified | Age | Recommendation |
|----------|---------------|-----|----------------|
| persona-legacy-user | 2025-10-01 | 106 days | Review or archive |
| journey-old-checkout | 2025-09-15 | 122 days | Validate still accurate |

## Never Validated
These artifacts have no last_validated date in custom fields:
- journey-mobile-purchase
- journey-support-call
- persona-enterprise-client

Consider scheduling validation sessions.
```

## Report Generation

### Process

1. **Read registry index** (or regenerate if stale)
2. **Read org config** for context
3. **Calculate metrics** based on report type
4. **Generate markdown report**
5. **Optionally save to reports/ folder**

### Output Options

```
AskUserQuestion:
  question: "How should I deliver this report?"
  options:
    - label: "Display here"
      description: "Show the report in this conversation"
    - label: "Save to file"
      description: "Save as markdown in reports/ folder"
    - label: "Both"
      description: "Display and save"
```

### Saved Report Naming

```
reports/
├── portfolio-summary-2026-01-15.md
├── coverage-report-2026-01-15.md
├── quality-report-2026-01-15.md
├── barrier-analysis-2026-01-15.md
└── custom-fields-2026-01-15.md
```

## Example Session

```
User: Give me a portfolio status report

Claude: I'll generate a portfolio summary.

[Reads registry index]

# DSDS Portfolio Summary
Generated: 2026-01-15 14:30

## Overview
| Type | Count | Connected | Quality |
|------|-------|-----------|---------|
| Personas | 12 | 10 (83%) | 78% |
| Roles | 8 | 6 (75%) | 72% |
| Pairings | 6 | 6 (100%) | 80% |
| Journeys | 21 | 21 (100%) | 75% |

## Health Score: B (76%)

**Good:**
- Strong journey coverage
- All pairings properly connected
- Recent activity (8 updates this month)

**Needs attention:**
- 2 personas without journeys
- 2 roles without pairings
- 4 artifacts below 60% quality

## Quick Actions
1. Create journey for persona-first-time-buyer
2. Improve quality of persona-incomplete (45%)
3. Review stale artifacts (2 over 90 days old)

Would you like a deeper dive on any of these areas?
- Coverage details
- Quality breakdown
- Barrier analysis
- Custom field distribution
```

## Quality Checklist

Reports should include:

- [ ] Clear generation timestamp
- [ ] Summary metrics at top
- [ ] Detailed breakdowns
- [ ] Visual indicators (✅ ⚠️ 🔴)
- [ ] Actionable recommendations
- [ ] Comparison context (averages, targets)
- [ ] Next steps or drill-down options

## Related Skills

- `artifact-registry` - Provides the data for reports
- `barrier-mapper` - Detailed barrier analysis
- `completeness-checker` - Individual artifact quality
- `standards-enforcer` - Compliance details
