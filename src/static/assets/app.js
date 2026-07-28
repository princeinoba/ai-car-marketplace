const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
const toast = (message) => window.DriveLens?.toast(message);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
const clean = (value, max = 400) => String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const money = (value) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(value) || 0);
const number = (value) => new Intl.NumberFormat("en-CA").format(Number(value) || 0);

function catalog() {
  const element = qs("#catalog-data");
  const source = element?.content?.textContent ?? element?.textContent ?? "{}";
  try { return JSON.parse(source); } catch { return { vehicles: [], branches: [], market: {} }; }
}

const { vehicles = [], branches = [] } = catalog();
const allowedVehicleIds = new Set(vehicles.map((vehicle) => vehicle.id));
const availableVehicleIds = new Set(vehicles.filter((vehicle) => vehicle.status === "Available").map((vehicle) => vehicle.id));
const allowedBranches = new Set(branches.map((branch) => branch.name));
const vehicleStatuses = new Set(["Available", "Unavailable", "Sold"]);
const reservationStatuses = new Set(["Planned", "Confirmed demo", "Completed demo", "Cancelled"]);

const SAVED = "drivelens:saved:v1";
const COMPARE = "drivelens:compare:v1";
const RESERVATIONS = "drivelens:reservations:v1";
const ADMIN = "drivelens:admin:v1";

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { toast("Browser storage is unavailable."); return false; }
}
function normalizeIds(value, maximum) {
  return [...new Set((Array.isArray(value) ? value : []).filter((id) => allowedVehicleIds.has(id)))].slice(0, maximum);
}
const saved = () => normalizeIds(read(SAVED, []), 50);
const compared = () => normalizeIds(read(COMPARE, []), 3);

function updateCounts() {
  const savedIds = saved();
  const comparedIds = compared();
  qsa("[data-saved-count]").forEach((element) => { element.textContent = String(savedIds.length); });
  qsa("[data-compare-count]").forEach((element) => { element.textContent = String(comparedIds.length); });
  qsa("[data-save-id]").forEach((button) => {
    const active = savedIds.includes(button.dataset.saveId);
    button.setAttribute("aria-pressed", String(active));
    const label = qs("span", button);
    if (label) label.textContent = active ? "Saved" : "Save";
  });
  qsa("[data-compare-id]").forEach((button) => button.setAttribute("aria-pressed", String(comparedIds.includes(button.dataset.compareId))));
}

function vehicleCard(vehicle) {
  return `<article class="vehicle-card">
    <a class="vehicle-card__image" href="/cars/${esc(vehicle.slug)}/">
      <img src="${esc(vehicle.image)}" alt="Original illustration of the fictional ${esc(vehicle.make)} ${esc(vehicle.model)}" width="1200" height="760" loading="lazy" decoding="async">
      <span class="status-badge status-badge--${esc(String(vehicle.status).toLowerCase())}">${esc(vehicle.status)}</span>
    </a>
    <div class="vehicle-card__body">
      <div class="vehicle-card__top"><div><p class="eyebrow">${esc(vehicle.year)} · ${esc(vehicle.bodyType)}</p><h3><a href="/cars/${esc(vehicle.slug)}/">${esc(vehicle.make)} ${esc(vehicle.model)}</a></h3><p>${esc(vehicle.trim)}</p></div><strong>${money(vehicle.price)}</strong></div>
      <div class="spec-row"><span>${esc(vehicle.fuelType)}</span><span>${number(vehicle.mileageKm)} km</span><span>${esc(vehicle.drivetrain)}</span></div>
      <div class="card-actions"><button class="icon-text-button" type="button" data-save-id="${esc(vehicle.id)}" aria-label="Save ${esc(vehicle.make)} ${esc(vehicle.model)}">♡ <span>Save</span></button><button class="icon-text-button" type="button" data-compare-id="${esc(vehicle.id)}" aria-label="Compare ${esc(vehicle.make)} ${esc(vehicle.model)}">⇄ <span>Compare</span></button><a class="text-link" href="/cars/${esc(vehicle.slug)}/">Details →</a></div>
    </div>
  </article>`;
}

