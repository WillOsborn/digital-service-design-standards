// deck-model.js — Actor view models → slide descriptions (spec §5). Pure; no PptxGenJS.
// Coordinates in inches on a 13.333 × 7.5 slide. Text sizes in points from theme.typography.scale.

'use strict';

const flow = require('./flow');

const SLIDE = Object.freeze({ w: 13.333, h: 7.5 });
const LAYOUT = Object.freeze({
  margin: 0.5, gutter: 0.25, footerY: 7.05, footerH: 0.3,
  cover: { titleY: 2.4, titleH: 1.0, subY: 3.5, subH: 0.5, srcY: 4.3, srcH: 1.6 },
  index: { perSlide: 8, cols: 4, rows: 2, titleY: 0.45, titleH: 0.6, gridY: 1.3, gridH: 5.55, avatarD: 0.6, cardPad: 0.15 },
  summary: { headerH: 1.55, avatarD: 0.95, nameX: 1.65, nameW: 6.2, quoteX: 8.0, quoteW: 4.85,
             sumY: 1.75, sumH: 0.85, colY: 2.8, colH: 4.05, colHeadH: 0.42, colHeadMaxH: 0.72, captionH: 0.26, colPad: 0.12 },
  appendix: { headerH: 0.85, avatarD: 0.5, frameY: 1.1, frameH: 5.85, colGap: 0.25 }
});
const AVATAR_COLOURS = ['touchpoint', 'start', 'decision', 'handoff', 'signal', 'end'];

const el = {
  text: (x, y, w, h, t, style) => ({ type: 'text', x, y, w, h,
    paragraphs: Array.isArray(t) ? t : [{ text: String(t) }],
    size: style.size, colour: style.colour, bold: !!style.bold, italic: !!style.italic,
    align: style.align || 'left', valign: style.valign || 'top', fill: style.fill }),
  rect: (x, y, w, h, fill, line, radius) => ({ type: 'rect', x, y, w, h, fill, line, radius }),
  ellipse: (x, y, w, h, fill, line) => ({ type: 'ellipse', x, y, w, h, fill, line }),
  line: (x1, y1, x2, y2, colour, width) => ({ type: 'line', x1, y1, x2, y2, colour, width }),
  image: (p, x, y, w, h) => ({ type: 'image', path: p, x, y, w, h })
};

function fitParagraph(text, w, h, style, metrics) {
  const fits = t => flow.estimateBlockHeight({ kind: 'paragraph', sectionId: 'fit', text: t, style }, w, metrics) <= h;
  if (fits(text)) return { text, truncated: false };
  const s = flow.splitSentences(text);
  let n = 0;
  for (let i = 1; i < s.length; i++) { if (fits(s.slice(0, i).join('').trimEnd())) n = i; else break; }
  return { text: n > 0 ? s.slice(0, n).join('').trimEnd() : (s[0] || '').trimEnd(), truncated: true };
}

// Truncates `text` at a word boundary, appending '…', until it fits within two wrapped lines at
// `sizePt` in `w` inches wide — used to keep a column heading inside its fixed-height band.
function fitHeading(text, w, sizePt, metrics) {
  const fits = t => flow.estimateLines(t, w, sizePt, metrics) <= 2;
  if (fits(text)) return { text, truncated: false };
  const words = text.split(' ');
  let n = 0;
  for (let i = 1; i <= words.length; i++) {
    if (fits(words.slice(0, i).join(' ') + '…')) n = i; else break;
  }
  const t = n > 0 ? words.slice(0, n).join(' ') + '…' : (words[0] || '') + '…';
  return { text: t, truncated: true };
}

function avatarElements(vm, ctx, x, y, d) {
  const img = ctx.images[vm.identity.id];
  if (img) return [el.image(img, x, y, d, d)];
  const colour = ctx.C[AVATAR_COLOURS[vm.avatar.colourKey % AVATAR_COLOURS.length]];
  const size = vm.avatar.kind === 'label' ? Math.round(d * 14) : Math.round(d * 24);
  return [el.ellipse(x, y, d, d, colour), el.text(x, y, d, d, vm.avatar.text, { size, bold: true, colour: '#ffffff', align: 'center', valign: 'middle' })];
}

function footerElements(left, ctx) {
  const s = { size: ctx.S.caption, colour: ctx.C.dim };
  return [
    el.text(LAYOUT.margin, LAYOUT.footerY, SLIDE.w - 2 * LAYOUT.margin - 1, LAYOUT.footerH, left, s),
    el.text(SLIDE.w - LAYOUT.margin - 1, LAYOUT.footerY, 1, LAYOUT.footerH, String(ctx.page()), Object.assign({ align: 'right' }, s))
  ];
}

