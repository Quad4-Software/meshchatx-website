// Resize screenshot webps for srcset. Writes *.w{n}.webp next to each source
// when the source is wider than n. Skips files already newer than the source.
import { readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const SHOT_WIDTHS = [640, 960, 1440];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shotRoot = join(root, 'public/media/screenshots');

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith('.webp') && !/\.w\d+\.webp$/.test(name)) acc.push(p);
  }
  return acc;
}

export async function generateShotVariants() {
  const files = walk(shotRoot);
  for (const file of files) {
    const meta = await sharp(file).metadata();
    const srcW = meta.width || 0;
    const srcM = statSync(file).mtimeMs;
    for (const w of SHOT_WIDTHS) {
      if (!srcW || w >= srcW) continue;
      const out = file.replace(/\.webp$/i, `.w${w}.webp`);
      if (existsSync(out) && statSync(out).mtimeMs >= srcM) continue;
      await sharp(file)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(out);
    }
  }
}
