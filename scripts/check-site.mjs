// check-site: static validation of dist/ after a build. Verifies internal
// links resolve, anchors exist, images have alt text, srcset targets exist,
// and every page carries title/description/canonical. Zero dependencies.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
if (!existsSync(dist)) {
  console.error('dist/ not found, run pnpm build first');
  process.exit(1);
}

const htmlFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) htmlFiles.push(p);
  }
})(dist);

const stripHash = (u) => u.split('#')[0];
const urlPath = (u) => {
  let p = stripHash(u).split('?')[0];
  if (!p.startsWith('/')) return null;
  return p;
};
const fileFor = (p) => {
  if (p.endsWith('/')) return join(dist, p, 'index.html');
  return join(dist, p);
};
const is404 = (p) => /^\/([a-z]{2}\/)?404$/.test(p);
const exists = (p) => {
  if (!p) return true;
  if (is404(p)) return true; // locale variants of the 404 page fall back
  if (existsSync(fileFor(p))) return true;
  if (existsSync(join(dist, p, 'index.html'))) return true;
  if (existsSync(join(dist, p + '.html'))) return true;
  return false;
};

let errors = 0;
let checked = { links: 0, imgs: 0, pages: htmlFiles.length };
const err = (f, msg) => {
  errors++;
  console.error(`  ${f.replace(dist, '')}: ${msg}`);
};

const hrefRe = /(?:href|src)="([^"#][^"]*)"/g;
const srcsetRe = /srcset="([^"]+)"/g;
const imgRe = /<img\b[^>]*>/g;
const idRe = /\sid="([^"]+)"/g;

const allIds = new Map(); // page path -> set of ids
const idsByFile = new Map();
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  idsByFile.set(f, new Set([...html.matchAll(idRe)].map((m) => m[1])));
}
const pagePathFor = (f) => '/' + f.slice(dist.length + 1).replace(/index\.html$/, '').replace(/\.html$/, '');
for (const [f, ids] of idsByFile) allIds.set(pagePathFor(f), ids);

for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const rel = f.replace(dist + '/', '');

  // metadata
  if (!/<title>[^<]{4,}<\/title>/.test(html)) err(rel, 'missing or empty <title>');
  if (!/name="description" content="[^"]{10,}"/.test(html)) err(rel, 'missing meta description');
  if (!/rel="canonical" href="https:\/\/meshchatx\.com\//.test(html)) err(rel, 'missing canonical');

  // duplicate ids on the same page
  const seen = new Set();
  for (const m of html.matchAll(idRe)) {
    if (seen.has(m[1])) err(rel, `duplicate id #${m[1]}`);
    seen.add(m[1]);
  }

  // link resolution
  for (const m of html.matchAll(hrefRe)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|rns:|obtainium:|data:|javascript:)/.test(u)) continue;
    if (u.startsWith('#')) {
      const id = u.slice(1);
      if (id && !seen.has(id)) err(rel, `broken fragment ${u}`);
      continue;
    }
    const p = urlPath(u);
    if (!p) continue;
    checked.links++;
    if (!exists(p)) err(rel, `unresolved internal link ${u}`);
    // anchor on same page or target page
    const frag = u.includes('#') ? u.split('#')[1] : '';
    if (frag) {
      const target = p === '' || p === pagePathFor(f) ? seen : allIds.get(p) ?? allIds.get(p + '/');
      if (target && !target.has(frag)) err(rel, `broken fragment ${u}`);
    }
  }

  // srcset targets
  for (const m of html.matchAll(srcsetRe)) {
    for (const cand of m[1].split(',')) {
      const u = cand.trim().split(/\s+/)[0];
      if (!u || !u.startsWith('/')) continue;
      if (!exists(u)) err(rel, `srcset target missing ${u}`);
    }
  }

  // img alt text
  for (const m of html.matchAll(imgRe)) {
    checked.imgs++;
    const tag = m[0];
    if (!/\salt="/.test(tag)) err(rel, `img missing alt: ${tag.slice(0, 80)}`);
  }
}

console.log(`checked ${checked.pages} pages, ${checked.links} links, ${checked.imgs} images`);
if (errors) {
  console.error(`${errors} problem(s)`);
  process.exit(1);
}
console.log('all checks passed');
