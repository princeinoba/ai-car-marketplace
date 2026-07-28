import assert from "node:assert/strict";
import { once } from "node:events";
import { createAppServer } from "./dev-server.mjs";
import { VEHICLES } from "../src/content/catalog.mjs";

const server = createAppServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;
let assertions = 0;
const check = (condition, message) => { assertions += 1; assert.ok(condition, message); };
async function request(path, init) { return fetch(`${base}${path}`, { redirect: "manual", ...init }); }
try {
  const routes = ["/", "/cars/", ...VEHICLES.map((vehicle) => `/cars/${vehicle.slug}/`), "/match/", "/compare/", "/saved/", "/finance/", "/test-drive/", "/reservations/", "/safety/", "/about/", "/privacy/", "/admin/", "/admin/inventory/", "/admin/test-drives/", "/admin/settings/"];
  for (const route of routes) {
    const response = await request(route);
    check(response.status === 200, `${route} should return 200`);
    const html = await response.text();
    check(html.includes('<main id="main"'), `${route} should return the application document`);
  }
  const redirect = await request("/cars");
  check(redirect.status === 308, "clean route should redirect to trailing slash");
  check(redirect.headers.get("location") === "/cars/", "clean route redirect target should be /cars/");
  const missing = await request("/not-a-real-road/");
  check(missing.status === 404, "unknown route should return 404");
  check((await missing.text()).includes("That road is not on the map"), "unknown route should render designed 404");

  for (const asset of ["/assets/site.css", "/assets/site.js", "/assets/app.js", "/site.webmanifest", "/sw.js", "/robots.txt", "/sitemap.xml", "/.well-known/security.txt"]) {
    const response = await request(asset);
    check(response.status === 200, `${asset} should return 200`);
  }
  const home = await request("/");
  check(Boolean(home.headers.get("content-security-policy")), "CSP should be present");
  check(home.headers.get("x-frame-options") === "DENY", "frame denial should be present");

  const health = await request("/api/health");
  check(health.status === 200, "health should return 200");
  const healthBody = await health.json();
  check(healthBody.status === "ok", "health status should be ok");
  check(healthBody.capabilities.liveSales === false && healthBody.capabilities.realReservations === false, "health should disclose safe capability boundary");
  check(health.headers.get("cache-control") === "no-store", "health should not be cached");
  const healthPost = await request("/api/health", { method: "POST" });
  check(healthPost.status === 405 && healthPost.headers.get("allow") === "GET", "health should reject POST");

  const cars = await request("/api/cars?q=electric%20suv%20under%2060000&limit=5");
  check(cars.status === 200, "catalogue API should return 200");
  const carsBody = await cars.json();
  check(Array.isArray(carsBody.items) && carsBody.items.length <= 5, "catalogue API should return bounded items");
  check(carsBody.items.every((vehicle) => vehicle.fuelType === "Electric" && vehicle.price <= 60_000), "natural-language filters should apply");
  check(cars.headers.get("cache-control")?.includes("s-maxage=300"), "catalogue API should use shared caching");
  const carsPost = await request("/api/cars", { method: "POST" });
  check(carsPost.status === 405, "catalogue API should reject POST");

  const aiGet = await request("/api/ai/vehicle-match");
  check(aiGet.status === 405, "photo API should reject GET");
  const aiPost = await request("/api/ai/vehicle-match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dataUrl: "bad" }) });
  check([400, 422, 503].includes(aiPost.status), "photo API should fail safely without a valid configured request");
  const aiBody = await aiPost.json();
  check(Boolean(aiBody.error?.code), "photo API error should be structured");

  const mutation = await request("/cars/", { method: "POST" });
  check(mutation.status === 405, "static routes should reject mutation methods");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
console.log(`HTTP smoke verification passed with ${assertions} assertions.`);
