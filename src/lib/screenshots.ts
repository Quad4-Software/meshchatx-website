import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { imageSize } from './imageSize';

const PUBLIC = join(process.cwd(), 'public');
const DISPLAY_WIDTHS = [640, 960, 1440];

export interface ShotPair {
  dark: string;
  light: string;
  displayDark: string;
  displayLight: string;
  srcsetDark?: string | undefined;
  srcsetLight?: string | undefined;
  width: number;
  height: number;
}

function hrefOf(rel: string): string {
  return `/${rel.replace(/\\/g, '/')}`;
}

function displayFor(rel: string, origW: number): { href: string; srcset?: string } {
  const parts: string[] = [];
  let displayRel = rel;
  for (const w of DISPLAY_WIDTHS) {
    if (w >= origW) continue;
    const vr = rel.replace(/\.webp$/i, `.w${w}.webp`);
    if (!existsSync(join(PUBLIC, vr))) continue;
    parts.push(`${hrefOf(vr)} ${w}w`);
    if (w <= 960) displayRel = vr;
  }
  if (parts.length === 0) return { href: hrefOf(rel) };
  const cap = DISPLAY_WIDTHS[DISPLAY_WIDTHS.length - 1] ?? origW;
  if (origW <= cap) parts.push(`${hrefOf(rel)} ${origW}w`);
  return { href: hrefOf(displayRel), srcset: parts.join(', ') };
}

function pair(relDark: string, relLight: string): ShotPair | null {
  const darkAbs = join(PUBLIC, relDark);
  const lightAbs = join(PUBLIC, relLight);
  if (!existsSync(darkAbs) || !existsSync(lightAbs)) return null;
  const size = imageSize(darkAbs);
  const width = size.width || 1440;
  const height = size.height || 900;
  const darkVar = displayFor(relDark, width);
  const lightVar = displayFor(relLight, width);
  return {
    dark: hrefOf(relDark),
    light: hrefOf(relLight),
    displayDark: darkVar.href,
    displayLight: lightVar.href,
    srcsetDark: darkVar.srcset,
    srcsetLight: lightVar.srcset,
    width,
    height,
  };
}

/** App UI screenshot from the copied MeshChatX screenshots tree. */
export function appShot(kind: 'desktop' | 'mobile', name: string): ShotPair | null {
  return pair(
    `media/screenshots/${kind}/dark/${name}.webp`,
    `media/screenshots/${kind}/light/${name}.webp`,
  );
}

/**
 * Docs page screenshot pair.
 * Looks for public/media/screenshots/docs/{slug}/dark.webp and light.webp.
 * Also accepts a single-file fallback docs/{slug}.webp used for both themes.
 * Returns null when the assets are not in the tree yet.
 */
export function docShot(slug: string): ShotPair | null {
  const clean = slug.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
  const both = pair(
    `media/screenshots/docs/${clean}/dark.webp`,
    `media/screenshots/docs/${clean}/light.webp`,
  );
  if (both) return both;
  const single = `media/screenshots/docs/${clean}.webp`;
  const abs = join(PUBLIC, single);
  if (!existsSync(abs)) return null;
  const size = imageSize(abs);
  const width = size.width || 1440;
  const height = size.height || 900;
  const v = displayFor(single, width);
  const href = hrefOf(single);
  return {
    dark: href,
    light: href,
    displayDark: v.href,
    displayLight: v.href,
    srcsetDark: v.srcset,
    srcsetLight: v.srcset,
    width,
    height,
  };
}
