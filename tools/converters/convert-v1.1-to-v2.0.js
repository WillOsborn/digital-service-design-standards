#!/usr/bin/env node
/**
 * v1.1 → v2.0 Converter
 *
 * Converts v1.1 Persona + Role + Pairing → v2.0 Actor
 * Converts v1.1 Journey → v2.0 Mission + Experience
 *
 * Usage (CLI):
 *   node tools/converters/convert-v1.1-to-v2.0.js \
 *     --persona v1.1/examples/personas/persona-sarah-martinez.json \
 *     --role v1.1/examples/roles/role-working-mom-consumer.json \
 *     --pairing v1.1/examples/pairings/pairing-sarah-working-mom.json \
 *     [--journey v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json] \
 *     --output v2.0/examples/retail/
 *
 * NOTE: This tool performs structural conversion only.
 * Sections marked ⚠ in the output require human review and design work.
 * needAtStep, painAtStep, service blueprint lanes, and decision branches
 * are NOT auto-populated — they require genuine design thinking.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const CONTEXT_URL = 'https://schemas.digitalservice.design/v2.0';

// ─── Source-enum translation ───────────────────────────────────────────────

function translateSource(source) {
  if (!source) return 'traits';
  switch (source) {
    case 'persona':       return 'traits';
    case 'role':          return 'context';
    case 'persona+role':  return 'collision';
    default:              return 'traits';
  }
}

// ─── Channel translation ───────────────────────────────────────────────────

// v1.1 and earlier data spells the same channel several ways, and `channel` is
// a free string in v2.0, so nothing downstream would reject the variants. Map
// them onto the taxonomy's suggested types so conversion cannot reintroduce the
// drift cleaned up in BACK-024. Anything unrecognised passes through untouched —
// custom channels remain fully supported.
const CHANNEL_NAME_MAP = {
  'web':          'website',
  'web-portal':   'website',
  'web portal':   'website',
  'in-person':    'in_person',
  'video-call':   'video_call',
  'phone-call':   'phone',
  'voice':        'phone',
  'text':         'sms',
  'social-media': 'social_media'
};

function normaliseChannelName(channel) {
  if (!channel) return channel;
  const key = String(channel).trim().toLowerCase();
  return CHANNEL_NAME_MAP[key] || channel;
}

// A voice or video conversation is telecom whatever the legacy record said.
// v1.1 only carried `medium` (digital | non_digital), which collapses phone and
// video onto `physical` — the exact miscategorisation fixed by hand in BACK-022
// and BACK-023. The channel itself is the more reliable signal, so it wins.
const TELECOM_CHANNELS = new Set(['phone', 'sms', 'video_call']);

function translateChannelCategory(medium, channel) {
  if (channel && TELECOM_CHANNELS.has(normaliseChannelName(channel))) return 'telecom';
  if (!medium) return 'digital';
  switch (medium) {
    case 'non_digital': return 'physical';
    case 'digital':     return 'digital';
    default:            return medium;
  }
}

// ─── ID translation ────────────────────────────────────────────────────────

function personaIdToActorId(id) {
  if (!id) return id;
  return id.replace(/^persona-/, 'actor-');
}

function roleIdToContextId(id) {
  if (!id) return id;
  return id.replace(/^role-/, 'ctx-');
}

// ─── convertPersonaToActor ─────────────────────────────────────────────────

/**
 * Merges v1.1 Persona + Role + Pairing into a v2.0 Actor.
 *
 * @param {object} persona  - Parsed persona JSON
 * @param {object} role     - Parsed role JSON (optional)
 * @param {object} pairing  - Parsed pairing JSON (optional)
 * @returns {object} v2.0 Actor
 */
