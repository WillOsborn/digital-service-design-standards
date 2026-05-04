// v2.0 Quality Scoring
// Assesses Actor, Mission, and Experience artifacts against a 100-point rubric.
// Scoring is a content quality guide, not a schema pass/fail gate.
//
// Usage:
//   const { scoreArtifact, scoreActor, scoreMission, scoreExperience } = require('./v2.0-quality-scoring');
//   const result = scoreArtifact(data); // auto-detects type
//   console.log(result.score, result.breakdown);

'use strict';

// ---------------------------------------------------------------------------
// Actor scoring — 100 pts
// ---------------------------------------------------------------------------
// Required fields:     30 pts
// Traits depth:        20 pts
// Context completeness: 15 pts
// Emergence:           15 pts
// Provenance:          10 pts
// Governance:          10 pts
// ---------------------------------------------------------------------------

function scoreActor(data) {
  const breakdown = {};
  let score = 0;

  // --- Required fields: 30 pts (5 each for 6 key fields) ---
  const requiredFields = ['id', 'version', 'name', 'actorType', 'traits', 'contexts'];
  let reqScore = 0;
  for (const field of requiredFields) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      reqScore += 5;
    }
  }
  breakdown.requiredFields = { score: reqScore, max: 30, detail: `${reqScore / 5}/${requiredFields.length} required fields present` };
  score += reqScore;

  // --- Traits depth: 20 pts ---
  // needs ≥3: 5, frustrations ≥2: 5, technology: 3, communication: 3, decisionMaking: 4
  const traits = data.traits || {};
  let traitsScore = 0;
  const needsCount = Array.isArray(traits.needs) ? traits.needs.length : 0;
  const frustCount = Array.isArray(traits.frustrations) ? traits.frustrations.length : 0;
  traitsScore += needsCount >= 3 ? 5 : needsCount > 0 ? 2 : 0;
  traitsScore += frustCount >= 2 ? 5 : frustCount > 0 ? 2 : 0;
  traitsScore += traits.technology ? 3 : 0;
  traitsScore += traits.communication ? 3 : 0;
  traitsScore += traits.decisionMaking ? 4 : 0;
  breakdown.traitsDepth = {
    score: traitsScore, max: 20,
    detail: `needs:${needsCount} frustrations:${frustCount} ` +
      `tech:${!!traits.technology} comms:${!!traits.communication} decisions:${!!traits.decisionMaking}`
  };
  score += traitsScore;

  // --- Context completeness: 15 pts ---
  // ≥1 context: 5, context has needs: 3, frustrations: 3, channels: 4
  const contexts = Array.isArray(data.contexts) ? data.contexts : [];
  let ctxScore = 0;
  ctxScore += contexts.length >= 1 ? 5 : 0;
  if (contexts.length > 0) {
    const firstCtx = contexts[0];
    ctxScore += Array.isArray(firstCtx.needs) && firstCtx.needs.length > 0 ? 3 : 0;
    ctxScore += Array.isArray(firstCtx.frustrations) && firstCtx.frustrations.length > 0 ? 3 : 0;
    ctxScore += Array.isArray(firstCtx.channels) && firstCtx.channels.length > 0 ? 4 : 0;
  }
  breakdown.contextCompleteness = {
    score: ctxScore, max: 15,
    detail: `${contexts.length} context(s), first has needs/frustrations/channels`
  };
  score += ctxScore;

  // --- Emergence: 15 pts ---
  // ≥1 emergence: 5, goalsAsExperienced: 3, painPoints (any): 4, painPoints with emergesFrom: 3
  const emergence = Array.isArray(data.emergence) ? data.emergence : [];
  let emergeScore = 0;
  emergeScore += emergence.length >= 1 ? 5 : 0;
  if (emergence.length > 0) {
    const e = emergence[0];
    emergeScore += Array.isArray(e.goalsAsExperienced) && e.goalsAsExperienced.length > 0 ? 3 : 0;
    const pains = Array.isArray(e.painPoints) ? e.painPoints : [];
    emergeScore += pains.length > 0 ? 4 : 0;
    emergeScore += pains.some(p => p.emergesFrom) ? 3 : 0;
  }
  breakdown.emergence = {
    score: emergeScore, max: 15,
    detail: `${emergence.length} emergence block(s)`
  };
  score += emergeScore;

  // --- Provenance: 10 pts ---
  // provenance object: 5, researchSources non-empty: 5
  const prov = data.provenance;
  let provScore = 0;
  if (prov && typeof prov === 'object') {
    provScore += 5;
    const sources = prov.researchSources || prov.sources;
    if (Array.isArray(sources) && sources.length > 0) provScore += 5;
  }
  breakdown.provenance = { score: provScore, max: 10, detail: provScore === 10 ? 'present with sources' : provScore === 5 ? 'present, no sources' : 'missing' };
  score += provScore;

  // --- Governance: 10 pts ---
  // dataClassification: 5, legalBasis or anonymisationMethod: 5
  const gov = data.governance;
  let govScore = 0;
  if (gov && typeof gov === 'object') {
    if (gov.dataClassification) govScore += 5;
    if (gov.legalBasis || gov.anonymisationMethod) govScore += 5;
  }
  breakdown.governance = { score: govScore, max: 10, detail: govScore === 10 ? 'complete' : govScore === 5 ? 'partial' : 'missing' };
  score += govScore;

  return { score: Math.min(score, 100), max: 100, breakdown };
}

