import test from "node:test";
import assert from "node:assert/strict";
import { handleCars, handleHealth, handlePhotoMatch } from "../src/server/handlers.mjs";

const req = (url, init = {}) => new Request(url, init);

test("health reports safe product capabilities", async () => {
  const response = await handleHealth(req("https://example.test/api/health"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "ok");
  assert.equal(body.capabilities.liveSales, false);
  assert.equal(body.capabilities.database, false);
  assert.equal(body.capabilities.realReservations, false);
});

test("health rejects mutation methods", async () => {
  const response = await handleHealth(req("https://example.test/api/health", { method: "POST" }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
});

test("catalogue API applies natural-language and limit filters", async () => {
  const response = await handleCars(req("https://example.test/api/cars?q=EV%20under%2060000&limit=2"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.items.length <= 2);
  assert.ok(body.items.every(v => v.fuelType === "Electric" && v.price <= 60_000));
});

test("catalogue API bounds malicious numeric parameters", async () => {
  const response = await handleCars(req("https://example.test/api/cars?limit=9999&maxPrice=-5&minYear=5000"));
  const body = await response.json();
  assert.ok(body.items.length <= 50);
});

test("catalogue API uses shared cache and request ID", async () => {
  const response = await handleCars(req("https://example.test/api/cars"));
  assert.match(response.headers.get("cache-control"), /s-maxage=300/);
  assert.ok(response.headers.get("x-request-id"));
});

test("catalogue rejects POST", async () => assert.equal((await handleCars(req("https://example.test/api/cars", { method: "POST" }))).status, 405));

test("photo match rejects GET", async () => assert.equal((await handlePhotoMatch(req("https://example.test/api/ai/vehicle-match"))).status, 405));

test("photo match is safely unavailable without a key", async () => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const response = await handlePhotoMatch(req("https://example.test/api/ai/vehicle-match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dataUrl: "x" }) }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "ai_unconfigured");
  if (previous) process.env.GEMINI_API_KEY = previous;
});

test("photo match validates image type and size before provider call", async () => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-only";
  const response = await handlePhotoMatch(req("https://example.test/api/ai/vehicle-match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dataUrl: "data:image/gif;base64,AAAA" }) }));
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error.code, "invalid_image");
  if (previous) process.env.GEMINI_API_KEY = previous; else delete process.env.GEMINI_API_KEY;
});

test("photo match normalizes a successful Gemini response without exposing key", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "fixture-key";
  let requestBody = "";
  let requestUrl = "";
  let requestHeaders;
  globalThis.fetch = async (url, init) => {
    requestUrl = String(url);
    requestHeaders = new Headers(init.headers);
    requestBody = String(init.body);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ makeHint: "", bodyType: "SUV", color: "black", visibleFeatures: ["roof rails", "five doors"], confidence: .76, limitations: "Cannot verify identity or condition." }) }] } }] }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const bytes = Buffer.alloc(300, 1).toString("base64");
  const response = await handlePhotoMatch(req("https://example.test/api/ai/vehicle-match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dataUrl: `data:image/jpeg;base64,${bytes}` }) }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.analysis.bodyType, "SUV");
  assert.equal(body.analysis.confidence, .76);
  assert.equal(body.matches.length, 3);
  assert.doesNotMatch(JSON.stringify(body), /test-secret/);
  assert.doesNotMatch(requestUrl, /fixture-key|[?&]key=/);
  assert.equal(requestHeaders.get("x-goog-api-key"), "fixture-key");
  assert.match(requestBody, /Do not identify a licence plate or infer VIN/);
  assert.match(requestBody, /accident history, roadworthiness, safety/);
  assert.match(requestBody, /"responseSchema"/);
  assert.match(requestBody, /"maxOutputTokens":320/);
  assert.match(requestBody, /"thinkingConfig":\{"thinkingBudget":0\}/);
  globalThis.fetch = previousFetch;
  if (previousKey) process.env.GEMINI_API_KEY = previousKey; else delete process.env.GEMINI_API_KEY;
});

test("photo match converts provider failure into a bounded 503", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-only";
  globalThis.fetch = async () => new Response("bad", { status: 500 });
  const bytes = Buffer.alloc(300, 1).toString("base64");
  const response = await handlePhotoMatch(req("https://example.test/api/ai/vehicle-match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dataUrl: `data:image/png;base64,${bytes}` }) }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "ai_unavailable");
  globalThis.fetch = previousFetch;
  if (previousKey) process.env.GEMINI_API_KEY = previousKey; else delete process.env.GEMINI_API_KEY;
});
