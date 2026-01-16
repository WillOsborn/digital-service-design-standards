---
name: persona-renderer
description: Renders persona, role, and pairing JSON as visual card artifacts. Use when displaying persona data, visualising role cards, or presenting pairing analysis. Triggers on "render persona", "show persona", "visualise role", "display pairing", "persona card", "role card artifact".
allowed-tools: Read, Glob
---

# Persona/Role/Pairing Renderer Skill

## Overview

This skill renders Digital Service Design persona, role, and pairing JSON files as visual card artifacts. It transforms structured JSON data into professional-looking cards that communicate key information at a glance.

## When to Use

- User asks to "render a persona" or "show the persona"
- User wants to "visualise" a role card or pairing
- User provides persona/role/pairing JSON and wants it displayed
- After creating or loading persona data, to present it visually

## Available Data Elements

The renderer supports configurable sections for each artifact type. Sections can be shown or hidden based on user preference.

### Core Persona - Configurable Sections
| Section | Data Location | Default | Description |
|---------|---------------|---------|-------------|
| **Identity** | `identity.*` | ON | Name and summary |
| **Demographics** | `demographics.*` | ON | Age, location, education, background |
| **Personal Needs** | `behavioural_attributes.personalNeeds` | ON | Fundamental needs with types |
| **Personal Frustrations** | `behavioural_attributes.personalFrustrations` | ON | Frustrations with severity/context |
| **Motivations** | `behavioural_attributes.motivations` | OFF | What drives them (intrinsic/extrinsic) |
| **Attitudes** | `behavioural_attributes.attitudes` | OFF | Key beliefs by domain |
| **Technology Comfort** | `behavioural_attributes.technologyComfort` | ON | Level, preferred devices |
| **Communication Preferences** | `behavioural_attributes.communicationPreferences` | ON | Preferred/acceptable/avoided channels |
| **Influences** | `behavioural_attributes.influences` | OFF | Who shapes their thinking |
| **Behavioural Patterns** | `behavioural_attributes.behaviouralPatterns` | OFF | Characteristic approaches |
| **Learning Style** | `behavioural_attributes.learningStyle` | OFF | How they learn |
| **Risk Tolerance** | `behavioural_attributes.riskTolerance` | ON | Risk appetite level |
| **Decision Making Style** | `behavioural_attributes.decisionMakingStyle` | ON | How they decide |
| **Research Sources** | `validation.research_sources` | OFF | Research backing with confidence |

### Role Card - Configurable Sections
| Section | Data Location | Default | Description |
|---------|---------------|---------|-------------|
| **Identity** | `identity.*` | ON | Title and description |
| **Role Type** | `roleType` | ON | Consumer, Professional, etc. |
| **Consumer Context** | `roleContext.consumerContext.*` | ON* | Shopping behavior, budget, household |
| **Professional Context** | `roleContext.professionalContext.*` | ON* | Job title, dept, stakeholders, tools |
| **Role-Based Needs** | `roleBasedNeeds` | ON | What the role requires (with priority) |
| **Role-Based Frustrations** | `roleBasedFrustrations` | ON | Friction inherent to role (with severity) |

*Context shown based on roleType - Consumer shows consumerContext, Professional shows professionalContext

### Pairing - Configurable Sections
| Section | Data Location | Default | Description |
|---------|---------------|---------|-------------|
| **Identity** | `identity.*` | ON | Title and description |
| **References** | `references.*` | ON | Linked persona and role IDs |
| **Quote** | `synthesis.quote` | ON | Voice of the pairing |
| **Goals As Experienced** | `synthesis.goalsAsExperienced` | ON | Combined goals with priority/source |
| **Pain Points** | `synthesis.painPoints` | ON | Friction from collision (with severity) |
| **Barriers** | `synthesis.barriers` | ON | 9-type taxonomy with emergesFrom |
| **Opportunities** | `synthesis.opportunities` | ON | Where strengths create advantage |
| **Emotional Context** | `synthesis.emotionalContext` | OFF | Overall emotional tone |
| **Channels** | `extendedContext.channels` | OFF | Preferred interaction channels |
| **Moments That Matter** | `extendedContext.moments_that_matter` | OFF | Critical emotional touchpoints |
| **Use Cases** | `extendedContext.use_cases` | OFF | Common scenarios |
| **Success Metrics** | `extendedContext.success_metrics` | OFF | How success is measured |
| **Research Sources** | `validation.research_sources` | OFF | Research backing |

## Section Configuration