function convertPersonaToActor(persona, role, pairing) {
  const ba  = persona.behavioural_attributes || {};
  const dem = persona.demographics || {};
  const val = persona.validation || {};

  // Build traits.needs — rename "text" → "need"
  const needs = (ba.personalNeeds || []).map(n => {
    const item = { need: n.text };
    if (n.type) item.type = n.type;
    return item;
  });

  // Build traits.frustrations — rename "text" → "frustration"
  const frustrations = (ba.personalFrustrations || []).map(f => {
    const item = { frustration: f.text };
    if (f.severity !== undefined) item.severity = f.severity;
    if (f.context) item.context = f.context;
    return item;
  });

  // Build traits.motivations — rename "text" → "motivation"
  const motivations = (ba.motivations || []).map(m => {
    const item = { motivation: m.text };
    if (m.type) item.type = m.type;
    return item;
  });

  const traits = {
    demographics: {
      age: dem.age,
      location: dem.location,
      education: dem.education,
      background: dem.background
    },
    needs,
    frustrations,
    motivations
  };

  if (ba.technologyComfort) {
    traits.technology = {
      comfort: ba.technologyComfort.level,
      description: ba.technologyComfort.description,
      preferredDevices: ba.technologyComfort.preferredDevices || []
    };
  }

  if (ba.communicationPreferences) {
    traits.communication = {
      preferred: ba.communicationPreferences.preferred || [],
      acceptable: ba.communicationPreferences.acceptable || [],
      avoided: ba.communicationPreferences.avoided || [],
      style: ba.communicationPreferences.style
    };
  }

  if (ba.learningStyle) traits.learningStyle = ba.learningStyle;

  if (ba.influences && ba.influences.length) {
    traits.influences = ba.influences.map(i => ({ source: i.source, description: i.description }));
  }

  if (ba.decisionMakingStyle || ba.riskTolerance) {
    traits.decisionMaking = {
      style: ba.decisionMakingStyle,
      riskTolerance: ba.riskTolerance
    };
  }

  if (ba.behaviouralPatterns && ba.behaviouralPatterns.length) {
    traits.behaviouralPatterns = ba.behaviouralPatterns.map(p => ({
      pattern: p.pattern,
      context: p.context
    }));
  }

  // ── Context from role ──
  const contexts = [];
  if (role) {
    const ri     = role.identity || {};
    const rCtx   = role.roleContext || {};
    const cType  = role.roleType || 'Consumer';

    // roleBasedNeeds — rename "text" → "need"
    const ctxNeeds = (role.roleBasedNeeds || []).map(n => {
      const item = { need: n.text };
      if (n.priority)   item.priority  = n.priority;
      if (n.timeframe)  item.timeframe = n.timeframe;
      return item;
    });

    // roleBasedFrustrations — rename "text" → "frustration"
    const ctxFrustrations = (role.roleBasedFrustrations || []).map(f => {
      const item = { frustration: f.text };
      if (f.severity !== undefined)  item.severity  = f.severity;
      if (f.frequency)               item.frequency = f.frequency;
      if (f.context)                 item.context   = f.context;
      return item;
    });

    // Channels from pairing extendedContext
    const rawChannels = (pairing && pairing.extendedContext && pairing.extendedContext.channels) || [];
    const channels = rawChannels.map(ch => {
      const item = {
        channel:      normaliseChannelName(ch.channel),
        category:     translateChannelCategory(ch.medium, ch.channel),
        serviceModel: ch.serviceModel,
        preference:   ch.preference_level
      };
      if (ch.usage_context || ch.name) {
        item.usageContext = ch.usage_context || ch.name;
      }
      if (ch.name) item.name = ch.name;
      return item;
    });

    // moments that matter from pairing
    const rawMoments = (pairing && pairing.extendedContext && pairing.extendedContext.moments_that_matter) || [];
    const momentsThatMatter = rawMoments.map(m => ({
      moment: m.moment,
      emotionalIntensity: m.emotional_intensity,
      importance: m.importance
    }));

    // Flatten roleContext details into a details object
    const details = {};
    for (const [key, val] of Object.entries(rCtx.consumerContext || rCtx.professionalContext || rCtx)) {
      if (typeof val === 'string' || Array.isArray(val)) {
        // Convert snake_case keys to camelCase
        const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        details[camel] = val;
      }
    }

    // Merge extensions custom fields into details
    const extCustom = role.extensions && role.extensions.custom;
    if (extCustom) {
      for (const [key, val] of Object.entries(extCustom)) {
        const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        details[camel] = val;
      }
    }

    const context = {
      contextId:   roleIdToContextId(ri.id),
      title:       ri.title,
      description: ri.description,
      contextType: cType,
      needs:       ctxNeeds,
      frustrations: ctxFrustrations,
      channels,
      details
    };

    if (momentsThatMatter.length) context.momentsThatMatter = momentsThatMatter;

    contexts.push(context);
  }

  // ── Emergence from pairing ──
  const emergence = [];
  if (pairing && pairing.synthesis) {
    const syn = pairing.synthesis;
    const contextRef = contexts.length ? contexts[0].contextId : undefined;

    // goalsAsExperienced — rename "text" → "goal", translate source enum
    const goalsAsExperienced = (syn.goalsAsExperienced || []).map(g => {
      const item = { goal: g.text, source: translateSource(g.source) };
      if (g.priority) item.priority = g.priority;
      return item;
    });

    // painPoints — rename "text" → "painPoint"
    const painPoints = (syn.painPoints || []).map(p => {
      const item = { painPoint: p.text };
      if (p.severity !== undefined) item.severity = p.severity;
      if (p.emergesFrom)            item.emergesFrom = p.emergesFrom;
      return item;
    });

    // barriers — keep as-is (already well-structured in v1.1)
    const barriers = (syn.barriers || []).map(b => {
      const item = { barrier: b.barrier, type: b.type };
      if (b.impact)       item.impact       = b.impact;
      if (b.workarounds)  item.workarounds  = b.workarounds;
      if (b.emergesFrom)  item.emergesFrom  = b.emergesFrom;
      return item;
    });

    const emergenceEntry = {
      contextRef,
      goalsAsExperienced,
      painPoints
    };

    if (barriers.length) emergenceEntry.barriers = barriers;
    if (syn.opportunities && syn.opportunities.length) emergenceEntry.opportunities = syn.opportunities;
    if (syn.emotionalContext) emergenceEntry.emotionalContext = syn.emotionalContext;

    // useCases from pairing extendedContext
    const useCases = ((pairing.extendedContext || {}).use_cases || []).map(u => ({
      scenario: u.scenario,
      trigger: u.trigger,
      outcome: u.outcome
    }));
    if (useCases.length) emergenceEntry.useCases = useCases;

    // successMetrics from pairing extendedContext
    const successMetrics = ((pairing.extendedContext || {}).success_metrics || []).map(m =>
      typeof m === 'string' ? m : m.metric
    );
    if (successMetrics.length) emergenceEntry.successMetrics = successMetrics;

    emergence.push(emergenceEntry);
  }

  // ── Provenance from persona validation ──
  const researchSources = (val.research_sources || []).map(r => ({
    source: r.source,
    type: r.type,
    ...(r.date ? { date: r.date } : {}),
    confidence: r.confidence
  }));

  const provenance = {
    source: 'user_research',
    confidence: val.confidence_level === 'high' ? 0.85 : 0.7,
    generationMethod: 'ai_assisted',
    humanReviewed: false
  };
  if (researchSources.length) provenance.researchSources = researchSources;

  // ── Governance ──
  const governance = {
    dataClassification: 'internal',
    containsPii: true,
    anonymisationMethod: 'fictional_composite'
  };

  // ── Meta ──
  const today = new Date().toISOString().slice(0, 10);
  const created = (persona.schema_info && persona.schema_info.created_date) || today;

  const meta = {
    created,
    updated: today,
    createdBy: (persona.schema_info && persona.schema_info.created_by) || 'Digital Service Design Team',
    organisation: (persona.schema_info && persona.schema_info.organization) || 'Digital Service Design Working',
    tags: ['converted-from-v1.1']
  };

  // ── Assemble Actor ──
  const actor = {
    $context: CONTEXT_URL,
    $type: 'Actor',
    id: personaIdToActorId(persona.identity.id),
    version: '2.0.0',
    name: persona.identity.name,
    summary: persona.identity.summary,
    actorType: 'human',
    traits,
    contexts,
    emergence,
    provenance,
    governance,
    meta
  };

  if (pairing && pairing.synthesis && pairing.synthesis.quote) {
    actor.quote = pairing.synthesis.quote;
  }

  return actor;
}

