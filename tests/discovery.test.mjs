import test from "node:test";
import assert from "node:assert/strict";
import { VEHICLES } from "../src/content/catalog.mjs";
import { filterVehicles, normalizeText, parseNaturalLanguage, relatedVehicles, smartMatch } from "../src/lib/catalog-core.mjs";

test("normalizes control characters and length", () => assert.equal(normalizeText("  SUV\u0000   winter  ", 20), "SUV winter"));

test("filters by text, body, fuel, status and price", () => {
  const list = filterVehicles(VEHICLES, { query: "roof", bodyTypes: ["SUV"], fuels: ["Hybrid"], statuses: ["Available"], maxPrice: 50_000 });
  assert.equal(list.length, 1);
  assert.equal(list[0].slug, "kinetic-trail-x");
});

test("sorts by price and mileage without mutating source", () => {
  const firstBefore = VEHICLES[0].id;
  const lowPrice = filterVehicles(VEHICLES, { sort: "price-low" });
  const lowMileage = filterVehicles(VEHICLES, { sort: "mileage-low" });
  assert.ok(lowPrice[0].price <= lowPrice.at(-1).price);
  assert.ok(lowMileage[0].mileageKm <= lowMileage.at(-1).mileageKm);
  assert.equal(VEHICLES[0].id, firstBefore);
});

test("natural-language parser infers EV, body, budget and year", () => {
  const parsed = parseNaturalLanguage("EV SUV under $60,000 newer than 2023");
  assert.deepEqual(parsed.bodyTypes, ["SUV"]);
  assert.deepEqual(parsed.fuels, ["Electric"]);
  assert.equal(parsed.maxPrice, 60_000);
  assert.equal(parsed.minYear, 2023);
});

test("related vehicles exclude the source and respect limit", () => {
  const source = VEHICLES[0];
  const related = relatedVehicles(VEHICLES, source, 3);
  assert.equal(related.length, 3);
  assert.equal(related.some(v => v.id === source.id), false);
});

test("smart match returns only available vehicles and reasons", () => {
  const results = smartMatch(VEHICLES, { budget: 55_000, bodyType: "SUV", fuelType: "Hybrid", seats: 5, priority: "winter" });
  assert.equal(results.length, 3);
  assert.ok(results.every(result => result.vehicle.status === "Available"));
  assert.ok(results[0].score >= results[1].score);
  assert.ok(results.some(result => result.vehicle.slug === "kinetic-trail-x"));
  assert.ok(results.every(result => result.reasons.length <= 4));
});

test("unknown sort safely falls back to featured ordering", () => {
  const results = filterVehicles(VEHICLES, { sort: "__bad__" });
  assert.equal(results[0].featured, true);
});
