import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { handleCars, handleHealth, handlePhotoMatch } from "../src/server/handlers.mjs";

const ROOT = fileURLToPath(new URL("../dist/", import.meta.url));
const MIME = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"], [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"], [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".svg", "image/svg+xml"], [".png", "image/png"], [".txt", "text/plain; charset=utf-8"], [".xml", "application/xml; charset=utf-8"]
]);
const SECURITY = {
  "content-security-policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; manifest-src 'self'; worker-src 'self'; frame-src 'none'; media-src 'none'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "geolocation=(), camera=(), microphone=(), payment=(), usb=(), browsing-topics=()"
};

async function exists(path) { try { return (await stat(path)).isFile(); } catch { return false; } }
async function bodyFor(request) {
  if (["GET", "HEAD"].includes(request.method || "GET")) return undefined;
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}
async function sendWebResponse(response, nodeResponse, headOnly = false) {
  nodeResponse.statusCode = response.status;
  for (const [key, value] of response.headers) nodeResponse.setHeader(key, value);
  for (const [key, value] of Object.entries(SECURITY)) if (!nodeResponse.hasHeader(key)) nodeResponse.setHeader(key, value);
  if (headOnly) return nodeResponse.end();
  nodeResponse.end(Buffer.from(await response.arrayBuffer()));
}

export function createAppServer({ root = ROOT } = {}) {
  return http.createServer(async (request, response) => {
    try {
      const origin = `http://${request.headers.host || "127.0.0.1"}`;
      const url = new URL(request.url || "/", origin);
      const handler = url.pathname === "/api/health" ? handleHealth : url.pathname === "/api/cars" ? handleCars : url.pathname === "/api/ai/vehicle-match" ? handlePhotoMatch : null;
      if (handler) {
        const body = await bodyFor(request);
        const webRequest = new Request(url, { method: request.method, headers: request.headers, body, duplex: body ? "half" : undefined });
        return sendWebResponse(await handler(webRequest), response, request.method === "HEAD");
      }

      if (!["GET", "HEAD"].includes(request.method || "GET")) {
        return sendWebResponse(new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { "content-type": "application/json", allow: "GET, HEAD" } }), response, request.method === "HEAD");
      }

      const decoded = decodeURIComponent(url.pathname);
      const safe = normalize(decoded).replace(/^([.][.][/\\])+/, "").replace(/^[/\\]+/, "");
      if (safe.includes("..")) return sendWebResponse(new Response("Not found", { status: 404 }), response, request.method === "HEAD");

      if (!url.pathname.endsWith("/") && !extname(url.pathname)) {
        const candidate = join(root, safe, "index.html");
        if (await exists(candidate)) {
          response.statusCode = 308;
          response.setHeader("location", `${url.pathname}/${url.search}`);
          for (const [key, value] of Object.entries(SECURITY)) response.setHeader(key, value);
          return response.end();
        }
      }

      const relative = url.pathname === "/" ? "index.html" : url.pathname.endsWith("/") ? join(safe, "index.html") : safe;
      let path = join(root, relative);
      let statusCode = 200;
      if (!(await exists(path))) { path = join(root, "404.html"); statusCode = 404; }
      const bytes = await readFile(path);
      response.statusCode = statusCode;
      response.setHeader("content-type", MIME.get(extname(path)) || "application/octet-stream");
      response.setHeader("cache-control", url.pathname === "/sw.js" ? "no-store" : url.pathname.startsWith("/assets/") ? "public, max-age=86400" : "no-store");
      if (url.pathname === "/sw.js") response.setHeader("service-worker-allowed", "/");
      for (const [key, value] of Object.entries(SECURITY)) response.setHeader(key, value);
      response.end(request.method === "HEAD" ? undefined : bytes);
    } catch (error) {
      response.statusCode = 500;
      response.setHeader("content-type", "text/plain; charset=utf-8");
      response.end("Internal development-server error");
      console.error(error);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || "127.0.0.1";
  createAppServer().listen(port, host, () => console.log(`DriveLens preview: http://${host}:${port}`));
}