// ─── convertJourneyToMission ───────────────────────────────────────────────

/**
 * Converts a v1.1 Journey into a v2.0 Mission (persona-agnostic service graph).
 * Extracts service-level content. Persona-specific content (thoughts, emotions)
 * is NOT included — that goes into the Experience.
 *
 * @param {object} journey - Parsed v1.1 journey JSON
 * @returns {object} v2.0 Mission
 */
function convertJourneyToMission(journey) {
  const jrny  = journey.journey;
  const today = new Date().toISOString().slice(0, 10);

  // ── Build phases ──
  const phases = (jrny.phases || []).map(p => ({
    phaseId: p.id,
    name: p.name,
    goal: p.goal || ''
  }));

  // ── Build nodes from steps ──
  const nodes = [];
  const edges = [];
  let prevNodeId = null;

  for (const phase of jrny.phases || []) {
    for (const step of phase.steps || []) {
      const lc = step.lane_content || {};

      // Service-level lane content only (no persona-specific fields)
      const laneContent = {};

      if (lc.channels && lc.channels.length) {
        laneContent.channels = lc.channels.map(ch => ({
          channel: normaliseChannelName(ch.type || ch.channel),
          category: translateChannelCategory(
            ch.category || (ch.medium === 'non_digital' ? 'non_digital' : ch.category),
            ch.type || ch.channel
          ),
          serviceModel: ch.serviceModel || ch.service_model,
          ...(ch.name ? { name: ch.name } : {}),
          ...(ch.usage_context ? { usageContext: ch.usage_context } : {})
        }));
      }

      if (lc.barriers && lc.barriers.length) {
        laneContent.barriers = lc.barriers.map(b => ({
          barrier: b.barrier || b.description || b,
          type: b.type || 'process',
          ...(b.impact ? { impact: b.impact } : {}),
          ...(b.workarounds ? { workarounds: b.workarounds } : {})
        }));
      }

      if (lc.opportunities && lc.opportunities.length) {
        laneContent.opportunities = lc.opportunities;
      }

      const node = {
        id: step.id,
        type: 'touchpoint',
        phaseId: phase.id,
        description: step.name || step.id,
        laneContent
      };

      if (step.duration_ms) node.slaDurationMs = step.duration_ms;

      nodes.push(node);

      // Auto-generate sequential edge from previous node
      if (prevNodeId) {
        edges.push({
          id: `edge-${prevNodeId}-${step.id}`,
          source: prevNodeId,
          target: step.id,
          type: 'default'
        });
      }

      prevNodeId = step.id;
    }
  }

  // ── Declared lanes ──
  const lanes = [
    { laneId: 'channels',      label: 'Channels',      type: 'channel',  core: true },
    { laneId: 'barriers',      label: 'Barriers',      type: 'barrier',  core: true },
    { laneId: 'opportunities', label: 'Opportunities', type: 'list',     core: false }
  ];

  const mission = {
    $context: CONTEXT_URL,
    $type: 'Mission',
    id: jrny.id
      ? jrny.id.replace(/^[\w-]+-journey$/, 'mission-$&').replace(/-journey$/, '')
      : 'mission-converted',
    version: '2.0.0',
    title: jrny.title || 'Converted Mission',
    goal: (jrny.context && jrny.context.use_case) || '',
    phases,
    nodes,
    edges,
    lanes,
    meta: {
      created: (journey.schema_info && journey.schema_info.created_date) || today,
      updated: today,
      convertedFrom: 'v1.1 journey',
      tags: ['converted-from-v1.1']
    }
  };

  return mission;
}

