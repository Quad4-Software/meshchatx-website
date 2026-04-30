import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const listUrl =
  'https://git.quad4.io/api/v1/repos/RNS-Things/MeshChatX/releases?limit=25';
const out = join(dirname(fileURLToPath(import.meta.url)), '../static/data/gitea-releases.json');

const res = await fetch(listUrl, { headers: { Accept: 'application/json' } });
if (!res.ok) {
  process.stderr.write('fetch-gitea-releases: HTTP ' + res.status + '\n');
  process.exit(1);
}
const list = await res.json();
if (!Array.isArray(list)) {
  process.stderr.write('fetch-gitea-releases: expected array\n');
  process.exit(1);
}
writeFileSync(out, JSON.stringify(list) + '\n', 'utf8');
process.stdout.write('wrote ' + out + ' (' + list.length + ' releases)\n');
