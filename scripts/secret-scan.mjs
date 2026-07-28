import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const excludedDirectories = new Set([".git", ".vercel", "node_modules"]);
const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".svg", ".txt", ".xml", ".yml", ".yaml"]);
const exactTextNames = new Set([".env.example", ".gitignore", ".npmrc", ".nvmrc"]);
const findings = [];
const scanned = [];
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["Google API key", /AIza[0-9A-Za-z_-]{35}/g],
  ["GitHub token", /gh(?:p|o|u|s|r)_[0-9A-Za-z]{30,}/g],
  ["AWS access key", /(?:AKIA|ASIA)[0-9A-Z]{16}/g],
  ["MongoDB URI", /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi],
  ["JWT", /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],
  ["long credential assignment", /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*["'][A-Za-z0-9_+\/=.-]{24,}["']/gi]
];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (textExtensions.has(extname(entry.name).toLowerCase()) || exactTextNames.has(entry.name)) scanned.push(full);
  }
}

await walk(root);
for (const file of scanned) {
  const text = await readFile(file, "utf8");
  for (const [label, pattern] of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) findings.push(`${relative(root, file)}: ${label}`);
  }
}

if (findings.length) {
  console.error(`High-confidence secret scan found ${findings.length} potential credential(s):`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(`High-confidence secret scan passed for ${scanned.length} text/source/generated files with 0 findings.`);
