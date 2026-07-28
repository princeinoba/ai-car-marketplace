import test from "node:test";
import assert from "node:assert/strict";
import { VEHICLES } from "../src/content/catalog.mjs";
import { normalizeReservation, normalizeReservationState, validatePlan } from "../src/lib/reservation-core.mjs";
import { normalizeAdminState } from "../src/lib/admin-core.mjs";

const allowed = new Set(VEHICLES.filter(v => v.status === "Available").map(v => v.id));
const future = new Date(Date.now() + 86_400_000 * 30).toISOString().slice(0, 10);

test("normalizes a valid reservation and cleans notes", () => {
  const result = normalizeReservation({ id: "x", vehicleId: [...allowed][0], branch: "Ottawa", date: future, time: "10:30", status: "Planned", notes: "ask\u0000 about tyres", createdAt: "2026-07-27T00:00:00.000Z" }, allowed);
  assert.equal(result.notes, "ask  about tyres");
  assert.equal(result.status, "Planned");
});

test("rejects reservations for unknown vehicles or malformed time", () => {
  assert.equal(normalizeReservation({ vehicleId: "bad", date: future, time: "10:30" }, allowed), null);
  assert.equal(normalizeReservation({ vehicleId: [...allowed][0], date: future, time: "bad" }, allowed), null);
});

test("reservation state is bounded and removes invalid entries", () => {
  const valid = { id: "x", vehicleId: [...allowed][0], branch: "Ottawa", date: future, time: "10:30", status: "Planned" };
  const state = normalizeReservationState({ version: 999, items: [valid, { vehicleId: "bad" }] }, allowed);
  assert.equal(state.version, 1);
  assert.equal(state.items.length, 1);
});

test("reservation validation identifies required fields", () => {
  const errors = validatePlan({}, allowed);
  assert.ok(errors.vehicleId && errors.branch && errors.date && errors.time);
});

test("reservation validation accepts a valid future plan", () => {
  const errors = validatePlan({ vehicleId: [...allowed][0], branch: "Ottawa", date: future, time: "10:30", notes: "Questions" }, allowed);
  assert.deepEqual(errors, {});
});

test("admin state enforces vehicle and status allowlists", () => {
  const id = [...allowed][0];
  const state = normalizeAdminState({ vehicleStatus: { [id]: "Sold", bad: "Available", [VEHICLES[1].id]: "Hacked" }, reservationStatus: { one: "Cancelled", two: "Hacked" }, branchNotice: " hello\u0000 world " }, new Set(VEHICLES.map(v => v.id)));
  assert.deepEqual(state.vehicleStatus, { [id]: "Sold" });
  assert.deepEqual(state.reservationStatus, { one: "Cancelled" });
  assert.equal(state.branchNotice, "hello  world");
});

test("admin notice is bounded", () => {
  const state = normalizeAdminState({ branchNotice: "x".repeat(500) }, new Set());
  assert.equal(state.branchNotice.length, 280);
});