function badgeWidth(text) { return Math.max(0.7, 0.12 * text.length + 0.25); }

function badgeElements(text, x, y, ctx, w) {
  const bw = w || badgeWidth(text);
  return [el.rect(x, y, bw, 0.28, ctx.C.band, { colour: ctx.C.border, width: 0.5 }, 0.14),
    el.text(x, y, bw, 0.28, text.toUpperCase(), { size: ctx.S.caption, bold: true, colour: ctx.C.dim, align: 'center', valign: 'middle' })];
}

function buildCover(vms, ctx) {
  const L = LAYOUT.cover, m = LAYOUT.margin, w = SLIDE.w - 2 * m;
  const title = ctx.title || `Actors · ${vms.length}`;
  const date = String(ctx.generatedAt).slice(0, 10);
  const elements = [
    el.rect(0, 0, SLIDE.w, 0.35, ctx.C.traits),
    el.text(m, L.titleY, w, L.titleH, title, { size: ctx.S.display, bold: true, colour: ctx.C.text }),
    el.text(m, L.subY, w, L.subH, `${vms.length} ${vms.length === 1 ? 'actor' : 'actors'} · generated ${date}`, { size: ctx.S.h2, colour: ctx.C.dim }),
    el.text(m, L.srcY, w, L.srcH, [{ text: 'Source', bold: true }, ...ctx.sources.map(s => ({ text: s }))], { size: ctx.S.small, colour: ctx.C.dim }),
    el.text(m, 6.6, w, 0.3, 'Digital Service Design Standards · v2.0 Actor', { size: ctx.S.caption, colour: ctx.C.dim })
  ];
  return { kind: 'cover', background: ctx.C.bg, elements };
}

