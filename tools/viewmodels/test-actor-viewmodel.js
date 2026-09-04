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

module.exports = { assert, section, ROOT, load, sarah, adam, daniel, fixture, ALL_ACTORS, isItem, finish: () => { console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };
if (require.main === module) module.exports.finish();
