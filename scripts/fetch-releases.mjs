import { writeFileSync } from "node:fs";
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

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(url + " HTTP " + res.status);
  }
  return res.json();
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