// ─── convertJourneyToExperience ────────────────────────────────────────────

/**
 * Converts a v1.1 Journey into a v2.0 Experience (persona-specific layer).
 * Extracts thoughts, emotions, persona-specific barriers.
 * needAtStep and painAtStep are NOT auto-populated.
 *
 * @param {object} journey   - Parsed v1.1 journey JSON
 * @param {string} actorId   - v2.0 Actor ID (e.g. "actor-sarah-martinez")
 * @param {string} contextId - v2.0 context ID (e.g. "ctx-working-mom-consumer")
 * @param {string} missionId - v2.0 Mission ID
 * @returns {object} v2.0 Experience
 */
function convertJourneyToExperience(journey, actorId, contextId, missionId) {
  const jrny  = journey.journey;
  const today = new Date().toISOString().slice(0, 10);

  const expNodes = [];
  const nodeSequence = [];

  for (const phase of jrny.phases || []) {
    for (const step of phase.steps || []) {
      const lc = step.lane_content || {};

      nodeSequence.push(step.id);

      const expNode = { nodeRef: step.id };

      if (lc.actions && lc.actions.length) expNode.actions = lc.actions;
      if (lc.thoughts) expNode.thoughts = lc.thoughts;
      if (lc.emotions) {
        expNode.emotions = {
          state: lc.emotions.state,
          intensity: lc.emotions.intensity
        };
      }

      // Persona-specific barriers (from experience, not structural)
      if (lc.barriers && lc.barriers.length) {
        expNode.barriers = lc.barriers.map(b => ({
          barrier: b.barrier || b.description || b,
          type: b.type || 'process',
          ...(b.impact ? { impact: b.impact } : {}),
          ...(b.workarounds ? { workarounds: b.workarounds } : {})
        }));
      }

      // needAtStep and painAtStep intentionally not populated —
      // they require human design thinking (see quality warnings).
      // expNode.needAtStep = null;
      // expNode.painAtStep = null;

      expNodes.push(expNode);
    }
  }

  const experience = {
    $context: CONTEXT_URL,
    $type: 'Experience',
    id: 'exp-' + actorId.replace(/^actor-/, '') + '-converted',
    version: '2.0.0',
    references: {
      actorRef: actorId,
      contextRef: contextId,
      missionRef: missionId
    },
    path: {
      pathId: 'happy-path-converted',
      name: 'Happy Path (converted)',
      nodeSequence
    },
    nodes: expNodes,
    meta: {
      created: (journey.schema_info && journey.schema_info.created_date) || today,
      updated: today,
      convertedFrom: 'v1.1 journey',
      tags: ['converted-from-v1.1']
    }
  };

  return experience;
}