// ---------------------------------------------------------------------------
// Mission scoring — 100 pts
// ---------------------------------------------------------------------------
// Required fields:          20 pts
// Node count & type variety: 15 pts
// Edge connectivity:         15 pts
// Lanes declared & populated: 15 pts
// Service blueprint depth:   15 pts
// Paths with frequency:      10 pts
// SLA on key nodes:          10 pts
// ---------------------------------------------------------------------------

function scoreMission(data) {
  const breakdown = {};
  let score = 0;

  // --- Required fields: 20 pts ---
  const requiredFields = ['id', 'version', 'title', 'goal', 'actors', 'nodes', 'edges', 'meta'];
  let reqScore = 0;
  const ptsEach = 20 / requiredFields.length; // 2.5 each
  for (const field of requiredFields) {
    const val = data[field];
    if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      reqScore += ptsEach;
    }
  }
  reqScore = Math.round(reqScore);
  breakdown.requiredFields = { score: reqScore, max: 20, detail: `key fields present` };
  score += reqScore;

  // --- Node count & type variety: 15 pts ---
  // ≥5 nodes: 5, ≥3 distinct node types: 5, has decision node: 5
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  let nodeScore = 0;
  nodeScore += nodes.length >= 5 ? 5 : nodes.length > 0 ? 2 : 0;
  const nodeTypes = new Set(nodes.map(n => n.nodeType).filter(Boolean));
  nodeScore += nodeTypes.size >= 3 ? 5 : nodeTypes.size >= 2 ? 2 : 0;
  nodeScore += nodeTypes.has('decision') ? 5 : 0;
  breakdown.nodeVariety = {
    score: nodeScore, max: 15,
    detail: `${nodes.length} nodes, ${nodeTypes.size} types (${[...nodeTypes].join(', ')})`
  };
  score += nodeScore;

  // --- Edge connectivity: 15 pts ---
  // All nodes referenced in edges: 10, no isolated nodes (node with no edges): 5
  const edges = Array.isArray(data.edges) ? data.edges : [];
  let edgeScore = 0;
  if (nodes.length > 0 && edges.length > 0) {
    const connectedIds = new Set();
    for (const e of edges) {
      if (e.from) connectedIds.add(e.from);
      if (e.to) connectedIds.add(e.to);
    }
    const nodeIds = new Set(nodes.map(n => n.nodeId));
    const isolated = [...nodeIds].filter(id => !connectedIds.has(id));
    edgeScore += edges.length >= nodes.length - 1 ? 10 : edges.length > 0 ? 5 : 0;
    edgeScore += isolated.length === 0 ? 5 : 0;
    breakdown.edgeConnectivity = {
      score: edgeScore, max: 15,
      detail: `${edges.length} edges, ${isolated.length} isolated nodes`
    };
  } else {
    breakdown.edgeConnectivity = { score: 0, max: 15, detail: 'no edges' };
  }
  score += edgeScore;

  // --- Lanes declared & populated: 15 pts ---
  // lanes array present: 5, core lanes (channels, barriers) declared: 5, ≥1 node has laneContent: 5
  const lanes = Array.isArray(data.lanes) ? data.lanes : [];
  let laneScore = 0;
  laneScore += lanes.length > 0 ? 5 : 0;
  const laneIds = new Set(lanes.map(l => l.id));
  laneScore += (laneIds.has('channels') || laneIds.has('barriers')) ? 5 : 0;
  const hasLaneContent = nodes.some(n => n.laneContent && Object.keys(n.laneContent).length > 0);
  laneScore += hasLaneContent ? 5 : 0;
  breakdown.lanes = {
    score: laneScore, max: 15,
    detail: `${lanes.length} lanes declared, content: ${hasLaneContent}`
  };
  score += laneScore;

  // --- Service blueprint depth: 15 pts ---
  // frontstage on ≥1 node: 5, backstage on ≥1 node: 5, support-systems on ≥1 node: 5
  let bpScore = 0;
  const hasFront = nodes.some(n => n.laneContent && n.laneContent.frontstage);
  const hasBack = nodes.some(n => n.laneContent && n.laneContent.backstage);
  const hasSupport = nodes.some(n => n.laneContent && (n.laneContent['support-systems'] || n.laneContent.supportSystems));
  bpScore += hasFront ? 5 : 0;
  bpScore += hasBack ? 5 : 0;
  bpScore += hasSupport ? 5 : 0;
  breakdown.serviceBlueprint = {
    score: bpScore, max: 15,
    detail: `frontstage:${hasFront} backstage:${hasBack} support-systems:${hasSupport}`
  };
  score += bpScore;

  // --- Paths with frequency: 10 pts ---
  // ≥1 path: 5, all paths have frequency: 5
  const paths = Array.isArray(data.paths) ? data.paths : [];
  let pathScore = 0;
  pathScore += paths.length >= 1 ? 5 : 0;
  pathScore += paths.length > 0 && paths.every(p => typeof p.frequency === 'number') ? 5 : 0;
  breakdown.paths = {
    score: pathScore, max: 10,
    detail: `${paths.length} path(s) defined`
  };
  score += pathScore;

  // --- SLA on key nodes: 10 pts ---
  // ≥1 node has sla property: 10
  const hasSla = nodes.some(n => n.sla && typeof n.sla === 'object');
  let slaScore = hasSla ? 10 : 0;
  breakdown.sla = { score: slaScore, max: 10, detail: hasSla ? 'SLA defined' : 'no SLA' };
  score += slaScore;

  return { score: Math.min(score, 100), max: 100, breakdown };
}

