import test from "node:test";
import assert from "node:assert/strict";
import { VEHICLES } from "../src/content/catalog.mjs";
import { normalizeCompare, normalizeSaved, toggleId } from "../src/lib/garage-core.mjs";
import { calculateFinance } from "../src/lib/finance-core.mjs";

const allowed = new Set(VEHICLES.map(v => v.id));

test("saved state removes unknown and duplicate IDs", () => {
  const id = VEHICLES[0].id;
  assert.deepEqual(normalizeSaved([id, "bad", id], allowed), [id]);
});

test("saved state is bounded to 50 IDs", () => {
  const many = Array.from({ length: 70 }, (_, i) => i < VEHICLES.length ? VEHICLES[i].id : `bad-${i}`);
  assert.ok(normalizeSaved(many, allowed).length <= 50);
});

test("compare state is bounded to three valid unique vehicles", () => {
  const ids = VEHICLES.slice(0, 6).map(v => v.id);
  assert.deepEqual(normalizeCompare([...ids, ids[0]], allowed), ids.slice(0, 3));
});

test("toggle adds and removes IDs predictably", () => {
  const a = VEHICLES[0].id, b = VEHICLES[1].id;
  assert.deepEqual(toggleId([a], b, 3), [a, b]);
  assert.deepEqual(toggleId([a, b], a, 3), [b]);
});

test("finance calculation handles zero interest", () => {
  const result = calculateFinance({ price: 60_000, downPayment: 10_000, tradeIn: 5_000, annualRate: 0, termMonths: 60, taxRate: 13 });
  assert.ok(Math.abs(result.principal - 52_150) < 0.001);
  assert.equal(result.monthly, result.principal / 60);
  assert.equal(result.totalInterest, 0);
});

test("finance calculation produces amortized totals", () => {
  const result = calculateFinance({ price: 45_000, downPayment: 5_000, annualRate: 6.99, termMonths: 60, taxRate: 13 });
  assert.ok(result.monthly > 0);
  assert.ok(result.totalPayments > result.principal);
  assert.ok(result.totalInterest > 0);
});

test("finance bounds unsafe rates and terms", () => {
  const result = calculateFinance({ price: -1, annualRate: 99, termMonths: 1, taxRate: 99 });
  assert.equal(result.price, 0);
  assert.equal(result.annualRate, 40);
  assert.equal(result.termMonths, 12);
  assert.equal(result.monthly, 0);
});