```javascript
// Core Persona configuration
const personaConfig = {
  identity: true,
  demographics: true,
  personalNeeds: true,
  personalFrustrations: true,
  motivations: false,
  attitudes: false,
  technologyComfort: true,
  communicationPreferences: true,
  influences: false,
  behaviouralPatterns: false,
  learningStyle: false,
  riskTolerance: true,
  decisionMakingStyle: true,
  researchSources: false
};

// Role Card configuration
const roleConfig = {
  identity: true,
  roleType: true,
  consumerContext: true,  // Auto-shown for Consumer roles
  professionalContext: true,  // Auto-shown for Professional roles
  roleBasedNeeds: true,
  roleBasedFrustrations: true
};

// Pairing configuration
const pairingConfig = {
  identity: true,
  references: true,
  quote: true,
  goalsAsExperienced: true,
  painPoints: true,
  barriers: true,
  opportunities: true,
  emotionalContext: false,
  channels: false,
  momentsThatMatter: false,
  useCases: false,
  successMetrics: false,
  researchSources: false
};
```

**IMPORTANT**: Respect user selections. If user says "show all sections" set all to true. If user says "without research sources" set researchSources to false.

## Artifact Types

### 1. Core Persona Card

A visual card showing behavioural attributes:

```
┌──────────────────────────────────────────────────┐
│  [Photo placeholder]  SARAH MARTINEZ             │
│                       Core Persona               │
├──────────────────────────────────────────────────┤
│  "I want convenience without sacrificing         │
│   quality for my family."                        │
├──────────────────────────────────────────────────┤
│  TECHNOLOGY         │  COMMUNICATION             │
│  ● Intermediate     │  ● Mobile apps, email      │
│  ● Confident: apps  │  ● As needed               │
│  ● Avoids: complex  │  ● Morning, evening        │
├──────────────────────────────────────────────────┤
│  PERSONAL NEEDS              FRUSTRATIONS        │
│  • Quick solutions           • Wasted time       │
│  • Quality assurance         • Hidden costs      │
│  • Family-friendly           • Complex processes │
├──────────────────────────────────────────────────┤
│  DECISION STYLE                                  │
│  Research-oriented │ Moderate risk │ Reviews     │
└──────────────────────────────────────────────────┘
```

### 2. Role Card

A visual card showing contextual demands:

```
┌──────────────────────────────────────────────────┐
│  WORKING MOM CONSUMER                            │
│  Role Card • Consumer                            │
├──────────────────────────────────────────────────┤
│  "Balancing family needs with personal desires   │
│   within time and budget constraints"            │
├──────────────────────────────────────────────────┤
│  ROLE-BASED NEEDS          FRUSTRATIONS         │
│  • Time efficiency         • Unexpected delays   │
│  • Budget visibility       • Poor communication │
│  • Flexible scheduling     • Rigid processes    │
├──────────────────────────────────────────────────┤
│  SUCCESS METRICS                                 │
│  ✓ Tasks under 5 min  ✓ Within budget           │
│  ✓ No surprises       ✓ Quality maintained      │
└──────────────────────────────────────────────────┘
```

### 3. Pairing Card

Shows persona + role combination with emergent properties:

```
┌──────────────────────────────────────────────────┐
│  SARAH as WORKING MOM CONSUMER                   │
│  Pairing • persona-sarah + role-working-mom      │
├──────────────────────────────────────────────────┤
│  GOALS (as experienced)                          │
│  ★ Find quality items quickly during breaks      │
│  ○ Stay within family budget                     │
│  ○ Avoid returns and hassle                      │
├──────────────────────────────────────────────────┤
│  EMERGENT BARRIERS                               │
│  ┌─────────────────────────────────────────────┐ │
│  │ ⚠ Resource: Limited time for research      │ │
│  │   → Sarah's thoroughness collides with     │ │
│  │     role's time constraints                │ │
│  └─────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│  OPPORTUNITIES                                   │
│  • Leverage research habits with quick compare  │
│  • Surface quality indicators prominently       │
└──────────────────────────────────────────────────┘
```

## React Artifact Templates

### Persona Card Template