function renderSaved() {
  const grid = qs("[data-saved-grid]");
  if (!grid) return;
  const list = saved().map((id) => vehicles.find((vehicle) => vehicle.id === id)).filter(Boolean);
  grid.innerHTML = list.map(vehicleCard).join("");
  const empty = qs("[data-saved-empty]");
  if (empty) empty.hidden = Boolean(list.length);
  updateCounts();
}

function renderCompare() {
  const view = qs("[data-compare-view]");
  if (!view) return;
  const list = compared().map((id) => vehicles.find((vehicle) => vehicle.id === id)).filter(Boolean);
  const empty = qs("[data-compare-empty]");
  if (empty) empty.hidden = Boolean(list.length);
  view.innerHTML = list.length ? `<div class="compare-grid">${list.map((vehicle) => `<article class="compare-card">
    <button type="button" class="remove-compare" data-compare-id="${esc(vehicle.id)}" aria-label="Remove ${esc(vehicle.make)} ${esc(vehicle.model)}">×</button>
    <img src="${esc(vehicle.image)}" alt="Original illustration of the fictional ${esc(vehicle.make)} ${esc(vehicle.model)}" width="1200" height="760">
    <h2>${esc(vehicle.make)} ${esc(vehicle.model)}</h2><strong>${money(vehicle.price)}</strong>
    <dl><div><dt>Year</dt><dd>${vehicle.year}</dd></div><div><dt>Mileage</dt><dd>${number(vehicle.mileageKm)} km</dd></div><div><dt>Body</dt><dd>${esc(vehicle.bodyType)}</dd></div><div><dt>Fuel</dt><dd>${esc(vehicle.fuelType)}</dd></div><div><dt>Drive</dt><dd>${esc(vehicle.drivetrain)}</dd></div><div><dt>Seats</dt><dd>${vehicle.seats}</dd></div><div><dt>Efficiency</dt><dd>${esc(vehicle.efficiency)}</dd></div><div><dt>Demo score</dt><dd>${vehicle.inspectionScore}/100</dd></div></dl>
    <a class="button button--secondary" href="/cars/${esc(vehicle.slug)}/">View details</a>
  </article>`).join("")}</div>` : "";
  updateCounts();
}

function renderCars() {
  const form = qs("[data-cars-filters]");
  const grid = qs("[data-vehicle-grid]");
  if (!form || !grid) return;
  const data = new FormData(form);
  const query = clean(data.get("query"), 120).toLowerCase();
  const bodyType = String(data.get("bodyType") || "");
  const fuelType = String(data.get("fuelType") || "");
  const status = String(data.get("status") || "");
  const maximumPrice = Math.max(20_000, Math.min(70_000, Number(data.get("maxPrice")) || 70_000));
  const sort = String(data.get("sort") || "featured");
  const list = vehicles.filter((vehicle) => {
    const haystack = [vehicle.make, vehicle.model, vehicle.trim, vehicle.bodyType, vehicle.fuelType, vehicle.location, vehicle.summary, ...vehicle.features].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (!bodyType || vehicle.bodyType === bodyType) && (!fuelType || vehicle.fuelType === fuelType) && (!status || vehicle.status === status) && vehicle.price <= maximumPrice;
  });
  list.sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "year-new" ? b.year - a.year : sort === "mileage-low" ? a.mileageKm - b.mileageKm : sort === "inspection" ? b.inspectionScore - a.inspectionScore : Number(b.featured) - Number(a.featured) || b.year - a.year);
  grid.innerHTML = list.map(vehicleCard).join("");
  const count = qs("[data-results-count]");
  if (count) count.textContent = String(list.length);
  const empty = qs("[data-empty]");
  if (empty) empty.hidden = Boolean(list.length);
  updateCounts();
}

