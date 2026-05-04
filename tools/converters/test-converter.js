#!/usr/bin/env node
/**
 * Test suite for v1.1→v2.0 converter.
 * Run: node tools/converters/test-converter.js
 */
'use strict';

const { convertPersonaToActor, convertJourneyToMission, convertJourneyToExperience } = require('./convert-v1.1-to-v2.0');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  PASS: ' + message);
    passed++;
  } else {
    console.error('  FAIL: ' + message);
    failed++;
  }
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

const root = path.resolve(__dirname, '../..');

const persona  = JSON.parse(fs.readFileSync(path.join(root, 'v1.1/examples/personas/persona-sarah-martinez.json'), 'utf8'));
const role     = JSON.parse(fs.readFileSync(path.join(root, 'v1.1/examples/roles/role-working-mom-consumer.json'), 'utf8'));
const pairing  = JSON.parse(fs.readFileSync(path.join(root, 'v1.1/examples/pairings/pairing-sarah-working-mom.json'), 'utf8'));
const journey  = JSON.parse(fs.readFileSync(path.join(root, 'v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json'), 'utf8'));

// ─── Test 1: persona→actor conversion ──────────────────────────────────────

console.log('\nTest group: convertPersonaToActor');

const actor = convertPersonaToActor(persona, role, pairing);

// Basic structure
assert(actor.$type === 'Actor', '$type === Actor');
assert(actor.$context === 'https://schemas.digitalservice.design/v2.0', '$context is v2.0 URL');
assert(actor.id === 'actor-sarah-martinez', 'ID prefix: persona- → actor-');
assert(actor.actorType === 'human', 'actorType === human');
assert(actor.name === 'Sarah Martinez', 'name preserved');

// Traits
assert(actor.traits !== undefined, 'traits object present');
assert(Array.isArray(actor.traits.needs), 'traits.needs is array');
assert(actor.traits.needs.length >= 4, 'all needs converted (>=4)');
assert(Array.isArray(actor.traits.frustrations), 'traits.frustrations is array');
assert(actor.traits.frustrations.length >= 3, 'all frustrations converted (>=3)');
assert(Array.isArray(actor.traits.motivations), 'traits.motivations is array');
assert(actor.traits.motivations.length >= 3, 'all motivations converted (>=3)');

// ── CRITICAL: field name transformations ──────────────────────────────────
// v1.1 uses "text" for the value field; v2.0 uses the specific field name.
assert(actor.traits.needs[0].need !== undefined,   'needs use "need" field (not "text")');
assert(actor.traits.needs[0].text === undefined,   'no leftover "text" field on needs');
assert(typeof actor.traits.needs[0].need === 'string', 'need value is a string');

assert(actor.traits.frustrations[0].frustration !== undefined, 'frustrations use "frustration" field');
assert(actor.traits.frustrations[0].text === undefined,        'no leftover "text" on frustrations');

assert(actor.traits.motivations[0].motivation !== undefined, 'motivations use "motivation" field');
assert(actor.traits.motivations[0].text === undefined,       'no leftover "text" on motivations');

// Contexts
assert(Array.isArray(actor.contexts), 'contexts is array');
assert(actor.contexts.length === 1, 'one context from role');
assert(actor.contexts[0].contextId === 'ctx-working-mom-consumer', 'contextId: role- → ctx-');
assert(actor.contexts[0].contextType === 'Consumer', 'contextType mapped from roleType');

// Context needs — field rename
assert(Array.isArray(actor.contexts[0].needs), 'context.needs is array');
assert(actor.contexts[0].needs.length >= 4, 'all context needs present');
assert(actor.contexts[0].needs[0].need !== undefined, 'context needs use "need" field');
assert(actor.contexts[0].needs[0].text === undefined, 'no leftover "text" on context needs');

// Context frustrations — field rename
assert(Array.isArray(actor.contexts[0].frustrations), 'context.frustrations is array');
assert(actor.contexts[0].frustrations[0].frustration !== undefined, 'context frustrations use "frustration" field');
assert(actor.contexts[0].frustrations[0].text === undefined, 'no leftover "text" on context frustrations');

// Channels — medium rename
const inPersonChannel = actor.contexts[0].channels.find(c => c.channel === 'in_person');
assert(inPersonChannel !== undefined, 'in_person channel preserved');
assert(inPersonChannel.category === 'physical', 'non_digital medium → physical category');
assert(inPersonChannel.medium === undefined, 'no leftover "medium" field on channel');

// Emergence
assert(Array.isArray(actor.emergence), 'emergence is array');
assert(actor.emergence.length === 1, 'one emergence entry');
assert(actor.emergence[0].contextRef === 'ctx-working-mom-consumer', 'contextRef matches context ID');

// Emergence goals — field rename
assert(Array.isArray(actor.emergence[0].goalsAsExperienced), 'goalsAsExperienced is array');
assert(actor.emergence[0].goalsAsExperienced.length >= 4, 'all goals converted');
assert(actor.emergence[0].goalsAsExperienced[0].goal !== undefined, 'goals use "goal" field');
assert(actor.emergence[0].goalsAsExperienced[0].text === undefined, 'no leftover "text" on goals');