```jsx
import React from 'react';

const PersonaCard = () => {
  // Section configuration - set based on user selection
  const config = {
    identity: true,
    demographics: true,
    personalNeeds: true,
    personalFrustrations: true,
    motivations: false,
    attitudes: false,
    technologyComfort: true,
    communicationPreferences: true,
    influences: false,
    behaviouralPatterns: false,
    learningStyle: false,
    riskTolerance: true,
    decisionMakingStyle: true,
    researchSources: false
  };

  // Persona data extracted from JSON
  const persona = {
    identity: {
      name: "[PERSONA NAME]",
      summary: "[SUMMARY]"
    },
    demographics: {
      age: 32,
      location: "Austin, TX",
      education: "Bachelor's degree",
      background: "Marketing professional"
    },
    behavioural_attributes: {
      personalNeeds: [
        { text: "Need 1", type: "autonomy" },
        { text: "Need 2", type: "security" }
      ],
      personalFrustrations: [
        { text: "Frustration 1", severity: 4, context: "When time-pressed" },
        { text: "Frustration 2", severity: 3 }
      ],
      motivations: [
        { text: "Motivation 1", type: "intrinsic" },
        { text: "Motivation 2", type: "social" }
      ],
      attitudes: [
        { domain: "Technology", attitude: "Embraces tools that save time" },
        { domain: "Risk", attitude: "Cautious with new brands" }
      ],
      technologyComfort: {
        level: "intermediate",
        description: "Confident with everyday apps",
        preferredDevices: ["smartphone", "laptop"]
      },
      communicationPreferences: {
        preferred: ["app", "email"],
        acceptable: ["sms"],
        avoided: ["phone"],
        style: "Concise, to the point"
      },
      influences: [
        { source: "Family", description: "Values family opinions" },
        { source: "Reviews", description: "Reads before purchasing" }
      ],
      behaviouralPatterns: [
        { pattern: "Researches thoroughly", context: "Before major purchases" }
      ],
      learningStyle: "Visual and hands-on",
      riskTolerance: "moderate",
      decisionMakingStyle: "Research-oriented, seeks validation"
    },
    validation: {
      research_sources: [
        { source: "User interviews", type: "interview", confidence: "high" }
      ],
      confidence_level: "high"
    }
  };

  const levelColors = {
    beginner: '#ff9800',
    intermediate: '#2196f3',
    advanced: '#4caf50',
    expert: '#9c27b0'
  };

  const riskColors = {
    risk_averse: '#f44336',
    cautious: '#ff9800',
    moderate: '#2196f3',
    risk_tolerant: '#4caf50',
    risk_seeking: '#9c27b0'
  };

  const needTypeColors = {
    recognition: '#e91e63',
    autonomy: '#9c27b0',
    security: '#3f51b5',
    belonging: '#00bcd4',
    growth: '#4caf50',
    mastery: '#ff9800'
  };

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '550px',
      margin: '20px auto',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header - Identity (always shown) */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            {persona.identity.name.charAt(0)}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>{persona.identity.name}</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9 }}>Core Persona</p>
          </div>
        </div>
        {persona.identity.summary && (
          <p style={{ marginTop: '16px', opacity: 0.9, fontStyle: 'italic' }}>
            "{persona.identity.summary}"
          </p>
        )}
      </div>

      {/* Demographics - if enabled */}
      {config.demographics && persona.demographics && (
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          fontSize: '13px'
        }}>
          {persona.demographics.age && <span><strong>Age:</strong> {persona.demographics.age}</span>}
          {persona.demographics.location && <span><strong>Location:</strong> {persona.demographics.location}</span>}
          {persona.demographics.education && <span><strong>Education:</strong> {persona.demographics.education}</span>}
          {persona.demographics.background && <span><strong>Background:</strong> {persona.demographics.background}</span>}
        </div>
      )}

      {/* Technology & Communication - if enabled */}
      {(config.technologyComfort || config.communicationPreferences) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e0e0e0' }}>
          {config.technologyComfort && persona.behavioural_attributes.technologyComfort && (
            <div style={{ padding: '16px 24px', borderRight: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
                Technology Comfort
              </h3>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '16px',
                backgroundColor: levelColors[persona.behavioural_attributes.technologyComfort.level] || '#9e9e9e',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                {persona.behavioural_attributes.technologyComfort.level}
              </div>
              {persona.behavioural_attributes.technologyComfort.preferredDevices && (
                <div style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>
                  <strong>Devices:</strong> {persona.behavioural_attributes.technologyComfort.preferredDevices.join(', ')}
                </div>
              )}
              {persona.behavioural_attributes.technologyComfort.description && (
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                  {persona.behavioural_attributes.technologyComfort.description}
                </div>
              )}
            </div>
          )}
          {config.communicationPreferences && persona.behavioural_attributes.communicationPreferences && (
            <div style={{ padding: '16px 24px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
                Communication
              </h3>
              <div style={{ fontSize: '12px', color: '#555' }}>
                {persona.behavioural_attributes.communicationPreferences.preferred?.length > 0 && (
                  <div><strong>Preferred:</strong> {persona.behavioural_attributes.communicationPreferences.preferred.join(', ')}</div>
                )}
                {persona.behavioural_attributes.communicationPreferences.avoided?.length > 0 && (
                  <div><strong>Avoids:</strong> {persona.behavioural_attributes.communicationPreferences.avoided.join(', ')}</div>
                )}
                {persona.behavioural_attributes.communicationPreferences.style && (
                  <div style={{ marginTop: '4px', fontStyle: 'italic' }}>{persona.behavioural_attributes.communicationPreferences.style}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Personal Needs & Frustrations - if enabled */}
      {(config.personalNeeds || config.personalFrustrations) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e0e0e0' }}>
          {config.personalNeeds && persona.behavioural_attributes.personalNeeds && (
            <div style={{ padding: '16px 24px', borderRight: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
                Personal Needs
              </h3>
              {persona.behavioural_attributes.personalNeeds.map((need, i) => (
                <div key={i} style={{ marginBottom: '8px', fontSize: '13px' }}>
                  <span>{need.text}</span>
                  {need.type && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      backgroundColor: needTypeColors[need.type] || '#9e9e9e',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      {need.type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {config.personalFrustrations && persona.behavioural_attributes.personalFrustrations && (
            <div style={{ padding: '16px 24px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
                Frustrations
              </h3>
              {persona.behavioural_attributes.personalFrustrations.map((f, i) => (
                <div key={i} style={{ marginBottom: '8px', fontSize: '13px', color: '#c62828' }}>
                  <span>{f.text}</span>
                  {f.severity && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: f.severity >= 4 ? '#f44336' : '#ff9800',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      S{f.severity}
                    </span>
                  )}
                  {f.context && (
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{f.context}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Motivations - if enabled */}
      {config.motivations && persona.behavioural_attributes.motivations?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Motivations
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {persona.behavioural_attributes.motivations.map((m, i) => (
              <div key={i} style={{
                padding: '8px 12px',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                fontSize: '12px'
              }}>
                {m.text}
                {m.type && <span style={{ color: '#666', marginLeft: '6px' }}>({m.type})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attitudes - if enabled */}
      {config.attitudes && persona.behavioural_attributes.attitudes?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Attitudes
          </h3>
          {persona.behavioural_attributes.attitudes.map((a, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '13px' }}>
              {a.domain && <strong>{a.domain}:</strong>} {a.attitude}
            </div>
          ))}
        </div>
      )}

      {/* Influences - if enabled */}
      {config.influences && persona.behavioural_attributes.influences?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Influences
          </h3>
          {persona.behavioural_attributes.influences.map((inf, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '13px' }}>
              <strong>{inf.source}:</strong> {inf.description}
            </div>
          ))}
        </div>
      )}

      {/* Behavioural Patterns - if enabled */}
      {config.behaviouralPatterns && persona.behavioural_attributes.behaviouralPatterns?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Behavioural Patterns
          </h3>
          {persona.behavioural_attributes.behaviouralPatterns.map((bp, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '13px' }}>
              {bp.pattern}
              {bp.context && <span style={{ color: '#666' }}> — {bp.context}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Decision Style, Risk, Learning - if enabled */}
      {(config.decisionMakingStyle || config.riskTolerance || config.learningStyle) && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Decision & Learning
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {config.decisionMakingStyle && persona.behavioural_attributes.decisionMakingStyle && (
              <span style={{ padding: '6px 12px', backgroundColor: '#e3f2fd', borderRadius: '16px', fontSize: '12px' }}>
                {persona.behavioural_attributes.decisionMakingStyle}
              </span>
            )}
            {config.riskTolerance && persona.behavioural_attributes.riskTolerance && (
              <span style={{
                padding: '6px 12px',
                backgroundColor: riskColors[persona.behavioural_attributes.riskTolerance] || '#9e9e9e',
                color: 'white',
                borderRadius: '16px',
                fontSize: '12px'
              }}>
                {persona.behavioural_attributes.riskTolerance.replace('_', ' ')}
              </span>
            )}
            {config.learningStyle && persona.behavioural_attributes.learningStyle && (
              <span style={{ padding: '6px 12px', backgroundColor: '#f3e5f5', borderRadius: '16px', fontSize: '12px' }}>
                Learns: {persona.behavioural_attributes.learningStyle}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Research Sources - if enabled */}
      {config.researchSources && persona.validation?.research_sources?.length > 0 && (
        <div style={{ padding: '16px 24px', backgroundColor: '#f5f5f5' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Research Sources
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {persona.validation.research_sources.map((rs, i) => (
              <div key={i} style={{
                padding: '6px 10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '12px'
              }}>
                {rs.source}
                {rs.confidence && (
                  <span style={{
                    marginLeft: '6px',
                    padding: '2px 6px',
                    backgroundColor: rs.confidence === 'high' ? '#c8e6c9' : rs.confidence === 'medium' ? '#fff9c4' : '#ffccbc',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }}>
                    {rs.confidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaCard;
```