function toggleSaved(id) {
  if (!allowedVehicleIds.has(id)) return;
  const list = saved();
  const active = list.includes(id);
  write(SAVED, active ? list.filter((item) => item !== id) : [...list, id]);
  updateCounts();
  renderSaved();
  toast(active ? "Removed from saved vehicles." : "Saved on this device.");
}
function toggleCompare(id) {
  if (!allowedVehicleIds.has(id)) return;
  let list = compared();
  if (list.includes(id)) list = list.filter((item) => item !== id);
  else if (list.length >= 3) { toast("Compare is limited to three vehicles."); return; }
  else list = [...list, id];
  write(COMPARE, list);
  updateCounts();
  renderCompare();
  toast(list.includes(id) ? "Added to compare." : "Removed from compare.");
}

document.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-id]");
  if (saveButton) { toggleSaved(saveButton.dataset.saveId); return; }
  const compareButton = event.target.closest("[data-compare-id]");
  if (compareButton) toggleCompare(compareButton.dataset.compareId);
});

updateCounts();
renderSaved();
renderCompare();

const filterForm = qs("[data-cars-filters]");
filterForm?.addEventListener("input", (event) => {
  if (event.target.name === "maxPrice") {
    const output = qs("[data-price-output]");
    if (output) output.textContent = money(event.target.value);
  }
  renderCars();
});
filterForm?.addEventListener("reset", () => setTimeout(() => {
  const output = qs("[data-price-output]");
  if (output) output.textContent = money(70_000);
  renderCars();
}, 0));
qs("[data-clear-saved]")?.addEventListener("click", () => {
  if (confirm("Clear the saved vehicle list on this device?")) {
    write(SAVED, []);
    renderSaved();
    toast("Saved list cleared.");
  }
});

function smartMatch(preferences) {
  const budget = Math.max(10_000, Math.min(150_000, Number(preferences.budget) || 50_000));
  const seats = Math.max(2, Math.min(8, Number(preferences.seats) || 5));
  return vehicles.filter((vehicle) => vehicle.status === "Available").map((vehicle) => {
    let score = 50;
    const reasons = [];
    if (vehicle.price <= budget) { score += 18; reasons.push("within budget"); } else score -= Math.min(25, Math.round((vehicle.price - budget) / 2_000));
    if (preferences.bodyType && vehicle.bodyType === preferences.bodyType) { score += 14; reasons.push("preferred body type"); }
    if (preferences.fuelType && vehicle.fuelType === preferences.fuelType) { score += 12; reasons.push("preferred powertrain"); }
    if (vehicle.seats >= seats) { score += 8; reasons.push(`${vehicle.seats} seats`); } else score -= 12;
    if (preferences.priority === "efficiency" && ["Electric", "Hybrid"].includes(vehicle.fuelType)) { score += 10; reasons.push("efficiency focus"); }
    if (preferences.priority === "winter" && ["AWD", "4WD"].includes(vehicle.drivetrain)) { score += 10; reasons.push("winter traction"); }
    if (preferences.priority === "value" && vehicle.price < budget * .85) { score += 8; reasons.push("budget headroom"); }
    if (preferences.priority === "condition" && vehicle.inspectionScore >= 92) { score += 8; reasons.push("high demo score"); }
    return { vehicle, score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 4) };
  }).sort((a, b) => b.score - a.score || a.vehicle.price - b.vehicle.price).slice(0, 3);
}

