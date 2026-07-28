import test from "node:test";
import assert from "node:assert/strict";
import { MARKET, VEHICLES, BRANCHES } from "../src/content/catalog.mjs";
import { BODY_TYPES, FUEL_TYPES, STATUSES } from "../src/lib/catalog-core.mjs";

test("market identity is an honest fictional Canadian demonstration", () => {
  assert.equal(MARKET.name, "DriveLens Market Lab");
  assert.equal(MARKET.demo, true);
  assert.equal(MARKET.currency, "CAD");
  assert.match(MARKET.classification, /fictional/i);
});

test("catalogue contains twelve unique vehicles", () => {
  assert.equal(VEHICLES.length, 12);
  assert.equal(new Set(VEHICLES.map(v => v.id)).size, 12);
  assert.equal(new Set(VEHICLES.map(v => v.slug)).size, 12);
  assert.equal(new Set(VEHICLES.map(v => `${v.make} ${v.model}`)).size, 12);
});

test("vehicle numeric values are bounded and coherent", () => {
  for (const vehicle of VEHICLES) {
    assert.ok(Number.isInteger(vehicle.year) && vehicle.year >= 2020 && vehicle.year <= 2026);
    assert.ok(vehicle.price >= 20_000 && vehicle.price <= 100_000);
    assert.ok(Number.isInteger(vehicle.mileageKm) && vehicle.mileageKm >= 0 && vehicle.mileageKm <= 250_000);
    assert.ok(Number.isInteger(vehicle.seats) && vehicle.seats >= 2 && vehicle.seats <= 8);
    assert.ok(vehicle.inspectionScore >= 0 && vehicle.inspectionScore <= 100);
  }
});

test("vehicle enumerations use supported values", () => {
  for (const vehicle of VEHICLES) {
    assert.ok(BODY_TYPES.includes(vehicle.bodyType));
    assert.ok(FUEL_TYPES.includes(vehicle.fuelType));
    assert.ok(STATUSES.includes(vehicle.status));
  }
});

test("all vehicles have complete original-looking local assets and editorial fields", () => {
  for (const vehicle of VEHICLES) {
    assert.match(vehicle.image, /^\/assets\/images\/vehicles\/[a-z0-9-]+\.svg$/);
    assert.ok(vehicle.summary.length >= 40);
    assert.ok(vehicle.description.length >= 80);
    assert.ok(vehicle.features.length >= 4 && vehicle.features.length <= 7);
    assert.ok(vehicle.history.length >= 30);
  }
});

test("branches are unique and every vehicle references a known branch", () => {
  assert.equal(BRANCHES.length, 3);
  assert.equal(new Set(BRANCHES.map(b => b.name)).size, 3);
  const branches = new Set(BRANCHES.map(b => b.name));
  for (const vehicle of VEHICLES) assert.ok(branches.has(vehicle.branch));
});

test("catalogue demonstrates available, unavailable and sold states", () => {
  const states = new Set(VEHICLES.map(v => v.status));
  assert.deepEqual(states, new Set(["Available", "Unavailable", "Sold"]));
});

test("catalogue records do not expose contact, VIN or payment fields", () => {
  const keys = new Set(VEHICLES.flatMap((vehicle) => Object.keys(vehicle).map((key) => key.toLowerCase())));
  for (const term of ["vin", "email", "phone", "wallet", "payment", "depositaddress"]) assert.equal(keys.has(term), false, term);
});