### Role Card Template

```jsx
import React from 'react';

const RoleCard = () => {
  // Section configuration - set based on user selection
  const config = {
    identity: true,
    roleType: true,
    consumerContext: true,
    professionalContext: true,
    roleBasedNeeds: true,
    roleBasedFrustrations: true
  };

  // Role data extracted from JSON
  const role = {
    identity: {
      id: "role-working-mom-consumer",
      title: "[ROLE NAME]",
      description: "[ROLE DESCRIPTION]"
    },
    roleType: "Consumer",
    roleContext: {
      consumerContext: {
        shopping_behavior: "Values convenience over price hunting",
        purchasing_context: "Primary household decision maker",
        brand_relationships: "Loyal to trusted brands",
        decision_factors: ["Quality", "Convenience", "Reviews"],
        budget_constraints: "Moderate, willing to pay for quality",
        household_context: "Family with young children"
      },
      professionalContext: {
        organisational_relationship: "internal",
        role_title: "Marketing Manager",
        department: "Brand Marketing",
        industry: "Retail",
        organisation_size: "201-1000",
        seniority_level: "manager",
        decision_authority: "Approves campaigns up to $50k",
        stakeholders: ["Creative team", "Sales", "Executive leadership"],
        responsibilities: ["Campaign strategy", "Budget management"],
        tools_and_systems: ["Salesforce", "HubSpot", "Adobe Creative Suite"]
      }
    },
    roleBasedNeeds: [
      { text: "Need 1", priority: "primary", timeframe: "immediate" },
      { text: "Need 2", priority: "secondary" }
    ],
    roleBasedFrustrations: [
      { text: "Frustration 1", severity: 4, frequency: "daily", context: "During shopping" },
      { text: "Frustration 2", severity: 3 }
    ]
  };

  const roleTypeColors = {
    Consumer: { bg: '#e8f5e9', accent: '#4caf50' },
    Professional: { bg: '#e3f2fd', accent: '#2196f3' },
    Employee: { bg: '#e3f2fd', accent: '#2196f3' },
    Business: { bg: '#fff3e0', accent: '#ff9800' },
    Citizen: { bg: '#f3e5f5', accent: '#9c27b0' }
  };

  const priorityColors = {
    primary: '#4caf50',
    secondary: '#2196f3',
    aspirational: '#9c27b0'
  };

  const colors = roleTypeColors[role.roleType] || roleTypeColors.Consumer;
  const isConsumer = role.roleType === 'Consumer';
  const isProfessional = role.roleType === 'Professional' || role.roleType === 'Employee' || role.roleType === 'Business';

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '550px',
      margin: '20px auto',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      border: `3px solid ${colors.accent}`
    }}>
      {/* Header - Identity */}
      <div style={{
        backgroundColor: colors.bg,
        padding: '24px',
        borderBottom: `2px solid ${colors.accent}`
      }}>
        {config.roleType && (
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: colors.accent,
            color: 'white',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            {role.roleType} Role
          </div>
        )}
        <h1 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: '600', color: '#333' }}>
          {role.identity.title}
        </h1>
        {role.identity.description && (
          <p style={{ margin: '12px 0 0', color: '#555', fontStyle: 'italic' }}>
            "{role.identity.description}"
          </p>
        )}
      </div>

      {/* Consumer Context - if enabled and relevant */}
      {config.consumerContext && isConsumer && role.roleContext?.consumerContext && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Consumer Context
          </h3>
          <div style={{ fontSize: '13px', color: '#555' }}>
            {role.roleContext.consumerContext.shopping_behavior && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Shopping:</strong> {role.roleContext.consumerContext.shopping_behavior}
              </div>
            )}
            {role.roleContext.consumerContext.purchasing_context && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Context:</strong> {role.roleContext.consumerContext.purchasing_context}
              </div>
            )}
            {role.roleContext.consumerContext.decision_factors?.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Decision factors:</strong>{' '}
                {role.roleContext.consumerContext.decision_factors.map((f, i) => (
                  <span key={i} style={{
                    marginLeft: i > 0 ? '4px' : '8px',
                    padding: '2px 8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}>
                    {f}
                  </span>
                ))}
              </div>
            )}
            {role.roleContext.consumerContext.budget_constraints && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Budget:</strong> {role.roleContext.consumerContext.budget_constraints}
              </div>
            )}
            {role.roleContext.consumerContext.household_context && (
              <div>
                <strong>Household:</strong> {role.roleContext.consumerContext.household_context}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Context - if enabled and relevant */}
      {config.professionalContext && isProfessional && role.roleContext?.professionalContext && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Professional Context
          </h3>
          <div style={{ fontSize: '13px', color: '#555' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {role.roleContext.professionalContext.role_title && (
                <span style={{ padding: '4px 10px', backgroundColor: '#e3f2fd', borderRadius: '12px', fontSize: '12px' }}>
                  {role.roleContext.professionalContext.role_title}
                </span>
              )}
              {role.roleContext.professionalContext.department && (
                <span style={{ padding: '4px 10px', backgroundColor: '#f5f5f5', borderRadius: '12px', fontSize: '12px' }}>
                  {role.roleContext.professionalContext.department}
                </span>
              )}
              {role.roleContext.professionalContext.seniority_level && (
                <span style={{ padding: '4px 10px', backgroundColor: '#fff3e0', borderRadius: '12px', fontSize: '12px' }}>
                  {role.roleContext.professionalContext.seniority_level.replace('_', ' ')}
                </span>
              )}
            </div>
            {role.roleContext.professionalContext.decision_authority && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Authority:</strong> {role.roleContext.professionalContext.decision_authority}
              </div>
            )}
            {role.roleContext.professionalContext.stakeholders?.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Stakeholders:</strong> {role.roleContext.professionalContext.stakeholders.join(', ')}
              </div>
            )}
            {role.roleContext.professionalContext.tools_and_systems?.length > 0 && (
              <div>
                <strong>Tools:</strong> {role.roleContext.professionalContext.tools_and_systems.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Needs & Frustrations */}
      {(config.roleBasedNeeds || config.roleBasedFrustrations) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e0e0e0' }}>
          {config.roleBasedNeeds && role.roleBasedNeeds && (
            <div style={{ padding: '16px 24px', borderRight: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
                Role-Based Needs
              </h3>
              {role.roleBasedNeeds.map((need, i) => (
                <div key={i} style={{ marginBottom: '8px', fontSize: '13px' }}>
                  <span>{need.text}</span>
                  {need.priority && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: priorityColors[need.priority] || '#9e9e9e',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      {need.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {config.roleBasedFrustrations && role.roleBasedFrustrations && (
            <div style={{ padding: '16px 24px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
                Role Frustrations
              </h3>
              {role.roleBasedFrustrations.map((f, i) => (
                <div key={i} style={{ marginBottom: '8px', fontSize: '13px', color: '#c62828' }}>
                  <span>{f.text}</span>
                  {f.severity && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: f.severity >= 4 ? '#f44336' : '#ff9800',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      S{f.severity}
                    </span>
                  )}
                  {f.frequency && (
                    <span style={{
                      marginLeft: '4px',
                      padding: '2px 6px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '10px',
                      fontSize: '10px',
                      color: '#555'
                    }}>
                      {f.frequency}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleCard;
```

