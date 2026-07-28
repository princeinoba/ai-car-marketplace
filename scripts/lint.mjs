import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const root = fileURLToPath(new URL("../", import.meta.url));
const roots = ["api", "scripts", "src", "tests"];
const files = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if ([".js", ".mjs"].includes(extname(entry.name))) files.push(full);
  }
}
for (const folder of roots) await walk(join(root, folder));
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) { console.error(result.stderr || result.stdout); process.exit(result.status || 1); }
}

const deployable = files.filter((file) => file.includes("/api/") || file.includes("/src/") || file.includes("\\api\\") || file.includes("\\src\\"));
const forbidden = [
  [/\beval\s*\(/, "eval"], [/new\s+Function\s*\(/, "new Function"], [/<[^>]*\son(?:click|change|submit|load)\s*=/i, "inline event handler"],
  [/(?:from|require\s*\()\s*["'](?:@clerk|@prisma|@supabase|@arcjet|next|react|@google\/generative-ai)/, "legacy runtime import"],
  [/REACT_APP_|NEXT_PUBLIC_GEMINI|VITE_GEMINI/i, "browser-exposed secret prefix"], [/localStorage\.clear\s*\(/, "whole-origin storage clear"],
  [/mongodb(?:\+srv)?:\/\//i, "MongoDB URI"], [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"]
];
let violations = 0;
for (const file of deployable) {
  const text = await readFile(file, "utf8");
  for (const [pattern, label] of forbidden) if (pattern.test(text)) { console.error(`${relative(root, file)}: forbidden ${label}`); violations += 1; }
}
if (violations) process.exit(1);
console.log(`Syntax and policy checks passed for ${files.length} JavaScript files.`);