function buildIndexSlides(vms, ctx) {
  const L = LAYOUT.index, m = LAYOUT.margin, g = LAYOUT.gutter;
  const pages = [];
  for (let i = 0; i < vms.length; i += L.perSlide) pages.push(vms.slice(i, i + L.perSlide));
  const cardW = (SLIDE.w - 2 * m - (L.cols - 1) * g) / L.cols;
  const cardH = (L.gridH - (L.rows - 1) * g) / L.rows;
  const drawnPairs = new Set();

  return pages.map((group, pi) => {
    const elements = [];
    const onSlide = new Map(group.map((vm, k) => [vm.identity.id, k]));
    const cardBox = k => ({ x: m + (k % L.cols) * (cardW + g), y: L.gridY + Math.floor(k / L.cols) * (cardH + g), w: cardW, h: cardH });
    const heading = pages.length > 1 ? `Actors  ·  ${pi + 1} of ${pages.length}` : 'Actors';
    elements.push(el.text(m, L.titleY, SLIDE.w - 2 * m, L.titleH, heading, { size: ctx.S.h1, bold: true, colour: ctx.C.text }));

    group.forEach((vm, k) => {
      const b = cardBox(k), p = L.cardPad;
      elements.push(el.rect(b.x, b.y, b.w, b.h, ctx.C.panel, { colour: ctx.C.border, width: 0.75 }, 0.08));
      elements.push(...avatarElements(vm, ctx, b.x + p, b.y + p, L.avatarD));
      elements.push(el.text(b.x + p + L.avatarD + 0.1, b.y + p, b.w - 2 * p - L.avatarD - 0.1, 0.35, vm.identity.name, { size: ctx.S.h3, bold: true, colour: ctx.C.text, valign: 'middle' }));
      elements.push(...badgeElements(vm.identity.actorType.replace('_', ' '), b.x + p + L.avatarD + 0.1, b.y + p + 0.36, ctx));
      const offSlideFull = vm.relationships.inDeck.filter(r => !onSlide.has(r.target))
        .map(r => `↔ ${ctx.nameById.get(r.target) || r.target} (${r.typeLabel})`);
      // Cap the off-slide list at 3 lines so relH can never outgrow the card: beyond 3, show the
      // first 2 plus a "+N more" summary line rather than letting the box grow (and the summary
      // box shrink) without bound.
      const offSlide = offSlideFull.length > 3
        ? [...offSlideFull.slice(0, 2), `+${offSlideFull.length - 2} more (see appendix)`]
        : offSlideFull;
      const relH = offSlide.length ? 0.22 * offSlide.length : 0;
      const sumStyle = { size: ctx.S.small, colour: ctx.C.text };
      const sumBox = { x: b.x + p, y: b.y + p + L.avatarD + 0.12, w: b.w - 2 * p, h: Math.max(0, b.h - 2 * p - L.avatarD - 0.12 - relH) };
      const fitted = fitParagraph(vm.identity.summary, sumBox.w, sumBox.h, sumStyle, ctx.metrics);
      elements.push(el.text(sumBox.x, sumBox.y, sumBox.w, sumBox.h, fitted.text + (fitted.truncated ? ' …' : ''), sumStyle));
      if (offSlide.length) elements.push(el.text(sumBox.x, sumBox.y + sumBox.h, sumBox.w, relH, offSlide.map(t => ({ text: t })), { size: ctx.S.caption, colour: ctx.C.dim }));
    });

    // In-deck relationships between cards on this slide: one line per unordered pair, labelled.
    group.forEach((vm, k) => {
      for (const r of vm.relationships.inDeck) {
        if (!onSlide.has(r.target)) continue;
        const key = [vm.identity.id, r.target].sort().join('|');
        if (drawnPairs.has(key)) continue;
        drawnPairs.add(key);
        const a = cardBox(k), b = cardBox(onSlide.get(r.target));
        const sameRow = Math.abs(a.y - b.y) < 1e-9;
        const left = a.x <= b.x ? a : b, right = a.x <= b.x ? b : a;
        const upper = a.y <= b.y ? a : b, lower = a.y <= b.y ? b : a;
        const [x1, y1, x2, y2] = sameRow
          ? [left.x + left.w, left.y + left.h / 2, right.x, right.y + right.h / 2]
          : [upper.x + upper.w / 2, upper.y + upper.h, lower.x + lower.w / 2, lower.y];
        elements.push(el.line(x1, y1, x2, y2, ctx.C.edge, 1.5));
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, lw = Math.max(0.9, 0.1 * r.typeLabel.length + 0.3);
        elements.push(el.rect(mx - lw / 2, my - 0.14, lw, 0.28, ctx.C.panel, { colour: ctx.C.edge, width: 0.5 }, 0.14));
        elements.push(el.text(mx - lw / 2, my - 0.14, lw, 0.28, r.typeLabel, { size: ctx.S.caption, colour: ctx.C.dim, align: 'center', valign: 'middle' }));
      }
    });

    elements.push(...footerElements(`Actors · ${vms.length}`, { ...ctx, page: () => ctx.page() + pi }));
    return { kind: 'index', background: ctx.C.bg, elements };
  });
}

function listParagraphs(items) {
  return items.map(it => ({ text: flow.itemText(it), bullet: true }));
}