const matchForm = qs("[data-match-form]");
matchForm?.addEventListener("input", (event) => {
  if (event.target.name === "budget") {
    const output = qs("[data-budget-output]");
    if (output) output.textContent = money(event.target.value);
  }
});
matchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const preferences = Object.fromEntries(new FormData(matchForm));
  const results = qs("[data-match-results]");
  if (!results) return;
  results.innerHTML = smartMatch(preferences).map(({ vehicle, score, reasons }) => `<article class="match-card"><img src="${esc(vehicle.image)}" alt="Original illustration of the fictional ${esc(vehicle.make)} ${esc(vehicle.model)}" width="1200" height="760"><div><p class="eyebrow">${score}% match</p><h3><a href="/cars/${esc(vehicle.slug)}/">${esc(vehicle.make)} ${esc(vehicle.model)}</a></h3><p>${reasons.map(esc).join(" · ")}</p><strong>${money(vehicle.price)}</strong></div></article>`).join("");
});

const photoForm = qs("[data-photo-form]");
const photoInput = photoForm?.elements.photo;
const photoPreview = qs("[data-photo-preview]");
let photoPreviewUrl = "";
function releasePhotoPreview() {
  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = "";
}
photoInput?.addEventListener("change", () => {
  releasePhotoPreview();
  const file = photoInput.files?.[0];
  if (file && photoPreview) {
    photoPreviewUrl = URL.createObjectURL(file);
    photoPreview.src = photoPreviewUrl;
    photoPreview.hidden = false;
  } else if (photoPreview) photoPreview.hidden = true;
});
window.addEventListener("pagehide", releasePhotoPreview);
photoForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = photoInput.files?.[0];
  const status = qs("[data-photo-status]");
  const results = qs("[data-photo-results]");
  if (!status || !results) return;
  results.innerHTML = "";
  if (!file) { status.textContent = "Select a photo first."; return; }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { status.textContent = "Use a JPEG, PNG or WebP image."; return; }
  if (file.size > 4 * 1024 * 1024) { status.textContent = "Keep the image under 4 MB."; return; }
  status.textContent = "Analysing visible attributes…";
  try {
    const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    const response = await fetch("/api/ai/vehicle-match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dataUrl }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error?.message || "Photo matching is unavailable.");
    status.textContent = `${clean(payload.analysis?.bodyType, 30)} · ${clean(payload.analysis?.color, 40)} · ${Math.round(Math.max(0, Math.min(1, Number(payload.analysis?.confidence) || 0)) * 100)}% visual confidence. ${clean(payload.analysis?.limitations, 220)}`;
    results.innerHTML = (Array.isArray(payload.matches) ? payload.matches : []).slice(0, 3).map((match) => `<article class="match-card"><img src="${esc(match.image)}" alt="Original illustration of the fictional ${esc(match.make)} ${esc(match.model)}" width="1200" height="760"><div><h3><a href="/cars/${esc(match.slug)}/">${esc(match.make)} ${esc(match.model)}</a></h3><p>${(Array.isArray(match.reasons) ? match.reasons : []).map((reason) => esc(clean(reason, 60))).join(" · ") || "catalogue similarity"}</p><strong>${money(match.price)}</strong></div></article>`).join("");
  } catch (error) { status.textContent = clean(error.message || "Photo matching is unavailable.", 180); }
});

