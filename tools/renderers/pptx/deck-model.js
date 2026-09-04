// deck-model.js — Actor view models → slide descriptions (spec §5). Pure; no PptxGenJS.
// Coordinates in inches on a 13.333 × 7.5 slide. Text sizes in points from theme.typography.scale.

'use strict';

const flow = require('./flow');

const SLIDE = Object.freeze({ w: 13.333, h: 7.5 });
const LAYOUT = Object.freeze({
  margin: 0.5, gutter: 0.25, footerY: 7.05, footerH: 0.3,
  cover: { titleY: 2.4, titleH: 1.0, subY: 3.5, subH: 0.5, srcY: 4.3, srcH: 1.6 },
  index: { perSlide: 8, cols: 4, rows: 2, titleY: 0.45, titleH: 0.6, gridY: 1.3, gridH: 5.55, avatarD: 0.6, cardPad: 0.15 },
  summary: {},   // filled in Task 9
  appendix: {}   // filled in Task 10
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

function badgeElements(text, x, y, ctx, w) {
  const bw = w || Math.max(0.7, 0.12 * text.length + 0.25);
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
  // Task 9 adds:  if (sections.summary) for (const vm of vms) push(buildSummarySlide(vm, { ...ctx, page: () => pageNo + 1 }));
  // Task 10 adds: if (sections.appendix) for (const vm of vms) for (const s of buildAppendixSlides(vm, ctx)) push(s);
  for (const vm of vms) for (const w of vm.warnings) warnings.push({ actorId: vm.identity.id, ...w });
  return { slides, warnings };
}

module.exports = { SLIDE, LAYOUT, AVATAR_COLOURS, el, fitParagraph, avatarElements, footerElements, badgeElements, buildCover, buildIndexSlides, buildDeck };