function buildSummarySlide(vm, ctx) {
  const L = LAYOUT.summary, m = LAYOUT.margin, g = LAYOUT.gutter;
  const id = vm.identity, slots = vm.summarySlots;
  const elements = [];
  // Header band: avatar, name, type badge, demographics strip, quote
  elements.push(el.rect(0, 0, SLIDE.w, L.headerH, ctx.C.panel, { colour: ctx.C.border, width: 0.75 }));
  elements.push(...avatarElements(vm, ctx, m, 0.3, L.avatarD));
  elements.push(el.text(L.nameX, 0.22, L.nameW, 0.5, id.name, { size: ctx.S.h1, bold: true, colour: ctx.C.text, valign: 'middle' }));
  const typeLabel = id.actorType.replace('_', ' ');
  elements.push(...badgeElements(typeLabel, L.nameX, 0.78, ctx));
  const bw = badgeWidth(typeLabel);
  const strip = slots.demographics.filter(i => ['age', 'location', 'education'].includes(i.badge)).map(i => i.primary).join('  ·  ');
  if (strip) elements.push(el.text(L.nameX + bw + 0.15, 0.78, L.nameW - bw - 0.15, 0.28, strip, { size: ctx.S.small, colour: ctx.C.dim, valign: 'middle' }));
  if (id.quote) {
    const quoteFitStyle = { size: ctx.S.body + 1, colour: ctx.C.dim };
    const qFitted = fitParagraph(id.quote, L.quoteW, 1.0, quoteFitStyle, ctx.metrics);
    if (qFitted.truncated) ctx.warn({ code: 'SUMMARY_TRUNCATED', actorId: id.id, slot: 'quote', shown: qFitted.text.length, of: id.quote.length });
    const quoteText = qFitted.truncated ? `“${qFitted.text}…` : `“${qFitted.text}”`;
    elements.push(el.text(L.quoteX, 0.3, L.quoteW, 1.0, quoteText, { size: ctx.S.body + 1, italic: true, colour: ctx.C.dim, valign: 'middle' }));
  }
  // Summary paragraph
  const summaryText = id.summary || '';
  const sumStyle = { size: ctx.S.body + 1, colour: ctx.C.text };
  const fitted = fitParagraph(summaryText, SLIDE.w - 2 * m, L.sumH, sumStyle, ctx.metrics);
  if (fitted.truncated) ctx.warn({ code: 'SUMMARY_TRUNCATED', actorId: id.id, slot: 'summary', shown: fitted.text.length, of: summaryText.length });
  elements.push(el.text(m, L.sumY, SLIDE.w - 2 * m, L.sumH, fitted.text + (fitted.truncated ? ' …' : ''), sumStyle));

  // Three columns: enduring traits → in context → what emerges (spec §5, spike outcome 2026-09-04)
  const colW = (SLIDE.w - 2 * m - 2 * g) / 3;
  const bodyStyle = { size: ctx.S.body + 1, colour: ctx.C.text };
  const c = slots.context;
  const contextCaption = c && c.contextType
    ? `${c.contextType} · needs · frustrations specific to this role`
    : 'needs · frustrations specific to this role';
  const cols = [
    { key: 'who', title: 'Enduring traits', caption: 'needs · frustrations — true of them in any situation',
      colour: ctx.C.traits, tint: ctx.C.traitsTint, slot: slots.who },
    { key: 'context', title: c ? `In context: ${c.title}` : 'In context: No context recorded',
      caption: contextCaption, colour: ctx.C.contexts, tint: ctx.C.contextsTint, slot: c },
    { key: 'emerges', title: 'When traits meet context', caption: 'goals as experienced · pain points — and what each emerges from',
      colour: ctx.C.emergence, tint: ctx.C.emergenceTint, slot: slots.emerges }
  ];
  const notes = ['Demographics'];
  slots.demographics.forEach(it => notes.push(`• ${flow.itemText(it)}`));
  notes.push('');
  cols.forEach((col, i) => {
    const x = m + i * (colW + g), y = L.colY, p = L.colPad, innerW = colW - 2 * p;
    // Heading band: sized from the estimator (clamped to [colHeadH, colHeadMaxH]) so a long
    // context title never overflows its one-line band into the tint above/below (2026-09-04 review).
    const headStyle = { size: ctx.S.h3, bold: true, colour: '#ffffff' };
    const headFit = fitHeading(col.title, innerW, ctx.S.h3, ctx.metrics);
    const headH = Math.min(L.colHeadMaxH, Math.max(L.colHeadH,
      flow.estimateBlockHeight({ kind: 'heading', sectionId: 'h', text: headFit.text, style: headStyle }, innerW, ctx.metrics)));
    elements.push(el.rect(x, y, colW, L.colH, col.tint, { colour: col.colour, width: 1 }, 0.08));
    elements.push(el.rect(x, y, colW, headH, col.colour));
    elements.push(el.text(x + p, y, innerW, headH, headFit.text, { size: ctx.S.h3, bold: true, colour: '#ffffff', valign: 'middle' }));
    // Caption row: sized from the estimator too, capped at two lines' worth so it can never wrap
    // into the first bullet (2026-09-04 review).
    const capStyle = { size: ctx.S.small, colour: col.colour };
    const twoLineCaptionH = (2 * flow.lineHeightIn(ctx.S.small, ctx.metrics) + flow.FLOW.paraSpacePt / 72) * flow.FLOW.safety;
    const capH = Math.min(twoLineCaptionH, Math.max(L.captionH,
      flow.estimateBlockHeight({ kind: 'paragraph', sectionId: 'c', text: col.caption, style: capStyle }, innerW, ctx.metrics)));
    let cy = y + headH + 0.06;
    elements.push(el.text(x + p, cy, innerW, capH, col.caption, { size: ctx.S.small, italic: true, colour: col.colour }));
    cy += capH + 0.06;
    const markerH = 0.28;
    const listH = y + L.colH - cy - markerH - p;
    const full = col.slot ? col.slot.full : [];
    const fit = flow.fitItems(full, innerW, listH, bodyStyle, ctx.metrics, col.slot ? col.slot.items.length : 0);
    if (fit.items.length) elements.push(el.text(x + p, cy, innerW, listH, listParagraphs(fit.items), bodyStyle));
    else elements.push(el.text(x + p, cy, innerW, 0.4, 'Nothing recorded yet', { size: ctx.S.body, italic: true, colour: ctx.C.dim }));
    const markers = [];
    if (fit.truncated) { markers.push('→ see appendix'); ctx.warn({ code: 'SUMMARY_TRUNCATED', actorId: id.id, slot: col.key, shown: fit.items.length, of: full.length }); }
    if (col.key === 'context' && c && c.moreContexts > 0) markers.push(`+${c.moreContexts} more context${c.moreContexts > 1 ? 's' : ''} → appendix`);
    if (markers.length) elements.push(el.text(x + p, y + L.colH - markerH - p / 2, innerW, markerH, markers.join('   '), { size: ctx.S.caption, bold: true, colour: col.colour, align: 'right' }));
    notes.push(`${col.title} — ${col.caption}`);
    full.forEach(it => notes.push(`• ${flow.itemText(it)}`));
    notes.push('');
  });
  elements.push(...footerElements(`${id.id} · v${id.version}`, ctx));
  return { kind: 'summary', actorId: id.id, background: ctx.C.bg, elements, notes: notes.join('\n') };
}