function calculateFinance() {
  const form = qs("[data-finance-form]");
  const result = qs("[data-finance-result]");
  if (!form || !result) return;
  const values = Object.fromEntries(new FormData(form));
  const price = Math.max(0, Math.min(250_000, Number(values.price) || 0));
  const downPayment = Math.max(0, Math.min(250_000, Number(values.downPayment) || 0));
  const tradeIn = Math.max(0, Math.min(250_000, Number(values.tradeIn) || 0));
  const annualRate = Math.max(0, Math.min(40, Number(values.annualRate) || 0));
  const termMonths = Math.max(12, Math.min(96, Number(values.termMonths) || 60));
  const taxRate = Math.max(0, Math.min(25, Number(values.taxRate) || 0));
  const taxable = Math.max(0, price - tradeIn);
  const taxAmount = taxable * taxRate / 100;
  const principal = Math.max(0, taxable + taxAmount - downPayment);
  const monthlyRate = annualRate / 100 / 12;
  const monthly = principal === 0 ? 0 : monthlyRate === 0 ? principal / termMonths : principal * (monthlyRate * (1 + monthlyRate) ** termMonths) / ((1 + monthlyRate) ** termMonths - 1);
  const totalPayments = monthly * termMonths;
  result.innerHTML = `<p class="eyebrow">Illustrative result</p><h2>${money(monthly)} / month</h2><dl><div><dt>Amount financed</dt><dd>${money(principal)}</dd></div><div><dt>Demo tax</dt><dd>${money(taxAmount)}</dd></div><div><dt>Total interest</dt><dd>${money(Math.max(0, totalPayments - principal))}</dd></div><div><dt>Total payments</dt><dd>${money(totalPayments)}</dd></div></dl><p>Excludes fees, insurance, incentives and lender decisions.</p>`;
}
const financeForm = qs("[data-finance-form]");
financeForm?.addEventListener("input", calculateFinance);
if (financeForm) {
  const rawPrice = new URLSearchParams(location.search).get("price");
  const price = rawPrice === null || rawPrice.trim() === "" ? Number.NaN : Number(rawPrice);
  if (Number.isFinite(price) && price >= 0 && price <= 250_000) financeForm.elements.price.value = String(price);
  calculateFinance();
}

