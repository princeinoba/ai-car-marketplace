const THEME_KEY = "drivelens:theme:v1";
const root = document.documentElement;
const themeButton = document.querySelector("[data-theme-toggle]");
const menu = document.querySelector("[data-primary-nav]");
const menuButton = document.querySelector("[data-menu-toggle]");
const commandDialog = document.querySelector("[data-command-dialog]");
const commandInput = document.querySelector("[data-command-input]");
const commandResults = document.querySelector("[data-command-results]");
let commandTrigger = null;

function readTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return ["system", "light", "dark"].includes(value) ? value : "system";
  } catch { return "system"; }
}
function applyTheme(value) {
  const theme = ["system", "light", "dark"].includes(value) ? value : "system";
  root.dataset.theme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  themeButton?.setAttribute("aria-label", `Colour theme: ${theme}. Activate to change.`);
}
applyTheme(readTheme());
themeButton?.addEventListener("click", () => applyTheme(root.dataset.theme === "system" ? "light" : root.dataset.theme === "light" ? "dark" : "system"));

function closeMenu({ restoreFocus = false } = {}) {
  menu?.removeAttribute("data-open");
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "Open navigation");
  if (restoreFocus) menuButton?.focus();
}
menuButton?.addEventListener("click", () => {
  const open = !menu?.hasAttribute("data-open");
  menu?.toggleAttribute("data-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  if (open) menu?.querySelector("a")?.focus();
});
menu?.addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
document.addEventListener("pointerdown", (event) => {
  if (menu?.hasAttribute("data-open") && !event.target.closest(".site-header")) closeMenu();
});
window.addEventListener("resize", () => { if (window.innerWidth > 820) closeMenu(); });

const commands = [
  ["/", "Home", "Overview and featured inventory"],
  ["/cars/", "Browse vehicles", "Search and filter fictional inventory"],
  ["/match/", "Smart Match", "Preference and optional photo matching"],
  ["/compare/", "Compare vehicles", "Compare up to three vehicles"],
  ["/saved/", "Saved vehicles", "Private browser-local shortlist"],
  ["/finance/", "Finance estimator", "Educational monthly-cost scenario"],
  ["/test-drive/", "Plan a test drive", "Private local visit reminder"],
  ["/reservations/", "Test-drive plans", "Review local plans"],
  ["/safety/", "Safety", "Verification-first marketplace guidance"],
  ["/about/", "Architecture", "Product and technical boundary"],
  ["/privacy/", "Privacy", "Browser-local data model"],
  ["/admin/", "Admin demo", "Synthetic operations information architecture"]
];
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}
function renderCommands(query = "") {
  if (!commandResults) return;
  const text = query.trim().toLowerCase();
  const matches = commands.filter(([, label, detail]) => `${label} ${detail}`.toLowerCase().includes(text));
  commandResults.innerHTML = matches.length ? matches.map(([href, label, detail]) => `<a href="${href}"><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></span><span aria-hidden="true">↗</span></a>`).join("") : '<p class="empty-inline">No matching page.</p>';
}
function openCommands(trigger = document.activeElement) {
  if (!commandDialog) return;
  commandTrigger = trigger;
  renderCommands();
  if (!commandDialog.open) commandDialog.showModal();
  setTimeout(() => commandInput?.focus(), 0);
}
commandDialog?.addEventListener("close", () => commandTrigger?.focus?.());
commandInput?.addEventListener("input", () => renderCommands(commandInput.value));
commandInput?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    commandResults?.querySelector("a")?.focus();
  }
});
commandResults?.addEventListener("keydown", (event) => {
  const links = [...commandResults.querySelectorAll("a")];
  const index = links.indexOf(document.activeElement);
  if (event.key === "ArrowDown") { event.preventDefault(); links[(index + 1) % links.length]?.focus(); }
  if (event.key === "ArrowUp") { event.preventDefault(); (index <= 0 ? commandInput : links[index - 1])?.focus(); }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu?.hasAttribute("data-open")) closeMenu({ restoreFocus: true });
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openCommands(); }
});

function toast(message) {
  const region = document.querySelector("[data-toast-region]");
  if (!region) return;
  const item = document.createElement("div");
  item.className = "toast";
  item.setAttribute("role", "status");
  item.textContent = String(message ?? "").slice(0, 220);
  region.append(item);
  setTimeout(() => item.remove(), 3200);
}
window.DriveLens = { toast, openCommands };

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
window.addEventListener("online", () => toast("Back online."));
window.addEventListener("offline", () => toast("You are offline. Curated pages and local tools remain available."));