function appendixBlocks(vm, ctx) {
  const blocks = [];
  const band = (sectionId, text, fill) => blocks.push({ kind: 'band', sectionId, text, style: { size: ctx.S.h3, bold: true, colour: '#ffffff', fill } });
  const heading = (sectionId, text) => blocks.push({ kind: 'heading', sectionId, text, style: { size: ctx.S.body + 1, bold: true, colour: ctx.C.text } });
  const para = (sectionId, text) => text && blocks.push({ kind: 'paragraph', sectionId, text, style: { size: ctx.S.body, colour: ctx.C.text } });
  const list = (sectionId, items) => items && items.length && blocks.push({ kind: 'list', sectionId, items, style: { size: ctx.S.body, colour: ctx.C.text } });
  const listSection = (sectionId, title, items) => { if (items && items.length) { heading(sectionId, title); list(sectionId, items); } };

  const groups = Object.entries(vm.traits);
  if (groups.length) {
    band('traits', 'Traits', ctx.C.traits);
    for (const [, g] of groups) listSection('traits', g.label, g.items);
  }
  vm.contexts.forEach((c, i) => {
    const sid = `context-${i}`;
    band(sid, `${c.title}${c.contextType ? ' · ' + c.contextType : ''}`, ctx.C.contexts);
    para(sid, c.description);
    listSection(sid, 'Needs', c.needs);
    listSection(sid, 'Frustrations', c.frustrations);
    listSection(sid, 'Channels', c.channels);
    listSection(sid, 'Moments that matter', c.momentsThatMatter);
    listSection(sid, 'Details', c.details);
    if (c.emergence) {
      const eid = `emergence-${i}`;
      band(eid, `What emerges — ${c.title}`, ctx.C.emergence);
      listSection(eid, 'Goals as experienced', c.emergence.goalsAsExperienced);
      listSection(eid, 'Pain points', c.emergence.painPoints);
      listSection(eid, 'Opportunities', c.emergence.opportunities);
      if (c.emergence.emotionalContext) { heading(eid, 'Emotional context'); para(eid, c.emergence.emotionalContext); }
      listSection(eid, 'Use cases', c.emergence.useCases);
      listSection(eid, 'Success metrics', c.emergence.successMetrics);
    }
  });
  vm.unattributedEmergence.forEach((e, i) => {
    const sid = `unattributed-${i}`;
    band(sid, `What emerges — unattributed (contextRef "${e.contextRef}")`, ctx.C.emergence);
    listSection(sid, 'Goals as experienced', e.goalsAsExperienced);
    listSection(sid, 'Pain points', e.painPoints);
    listSection(sid, 'Opportunities', e.opportunities);
  });
  const rels = [...vm.relationships.inDeck, ...vm.relationships.external];
  if (rels.length) {
    band('relationships', 'Relationships', ctx.C.dim);
    list('relationships', rels.map(r => ({ primary: `${r.typeLabel} ${r.target}`, secondary: r.description || undefined, badge: r.strength })));
  }
  if (vm.provenance) { band('provenance', 'Provenance', ctx.C.dim); list('provenance', vm.provenance); }
  if (vm.governance) { band('governance', 'Governance', ctx.C.dim); list('governance', vm.governance); }
  return blocks;
}