// ─── CLI ───────────────────────────────────────────────────────────────────

function printQualityWarnings(type, warnings) {
  for (const w of warnings) {
    console.log('  ⚠ ' + w);
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function runCLI(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      opts[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }

  if (!opts.persona) {
    console.error('Usage: node convert-v1.1-to-v2.0.js --persona <file> [--role <file>] [--pairing <file>] [--journey <file>] --output <dir>');
    process.exit(1);
  }

  const persona  = JSON.parse(fs.readFileSync(opts.persona, 'utf8'));
  const role     = opts.role    ? JSON.parse(fs.readFileSync(opts.role, 'utf8'))    : null;
  const pairing  = opts.pairing ? JSON.parse(fs.readFileSync(opts.pairing, 'utf8')) : null;
  const journey  = opts.journey ? JSON.parse(fs.readFileSync(opts.journey, 'utf8')) : null;

  const outputDir = opts.output || '.';
  fs.mkdirSync(outputDir, { recursive: true });

  // ── Convert Actor ──
  const actor = convertPersonaToActor(persona, role, pairing);
  const actorFile = path.join(outputDir, actor.id + '.json');
  writeJson(actorFile, actor);

  console.log('✓ Actor created: ' + path.basename(actorFile));
  printQualityWarnings('actor', [
    'emergence[].painPoints: emergesFrom text copied from v1.1 — review for accuracy',
    'needAtStep: NOT populated (requires human design work)',
    'painAtStep: NOT populated (requires human design work)',
    'accessibility.dimensions: placeholder — populate from user research'
  ]);

  if (!journey) {
    console.log('\nQuality: Structural conversion complete. No journey provided — Mission and Experience not generated.');
    console.log('  → Use mission-builder and experience-generator skills to create Mission and Experience.');
    return;
  }

  // ── Convert Mission ──
  const mission = convertJourneyToMission(journey);
  const missionFile = path.join(outputDir, mission.id + '.json');
  writeJson(missionFile, mission);

  console.log('✓ Mission created: ' + path.basename(missionFile));
  printQualityWarnings('mission', [
    'Decision nodes: NOT added (v1.1 journeys are linear — add manually)',
    'Alternative paths: NOT generated (only happy path converted)',
    'Service blueprint lanes (frontstage, backstage, support-systems): NOT populated'
  ]);

  // ── Convert Experience ──
  const contextId = (actor.contexts && actor.contexts[0] && actor.contexts[0].contextId) || 'ctx-default';
  const exp = convertJourneyToExperience(journey, actor.id, contextId, mission.id);
  const expFile = path.join(outputDir, exp.id + '.json');
  writeJson(expFile, exp);

  console.log('✓ Experience created: ' + path.basename(expFile));
  printQualityWarnings('experience', [
    'needAtStep: NOT populated (requires human design work for each touchpoint)',
    'painAtStep: NOT populated (requires human design work for each touchpoint)',
    'barriers: copied from journey — review whether structural (→ Mission) or persona-specific (→ Experience)',
    'outcome: NOT populated — add manually'
  ]);

  console.log('\nQuality: Structural conversion complete. Design depth requires human review.');
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = { convertPersonaToActor, convertJourneyToMission, convertJourneyToExperience };

// ─── Entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  runCLI(process.argv.slice(2));
}
