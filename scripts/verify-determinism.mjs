import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = join(root, "dist");
async function files(path, output = []) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) await files(full, output); else output.push(full);
  }
  return output;
}
async function tree() {
  const rows = [];
  for (const file of (await files(dist)).sort()) {
    const bytes = await readFile(file);
    rows.push(`${relative(dist, file).replaceAll("\\", "/")} ${createHash("sha256").update(bytes).digest("hex")}`);
  }
  return { rows, hash: createHash("sha256").update(rows.join("\n")).digest("hex") };
}
function build() {
  const result = spawnSync(process.execPath, [join(root, "scripts/build.mjs")], { cwd: root, encoding: "utf8", env: { ...process.env, SITE_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "", DRIVELENS_PUBLIC_INDEXING: "" } });
  if (result.status !== 0) { console.error(result.stderr || result.stdout); process.exit(result.status || 1); }
}
build();
const first = await tree();
build();
const second = await tree();
if (first.rows.join("\n") !== second.rows.join("\n")) {
  console.error("Generated output is not deterministic.");
  process.exit(1);
}
console.log(`Deterministic build passed for ${second.rows.length} files.`);
console.log(`Generated-tree SHA-256: ${second.hash}`);