function uniqueId() { return crypto.randomUUID?.() || `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function normalizeReservation(input) {
  if (!input || typeof input !== "object" || !availableVehicleIds.has(input.vehicleId) || !allowedBranches.has(input.branch)) return null;
  const date = String(input.date || "");
  const time = String(input.time || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || time < "09:00" || time > "18:00") return null;
  return {
    id: clean(input.id || uniqueId(), 80), vehicleId: input.vehicleId, branch: input.branch, date, time,
    status: reservationStatuses.has(input.status) ? input.status : "Planned",
    notes: clean(input.notes, 400), createdAt: String(input.createdAt || new Date().toISOString())
  };
}
function reservationState() {
  const raw = read(RESERVATIONS, { version: 1, items: [] });
  return { version: 1, items: (Array.isArray(raw?.items) ? raw.items : []).map(normalizeReservation).filter(Boolean).slice(0, 20) };
}
const saveReservationState = (state) => write(RESERVATIONS, state);

const reservationForm = qs("[data-reservation-form]");
if (reservationForm) {
  const initialVehicle = new URLSearchParams(location.search).get("vehicle");
  if (availableVehicleIds.has(initialVehicle)) reservationForm.elements.vehicleId.value = initialVehicle;
  reservationForm.elements.date.min = new Date().toISOString().slice(0, 10);
  reservationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(reservationForm));
    const errors = [];
    if (!availableVehicleIds.has(data.vehicleId)) errors.push("Select an available vehicle.");
    if (!allowedBranches.has(data.branch)) errors.push("Select a valid branch.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date || ""))) errors.push("Choose a valid date.");
    else {
      const chosen = new Date(`${data.date}T12:00:00`);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (chosen < today) errors.push("Choose today or a future date.");
    }
    if (!/^\d{2}:\d{2}$/.test(String(data.time || "")) || data.time < "09:00" || data.time > "18:00") errors.push("Choose a time between 9:00 a.m. and 6:00 p.m.");
    if (String(data.notes || "").length > 400) errors.push("Keep notes under 400 characters.");
    if (data.consent !== "on") errors.push("Confirm the local-only demonstration boundary.");
    const summary = qs("[data-reservation-errors]");
    if (errors.length) {
      summary.hidden = false;
      summary.innerHTML = `<strong>Correct these items:</strong><ul>${errors.map((error) => `<li>${esc(error)}</li>`).join("")}</ul>`;
      summary.focus();
      return;
    }
    summary.hidden = true;
    const state = reservationState();
    state.items.unshift({ id: uniqueId(), vehicleId: data.vehicleId, branch: data.branch, date: data.date, time: data.time, status: "Planned", notes: clean(data.notes, 400), createdAt: new Date().toISOString() });
    if (saveReservationState(state)) location.href = "/reservations/";
  });
}

function renderReservations(admin = false) {
  const target = qs(admin ? "[data-admin-reservations]" : "[data-reservations-list]");
  if (!target) return;
  const state = reservationState();
  const empty = qs(admin ? "[data-admin-reservations-empty]" : "[data-reservations-empty]");
  if (empty) empty.hidden = Boolean(state.items.length);
  target.innerHTML = state.items.map((reservation) => {
    const vehicle = vehicles.find((item) => item.id === reservation.vehicleId);
    return `<article class="reservation-card"><div><p class="eyebrow">${esc(reservation.date)} · ${esc(reservation.time)}</p><h2>${esc(vehicle?.make || "Vehicle")} ${esc(vehicle?.model || "")}</h2><p>${esc(reservation.branch)}</p>${reservation.notes ? `<p>${esc(reservation.notes)}</p>` : ""}</div><label><span>Status</span><select data-reservation-status="${esc(reservation.id)}">${[...reservationStatuses].map((status) => `<option${reservation.status === status ? " selected" : ""}>${esc(status)}</option>`).join("")}</select></label><button class="button button--ghost" type="button" data-reservation-remove="${esc(reservation.id)}">Remove</button></article>`;
  }).join("");
  qsa("[data-reservation-status]").forEach((select) => select.addEventListener("change", () => {
    if (!reservationStatuses.has(select.value)) return;
    const next = reservationState();
    const item = next.items.find((reservation) => reservation.id === select.dataset.reservationStatus);
    if (item) item.status = select.value;
    saveReservationState(next);
    toast("Local plan updated.");
  }));
  qsa("[data-reservation-remove]").forEach((button) => button.addEventListener("click", () => {
    const next = reservationState();
    next.items = next.items.filter((reservation) => reservation.id !== button.dataset.reservationRemove);
    saveReservationState(next);
    renderReservations(admin);
  }));
}
renderReservations(false);
renderReservations(true);

function adminState() {
  const raw = read(ADMIN, { version: 1, vehicleStatus: {}, branchNotice: "" });
  const vehicleStatus = {};
  for (const [id, status] of Object.entries(raw?.vehicleStatus || {})) if (allowedVehicleIds.has(id) && vehicleStatuses.has(status)) vehicleStatus[id] = status;
  return { version: 1, vehicleStatus, branchNotice: clean(raw?.branchNotice, 280) };
}
const saveAdminState = (state) => write(ADMIN, state);
qsa("[data-admin-vehicle]").forEach((select) => {
  const state = adminState();
  if (state.vehicleStatus[select.dataset.adminVehicle]) select.value = state.vehicleStatus[select.dataset.adminVehicle];
  select.addEventListener("change", () => {
    if (!vehicleStatuses.has(select.value) || !allowedVehicleIds.has(select.dataset.adminVehicle)) return;
    const next = adminState();
    next.vehicleStatus[select.dataset.adminVehicle] = select.value;
    saveAdminState(next);
    toast("Fictional inventory updated locally.");
  });
});
const notice = qs("[data-admin-notice]");
if (notice) {
  notice.value = adminState().branchNotice;
  notice.addEventListener("input", () => {
    const next = adminState();
    next.branchNotice = clean(notice.value, 280);
    notice.value = next.branchNotice;
    saveAdminState(next);
    const status = qs("[data-admin-status]");
    if (status) status.textContent = "Saved locally.";
  });
}
qsa("[data-admin-reset]").forEach((button) => button.addEventListener("click", () => {
  if (confirm("Reset DriveLens admin demonstration data?")) {
    localStorage.removeItem(ADMIN);
    toast("Admin demo reset.");
    location.reload();
  }
}));
