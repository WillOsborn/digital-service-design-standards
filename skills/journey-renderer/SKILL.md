---
name: journey-renderer
description: Renders journey JSON as a visual horizontal journey map artifact. Use when displaying journey data, visualising customer journeys, or presenting journey analysis. Triggers on "render journey", "show journey", "visualise journey", "display journey map", "journey artifact".
allowed-tools: Read, Glob
---

# Journey Renderer Skill

## Overview

This skill renders Digital Service Design journey JSON files as visual horizontal journey maps using Claude artifacts. It transforms structured JSON data into the standard service design swimlane format that makes patterns visible at a glance.

## When to Use

- User asks to "render a journey" or "show the journey"
- User wants to "visualise" or "display" a journey
- User provides journey JSON and wants it displayed
- User asks to "create a journey map" from existing data
- After creating or loading a journey, to present it visually

## Available Lanes & Data Elements

The renderer supports **10 data elements** that can be shown or hidden:

### Step-Level Lanes (shown as horizontal swimlanes)
| Lane | Data Location | Description |
|------|---------------|-------------|
| **Actions** | `step.lane_content.actions` | What the customer is doing (list) |
| **Thoughts** | `step.lane_content.thoughts` | What the customer is thinking (text) |
| **Emotions** | `step.lane_content.emotions` | Emotional state -2 to +2 (emotion) |
| **Channels** | `step.lane_content.channels` | Touchpoints used (channel objects) |
| **Barriers** | `step.lane_content.barriers` | Friction points (barrier objects) |
| **Opportunities** | `step.lane_content.opportunities` | Potential improvements (list) |

### Phase-Level Data (shown as row spanning phase columns)
| Element | Data Location | Description |
|---------|---------------|-------------|
| **Phase Goals** | `phase.goal` | The goal for each phase |
| **Moments that Matter** | `phase.moments_that_matter[]` | Key moments linked to specific steps via `step_id` |

### Journey-Level Data (shown in header/footer sections)
| Element | Data Location | Description |
|---------|---------------|-------------|
| **Success Criteria** | `journey.context.success_criteria` | Metrics and targets for the journey |
| **Research Sources** | `journey.validation.research_sources` | Sources validating journey data |

## Visual Format

The renderer creates a horizontal journey map with:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Journey Title                                                           │
│ Persona: Sarah Martinez                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ SUCCESS CRITERIA: Time to purchase < 5min | Return process < 10min     │
├─────────────────────────────────────────────────────────────────────────┤
│ PHASES      │ Discovery          │ Browsing & Selection  │ Purchase    │
├─────────────┼────────────────────┼───────────────────────┼─────────────┤
│ PHASE GOALS │ Become aware of... │ Find desirable item   │ Complete... │
├─────────────┼────────────────────┼───────────────────────┼─────────────┤
│ STEPS       │ Step 1 │ Step 2   │ Step 3 │ Step 4       │ Step 5      │
├─────────────┼────────┼──────────┼────────┼──────────────┼─────────────┤
│ Moments ⭐  │        │          │   ⭐   │              │             │
├─────────────┼────────┼──────────┼────────┼──────────────┼─────────────┤
│ Actions     │ ...    │ ...      │ ...    │ ...          │ ...         │
├─────────────┼────────┼──────────┼────────┼──────────────┼─────────────┤
│ Thoughts    │ ...    │ ...      │ ...    │ ...          │ ...         │
├─────────────┼────────┼──────────┼────────┼──────────────┼─────────────┤
│ Emotions    │ 😊 +1  │ 😐 0     │ 😟 -1  │ 😊 +2        │ 😐 0        │
├─────────────┼────────┼──────────┼────────┼──────────────┼─────────────┤
│ Channels    │ App    │ App      │ App    │ App          │ In-person   │
├─────────────┼────────┼──────────┼────────┼──────────────┼─────────────┤
│ Barriers    │        │ ⚠️ Tech  │        │ ⚠️ Knowledge │             │
├─────────────┼────────┼──────────┼────────┼──────────────┼─────────────┤
│ Opportunities│       │ Cache... │        │ Add fit...   │             │
├─────────────┴────────┴──────────┴────────┴──────────────┴─────────────┤
│ RESEARCH: Customer interviews (high) | Analytics (medium)             │
└───────────────────────────────────────────────────────────────────────┘
```

## Process

### Step 1: Load the Journey Data

If user provides a file path:
```bash
# Read the journey JSON
cat v1.1/examples/journeys/[journey-file].json
```

If user provides JSON directly, parse it from their message.

### Step 2: Determine Lane Selection

**IMPORTANT**: Ask the user which lanes/elements to include, OR respect selections they've already made.

Default lanes (if not specified): Actions, Thoughts, Emotions, Channels, Barriers

All available options:
```javascript
const laneConfig = {
  // Step-level lanes
  actions: true,        // Default ON
  thoughts: true,       // Default ON
  emotions: true,       // Default ON
  channels: true,       // Default ON
  barriers: true,       // Default ON
  opportunities: false, // Default OFF (can add clutter)

  // Phase-level elements
  phaseGoals: false,    // Default OFF
  momentsThatMatter: false, // Default OFF

  // Journey-level elements
  successCriteria: false,  // Default OFF
  researchSources: false   // Default OFF
};
```

When the user specifies lanes to include/exclude, update this configuration accordingly.

### Step 3: Extract Key Data

From the journey JSON, extract:
- `journey.title` - Main heading
- `journey.context.success_criteria` - Success metrics (if enabled)
- `journey.phases[]` - Phase names, goals, and moments
- `journey.phases[].steps[]` - Individual steps
- `lanes.standard[]` - Which lanes are defined
- Step `lane_content` - Data for each cell
- `journey.validation.research_sources` - Research backing (if enabled)

### Step 4: Generate the Artifact

Create a React artifact using the template below. The artifact should:
- Use horizontal scrolling for many steps
- Colour-code phases distinctly
- Show emotion indicators visually
- Highlight barriers with warning styling
- Truncate long text with hover expansion

## React Artifact Template

When rendering, create an artifact with this structure. **IMPORTANT**: Only include lanes/sections where the corresponding config option is `true`.

```jsx
import React, { useState } from 'react';