### Pairing Card Template

```jsx
import React from 'react';

const PairingCard = () => {
  // Section configuration - set based on user selection
  const config = {
    identity: true,
    references: true,
    quote: true,
    goalsAsExperienced: true,
    painPoints: true,
    barriers: true,
    opportunities: true,
    emotionalContext: false,
    channels: false,
    momentsThatMatter: false,
    useCases: false,
    successMetrics: false,
    researchSources: false
  };

  // Pairing data extracted from JSON
  const pairing = {
    identity: {
      id: "pairing-sarah-working-mom",
      title: "[PERSONA] as [ROLE]",
      description: "[PAIRING DESCRIPTION]"
    },
    references: {
      personaRef: "persona-sarah-martinez",
      roleRefs: ["role-working-mom-consumer"]
    },
    synthesis: {
      quote: "I just need this to work the first time - I don't have time for returns.",
      goalsAsExperienced: [
        { text: "Goal 1", source: "persona+role", priority: "primary" },
        { text: "Goal 2", source: "role", priority: "secondary" }
      ],
      painPoints: [
        { text: "Pain point 1", severity: 4, emergesFrom: "How persona trait collides with role constraint" },
        { text: "Pain point 2", severity: 3 }
      ],
      barriers: [
        {
          barrier: "Barrier description",
          type: "resource",
          impact: "How it affects them",
          workarounds: "How they cope",
          emergesFrom: "Collision explanation"
        }
      ],
      opportunities: ["Opportunity 1", "Opportunity 2"],
      emotionalContext: "Generally time-pressured and efficiency-focused"
    },
    extendedContext: {
      channels: [
        { channel: "app", medium: "digital", serviceModel: "self_service", name: "Mobile App", preference_level: "preferred" },
        { channel: "phone", medium: "non_digital", serviceModel: "managed", preference_level: "avoided" }
      ],
      moments_that_matter: [
        { moment: "Finding the right item", emotional_intensity: 1, importance: "high", current_experience: "Hit or miss" }
      ],
      use_cases: [
        { scenario: "Quick purchase during lunch", trigger: "Need identified", outcome: "Item delivered" }
      ],
      success_metrics: [
        { metric: "Time to purchase", target: "Under 5 minutes" }
      ]
    },
    validation: {
      research_sources: [
        { source: "User interviews", type: "interview", confidence: "high" }
      ],
      confidence_level: "high"
    }
  };

  const barrierColors = {
    process: '#9c27b0',
    technology: '#2196f3',
    knowledge: '#ff9800',
    resource: '#f44336',
    policy: '#607d8b',
    cultural: '#795548',
    vision: '#3f51b5',
    communications: '#00bcd4',
    governance: '#9e9e9e'
  };

  const sourceColors = {
    persona: '#667eea',
    role: '#4caf50',
    'persona+role': '#ff9800'
  };

  const importanceColors = {
    critical: '#f44336',
    high: '#ff9800',
    medium: '#2196f3',
    low: '#9e9e9e'
  };

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '600px',
      margin: '20px auto',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header - Identity */}
      <div style={{
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        padding: '24px',
        color: 'white'
      }}>
        <div style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          opacity: 0.9,
          marginBottom: '8px'
        }}>
          Pairing
        </div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>
          {pairing.identity.title}
        </h1>
        {config.references && (
          <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.8 }}>
            {pairing.references.personaRef} + {pairing.references.roleRefs.join(' + ')}
          </div>
        )}
      </div>

      {/* Quote - if enabled */}
      {config.quote && pairing.synthesis.quote && (
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0',
          fontStyle: 'italic',
          color: '#555',
          fontSize: '15px'
        }}>
          "{pairing.synthesis.quote}"
        </div>
      )}

      {/* Description */}
      {pairing.identity.description && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e0e0e0',
          fontSize: '14px',
          color: '#555'
        }}>
          {pairing.identity.description}
        </div>
      )}

      {/* Goals As Experienced - if enabled */}
      {config.goalsAsExperienced && pairing.synthesis.goalsAsExperienced?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Goals (as experienced)
          </h3>
          {pairing.synthesis.goalsAsExperienced.map((goal, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '16px',
                color: goal.priority === 'primary' ? '#ffc107' : '#9e9e9e'
              }}>
                {goal.priority === 'primary' ? '★' : '○'}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: goal.priority === 'primary' ? '500' : '400'
              }}>
                {goal.text}
              </span>
              {goal.source && (
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: sourceColors[goal.source] || '#9e9e9e',
                  color: 'white',
                  borderRadius: '10px',
                  fontSize: '10px'
                }}>
                  {goal.source}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pain Points - if enabled */}
      {config.painPoints && pairing.synthesis.painPoints?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Pain Points
          </h3>
          {pairing.synthesis.painPoints.map((pp, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              backgroundColor: '#ffebee',
              borderLeft: `3px solid ${pp.severity >= 4 ? '#f44336' : '#ff9800'}`,
              borderRadius: '0 6px 6px 0',
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '13px', color: '#c62828' }}>
                {pp.text}
                {pp.severity && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    backgroundColor: pp.severity >= 4 ? '#f44336' : '#ff9800',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '10px'
                  }}>
                    S{pp.severity}
                  </span>
                )}
              </div>
              {pp.emergesFrom && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', fontStyle: 'italic' }}>
                  → {pp.emergesFrom}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Barriers - if enabled */}
      {config.barriers && pairing.synthesis.barriers?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Emergent Barriers
          </h3>
          {pairing.synthesis.barriers.map((barrier, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              backgroundColor: '#fff8e1',
              borderLeft: `4px solid ${barrierColors[barrier.type] || '#ff9800'}`,
              borderRadius: '0 8px 8px 0',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>⚠️</span>
                <span style={{
                  fontWeight: '600',
                  fontSize: '13px',
                  textTransform: 'capitalize',
                  color: barrierColors[barrier.type] || '#ff9800'
                }}>
                  {barrier.type}
                </span>
              </div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                {barrier.barrier}
              </div>
              {barrier.impact && (
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
                  <strong>Impact:</strong> {barrier.impact}
                </div>
              )}
              {barrier.workarounds && (
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
                  <strong>Workarounds:</strong> {barrier.workarounds}
                </div>
              )}
              {barrier.emergesFrom && (
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  fontStyle: 'italic',
                  paddingTop: '8px',
                  borderTop: '1px dashed #e0e0e0'
                }}>
                  → {barrier.emergesFrom}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Opportunities - if enabled */}
      {config.opportunities && pairing.synthesis.opportunities?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Opportunities
          </h3>
          {pairing.synthesis.opportunities.map((opp, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
              padding: '8px 12px',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px'
            }}>
              <span style={{ color: '#4caf50' }}>💡</span>
              <span style={{ fontSize: '13px' }}>{opp}</span>
            </div>
          ))}
        </div>
      )}

      {/* Emotional Context - if enabled */}
      {config.emotionalContext && pairing.synthesis.emotionalContext && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Emotional Context
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#555', fontStyle: 'italic' }}>
            {pairing.synthesis.emotionalContext}
          </p>
        </div>
      )}

      {/* Channels - if enabled */}
      {config.channels && pairing.extendedContext?.channels?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Channel Preferences
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {pairing.extendedContext.channels.map((ch, i) => (
              <div key={i} style={{
                padding: '6px 12px',
                backgroundColor: ch.preference_level === 'preferred' ? '#e8f5e9' : ch.preference_level === 'avoided' ? '#ffebee' : '#f5f5f5',
                borderRadius: '16px',
                fontSize: '12px',
                border: `1px solid ${ch.preference_level === 'preferred' ? '#4caf50' : ch.preference_level === 'avoided' ? '#f44336' : '#e0e0e0'}`
              }}>
                {ch.name || ch.channel}
                <span style={{ marginLeft: '6px', color: '#666', fontSize: '10px' }}>
                  ({ch.medium})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moments That Matter - if enabled */}
      {config.momentsThatMatter && pairing.extendedContext?.moments_that_matter?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Moments That Matter
          </h3>
          {pairing.extendedContext.moments_that_matter.map((mtm, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              backgroundColor: '#fff8e1',
              borderLeft: `3px solid ${importanceColors[mtm.importance] || '#9e9e9e'}`,
              borderRadius: '0 6px 6px 0',
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>
                ⭐ {mtm.moment}
                {mtm.importance && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    backgroundColor: importanceColors[mtm.importance] || '#9e9e9e',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '10px'
                  }}>
                    {mtm.importance}
                  </span>
                )}
              </div>
              {mtm.current_experience && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                  Current: {mtm.current_experience}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Use Cases - if enabled */}
      {config.useCases && pairing.extendedContext?.use_cases?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Use Cases
          </h3>
          {pairing.extendedContext.use_cases.map((uc, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              marginBottom: '10px',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: '500' }}>{uc.scenario}</div>
              {uc.trigger && <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Trigger: {uc.trigger}</div>}
              {uc.outcome && <div style={{ fontSize: '11px', color: '#666' }}>Outcome: {uc.outcome}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Success Metrics - if enabled */}
      {config.successMetrics && pairing.extendedContext?.success_metrics?.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Success Metrics
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {pairing.extendedContext.success_metrics.map((sm, i) => (
              <div key={i} style={{
                padding: '8px 12px',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                fontSize: '12px'
              }}>
                <span style={{ color: '#4caf50' }}>✓</span> {sm.metric}
                {sm.target && <span style={{ color: '#666', marginLeft: '6px' }}>({sm.target})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Research Sources - if enabled */}
      {config.researchSources && pairing.validation?.research_sources?.length > 0 && (
        <div style={{ padding: '16px 24px', backgroundColor: '#f5f5f5' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            Research Sources
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {pairing.validation.research_sources.map((rs, i) => (
              <div key={i} style={{
                padding: '6px 10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '12px'
              }}>
                {rs.source}
                {rs.confidence && (
                  <span style={{
                    marginLeft: '6px',
                    padding: '2px 6px',
                    backgroundColor: rs.confidence === 'high' ? '#c8e6c9' : rs.confidence === 'medium' ? '#fff9c4' : '#ffccbc',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }}>
                    {rs.confidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PairingCard;
```

