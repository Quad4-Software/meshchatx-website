import { existsSync, rmSync, symlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const chunksDir = join(root, "build/server/chunks");

function link(name) {
  const target = join(root, "build", name);
  const linkPath = join(chunksDir, name);
  if (!existsSync(target)) return;
  rmSync(linkPath, { recursive: true, force: true });
  symlinkSync(`../../${name}`, linkPath);
  console.log(`linked build/server/chunks/${name} -> ../../${name}`);
}

if (!existsSync(chunksDir)) {
  console.warn("skip adapter client path fix: build/server/chunks missing");
  process.exit(0);
}

link("client");
link("prerendered");
