#!/usr/bin/env bash
# verify-pptx.sh — the visual gate for the PPTX renderer.
#   .pptx → PDF (LibreOffice headless) → page-N.png (pdftoppm) → bbox.html (pdftotext) → overflow oracle.
# Usage: tools/renderers/pptx/verify-pptx.sh <deck.pptx> [outdir]
# Exit: 0 clean, 1 overflow found, 2 usage/conversion error, 3 LibreOffice or poppler not installed (skipped).
set -u
DECK="${1:-}"; OUT="${2:-}"
[ -z "$DECK" ] && { echo "Usage: $0 <deck.pptx> [outdir]" >&2; exit 2; }
[ -f "$DECK" ] || { echo "verify-pptx: not found: $DECK" >&2; exit 2; }
SOFFICE="${SOFFICE:-/Applications/LibreOffice.app/Contents/MacOS/soffice}"
command -v "$SOFFICE" >/dev/null 2>&1 || SOFFICE="$(command -v soffice || command -v libreoffice || true)"
if [ -z "$SOFFICE" ]; then echo "verify-pptx: SKIPPED — LibreOffice (soffice) not installed; the visual gate cannot run on this machine" >&2; exit 3; fi
for t in pdftoppm pdftotext; do command -v "$t" >/dev/null 2>&1 || { echo "verify-pptx: SKIPPED — $t (poppler) not installed" >&2; exit 3; }; done
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -z "$OUT" ] && OUT="$(dirname "$DECK")/$(basename "${DECK%.pptx}")-verify"
mkdir -p "$OUT"
"$SOFFICE" --headless --convert-to pdf --outdir "$OUT" "$DECK" >/dev/null 2>&1
PDF="$OUT/$(basename "${DECK%.pptx}").pdf"
[ -f "$PDF" ] || { echo "verify-pptx: PDF conversion failed for $DECK" >&2; exit 2; }
pdftoppm -png -r 80 "$PDF" "$OUT/page" || { echo "verify-pptx: pdftoppm failed" >&2; exit 2; }
pdftotext -bbox "$PDF" "$OUT/bbox.html" || { echo "verify-pptx: pdftotext failed" >&2; exit 2; }
PAGES=$(ls "$OUT"/page-*.png 2>/dev/null | wc -l | tr -d ' ')
echo "verify-pptx: $DECK → $PAGES page(s) in $OUT"
# INSET: points of slide edge treated as a no-text zone. LibreOffice clips overflowing text at
# the page box, so off-page words never reach pdftotext; text pressed against the edge is the
# observable symptom. Calibrated in Task 13 — see the note at the top of overflow-check.js.
INSET="${INSET:-12}"
node "$HERE/overflow-check.js" "$OUT/bbox.html" --inset "$INSET"
