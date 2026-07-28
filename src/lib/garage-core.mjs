export const SAVED_KEY = "drivelens:saved:v1";
export const COMPARE_KEY = "drivelens:compare:v1";
export function normalizeIds(value, allowed, max) {
  const source = Array.isArray(value) ? value : [];
  return [...new Set(source.filter(id => typeof id === "string" && allowed.has(id)))].slice(0,max);
}
export const normalizeSaved = (value, allowed) => normalizeIds(value, allowed, 50);
export const normalizeCompare = (value, allowed) => normalizeIds(value, allowed, 3);
export function toggleId(list, id, max) { const next=list.includes(id)?list.filter(x=>x!==id):[...list,id]; return next.slice(-max); }