## Process

### Step 1: Load the Data

Read the JSON file if a path is provided:
```bash
cat v1.1/examples/personas/[filename].json
```

### Step 2: Identify Type

Determine if it's a persona, role, or pairing from:
- File path (personas/, roles/, pairings/)
- Schema type in `schema_info.schema_type`
- Field presence (roleType = role, personaRef = pairing)

### Step 3: Determine Section Selection

**IMPORTANT**: Ask the user which sections to include, OR respect selections they've already made.

When the user specifies sections to include/exclude, update the config accordingly:
- "show all sections" → set all config values to `true`
- "show motivations" → set `motivations: true`
- "without research sources" → set `researchSources: false`
- "include extended context" → (for pairings) set `channels`, `momentsThatMatter`, `useCases`, `successMetrics` to `true`

### Step 4: Generate Artifact

Use the appropriate template, populate with data, and render as a Claude artifact. Only include sections where config is `true`.

### Step 5: Present

Provide the visual card with a brief summary highlighting key points.

## Quality Checklist

### All Artifact Types
- [ ] **Section selection respected** - Only enabled sections appear in output
- [ ] Correct template used for artifact type
- [ ] All enabled fields are displayed
- [ ] Colours are appropriate for type/role
- [ ] Text is readable and not truncated

### Core Persona
- [ ] Demographics displayed (if enabled)
- [ ] Personal needs show type badges (if type provided)
- [ ] Frustrations show severity badges
- [ ] Technology comfort shows level badge with colour
- [ ] Communication preferences show preferred/avoided
- [ ] Motivations show type (if enabled)
- [ ] Attitudes show domain grouping (if enabled)
- [ ] Risk tolerance uses colour-coded badge
- [ ] Research sources show confidence badges (if enabled)

