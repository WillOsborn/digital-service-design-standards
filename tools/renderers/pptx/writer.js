// writer.js — slide descriptions → PptxGenJS. The ONLY module that requires pptxgenjs.
// It draws exactly what deck-model.js describes; no layout decisions live here.

'use strict';

const PptxGenJS = require('pptxgenjs');
const { SLIDE } = require('./deck-model');

const hex = c => String(c).replace('#', '').toUpperCase();

function textRuns(e) {
  const last = e.paragraphs.length - 1;
  return e.paragraphs.map((p, i) => ({
    text: p.text,
    options: {
      bold: p.bold !== undefined ? !!p.bold : !!e.bold,
      italic: p.italic !== undefined ? !!p.italic : !!e.italic,
      fontSize: p.size || e.size,
      color: hex(p.colour || e.colour),
      bullet: p.bullet ? { indent: 12 } : false,
      breakLine: i < last,
      paraSpaceAfter: p.bullet ? 4 : 2
    }
  }));
}

function drawElement(pptx, slide, e, font) {
  switch (e.type) {
    case 'rect':
      slide.addShape(e.radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
        x: e.x, y: e.y, w: e.w, h: e.h, fill: { color: hex(e.fill) },
        line: e.line ? { color: hex(e.line.colour), width: e.line.width } : { color: hex(e.fill), width: 0 },
        rectRadius: e.radius || 0
      });
      break;
    case 'ellipse':
      slide.addShape(pptx.ShapeType.ellipse, { x: e.x, y: e.y, w: e.w, h: e.h, fill: { color: hex(e.fill) },
        line: e.line ? { color: hex(e.line.colour), width: e.line.width } : { color: hex(e.fill), width: 0 } });
      break;
    case 'line': {
      const x = Math.min(e.x1, e.x2), y = Math.min(e.y1, e.y2);
      const w = Math.abs(e.x2 - e.x1), h = Math.abs(e.y2 - e.y1);
      const flipV = (e.x2 - e.x1) * (e.y2 - e.y1) < 0;   // rising to the right
      slide.addShape(pptx.ShapeType.line, { x, y, w, h, flipV, line: { color: hex(e.colour), width: e.width } });
      break;
    }
    case 'text':
      slide.addText(textRuns(e), {
        x: e.x, y: e.y, w: e.w, h: e.h, fontFace: font, fontSize: e.size, color: hex(e.colour),
        align: e.align || 'left', valign: e.valign || 'top', margin: 2,
        fill: e.fill ? { color: hex(e.fill) } : undefined,
        autoFit: false, fit: 'none', shrinkText: false, wrap: true
      });
      break;
    case 'image':
      slide.addImage({ path: e.path, x: e.x, y: e.y, w: e.w, h: e.h });
      break;
    default:
      throw new Error(`writer: unknown element type "${e.type}"`);
  }
}

async function writeDeck(slides, theme, opts) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'DSDS_16x9', width: SLIDE.w, height: SLIDE.h });
  pptx.layout = 'DSDS_16x9';
  pptx.author = 'DSDS render-pptx';
  pptx.company = 'Digital Service Design Standards';
  const font = theme.typography.fontFamily;
  for (const s of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: hex(s.background) };
    for (const e of s.elements) drawElement(pptx, slide, e, font);
    if (s.notes) slide.addNotes(s.notes);
  }
  if (opts.outputType === 'file') return pptx.writeFile({ fileName: opts.fileName });
  return pptx.write({ outputType: 'nodebuffer' });
}

// --- test helpers (jszip is a devDependency and a transitive dependency of pptxgenjs) ---
async function zipEntries(buffer, pattern) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter(n => pattern.test(n))
    .sort((a, b) => parseInt(a.match(/(\d+)\.xml$/)[1], 10) - parseInt(b.match(/(\d+)\.xml$/)[1], 10));
  return Promise.all(names.map(n => zip.file(n).async('string')));
}
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
async function slideTexts(buffer, o) {
  const xmls = await zipEntries(buffer, /^ppt\/slides\/slide\d+\.xml$/);
  const runs = xmls.map(x => [...x.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => decode(m[1])));
  return o && o.asRuns ? runs : runs.map(r => r.join('\n'));
}
async function slideNotes(buffer) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  const out = [];
  for (let i = 1; i <= slideNames.length; i++) {
    const f = zip.file(`ppt/notesSlides/notesSlide${i}.xml`);
    out.push(f ? [...(await f.async('string')).matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => decode(m[1])).join('\n') : '');
  }
  return out;
}

module.exports = { writeDeck, slideTexts, slideNotes, hex, textRuns };