// Emergence pain points — field rename
assert(Array.isArray(actor.emergence[0].painPoints), 'painPoints is array');
assert(actor.emergence[0].painPoints.length >= 4, 'all pain points converted');
assert(actor.emergence[0].painPoints[0].painPoint !== undefined, 'painPoints use "painPoint" field');
assert(actor.emergence[0].painPoints[0].text === undefined, 'no leftover "text" on painPoints');

// Enum translations: persona/role/persona+role → traits/context/collision
const sources = actor.emergence[0].goalsAsExperienced.map(g => g.source);
assert(sources.every(s => ['traits', 'context', 'collision'].includes(s)),
  'source enum translated: persona→traits, role→context, persona+role→collision');
assert(!sources.includes('persona'),    'no raw "persona" source value');
assert(!sources.includes('role'),       'no raw "role" source value');
assert(!sources.includes('persona+role'), 'no raw "persona+role" source value');

// Quote from pairing
assert(typeof actor.quote === 'string' && actor.quote.length > 0, 'quote preserved from pairing.synthesis.quote');

// Provenance and governance
assert(actor.provenance !== undefined, 'provenance present');
assert(actor.governance !== undefined, 'governance present');

// Meta
assert(actor.meta !== undefined, 'meta present');
assert(actor.version === '2.0.0', 'version set to 2.0.0');

console.log('\nTest group: convertJourneyToMission');

const mission = convertJourneyToMission(journey);

assert(mission.$type === 'Mission', '$type === Mission');
assert(mission.$context === 'https://schemas.digitalservice.design/v2.0', '$context is v2.0 URL');
assert(typeof mission.id === 'string' && mission.id.length > 0, 'mission ID present');
assert(typeof mission.title === 'string', 'title present');
assert(Array.isArray(mission.nodes), 'nodes array present');
assert(Array.isArray(mission.edges), 'edges array present');

// Count nodes — journey has steps; all should become nodes
const totalJourneySteps = journey.journey.phases.reduce((acc, p) => acc + p.steps.length, 0);
assert(mission.nodes.length >= totalJourneySteps, 'node count >= journey step count');

// Each node should have id, type, description
const firstNode = mission.nodes[0];
assert(firstNode.id !== undefined, 'node has id');
assert(firstNode.type !== undefined, 'node has type');

// Edges — should connect sequential steps
assert(mission.edges.length >= totalJourneySteps - 1, 'edges connect sequential steps');

// Phases declared
assert(Array.isArray(mission.phases), 'phases array present');
assert(mission.phases.length === journey.journey.phases.length, 'phase count matches');

// Service-level channels should be on nodes (not persona thoughts/emotions)
const nodeWithChannels = mission.nodes.find(n => n.laneContent && n.laneContent.channels && n.laneContent.channels.length > 0);
assert(nodeWithChannels !== undefined, 'at least one node has channels in laneContent');

// No persona-specific fields should be on mission nodes
const hasPersonaFields = mission.nodes.some(n =>
  n.laneContent && (n.laneContent.thoughts !== undefined || n.laneContent.emotions !== undefined)
);
assert(!hasPersonaFields, 'mission nodes have no persona-specific fields (thoughts/emotions)');

console.log('\nTest group: convertJourneyToExperience');

const experience = convertJourneyToExperience(
  journey,
  'actor-sarah-martinez',
  'ctx-working-mom-consumer',
  mission.id
);

assert(experience.$type === 'Experience', '$type === Experience');
assert(experience.$context === 'https://schemas.digitalservice.design/v2.0', '$context is v2.0 URL');
assert(experience.references.actorRef === 'actor-sarah-martinez', 'actorRef set');
assert(experience.references.missionRef === mission.id, 'missionRef matches mission ID');

// Path
assert(experience.path !== undefined, 'path defined');
assert(Array.isArray(experience.path.nodeSequence), 'path.nodeSequence is array');
assert(experience.path.nodeSequence.length >= totalJourneySteps, 'path covers all steps');

// Experience nodes
assert(Array.isArray(experience.nodes), 'experience nodes array present');
assert(experience.nodes.length >= totalJourneySteps, 'experience node count matches');

// Persona-specific fields should be on experience nodes
const expNode = experience.nodes[0];
assert(expNode.nodeRef !== undefined, 'experience node has nodeRef');
// thoughts and emotions come from the journey steps
const hasThoughtsOrEmotions = experience.nodes.some(n => n.thoughts !== undefined || n.emotions !== undefined);
assert(hasThoughtsOrEmotions, 'experience nodes carry thoughts/emotions from journey');

// needAtStep and painAtStep should NOT be set (require human work)
const hasNeedAtStep = experience.nodes.some(n => n.needAtStep !== undefined && n.needAtStep !== null);
assert(!hasNeedAtStep, 'needAtStep not auto-populated (requires human design work)');

// ─── Summary ───────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────────');
if (failed === 0) {
  console.log(`✓ All ${passed} tests passed`);
} else {
  console.log(`✗ ${failed} failed, ${passed} passed`);
  process.exit(1);
}