### Role Card
- [ ] Role type badge uses correct colour
- [ ] Consumer context shows for Consumer roles
- [ ] Professional context shows for Professional/Employee roles
- [ ] Needs show priority badges
- [ ] Frustrations show severity and frequency

### Pairing
- [ ] References show persona + role IDs
- [ ] Quote is prominently displayed (if enabled)
- [ ] Goals show source badges (persona/role/persona+role)
- [ ] Pain points show severity and emergesFrom
- [ ] Barriers show 9-type taxonomy colours
- [ ] Barrier impact and workarounds displayed (if present)
- [ ] Channels show preference level colours (if enabled)
- [ ] Moments that matter show importance badges (if enabled)
- [ ] Success metrics displayed (if enabled)
- [ ] Research sources show confidence badges (if enabled)

## Example Usage

```
User: Show me the Sarah Martinez persona

Claude: I'll render the Sarah Martinez Core Persona as a visual card.

[Reads persona-sarah-martinez.json]
[Creates React artifact with persona data]

Here's Sarah Martinez's persona card. Key highlights:

**Technology:** Intermediate comfort, confident with mobile apps
**Communication:** Prefers apps and email, morning/evening
**Needs:** Quick solutions, quality assurance, family-friendly options
**Decision style:** Research-oriented, moderate risk, influenced by reviews

Would you like me to also render her associated Role Card (Working Mom Consumer) or the Pairing?
```
