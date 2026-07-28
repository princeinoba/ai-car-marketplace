import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, join, relative } from "node:path";
import process from "node:process";
import { VEHICLES } from "../src/content/catalog.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = join(root, "dist");
const failures = [];
const files = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) await walk(full); else files.push(full);
  }
}
await walk(dist);
const rels = new Set(files.map((file) => relative(dist, file).replaceAll("\\", "/")));
const expectedRoutes = [
  "index.html", "cars/index.html", ...VEHICLES.map((vehicle) => `cars/${vehicle.slug}/index.html`),
  "match/index.html", "compare/index.html", "saved/index.html", "finance/index.html", "test-drive/index.html",
  "reservations/index.html", "safety/index.html", "about/index.html", "privacy/index.html", "admin/index.html",
  "admin/inventory/index.html", "admin/test-drives/index.html", "admin/settings/index.html", "404/index.html", "404.html"
];
for (const path of expectedRoutes) if (!rels.has(path)) failures.push(`missing route output: ${path}`);
for (const path of ["site.webmanifest", "sw.js", "robots.txt", "sitemap.xml", ".well-known/security.txt", "assets/site.css", "assets/site.js", "assets/app.js", "assets/icons/favicon.svg", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/images/social-card.png"]) if (!rels.has(path)) failures.push(`missing required file: ${path}`);

const routeFromFile = (file) => {
  const rel = relative(dist, file).replaceAll("\\", "/");
  if (rel === "index.html") return "/";
  if (rel === "404.html") return "/404/";
  return `/${rel.replace(/index\.html$/, "")}`;
};
const hrefExists = (raw) => {
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || /^https?:\/\//.test(raw)) return true;
  const clean = raw.split("#")[0].split("?")[0];
  if (!clean) return true;
  if (clean.startsWith("/api/")) return true;
  const normalized = clean.replace(/^\//, "");
  if (clean.endsWith("/")) return rels.has(`${normalized}index.html`);
  return rels.has(normalized) || rels.has(`${normalized}/index.html`);
};

const htmlFiles = files.filter((file) => extname(file) === ".html");
const titles = new Map();
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const label = relative(dist, file);
  if (!/^<!doctype html>/i.test(html)) failures.push(`${label}: incomplete document`);
  if ((html.match(/<main\b/g) || []).length !== 1) failures.push(`${label}: expected exactly one main`);
  if ((html.match(/<h1\b/g) || []).length !== 1) failures.push(`${label}: expected exactly one h1`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) failures.push(`${label}: missing description`);
  if (!/<meta name="robots" content="(?:noindex,follow|noindex,nofollow|index,follow)">/.test(html)) failures.push(`${label}: invalid robots metadata`);
  if (!/<a class="skip-link" href="#main">/.test(html)) failures.push(`${label}: missing skip link`);
  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) failures.push(`${label}: inline script found`);
  if (/\son(?:click|change|submit|load)=/i.test(html)) failures.push(`${label}: inline event handler found`);
  if (/\b(?:Vehiql|REACT_APP_|NEXT_PUBLIC_GEMINI|mongodb(?:\+srv)?:\/\/)/i.test(html)) failures.push(`${label}: stale or sensitive legacy identity found`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || "";
  if (!title) failures.push(`${label}: missing title`);
  else if (titles.has(title) && routeFromFile(file) !== "/404/") failures.push(`${label}: duplicate title also used by ${titles.get(title)}`);
  else titles.set(title, label);
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt="[^"]*"/.test(image[0])) failures.push(`${label}: image missing alt`);
    if (!/\bwidth="\d+"/.test(image[0]) || !/\bheight="\d+"/.test(image[0])) failures.push(`${label}: image missing dimensions`);
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) if (!hrefExists(match[1])) failures.push(`${label}: broken local reference ${match[1]}`);
}

const manifest = JSON.parse(await readFile(join(dist, "site.webmanifest"), "utf8"));
if (manifest.name !== "DriveLens Market Lab" || manifest.start_url !== "/" || manifest.display !== "standalone") failures.push("manifest identity/configuration invalid");
if (!Array.isArray(manifest.icons) || !manifest.icons.some((icon) => icon.sizes === "192x192") || !manifest.icons.some((icon) => icon.sizes === "512x512")) failures.push("manifest icons incomplete");
const sw = await readFile(join(dist, "sw.js"), "utf8");
if (sw.includes("__CACHE_VERSION__") || sw.includes("__PRECACHE__")) failures.push("service worker placeholders unresolved");
if (!sw.includes('url.pathname.startsWith("/api/")')) failures.push("service worker does not exclude API routes");
const robots = await readFile(join(dist, "robots.txt"), "utf8");
const sitemap = await readFile(join(dist, "sitemap.xml"), "utf8");
if (!robots.includes("Disallow: /")) failures.push("default demonstration robots policy is not restrictive");
if (/<url>/.test(sitemap)) failures.push("default demonstration sitemap must be empty");
const generatedText = (await Promise.all(files.filter((file) => [".html", ".js", ".css", ".json", ".webmanifest"].includes(extname(file))).map((file) => readFile(file, "utf8")))).join("\n");
if (/GEMINI_API_KEY|AIza[0-9A-Za-z_-]{20,}/.test(generatedText)) failures.push("generated output contains a credential-like value");

const vercel = JSON.parse(await readFile(join(root, "vercel.json"), "utf8"));
if (vercel.framework !== null || vercel.buildCommand !== "npm run build" || vercel.outputDirectory !== "dist" || vercel.installCommand !== "npm ci --ignore-scripts") failures.push("Vercel build contract invalid");
const headerValues = JSON.stringify(vercel.headers || []);
for (const header of ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "Permissions-Policy"]) if (!headerValues.includes(header)) failures.push(`Vercel security header missing: ${header}`);
if (!headerValues.includes("blob:")) failures.push("CSP must permit local blob image preview");
if (!JSON.stringify(vercel.functions || {}).includes("api/**/*.js")) failures.push("Vercel Function glob missing");

const sizes = await Promise.all(files.map(async (file) => ({ file, size: (await stat(file)).size })));
const total = sizes.reduce((sum, item) => sum + item.size, 0);
const js = sizes.filter((item) => relative(dist, item.file).replaceAll("\\", "/").startsWith("assets/") && extname(item.file) === ".js").reduce((sum, item) => sum + item.size, 0);
const css = sizes.filter((item) => extname(item.file) === ".css").reduce((sum, item) => sum + item.size, 0);
if (total > 1_500_000) failures.push(`total output budget exceeded: ${total}`);
if (js > 120_000) failures.push(`browser JavaScript budget exceeded: ${js}`);
if (css > 70_000) failures.push(`CSS budget exceeded: ${css}`);

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Verified ${htmlFiles.length} HTML files and ${files.length} total files.`);
console.log(`Output: ${total} bytes; browser JavaScript: ${js} bytes; CSS: ${css} bytes.`);
