export const BODY_TYPES = ["Sedan", "SUV", "Crossover", "Hatchback", "Pickup", "Coupe", "Minivan", "Wagon"];
export const FUEL_TYPES = ["Electric", "Hybrid", "Gasoline"];
export const STATUSES = ["Available", "Unavailable", "Sold"];
export const SORTS = ["featured", "price-low", "price-high", "year-new", "mileage-low", "inspection"];

export function normalizeText(value, max = 120) {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function money(value) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function filterVehicles(vehicles, options = {}) {
  const query = normalizeText(options.query || "", 120).toLowerCase();
  const bodyTypes = new Set(options.bodyTypes || []);
  const fuels = new Set(options.fuels || []);
  const statuses = new Set(options.statuses || []);
  const maxPrice = Number.isFinite(Number(options.maxPrice)) ? Number(options.maxPrice) : Infinity;
  const minYear = Number.isFinite(Number(options.minYear)) ? Number(options.minYear) : 0;
  const branch = normalizeText(options.branch || "", 40);
  const sort = SORTS.includes(options.sort) ? options.sort : "featured";
  const result = vehicles.filter((vehicle) => {
    const haystack = [vehicle.make, vehicle.model, vehicle.trim, vehicle.bodyType, vehicle.fuelType, vehicle.color, vehicle.location, vehicle.summary, ...vehicle.features].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (!bodyTypes.size || bodyTypes.has(vehicle.bodyType)) && (!fuels.size || fuels.has(vehicle.fuelType)) && (!statuses.size || statuses.has(vehicle.status)) && vehicle.price <= maxPrice && vehicle.year >= minYear && (!branch || vehicle.branch === branch);
  });
  const copy = [...result];
  copy.sort((a,b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "year-new") return b.year - a.year || a.mileageKm - b.mileageKm;
    if (sort === "mileage-low") return a.mileageKm - b.mileageKm;
    if (sort === "inspection") return b.inspectionScore - a.inspectionScore;
    return Number(b.featured) - Number(a.featured) || b.year - a.year;
  });
  return copy;
}

export function parseNaturalLanguage(query) {
  const text = normalizeText(query, 120).toLowerCase();
  const inferred = { query: text, bodyTypes: [], fuels: [], maxPrice: Infinity, minYear: 0 };
  for (const body of BODY_TYPES) if (text.includes(body.toLowerCase())) inferred.bodyTypes.push(body);
  for (const fuel of FUEL_TYPES) if (text.includes(fuel.toLowerCase()) || (fuel === "Electric" && text.includes("ev"))) inferred.fuels.push(fuel);
  const moneyMatch = text.match(/(?:under|below|max(?:imum)?|up to)\s*\$?([\d,]+)/);
  if (moneyMatch) inferred.maxPrice = Number(moneyMatch[1].replaceAll(",", ""));
  const yearMatch = text.match(/(?:since|from|newer than)\s*(20\d{2})/);
  if (yearMatch) inferred.minYear = Number(yearMatch[1]);
  return inferred;
}

export function relatedVehicles(vehicles, vehicle, limit = 3) {
  return vehicles.filter(v => v.id !== vehicle.id).map(v => ({ vehicle: v, score: (v.bodyType === vehicle.bodyType ? 4 : 0) + (v.fuelType === vehicle.fuelType ? 3 : 0) + (Math.abs(v.price - vehicle.price) < 12000 ? 2 : 0) + (v.seats === vehicle.seats ? 1 : 0) })).sort((a,b) => b.score-a.score || a.vehicle.price-b.vehicle.price).slice(0,limit).map(x=>x.vehicle);
}

export function smartMatch(vehicles, preferences = {}) {
  const budget = Math.max(10000, Math.min(150000, Number(preferences.budget) || 50000));
  const body = normalizeText(preferences.bodyType || "", 30);
  const fuel = normalizeText(preferences.fuelType || "", 30);
  const seats = Math.max(2, Math.min(8, Number(preferences.seats) || 5));
  const priority = normalizeText(preferences.priority || "value", 30);
  return vehicles.filter(v => v.status === "Available").map(v => {
    let score = 50;
    const reasons = [];
    if (v.price <= budget) { score += 18; reasons.push("within budget"); } else score -= Math.min(25, Math.round((v.price-budget)/2000));
    if (body && v.bodyType === body) { score += 14; reasons.push(`${body.toLowerCase()} body`); }
    if (fuel && v.fuelType === fuel) { score += 12; reasons.push(`${fuel.toLowerCase()} powertrain`); }
    if (v.seats >= seats) { score += 8; reasons.push(`${v.seats} seats`); } else score -= 12;
    if (priority === "efficiency" && ["Electric","Hybrid"].includes(v.fuelType)) { score += 10; reasons.push("efficiency focus"); }
    if (priority === "winter" && ["AWD","4WD"].includes(v.drivetrain)) { score += 10; reasons.push("winter traction"); }
    if (priority === "value" && v.price < budget * .85) { score += 8; reasons.push("budget headroom"); }
    if (priority === "condition" && v.inspectionScore >= 92) { score += 8; reasons.push("high demo inspection score"); }
    return { vehicle: v, score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0,4) };
  }).sort((a,b)=>b.score-a.score || a.vehicle.price-b.vehicle.price).slice(0,3);
}