function buildAppendixSlides(vm, ctx) {
  const L = LAYOUT.appendix, m = LAYOUT.margin;
  const colW = (SLIDE.w - 2 * m - L.colGap) / 2;
  const blocks = appendixBlocks(vm, ctx);
  const { pages, warnings } = flow.paginate(blocks, { x: 0, y: 0, w: colW, h: L.frameH }, ctx.metrics);
  for (const w of warnings) ctx.warn({ code: `APPENDIX_${w.reason.toUpperCase()}`, actorId: vm.identity.id, sectionId: w.sectionId, page: w.page });

  const slides = [];
  for (let i = 0; i < pages.length; i += 2) {
    const elements = [];
    elements.push(el.rect(0, 0, SLIDE.w, L.headerH, ctx.C.panel, { colour: ctx.C.border, width: 0.75 }));
    elements.push(...avatarElements(vm, ctx, m, (L.headerH - L.avatarD) / 2, L.avatarD));
    elements.push(el.text(m + L.avatarD + 0.15, 0.15, 7, 0.55, vm.identity.name, { size: ctx.S.h2, bold: true, colour: ctx.C.text, valign: 'middle' }));
    elements.push(el.text(SLIDE.w - m - 4, 0.15, 4, 0.55, `Appendix · ${Math.floor(i / 2) + 1} of ${Math.ceil(pages.length / 2)}`, { size: ctx.S.small, colour: ctx.C.dim, align: 'right', valign: 'middle' }));
    [pages[i], pages[i + 1]].forEach((page, col) => {
      if (!page) return;
      const x = m + col * (colW + L.colGap);
      for (const b of page.blocks) {
        const y = L.frameY + b.y;
        if (b.kind === 'band') {
          elements.push(el.rect(x, y, colW, b.h, b.style.fill, undefined, 0.04));
          elements.push(el.text(x + 0.1, y, colW - 0.2, b.h, b.text, { size: b.style.size, bold: true, colour: b.style.colour, valign: 'middle' }));
        } else if (b.kind === 'heading' || b.kind === 'paragraph') {
          elements.push(el.text(x, y, colW, b.h, b.text, { size: b.style.size, bold: !!b.style.bold, colour: b.style.colour }));
        } else {
          elements.push(el.text(x, y, colW, b.h, listParagraphs(b.items), { size: b.style.size, colour: b.style.colour }));
        }
      }
    });
    elements.push(...footerElements(`${vm.identity.id} · v${vm.identity.version}`, { ...ctx, page: () => ctx.page() + Math.floor(i / 2) }));
    slides.push({ kind: 'appendix', actorId: vm.identity.id, background: ctx.C.bg, elements });
  }
  return slides;
}

function buildDeck(vms, opts) {
  const warnings = [];
  let pageNo = 0;
  const ctx = {
    theme: opts.theme, C: opts.theme.colour.light, S: opts.theme.typography.scale, font: opts.theme.typography.fontFamily,
    metrics: opts.metrics, images: opts.images || {}, title: opts.title, generatedAt: opts.generatedAt, sources: opts.sources || [],
    nameById: new Map(vms.map(vm => [vm.identity.id, vm.identity.name])),
    page: () => pageNo, warn: w => warnings.push(w)
  };
  const sections = Object.assign({ cover: true, index: true, summary: true, appendix: true }, opts.sections || {});
  const slides = [];
  const push = s => { pageNo += 1; slides.push(s); };

  if (sections.cover) push(buildCover(vms, ctx));
  if (sections.index && vms.length >= 2) {
    // page() is read while building, so bump before each build so footers show the right number
    for (const s of buildIndexSlides(vms, { ...ctx, page: () => pageNo + 1 })) push(s);
  }
  if (sections.summary) for (const vm of vms) push(buildSummarySlide(vm, { ...ctx, page: () => pageNo + 1 }));
  if (sections.appendix) for (const vm of vms) for (const s of buildAppendixSlides(vm, { ...ctx, page: () => pageNo + 1 })) push(s);
  for (const vm of vms) for (const w of vm.warnings) warnings.push({ actorId: vm.identity.id, ...w });
  return { slides, warnings };
}

module.exports = { SLIDE, LAYOUT, AVATAR_COLOURS, el, fitParagraph, avatarElements, footerElements, badgeElements, badgeWidth, buildCover, buildIndexSlides, buildSummarySlide, listParagraphs, appendixBlocks, buildAppendixSlides, buildDeck };