const JourneyMap = () => {
  // Lane configuration - set based on user selection
  const laneConfig = {
    actions: true,
    thoughts: true,
    emotions: true,
    channels: true,
    barriers: true,
    opportunities: false,      // Include if user selected
    phaseGoals: false,         // Include if user selected
    momentsThatMatter: false,  // Include if user selected
    successCriteria: false,    // Include if user selected
    researchSources: false     // Include if user selected
  };

  // Journey data extracted from JSON
  const journeyData = {
    title: "[JOURNEY TITLE]",
    persona: "[PERSONA NAME]",
    successCriteria: [
      // From journey.context.success_criteria
      { metric: "Time to complete purchase", target: "Under 5 minutes" }
    ],
    researchSources: [
      // From journey.validation.research_sources
      { source: "Customer interviews", type: "interview", confidence: "high" }
    ],
    phases: [
      {
        id: "discovery",
        name: "Discovery",
        goal: "Become aware of a compelling offer",  // From phase.goal
        momentsThatMatter: [
          // From phase.moments_that_matter
          { step_id: "receive-notification", moment: "Notification arrives at right time", importance: "high" }
        ],
        steps: [
          {
            id: "step-1",
            name: "Step Name",
            actions: ["Action 1", "Action 2"],
            thoughts: "What they're thinking...",
            emotion: { state: "intrigued", intensity: 1 },
            channels: [{ type: "app", name: "App Name" }],
            barriers: [{ type: "technology", description: "...", severity: 3 }],
            opportunities: ["Opportunity 1", "Opportunity 2"]
          }
        ]
      }
    ]
  };

  // Build lookup for moments that matter by step_id
  const momentsLookup = {};
  journeyData.phases.forEach(phase => {
    (phase.momentsThatMatter || []).forEach(m => {
      momentsLookup[m.step_id] = m;
    });
  });

  const getEmotionDisplay = (intensity) => {
    const emotions = {
      '-2': { emoji: '😫', color: '#f44336', label: 'Very Negative' },
      '-1': { emoji: '😟', color: '#ff9800', label: 'Negative' },
      '0': { emoji: '😐', color: '#9e9e9e', label: 'Neutral' },
      '1': { emoji: '😊', color: '#8bc34a', label: 'Positive' },
      '2': { emoji: '😄', color: '#4caf50', label: 'Very Positive' }
    };
    return emotions[intensity.toString()] || emotions['0'];
  };

  const getImportanceStyle = (importance) => {
    const styles = {
      critical: { bg: '#ffebee', border: '#f44336', icon: '⭐⭐' },
      high: { bg: '#fff3e0', border: '#ff9800', icon: '⭐' },
      medium: { bg: '#e3f2fd', border: '#2196f3', icon: '○' },
      low: { bg: '#f5f5f5', border: '#9e9e9e', icon: '·' }
    };
    return styles[importance] || styles.medium;
  };

  const phaseColors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#607D8B'];

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{journeyData.title}</h1>
        <p style={{ margin: '8px 0 0', color: '#666' }}>Persona: {journeyData.persona}</p>
      </div>

      {/* Success Criteria - if enabled */}
      {laneConfig.successCriteria && journeyData.successCriteria?.length > 0 && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          borderLeft: '4px solid #4caf50'
        }}>
          <strong style={{ fontSize: '12px', textTransform: 'uppercase', color: '#2e7d32' }}>Success Criteria</strong>
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {journeyData.successCriteria.map((sc, i) => (
              <div key={i} style={{ fontSize: '13px' }}>
                <span style={{ color: '#555' }}>{sc.metric}:</span>{' '}
                <span style={{ fontWeight: '500' }}>{sc.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journey Map Container - Horizontal Scroll */}
      <div style={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            {/* Phase Row */}
            <tr>
              <th style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderBottom: '2px solid #e0e0e0',
                position: 'sticky',
                left: 0,
                zIndex: 10,
                minWidth: '120px'
              }}>Phases</th>
              {journeyData.phases.map((phase, phaseIndex) => (
                <th
                  key={phase.id}
                  colSpan={phase.steps.length}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: phaseColors[phaseIndex % phaseColors.length],
                    color: 'white',
                    fontWeight: '600',
                    textAlign: 'center',
                    borderBottom: '2px solid #e0e0e0'
                  }}
                >
                  {phase.name}
                </th>
              ))}
            </tr>

            {/* Phase Goals Row - if enabled */}
            {laneConfig.phaseGoals && (
              <tr>
                <th style={{
                  padding: '10px 12px',
                  backgroundColor: '#f5f5f5',
                  borderBottom: '1px solid #e0e0e0',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10,
                  fontWeight: '500',
                  fontSize: '12px'
                }}>Phase Goals</th>
                {journeyData.phases.map((phase, phaseIndex) => (
                  <td
                    key={`${phase.id}-goal`}
                    colSpan={phase.steps.length}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: `${phaseColors[phaseIndex % phaseColors.length]}11`,
                      borderBottom: '1px solid #e0e0e0',
                      borderLeft: `3px solid ${phaseColors[phaseIndex % phaseColors.length]}`,
                      fontSize: '12px',
                      fontStyle: 'italic',
                      color: '#555'
                    }}
                  >
                    {phase.goal}
                  </td>
                ))}
              </tr>
            )}

            {/* Steps Row */}
            <tr>
              <th style={{
                padding: '10px 12px',
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
                position: 'sticky',
                left: 0,
                zIndex: 10,
                fontWeight: '500'
              }}>Steps</th>
              {journeyData.phases.flatMap((phase, phaseIndex) =>
                phase.steps.map((step, stepIndex) => (
                  <th
                    key={step.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: `${phaseColors[phaseIndex % phaseColors.length]}22`,
                      borderBottom: '1px solid #e0e0e0',
                      borderLeft: stepIndex === 0 ? `3px solid ${phaseColors[phaseIndex % phaseColors.length]}` : '1px solid #e0e0e0',
                      fontWeight: '500',
                      fontSize: '13px',
                      minWidth: '150px',
                      maxWidth: '200px'
                    }}
                  >
                    {step.name}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {/* Moments That Matter Lane - if enabled */}
            {laneConfig.momentsThatMatter && (
              <tr>
                <td style={{
                  padding: '10px 12px',
                  backgroundColor: '#fff8e1',
                  fontWeight: '500',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10,
                  fontSize: '12px'
                }}>Moments ⭐</td>
                {journeyData.phases.flatMap((phase, phaseIndex) =>
                  phase.steps.map((step, stepIndex) => {
                    const moment = momentsLookup[step.id];
                    const style = moment ? getImportanceStyle(moment.importance) : null;
                    return (
                      <td
                        key={`${step.id}-moments`}
                        style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid #e0e0e0',
                          borderLeft: stepIndex === 0 ? `3px solid ${phaseColors[phaseIndex % phaseColors.length]}` : '1px solid #e0e0e0',
                          verticalAlign: 'top',
                          fontSize: '11px',
                          backgroundColor: moment ? style.bg : 'transparent'
                        }}
                      >
                        {moment && (
                          <div style={{
                            padding: '6px 8px',
                            borderLeft: `3px solid ${style.border}`,
                            borderRadius: '0 4px 4px 0'
                          }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {style.icon} {moment.importance}
                            </div>
                            <div>{moment.moment}</div>
                          </div>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            )}

            {/* Actions Lane - if enabled */}
            {laneConfig.actions && (
              <tr>
                <td style={{
                  padding: '10px 12px',
                  backgroundColor: '#f9f9f9',
                  fontWeight: '500',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10
                }}>Actions</td>
                {journeyData.phases.flatMap((phase, phaseIndex) =>
                  phase.steps.map((step, stepIndex) => (
                    <td
                      key={`${step.id}-actions`}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #e0e0e0',
                        borderLeft: stepIndex === 0 ? `3px solid ${phaseColors[phaseIndex % phaseColors.length]}` : '1px solid #e0e0e0',
                        verticalAlign: 'top',
                        fontSize: '12px'
                      }}
                    >
                      <ul style={{ margin: 0, paddingLeft: '16px' }}>
                        {(step.actions || []).map((action, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{action}</li>
                        ))}
                      </ul>
                    </td>
                  ))
                )}
              </tr>
            )}

            {/* Thoughts Lane - if enabled */}
            {laneConfig.thoughts && (
              <tr>
                <td style={{
                  padding: '10px 12px',
                  backgroundColor: '#f9f9f9',
                  fontWeight: '500',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10
                }}>Thoughts</td>
                {journeyData.phases.flatMap((phase, phaseIndex) =>
                  phase.steps.map((step, stepIndex) => (
                    <td
                      key={`${step.id}-thoughts`}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #e0e0e0',
                        borderLeft: stepIndex === 0 ? `3px solid ${phaseColors[phaseIndex % phaseColors.length]}` : '1px solid #e0e0e0',
                        verticalAlign: 'top',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        color: '#555'
                      }}
                    >
                      {step.thoughts && `"${step.thoughts}"`}
                    </td>
                  ))
                )}
              </tr>
            )}

            {/* Emotions Lane - if enabled */}
            {laneConfig.emotions && (
              <tr>
                <td style={{
                  padding: '10px 12px',
                  backgroundColor: '#f9f9f9',
                  fontWeight: '500',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10
                }}>Emotions</td>
                {journeyData.phases.flatMap((phase, phaseIndex) =>
                  phase.steps.map((step, stepIndex) => {
                    const emotion = getEmotionDisplay(step.emotion?.intensity || 0);
                    return (
                      <td
                        key={`${step.id}-emotions`}
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #e0e0e0',
                          borderLeft: stepIndex === 0 ? `3px solid ${phaseColors[phaseIndex % phaseColors.length]}` : '1px solid #e0e0e0',
                          textAlign: 'center',
                          backgroundColor: `${emotion.color}15`
                        }}
                      >
                        <div style={{ fontSize: '24px' }}>{emotion.emoji}</div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          {step.emotion?.state || 'neutral'}
                        </div>
                      </td>
                    );
                  })
                )}
              </tr>
            )}

            {/* Channels Lane - if enabled */}
            {laneConfig.channels && (
              <tr>
                <td style={{
                  padding: '10px 12px',
                  backgroundColor: '#f9f9f9',
                  fontWeight: '500',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10
                }}>Channels</td>
                {journeyData.phases.flatMap((phase, phaseIndex) =>
                  phase.steps.map((step, stepIndex) => (
                    <td
                      key={`${step.id}-channels`}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #e0e0e0',
                        borderLeft: stepIndex === 0 ? `3px solid ${phaseColors[phaseIndex % phaseColors.length]}` : '1px solid #e0e0e0',
                        verticalAlign: 'top',
                        fontSize: '12px'
                      }}
                    >
                      {(step.channels || []).map((channel, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            marginRight: '4px',
                            marginBottom: '4px',
                            backgroundColor: channel.category === 'physical' ? '#e8f5e9' : '#e3f2fd',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}
                        >
                          {channel.name || channel.type}
                        </div>
                      ))}
                    </td>
                  ))
                )}
              </tr>
            )}

            {/* Barriers Lane - if enabled */}
            {laneConfig.barriers && (
              <tr>
                <td style={{
                  padding: '10px 12px',
                  backgroundColor: '#f9f9f9',
                  fontWeight: '500',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10
                }}>Barriers</td>
                {journeyData.phases.flatMap((phase, phaseIndex) =>
                  phase.steps.map((step, stepIndex) => (
                    <td
                      key={`${step.id}-barriers`}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #e0e0e0',
                        borderLeft: stepIndex === 0 ? `3px solid ${phaseColors[phaseIndex % phaseColors.length]}` : '1px solid #e0e0e0',
                        verticalAlign: 'top',
                        fontSize: '12px',
                        backgroundColor: (step.barriers || []).length > 0 ? '#fff3e0' : 'transparent'
                      }}
                    >
                      {(step.barriers || []).map((barrier, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '6px 8px',
                            marginBottom: '4px',
                            backgroundColor: '#ffecb3',
                            borderLeft: `3px solid ${barrier.severity >= 4 ? '#f44336' : '#ff9800'}`,
                            borderRadius: '0 4px 4px 0',
                            fontSize: '11px'
                          }}
                        >
                          <strong style={{ textTransform: 'capitalize' }}>{barrier.type}</strong>
                          {barrier.severity && <span style={{ color: '#666' }}> (S{barrier.severity})</span>}
                          : {barrier.description}
                        </div>
                      ))}
                    </td>
                  ))
                )}
              </tr>
            )}

            {/* Opportunities Lane - if enabled */}
            {laneConfig.opportunities && (
              <tr>
                <td style={{
                  padding: '10px 12px',
                  backgroundColor: '#e8f5e9',
                  fontWeight: '500',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10
                }}>Opportunities</td>
                {journeyData.phases.flatMap((phase, phaseIndex) =>
                  phase.steps.map((step, stepIndex) => (
                    <td
                      key={`${step.id}-opportunities`}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #e0e0e0',
                        borderLeft: stepIndex === 0 ? `3px solid ${phaseColors[phaseIndex % phaseColors.length]}` : '1px solid #e0e0e0',
                        verticalAlign: 'top',
                        fontSize: '12px',
                        backgroundColor: (step.opportunities || []).length > 0 ? '#e8f5e9' : 'transparent'
                      }}
                    >
                      {(step.opportunities || []).map((opp, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '4px 8px',
                            marginBottom: '4px',
                            backgroundColor: '#c8e6c9',
                            borderLeft: '3px solid #4caf50',
                            borderRadius: '0 4px 4px 0',
                            fontSize: '11px'
                          }}
                        >
                          💡 {opp}
                        </div>
                      ))}
                    </td>
                  ))
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Research Sources Footer - if enabled */}
      {laneConfig.researchSources && journeyData.researchSources?.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          borderLeft: '4px solid #9e9e9e'
        }}>
          <strong style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>Research Sources</strong>
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {journeyData.researchSources.map((rs, i) => (
              <div
                key={i}
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}
              >
                <span>{rs.source}</span>
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 6px',
                  backgroundColor: rs.confidence === 'high' ? '#c8e6c9' : rs.confidence === 'medium' ? '#fff9c4' : '#ffccbc',
                  borderRadius: '3px',
                  fontSize: '10px'
                }}>
                  {rs.confidence}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px' }}>Emotion Scale</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {['-2', '-1', '0', '1', '2'].map(intensity => {
            const e = getEmotionDisplay(parseInt(intensity));
            return (
              <div key={intensity} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>{e.emoji}</span>
                <span style={{ fontSize: '12px', color: '#666' }}>{e.label} ({intensity})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JourneyMap;
```

## Data Transformation

When processing journey JSON, transform it to the artifact format:

```javascript
// Transform journey JSON to artifact data structure
const transformJourney = (journeyJson) => {
  const journey = journeyJson.journey;

  return {
    title: journey.title,
    persona: journey.context.personaRef || journey.context.persona_id || "Unknown",

    // Journey-level data
    successCriteria: journey.context.success_criteria || [],
    researchSources: journey.validation?.research_sources || [],

    // Phases with goals, moments, and steps
    phases: journey.phases.map(phase => ({
      id: phase.id,
      name: phase.name,
      goal: phase.goal || "",
      momentsThatMatter: phase.moments_that_matter || [],
      steps: phase.steps.map(step => ({
        id: step.id,
        name: step.name,
        // Step-level lane content
        actions: step.lane_content?.actions || [],
        thoughts: step.lane_content?.thoughts || "",
        emotion: step.lane_content?.emotions || { state: "neutral", intensity: 0 },
        channels: step.lane_content?.channels || [],
        barriers: step.lane_content?.barriers || [],
        opportunities: step.lane_content?.opportunities || []
      }))
    }))
  };
};
```

## Customisation Options

The renderer supports **10 configurable elements**. When the user specifies which to include, update `laneConfig` accordingly.

### Configuration Reference

| Config Key | Element | Default | Where it Appears |
|------------|---------|---------|------------------|
| `actions` | Actions | ON | Step row |
| `thoughts` | Thoughts | ON | Step row |
| `emotions` | Emotions | ON | Step row |
| `channels` | Channels | ON | Step row |
| `barriers` | Barriers | ON | Step row |
| `opportunities` | Opportunities | OFF | Step row |
| `phaseGoals` | Phase Goals | OFF | Phase header row |
| `momentsThatMatter` | Moments that Matter | OFF | Step row (linked from phase) |
| `successCriteria` | Success Criteria | OFF | Header section |
| `researchSources` | Research Sources | OFF | Footer section |

### Handling User Selections

When user selects/deselects elements:
- "with all lanes" → set all to `true`
- "without opportunities" → set `opportunities: false`
- "show moments that matter" → set `momentsThatMatter: true`
- "include research sources" → set `researchSources: true`

**CRITICAL**: The artifact MUST reflect user selections. If a user deselects "Opportunities", that lane must NOT appear in the rendered output.

## Display Modes

### Full View (Default)
Shows all lanes with full content. Best for detailed analysis.

### Summary View
Shows only: Steps, Emotions, Barriers. Best for quick overview.

### Presentation View
Larger text, simplified layout. Best for stakeholder presentations.

## Example Usage

### Example 1: Default rendering
```
User: Render the Sarah Martinez clothes shopping journey

Claude: I'll render the Sarah Martinez journey as a visual journey map with the default lanes
(Actions, Thoughts, Emotions, Channels, Barriers).

[Reads the journey JSON file]
[Creates React artifact with laneConfig defaults]

Here's the visual journey map for Sarah Martinez's online clothes shopping experience.
...
```

### Example 2: With specific lanes selected
```
User: Render the Sarah Martinez journey with Moments that Matter and Opportunities included

Claude: I'll render the journey with Moments that Matter and Opportunities enabled.

[Reads the journey JSON file]
[Sets laneConfig: momentsThatMatter: true, opportunities: true]
[Creates React artifact]

Here's the journey map with Moments that Matter highlighted (⭐) and Opportunities (💡) shown.
The map identifies 8 key moments across the journey, with 3 marked as critical...
```

### Example 3: Full view with all elements
```
User: Show me everything - all lanes, success criteria, and research sources

Claude: I'll render the complete journey with all 10 elements enabled.

[Sets all laneConfig options to true]
[Creates React artifact with Success Criteria header, all lanes, Research Sources footer]

Here's the comprehensive view including:
- Success Criteria: 3 metrics defined
- Phase Goals: shown for each of the 7 phases
- Moments that Matter: 8 key moments highlighted
- All 6 step-level lanes
- Research Sources: 4 sources with confidence ratings
```

### Example 4: Excluding specific lanes
```
User: Render the journey but without Thoughts and Channels

Claude: I'll render the journey with Thoughts and Channels hidden.

[Sets laneConfig: thoughts: false, channels: false]
[Creates React artifact without those lanes]

Here's the focused view showing Actions, Emotions, Barriers only...
```

## Quality Checklist

Before presenting the artifact:

- [ ] **Lane selection respected** - Only enabled lanes appear in output
- [ ] All phases are represented with distinct colours
- [ ] Steps are in correct sequence
- [ ] Emotions display with correct emoji/colour
- [ ] Barriers are visually highlighted (severity 4-5 in red)
- [ ] Moments that Matter linked correctly to steps (if enabled)
- [ ] Phase Goals span correct columns (if enabled)
- [ ] Success Criteria shown in header (if enabled)
- [ ] Research Sources shown in footer with confidence badges (if enabled)
- [ ] Opportunities shown with 💡 icon (if enabled)
- [ ] Horizontal scrolling works for long journeys
- [ ] Lane labels are sticky on scroll
- [ ] Text is readable (not too small)
- [ ] Persona reference is shown in header

## Limitations

- Very long journeys (30+ steps) may be hard to read
- Complex nested data in custom lanes needs flattening
- Print view may cut off horizontal content

## Related Skills

- `example-creator` - Creates journey JSON from scratch
- `quality-checker` - Validates journey data before rendering
