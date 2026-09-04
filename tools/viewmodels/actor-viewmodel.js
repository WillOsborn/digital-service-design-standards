// Actor view model — v2.0 Actor JSON → target-agnostic, uniformly shaped object.
// Pure: no I/O. Consumed by tools/renderers/pptx/deck-model.js and the Figma plugin.
// Spec: docs/superpowers/specs/2026-09-04-actor-export-design.md §4

'use strict';

const TRAIT_GROUPS = ['demographics', 'needs', 'frustrations', 'motivations', 'technology', 'communication',
  'learningStyle', 'influences', 'decisionMaking', 'accessibility', 'behaviouralPatterns'];

const TRAIT_LABELS = {
  demographics: 'Demographics', needs: 'Needs', frustrations: 'Frustrations', motivations: 'Motivations',
  technology: 'Technology', communication: 'Communication', learningStyle: 'Learning style',
  influences: 'Influences', decisionMaking: 'Decision making', accessibility: 'Accessibility',
  behaviouralPatterns: 'Behavioural patterns'
};

const DEFAULT_ACTOR_SECTIONS = Object.freeze({
  traits: true, contexts: true, emergence: true, relationships: true, provenance: false, governance: false
});

const AVATAR_LABELS = { ai_agent: 'AI', team: 'TEAM', organisation: 'ORG' };
const COLOUR_KEYS = 6;

function humanise(key) {
  const s = String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function initialsOf(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1].split('-')[0][0] : '';
  return (first + last).toUpperCase();
}

function colourKeyOf(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % COLOUR_KEYS;
}

const nonEmpty = v => Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '';
const item = (primary, extra) => Object.assign({ primary: String(primary) }, extra || {});
const severityBadge = n => (typeof n === 'number' ? `severity ${n}/5` : undefined);
const joinList = arr => (Array.isArray(arr) ? arr.map(humaniseValue).join(', ') : undefined);
function humaniseValue(v) { return typeof v === 'string' ? v.replace(/_/g, ' ') : String(v); }

// One normaliser per trait group (spec §4.1). Each returns Item[] (possibly empty).
const TRAIT_NORMALISERS = {
  demographics: d => ['age', 'location', 'education', 'background']
    .filter(k => nonEmpty(d[k])).map(k => item(d[k], { badge: k })),
  needs: arr => arr.map(n => item(n.need, { badge: n.type })),
  frustrations: arr => arr.map(f => item(f.frustration, { badge: severityBadge(f.severity) })),
  motivations: arr => arr.map(m => item(m.motivation, { badge: m.type })),
  technology: t => nonEmpty(t.description) || nonEmpty(t.comfort)
    ? [item(t.description || humaniseValue(t.comfort), { badge: t.comfort, secondary: joinList(t.preferredDevices) })] : [],
  communication: c => [
    ...['preferred', 'acceptable', 'avoided'].filter(k => nonEmpty(c[k])).map(k => item(joinList(c[k]), { badge: k })),
    ...(nonEmpty(c.style) ? [item(c.style)] : [])
  ],
  learningStyle: s => nonEmpty(s) ? [item(s)] : [],
  influences: arr => arr.map(i => item(i.description || i.source, { badge: i.description ? i.source : undefined })),
  decisionMaking: d => nonEmpty(d.style) ? [item(d.style, { badge: d.riskTolerance })] : [],
  accessibility: a => [
    ...(a.dimensions || []).map(d => item(d.description || d.dimension, { badge: [d.dimension, d.impact].filter(Boolean).join(' · ') })),
    ...(a.assistiveTech || []).map(t => item(typeof t === 'string' ? t : (t.name || JSON.stringify(t)), { badge: 'assistive tech' }))
  ],
  behaviouralPatterns: arr => arr.map(p => item(p.pattern, { secondary: p.context }))
};

function normaliseTraits(traits, groups) {
  const out = {};
  for (const g of groups) {
    const raw = traits && traits[g];
    if (!nonEmpty(raw)) continue;
    const items = TRAIT_NORMALISERS[g](raw).filter(i => nonEmpty(i.primary));
    if (items.length === 0) continue;
    out[g] = { label: TRAIT_LABELS[g], items };
  }
  return out;
}

function buildAvatar(actor) {
  const label = AVATAR_LABELS[actor.actorType];
  return label
    ? { kind: 'label', text: label, colourKey: colourKeyOf(actor.id) }
    : { kind: 'initials', text: initialsOf(actor.name), colourKey: colourKeyOf(actor.id) };
}

function resolveOptions(options) {
  const o = options || {};
  const sections = Object.assign({}, DEFAULT_ACTOR_SECTIONS, o.sections || {});
  const traitGroups = o.traitGroups && o.traitGroups !== 'all'
    ? TRAIT_GROUPS.filter(g => o.traitGroups.includes(g)) : TRAIT_GROUPS.slice();
  return { sections, traitGroups, caps: Object.assign({ summaryItems: 3 }, o.caps || {}), context: o.context, deck: Object.assign({ actorIds: [] }, o.deck || {}) };
}

function buildActorViewModel(actor, options) {
  const opts = resolveOptions(options);
  const warnings = [];
  const vm = {
    identity: { id: actor.id, name: actor.name, actorType: actor.actorType, summary: actor.summary || '', quote: actor.quote || '', version: actor.version },
    avatar: buildAvatar(actor),
    traits: opts.sections.traits ? normaliseTraits(actor.traits, opts.traitGroups) : {},
    contexts: [],
    unattributedEmergence: [],
    relationships: { inDeck: [], external: [] },
    summarySlots: null,
    warnings
  };
  return vm;
}

module.exports = { buildActorViewModel, TRAIT_GROUPS, TRAIT_LABELS, DEFAULT_ACTOR_SECTIONS, humanise, initialsOf, colourKeyOf, humaniseValue, item, nonEmpty, severityBadge, joinList, resolveOptions };
