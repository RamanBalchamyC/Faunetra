// One-off asset prep: takes the finalized logo (src/assets/logo/octopus.jpg,
// teal octopus on an off-white background) and produces the sizes/variants
// the app actually needs, per section 6 of the Phase 2 brief. Re-run this
// whenever the source logo file is replaced.
//
//   node scripts/process-logo.mjs
//
// Outputs to public/logo/ (not /assets/logo/ as the brief literally says —
// Next.js only serves static files from /public; /assets/logo/ is kept as
// the source-of-truth original, this script's input).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "src/assets/logo/octopus.jpg";
const OUT_DIR = "public/logo";
const BACKGROUND = "#fafaf8"; // matches --color-background

await mkdir(OUT_DIR, { recursive: true });

const trimmed = sharp(SRC).trim({ threshold: 12 });
const { data, info } = await trimmed.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// Key out the near-white background to transparency (the source has no
// alpha channel — it's a flat-color JPG on an off-white ground).
const { width, height, channels } = info;
for (let i = 0; i < data.length; i += channels) {
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  if (r > 235 && g > 235 && b > 230) {
    data[i + 3] = 0;
  }
}
const transparentBase = sharp(data, { raw: { width, height, channels } });

const sizes = [512, 192, 32];

for (const size of sizes) {
  // Transparent PNG — for use on any UI background (e.g. the FAB).
  await transparentBase
    .clone()
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`${OUT_DIR}/octopus-${size}-transparent.png`);

  // Solid off-white background — for favicon/app-icon contexts.
  await transparentBase
    .clone()
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background: BACKGROUND })
    .png()
    .toFile(`${OUT_DIR}/octopus-${size}.png`);

  console.log(`wrote octopus-${size}.png and octopus-${size}-transparent.png`);
}

console.log("Done.");