// ---------------------------------------------------------------------------
// Experience scoring — 100 pts
// ---------------------------------------------------------------------------
// Required fields:            20 pts
// Path coverage:              10 pts
// Thoughts & emotions:        20 pts
// needAtStep on ≥3 nodes:     15 pts
// painAtStep on ≥2 nodes:     10 pts
// Barriers with emergesFrom:  15 pts
// Outcome section:            10 pts
// ---------------------------------------------------------------------------

function scoreExperience(data) {
  const breakdown = {};
  let score = 0;

  // --- Required fields: 20 pts ---
  const requiredFields = ['id', 'version', 'title', 'references', 'path', 'nodes', 'meta'];
  let reqScore = 0;
  const ptsEach = Math.floor(20 / requiredFields.length); // 2 each = 14, last gets extra
  for (const field of requiredFields) {
    const val = data[field];
    if (val !== undefined && val !== null && val !== '') {
      reqScore += 3;
    }
  }
  reqScore = Math.min(reqScore, 20); // cap at 20 (7 fields × 3 = 21, cap at 20)
  breakdown.requiredFields = { score: reqScore, max: 20, detail: `key fields present` };
  score += reqScore;

  // --- Path coverage: 10 pts ---
  // nodeSequence length ≥5: 5, nodes array populated: 5
  const nodeSeq = data.path && Array.isArray(data.path.nodeSequence) ? data.path.nodeSequence : [];
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  let pathScore = 0;
  pathScore += nodeSeq.length >= 5 ? 5 : nodeSeq.length > 0 ? 2 : 0;
  pathScore += nodes.length > 0 ? 5 : 0;
  breakdown.pathCoverage = {
    score: pathScore, max: 10,
    detail: `nodeSequence: ${nodeSeq.length} steps, nodes: ${nodes.length}`
  };
  score += pathScore;

  // --- Thoughts & emotions: 20 pts ---
  // thoughts on ≥75% of nodes: 10, emotions on ≥75% of nodes: 10
  let thoughtScore = 0;
  let emotionScore = 0;
  if (nodes.length > 0) {
    const withThoughts = nodes.filter(n => n.laneContent && n.laneContent.thoughts).length;
    const withEmotions = nodes.filter(n => n.laneContent && n.laneContent.emotions).length;
    const threshold = Math.ceil(nodes.length * 0.75);
    thoughtScore = withThoughts >= threshold ? 10 : withThoughts > 0 ? 5 : 0;
    emotionScore = withEmotions >= threshold ? 10 : withEmotions > 0 ? 5 : 0;
    breakdown.thoughtsEmotions = {
      score: thoughtScore + emotionScore, max: 20,
      detail: `thoughts: ${withThoughts}/${nodes.length}, emotions: ${withEmotions}/${nodes.length} (threshold: ${threshold})`
    };
  } else {
    breakdown.thoughtsEmotions = { score: 0, max: 20, detail: 'no nodes' };
  }
  score += thoughtScore + emotionScore;

  // --- needAtStep on ≥3 nodes: 15 pts ---
  // (needAtStep stored in laneContent.needAtStep per node)
  const nodesWithNeed = nodes.filter(n => n.laneContent && n.laneContent.needAtStep).length;
  const needScore = nodesWithNeed >= 3 ? 15 : nodesWithNeed >= 1 ? 7 : 0;
  breakdown.needAtStep = {
    score: needScore, max: 15,
    detail: `${nodesWithNeed} node(s) have needAtStep (threshold: 3)`
  };
  score += needScore;

  // --- painAtStep on ≥2 nodes: 10 pts ---
  const nodesWithPain = nodes.filter(n => n.laneContent && n.laneContent.painAtStep).length;
  const painScore = nodesWithPain >= 2 ? 10 : nodesWithPain >= 1 ? 5 : 0;
  breakdown.painAtStep = {
    score: painScore, max: 10,
    detail: `${nodesWithPain} node(s) have painAtStep (threshold: 2)`
  };
  score += painScore;

  // --- Barriers with emergesFrom: 15 pts ---
  // ≥1 node has barriers: 8, any barrier has emergesFrom: 7
  const allBarriers = [];
  for (const n of nodes) {
    const b = n.laneContent && n.laneContent.barriers;
    if (Array.isArray(b)) allBarriers.push(...b);
  }
  let barrierScore = 0;
  barrierScore += allBarriers.length >= 1 ? 8 : 0;
  barrierScore += allBarriers.some(b => b.emergesFrom) ? 7 : 0;
  breakdown.barriers = {
    score: barrierScore, max: 15,
    detail: `${allBarriers.length} barrier(s) across nodes, emergesFrom: ${allBarriers.some(b => b.emergesFrom)}`
  };
  score += barrierScore;

  // --- Outcome section: 10 pts ---
  const outcome = data.outcome;
  const outcomeScore = outcome && typeof outcome === 'object' && Object.keys(outcome).length > 0 ? 10 : 0;
  breakdown.outcome = { score: outcomeScore, max: 10, detail: outcome ? 'present' : 'missing' };
  score += outcomeScore;

  return { score: Math.min(score, 100), max: 100, breakdown };
}

// ---------------------------------------------------------------------------
// Auto-dispatch
// ---------------------------------------------------------------------------

/**
 * Score any v2.0 artifact. Uses $type field or structural heuristics.
 * @param {Object} data - Parsed artifact
 * @returns {{ score: number, max: number, schemaType: string|null, breakdown: Object }}
 */
function scoreArtifact(data) {
  const type = data.$type ||
    (data.traits && data.contexts ? 'Actor' : null) ||
    (data.nodes && data.edges ? 'Mission' : null) ||
    (data.references && data.path ? 'Experience' : null);

  if (type === 'Actor') return { ...scoreActor(data), schemaType: 'Actor' };
  if (type === 'Mission') return { ...scoreMission(data), schemaType: 'Mission' };
  if (type === 'Experience') return { ...scoreExperience(data), schemaType: 'Experience' };

  return { score: 0, max: 100, schemaType: null, breakdown: { error: 'Unknown artifact type' } };
}

module.exports = { scoreActor, scoreMission, scoreExperience, scoreArtifact };
