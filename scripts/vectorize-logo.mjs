// Traces the flat-color octopus silhouette into a real SVG path so the
// logo stays crisp at any zoom level (the PNG-only version blurred on
// browser zoom/pinch — a resolution ceiling no amount of re-exporting a
// raster fixes, per the Phase 3 nav/logo update brief).
//
// Simplification: this traces the SOLID SILHOUETTE only, not the fine
// lighter-teal network lines/nodes on the tentacles — those are barely
// visible at the small sizes the mark is actually used at (nav, favicon,
// FAB), and potrace's single-threshold tracing doesn't cleanly separate
// two close teal tones. The result is one clean, infinitely-scalable path
// in the brand teal. Re-run if the source logo changes.
//
//   node scripts/vectorize-logo.mjs
import sharp from "sharp";
import potrace from "potrace";
import { writeFile } from "node:fs/promises";

const SRC = "src/assets/logo/octopus.jpg";
const OUT_SVG = "public/logo/octopus.svg";
const PRIMARY_TEAL = "#0d3b3e"; // --color-primary

// Potrace wants a bitmap with clear dark-shape-on-light-background
// contrast. Trim the source's off-white margin first (same as
// process-logo.mjs) so the traced shape fills the frame.
const trimmed = await sharp(SRC).trim({ threshold: 12 }).png().toBuffer();

const svg = await new Promise((resolve, reject) => {
  potrace.trace(
    trimmed,
    { color: PRIMARY_TEAL, background: "transparent", threshold: 180, turdSize: 8 },
    (err, svgString) => (err ? reject(err) : resolve(svgString))
  );
});

await writeFile(OUT_SVG, svg);
console.log(`wrote ${OUT_SVG} (${svg.length} bytes)`);
