import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getMcxReleasesPayload,
  resetBunnyReleasesCacheForTests,
} from "../src/lib/bunny-releases.server";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "src/lib/mcx-releases.static.json");

function loadDotEnv(): void {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined || process.env[k] === "")
      process.env[k] = v;
  }
}

async function main(): Promise<void> {
  loadDotEnv();
  if (!process.env.BUNNY_STORAGE_ACCESS_KEY?.trim()) {
    console.error(
      "Missing BUNNY_STORAGE_ACCESS_KEY (set in environment or .env in repo root).",
    );
    process.exit(1);
  }
  resetBunnyReleasesCacheForTests();
  process.env.RELEASES_CACHE_SECONDS = "0";
  process.env.MCX_RELEASES_SYNC = "1";

  const payload = await getMcxReleasesPayload();
  writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);
  console.log("Wrote", outFile);
  console.log(
    "stable:",
    payload.stable?.version ?? null,
    "prerelease:",
    payload.prerelease?.version ?? null,
  );

  const wantCommit = process.argv.includes("--commit");
  const wantPush = process.argv.includes("--push");
  if (!wantCommit && !wantPush) {
    console.log(
      "\nRebuild or redeploy so the new JSON is bundled. Optional: pnpm sync-releases --commit --push\n",
    );
    return;
  }
  try {
    execSync("git diff --quiet -- src/lib/mcx-releases.static.json", {
      cwd: root,
      stdio: "pipe",
    });
    console.log("No git diff for mcx-releases.static.json; skip commit/push.");
    return;
  } catch {
    /* has changes */
  }
  if (wantCommit) {
    execSync("git add src/lib/mcx-releases.static.json", {
      cwd: root,
      stdio: "inherit",
    });
    execSync('git commit -m "chore: sync Mcx releases embed"', {
      cwd: root,
      stdio: "inherit",
    });
  }
  if (wantPush) {
    execSync("git push", { cwd: root, stdio: "inherit" });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
