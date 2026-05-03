/**
 * Writes static/data/releases-bundle.json from Gitea + GitHub release APIs.
 * Run before deploy or in CI (`pnpm run fetch:releases`). The site reads this
 * file only unless RELEASES_FETCH_LIVE=1 on the server.
 *
 * By default skips network if the bundle file is newer than 30 minutes (use
 * `--force` to always fetch).
 */
import { existsSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const outBundle = join(dir, "../static/data/releases-bundle.json");

const GITEA_URL =
  "https://git.quad4.io/api/v1/repos/RNS-Things/MeshChatX/releases?limit=25";
const GITHUB_URL =
  "https://api.github.com/repos/Quad4-Software/MeshChatX/releases?per_page=25";

const ghHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "meshchatx-website-release-fetch",
};

const MAX_AGE_MS = 30 * 60 * 1000;
const force = process.argv.includes("--force");

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(url + " HTTP " + res.status);
  }
  return res.json();
}

if (
  !force &&
  existsSync(outBundle) &&
  Date.now() - statSync(outBundle).mtimeMs < MAX_AGE_MS
) {
  process.stdout.write(
    "fetch-releases: bundle is fresh (<30m), skip network (use --force)\n",
  );
  process.exit(0);
}

let gitea = [];
let github = [];

try {
  gitea = await fetchJson(GITEA_URL, { Accept: "application/json" });
  if (!Array.isArray(gitea)) throw new Error("Gitea: expected array");
  process.stdout.write("gitea: " + gitea.length + " releases\n");
} catch (e) {
  process.stderr.write("fetch-releases: gitea failed: " + e.message + "\n");
}

try {
  github = await fetchJson(GITHUB_URL, ghHeaders);
  if (!Array.isArray(github)) throw new Error("GitHub: expected array");
  process.stdout.write("github: " + github.length + " releases\n");
} catch (e) {
  process.stderr.write("fetch-releases: github failed: " + e.message + "\n");
}

const bundle = { gitea, github };
writeFileSync(outBundle, JSON.stringify(bundle, null, 0) + "\n", "utf8");
process.stdout.write("wrote " + outBundle + "\n");
