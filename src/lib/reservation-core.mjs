export const RESERVATIONS_KEY = "drivelens:reservations:v1";
export const RESERVATION_VERSION = 1;
export const RESERVATION_STATUSES = ["Planned", "Confirmed demo", "Completed demo", "Cancelled"];
export function normalizeReservation(input, allowedVehicleIds) {
  if (!input || typeof input !== "object" || !allowedVehicleIds.has(input.vehicleId)) return null;
  const date=String(input.date||""); const time=String(input.time||"");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const status=RESERVATION_STATUSES.includes(input.status)?input.status:"Planned";
  return { id:String(input.id||crypto.randomUUID()), vehicleId:input.vehicleId, branch:String(input.branch||"").slice(0,40), date, time, status, notes:String(input.notes||"").replace(/[\u0000-\u001F\u007F]/g," ").trim().slice(0,400), createdAt:String(input.createdAt||new Date().toISOString()) };
}
export function normalizeReservationState(value, allowedVehicleIds) { const items=Array.isArray(value?.items)?value.items:[]; return {version:RESERVATION_VERSION,items:items.map(x=>normalizeReservation(x,allowedVehicleIds)).filter(Boolean).slice(0,20)}; }
export function validatePlan({vehicleId,branch,date,time,notes}, allowedVehicleIds) {
  const errors={}; if(!allowedVehicleIds.has(vehicleId)) errors.vehicleId="Select an available vehicle."; if(!branch) errors.branch="Select a branch."; if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||""))) errors.date="Choose a valid date."; else { const chosen=new Date(`${date}T12:00:00`); const today=new Date(); today.setHours(0,0,0,0); if(chosen<today) errors.date="Choose today or a future date."; }
  if(!/^\d{2}:\d{2}$/.test(String(time||""))) errors.time="Choose a valid time."; if(String(notes||"").length>400) errors.notes="Keep notes under 400 characters."; return errors;
}
