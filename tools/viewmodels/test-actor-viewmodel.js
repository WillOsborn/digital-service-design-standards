// Tests for tools/viewmodels/actor-viewmodel.js
// Run from project root: node tools/viewmodels/test-actor-viewmodel.js

'use strict';

const fs = require('fs');
const path = require('path');
const { validateData } = require('../validators/validate-v2.0');
const vmod = require('./actor-viewmodel');
const { buildActorViewModel, TRAIT_GROUPS, TRAIT_LABELS, DEFAULT_ACTOR_SECTIONS, humanise, initialsOf, colourKeyOf } = vmod;

let passed = 0;
let failed = 0;
function assert(condition, label, detail) {
  if (condition) { console.log(`  PASS: ${label}`); passed++; }
  else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}
function section(title) { console.log(`\n${'='.repeat(60)}\n  ${title}\n${'='.repeat(60)}`); }

const ROOT = path.join(__dirname, '..', '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const sarah = load('v2.0/examples/retail/actor-sarah-martinez.json');
const adam = load('v2.0/examples/roadside/actor-adam-rees.json');
const daniel = load('v2.0/examples/roadside/actor-daniel-rees.json');
const fixture = load('tools/tests/fixtures/actor-multi-context.json');
const ALL_ACTORS = fs.readdirSync(path.join(ROOT, 'v2.0/examples'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .flatMap(d => fs.readdirSync(path.join(ROOT, 'v2.0/examples', d.name))
    .filter(f => f.startsWith('actor-') && f.endsWith('.json'))
    .map(f => load(path.join('v2.0/examples', d.name, f))));

const isItem = it => it && typeof it.primary === 'string' && it.primary.length > 0
  && (it.secondary === undefined || typeof it.secondary === 'string')
  && (it.badge === undefined || typeof it.badge === 'string');

section('Fixture');
assert(validateData(fixture).valid, 'multi-context fixture validates against the Actor schema', (validateData(fixture).errors || []).join('; '));
assert(fixture.contexts.length === 3, 'fixture has three contexts');

section('Helpers');
assert(humanise('preferredDevices') === 'Preferred devices', 'humanise camelCase');
assert(humanise('served_by') === 'Served by', 'humanise snake_case');
assert(initialsOf('Sarah Martinez') === 'SM', 'initials from two words');
assert(initialsOf('Cher') === 'C', 'initials from one word');
assert(initialsOf('Priya Test-Fixture') === 'PT', 'initials ignore hyphenated second part');
assert(colourKeyOf('actor-adam-rees') === colourKeyOf('actor-adam-rees'), 'colourKey is stable');
assert(Number.isInteger(colourKeyOf('x')) && colourKeyOf('x') >= 0 && colourKeyOf('x') < 6, 'colourKey is an integer 0–5');

section('Identity and avatar');
{
  const vm = buildActorViewModel(sarah);
  assert(vm.identity.id === 'actor-sarah-martinez' && vm.identity.name === 'Sarah Martinez', 'identity carries id and name');
  assert(vm.identity.actorType === 'human' && vm.identity.version === '2.0.0', 'identity carries actorType and version');
  assert(vm.identity.summary === sarah.summary && vm.identity.quote === sarah.quote, 'identity carries summary and quote');
  assert(vm.avatar.kind === 'initials' && vm.avatar.text === 'SM', 'human actor gets initials avatar');
  const org = buildActorViewModel({ ...sarah, actorType: 'organisation' });
  assert(org.avatar.kind === 'label' && org.avatar.text === 'ORG', 'organisation gets ORG label');
  assert(buildActorViewModel({ ...sarah, actorType: 'ai_agent' }).avatar.text === 'AI', 'ai_agent gets AI label');
  assert(buildActorViewModel({ ...sarah, actorType: 'team' }).avatar.text === 'TEAM', 'team gets TEAM label');
}

section('Trait normalisation — shapes');
{
  const vm = buildActorViewModel(sarah);
  assert(TRAIT_GROUPS.length === 11, 'eleven trait groups');
  for (const g of TRAIT_GROUPS) {
    const grp = vm.traits[g];
    assert(grp && grp.label === TRAIT_LABELS[g] && Array.isArray(grp.items), `traits.${g} has label and items`);
    assert(grp.items.every(isItem), `traits.${g} items are {primary, secondary?, badge?}`);
  }
  assert(vm.traits.demographics.items.some(i => i.badge === 'age' && i.primary === '32'), 'demographics: age → primary "32", badge "age"');
  assert(vm.traits.demographics.items.some(i => i.badge === 'location' && i.primary === 'Austin, Texas'), 'demographics: location');
  assert(vm.traits.needs.items[0].primary === 'Maintain family wellbeing and happiness' && vm.traits.needs.items[0].badge === 'belonging', 'needs: primary=need, badge=type');
  assert(vm.traits.frustrations.items[0].badge === 'severity 4/5', 'frustrations: badge "severity n/5"');
  assert(vm.traits.motivations.items[0].badge === 'intrinsic', 'motivations: badge=type');
  const tech = vm.traits.technology.items[0];
  assert(tech.badge === 'intermediate' && tech.secondary === 'smartphone, tablet, laptop' && tech.primary.startsWith('Smartphone-first'), 'technology: one item, badge=comfort, secondary=devices');
  const comm = vm.traits.communication.items;
  assert(comm[0].badge === 'preferred' && comm[0].primary === 'app, social media', 'communication: preferred list humanised');
  assert(comm[2].badge === 'avoided' && comm[2].primary === 'phone', 'communication: avoided');
  assert(comm[3].primary.startsWith('Prefers concise') && comm[3].badge === undefined, 'communication: style as fourth item without badge');
  assert(vm.traits.learningStyle.items.length === 1 && vm.traits.learningStyle.items[0].primary.startsWith('Visual learner'), 'learningStyle: single item');
  assert(vm.traits.influences.items[0].badge === 'Family and friends', 'influences: badge=source');
  assert(vm.traits.decisionMaking.items[0].badge === 'cautious', 'decisionMaking: badge=riskTolerance');
  assert(vm.traits.accessibility.items[0].badge === 'situational · moderate', 'accessibility: badge "dimension · impact"');
  assert(vm.traits.behaviouralPatterns.items[0].secondary === 'Any purchase affecting family wellbeing or budget', 'behaviouralPatterns: secondary=context');
}

section('Trait normalisation — absence and selection');
{
  const noMotiv = JSON.parse(JSON.stringify(sarah)); delete noMotiv.traits.motivations; noMotiv.traits.influences = [];
  const vm = buildActorViewModel(noMotiv);
  assert(!('motivations' in vm.traits), 'absent group is omitted');
  assert(!('influences' in vm.traits), 'empty group is omitted');
  const sel = buildActorViewModel(sarah, { traitGroups: ['needs', 'frustrations'] });
  assert(Object.keys(sel.traits).sort().join(',') === 'frustrations,needs', 'traitGroups option selects groups');
  const none = buildActorViewModel(sarah, { sections: { ...DEFAULT_ACTOR_SECTIONS, traits: false } });
  assert(Object.keys(none.traits).length === 0, 'sections.traits=false yields no trait groups');
  assert(DEFAULT_ACTOR_SECTIONS.traits === true && DEFAULT_ACTOR_SECTIONS.provenance === false && DEFAULT_ACTOR_SECTIONS.governance === false && DEFAULT_ACTOR_SECTIONS.relationships === true, 'default sections per spec §4.2');
}

section('Every example Actor normalises without throwing');
for (const a of ALL_ACTORS) {
  let vm, err;
  try { vm = buildActorViewModel(a); } catch (e) { err = e; }
  assert(!err && vm && Object.values(vm.traits).every(g => g.items.every(isItem)), `${a.id} → uniform items`, err && err.message);
}

section('Contexts');
{
  const vm = buildActorViewModel(sarah);
  assert(vm.contexts.length === 1, 'sarah has one context');
  const c = vm.contexts[0];
  assert(c.contextId === 'ctx-working-mom-consumer' && c.title === 'Working Mom Consumer' && c.contextType === 'Consumer', 'context identity fields');
  assert(c.description.startsWith('Primary household'), 'context description');
  assert(c.needs.every(isItem) && c.needs[0].primary === 'Find products that save time in daily routines' && c.needs[0].badge === 'primary', 'context needs: badge=priority');
  assert(c.frustrations[0].badge === 'severity 4/5', 'context frustrations: severity badge');
  assert(c.channels[0].primary === 'app' && c.channels[0].badge === 'preferred' && c.channels[0].secondary.startsWith('Quick shopping'), 'context channels: primary=channel, badge=preference, secondary=usageContext');
  assert(c.momentsThatMatter[0].primary.startsWith('First-time purchase') && c.momentsThatMatter[0].badge === 'critical', 'moments: badge=importance');
  assert(c.details.some(d => d.badge === 'Decision factors' && d.primary.includes('Time savings')), 'details: key humanised as badge, array joined');
  assert(c.details.some(d => d.badge === 'Shopping behaviour'), 'details: camelCase key humanised');
}

section('Emergence nests under its context');
{
  const vm = buildActorViewModel(sarah);
  const e = vm.contexts[0].emergence;
  assert(e && e.goalsAsExperienced[0].primary.startsWith('Make quick, confident') && e.goalsAsExperienced[0].badge === 'collision', 'goals: badge=source (collision made visible)');
  assert(e.painPoints[0].badge === 'severity 4/5' && e.painPoints[0].secondary.startsWith("Sarah's decision-making"), 'pain points: secondary=emergesFrom');
  assert(e.opportunities[0].primary.startsWith('Time-aware') && e.opportunities[0].badge === undefined, 'opportunities: plain items');
  assert(typeof e.emotionalContext === 'string' && e.emotionalContext.startsWith('Generally optimistic'), 'emotionalContext string');
  assert(e.useCases[0].primary === 'Quick reordering of household essentials' && e.useCases[0].secondary === 'Trigger: Running low on regular items → Fast, one-click repurchase with confidence', 'use cases: secondary = trigger → outcome');
  assert(e.successMetrics[0].primary.startsWith('Time saved'), 'success metrics: plain items');
  assert(vm.unattributedEmergence.length === 0 && !vm.warnings.some(w => w.code === 'UNATTRIBUTED_EMERGENCE'), 'no unattributed emergence for sarah');
}
{
  const vm = buildActorViewModel(fixture);
  assert(vm.contexts.length === 3 && vm.contexts.map(c => c.contextId).join(',') === 'ctx-alpha,ctx-beta,ctx-gamma', 'fixture keeps schema order');
  assert(vm.contexts[0].emergence && vm.contexts[0].emergence.goalsAsExperienced.length === 2, 'alpha has its emergence');
  assert(vm.contexts[1].emergence && vm.contexts[1].emergence.goalsAsExperienced.length === 1, 'beta has its emergence');
  assert(vm.contexts[2].emergence === null, 'gamma (no emergence entry) gets null, not an empty object');
  const orphan = JSON.parse(JSON.stringify(fixture));
  orphan.emergence.push({ contextRef: 'ctx-does-not-exist', goalsAsExperienced: [{ goal: 'Orphan goal', source: 'traits', priority: 'primary' }], painPoints: [], opportunities: [], emotionalContext: '', useCases: [], successMetrics: [] });
  const ovm = buildActorViewModel(orphan);
  assert(ovm.unattributedEmergence.length === 1 && ovm.unattributedEmergence[0].contextRef === 'ctx-does-not-exist', 'unmatched contextRef lands in unattributedEmergence');
  assert(ovm.warnings.some(w => w.code === 'UNATTRIBUTED_EMERGENCE' && w.message.includes('ctx-does-not-exist')), 'and produces a warning naming the ref');
  const noEm = buildActorViewModel(fixture, { sections: { emergence: false } });
  assert(noEm.contexts.every(c => c.emergence === null), 'sections.emergence=false nulls all emergence');
  const noCtx = buildActorViewModel(fixture, { sections: { contexts: false } });
  assert(noCtx.contexts.length === 0, 'sections.contexts=false yields no contexts');
}

section('Relationships');
{
  const vm = buildActorViewModel(adam, { deck: { actorIds: ['actor-adam-rees', 'actor-daniel-rees'] } });
  assert(vm.relationships.inDeck.length === 1 && vm.relationships.inDeck[0].target === 'actor-daniel-rees', 'adam→daniel is in-deck when daniel is in the deck');
  assert(vm.relationships.inDeck[0].type === 'serves' && vm.relationships.inDeck[0].typeLabel === 'serves', 'type and typeLabel (no underscores)');
  const alone = buildActorViewModel(adam);
  assert(alone.relationships.inDeck.length === 0 && alone.relationships.external.length === 1, 'same edge is external when daniel is absent');
  const d = buildActorViewModel(daniel, { deck: { actorIds: ['actor-adam-rees', 'actor-daniel-rees'] } });
  assert(d.relationships.inDeck[0].typeLabel === 'served by', 'served_by → "served by"');
  const s = buildActorViewModel(sarah);
  assert(s.relationships.external[0].target === 'mission-online-clothes-shopping' && s.relationships.external[0].typeLabel === 'participates in', 'mission edge is external with humanised label');
  const off = buildActorViewModel(adam, { sections: { relationships: false }, deck: { actorIds: ['actor-adam-rees', 'actor-daniel-rees'] } });
  assert(off.relationships.inDeck.length === 0 && off.relationships.external.length === 0, 'sections.relationships=false empties both');
}

section('Summary slots');
{
  const vm = buildActorViewModel(adam);
  const s = vm.summarySlots;
  assert(s && s.who && s.context && s.emerges, 'three slots present');
  assert(s.who.items.length === 3 && s.who.full.length > 3 && s.who.truncated === true, 'who: capped at 3, full retained, truncated flagged');
  assert(s.who.full[0].badge === 'age', 'who: demographics come first');
  assert(s.who.full.some(i => i.badge && i.badge.startsWith('severity')), 'who: includes frustrations');
  assert(s.context.contextId === adam.contexts[0].contextId && s.context.moreContexts === 0, 'context: first context, no more');
  assert(s.emerges.items.every(isItem) && s.emerges.full[0].badge !== undefined, 'emerges: goals (badged by source) then pain points');
  const cap5 = buildActorViewModel(adam, { caps: { summaryItems: 5 } });
  assert(cap5.summarySlots.who.items.length === 5, 'caps.summaryItems honoured');
}
{
  const vm = buildActorViewModel(fixture);
  assert(vm.summarySlots.context.contextId === 'ctx-alpha' && vm.summarySlots.context.moreContexts === 2, 'multi-context: first by default, moreContexts=2');
  assert(vm.summarySlots.context.items[0].primary === 'Alpha need one', 'context slot items come from the chosen context');
  const beta = buildActorViewModel(fixture, { context: 'ctx-beta' });
  assert(beta.summarySlots.context.contextId === 'ctx-beta' && beta.summarySlots.context.title === 'Beta Role', 'options.context selects a context');
  assert(beta.summarySlots.emerges.full[0].primary === 'Beta goal', 'emerges follows the chosen context');
  const gamma = buildActorViewModel(fixture, { context: 'ctx-gamma' });
  assert(gamma.summarySlots.emerges.items.length === 0 && gamma.summarySlots.emerges.truncated === false, 'context without emergence → empty emerges slot, not an error');
  const missing = buildActorViewModel(fixture, { context: 'ctx-nope' });
  assert(missing.summarySlots.context.contextId === 'ctx-alpha', 'unknown options.context falls back to first');
  assert(missing.warnings.some(w => w.code === 'CONTEXT_NOT_FOUND' && w.message.includes('ctx-nope')), 'and warns');
  const noCtx = buildActorViewModel({ ...fixture, contexts: [], emergence: [] });
  assert(noCtx.summarySlots.context === null && noCtx.summarySlots.emerges.items.length === 0, 'no contexts → context slot null');
}

section('Provenance and governance');
{
  const off = buildActorViewModel(sarah);
  assert(off.provenance === undefined && off.governance === undefined, 'off by default');
  const on = buildActorViewModel(sarah, { sections: { provenance: true, governance: true } });
  assert(Array.isArray(on.governance) && on.governance.some(i => i.badge === 'Contains pii' && i.primary === 'true'), 'governance rendered as key/value items');
  assert(Array.isArray(on.provenance) && on.provenance.some(i => i.badge === 'Source'), 'provenance rendered as key/value items');
}

section('Warnings shape');
for (const a of ALL_ACTORS) {
  const vm = buildActorViewModel(a);
  assert(Array.isArray(vm.warnings) && vm.warnings.every(w => typeof w.code === 'string' && typeof w.message === 'string'), `${a.id}: warnings are {code, message}`);
}

module.exports = { assert, section, ROOT, load, sarah, adam, daniel, fixture, ALL_ACTORS, isItem, finish: () => { console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };
if (require.main === module) module.exports.finish();
