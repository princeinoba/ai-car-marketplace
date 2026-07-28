import test from "node:test";
import assert from "node:assert/strict";
import { VEHICLES } from "../src/content/catalog.mjs";
import { renderDocument } from "../src/templates/layout.mjs";
import { homePage, carsPage, vehiclePage, matchPage, comparePage, savedPage, financePage, testDrivePage, reservationsPage, safetyPage, aboutPage, privacyPage, adminOverviewPage, adminInventoryPage, adminTestDrivesPage, adminSettingsPage, notFoundPage } from "../src/templates/pages.mjs";

const pages = [homePage(), carsPage(), ...VEHICLES.map(vehiclePage), matchPage(), comparePage(), savedPage(), financePage(), testDrivePage(), reservationsPage(), safetyPage(), aboutPage(), privacyPage(), adminOverviewPage(), adminInventoryPage(), adminTestDrivesPage(), adminSettingsPage(), notFoundPage()];

test("all page templates contain one main and one h1", () => {
  assert.equal(pages.length, 28);
  for (const page of pages) {
    assert.equal((page.match(/<main\b/g) || []).length, 1);
    assert.equal((page.match(/<h1\b/g) || []).length, 1);
  }
});

test("catalogue data is embedded in inert templates, not inline scripts", () => {
  const page = homePage();
  assert.match(page, /<template id="catalog-data">/);
  assert.doesNotMatch(page, /<script[^>]*id="catalog-data"/);
});

test("full documents use external scripts and restrictive robots metadata", () => {
  const html = renderDocument({ title: "Test", description: "Test document description", path: "/test/", main: homePage(), scripts: ["/assets/app.js"], robots: "noindex,follow" });
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /<aside class="demo-banner" aria-label="Demonstration disclosure">/);
  assert.match(html, /<script src="\/assets\/site\.js" type="module"><\/script>/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
});

test("vehicle pages use local images and no real contact or VIN fields", () => {
  for (const vehicle of VEHICLES) {
    const page = vehiclePage(vehicle);
    assert.match(page, new RegExp(`/assets/images/vehicles/${vehicle.slug}\\.svg`));
    assert.doesNotMatch(page, /\bVIN\s*:/i);
    assert.doesNotMatch(page, /mailto:|tel:/i);
  }
});

test("test-drive routes state the no-booking boundary", () => {
  assert.match(testDrivePage(), /No dealership receives this plan and no appointment slot is reserved\./);
  assert.match(reservationsPage(), /No dealership receives these plans and no appointment slot is reserved\./);
});
test("admin routes state their synthetic demonstration boundary", () => {
  for (const page of [adminOverviewPage(), adminInventoryPage(), adminTestDrivesPage(), adminSettingsPage()]) assert.match(page, /Synthetic administration demonstration/);
});

test("photo match copy prohibits unsafe visual guesses", () => {
  const page = matchPage();
  for (const term of ["mileage", "VIN", "ownership", "exact year", "price", "mechanical condition"]) assert.match(page, new RegExp(term, "i"));
});
