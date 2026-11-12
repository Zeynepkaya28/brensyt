// Uygulama kabuğu: yükleme ekranı, giriş, profil seçimi ve sayfa geçişleri.
import { put, h, tilt } from "./core/dom.js";
import { teddy, trackEyes } from "./core/teddy.js";
import * as auth from "./core/auth.js";
import * as store from "./core/store.js";
import { pop } from "./core/audio.js";
import { LANGS, LANG_LIST } from "./langs/index.js";
import { renderLogin } from "./views/login.js";
import { renderToday } from "./views/today.js";
import { renderCards } from "./views/cards.js";
import { renderChat } from "./views/chat.js";
import { renderExam } from "./views/exam.js";
import { renderPlan } from "./views/plan.js";
import { renderHistory } from "./views/history.js";
import { renderKids } from "./views/kids.js";
import { renderIdioms } from "./views/idioms.js";
import { renderRewards } from "./views/rewards.js";
import { applyOutfit, resetOutfit } from "./core/outfit.js";
import { renderStudio } from "./views/studio.js";
import { startReminder } from "./core/quests.js";
import { syncOfficialDates } from "./core/exam-dates.js";

const app = document.getElementById("app");
const ROUTES = [
  { id: "today", label: "Bugün", icon: "☀️", render: renderToday },
  { id: "cards", label: "Kartlar", icon: "🃏", render: renderCards },
  { id: "idioms", label: "Kalıplar", icon: "🐔", render: renderIdioms },
  { id: "studio", label: "Atölye", icon: "✏️", render: renderStudio },
  { id: "brensyt", label: "Brensyt", icon: "🧸", render: renderChat },
  { id: "exam", label: "Sınav", icon: "⏱️", render: renderExam },
  { id: "plan", label: "Program", icon: "🗓️", render: renderPlan },
  { id: "rewards", label: "Ödüller", icon: "🏅", render: renderRewards },
  { id: "history", label: "Geçmiş", icon: "📖", render: renderHistory },
];
let user = null;
let cleanup = null;

// Tema: kayıtlı seçim yoksa cihazın tercihine uyar.
const THEME_KEY = "brensyt:theme";
const root = document.documentElement;
root.dataset.theme = localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
function themeButton() {
  const btn = h("button", { class: "chip-btn", title: "Açık / koyu tema", onclick: () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, root.dataset.theme);
    btn.textContent = root.dataset.theme === "dark" ? "☀️" : "🌙";
  } }, root.dataset.theme === "dark" ? "☀️" : "🌙");
  return btn;
}

// Yükleme ekranı: Brensyt çubuğun üstünde yürür.
function loading(text = "Brensyt yola çıktı…", ms = 1700) {
  return new Promise((resolve) => {
    const walker = teddy("walk");
    const fill = h("div", { class: "load-fill" });
    const pct = h("span", { class: "load-pct" }, "0%");
    const screen = h("div", { class: "loading" },
      h("div", { class: "load-track" }, walker, h("div", { class: "load-bar" }, fill)),
      h("p", { class: "load-text" }, text, " ", pct));
    document.body.append(screen);
    const t0 = performance.now();
    const step = () => {
      const now = performance.now();
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 2);
      fill.style.width = eased * 100 + "%";
      walker.style.left = `calc(${eased * 100}% - ${eased * 76}px)`;
      pct.textContent = Math.round(eased * 100) + "%";
      if (p < 1) return;
      clearInterval(ticker);
      screen.classList.add("out");
      setTimeout(() => { screen.remove(); resolve(); }, 350);
    };
    // Zamanlayıcı kullanılır: sekme arka plandayken de yükleme ekranı takılmaz.
    const ticker = setInterval(step, 16);
  });
}

function clear() {
  if (cleanup) { try { cleanup(); } catch { /* yok say */ } cleanup = null; }
  put(app, );
}

function showLogin() {
  clear();
  renderLogin(app, async (u) => { user = u; await loading("Defterin hazırlanıyor…"); enter(); });
}

async function enter() {
  store.open(user.email);
  await store.pull();
  applyOutfit();
  syncOfficialDates();
  if (!store.state().profile) return showProfilePicker();
  if (store.state().profile === "kid") return showKids();
  if (!location.hash) location.hash = "#today";
  startReminder();
  showShell();
}

function showProfilePicker() {
  clear();
  const pick = (profile) => { pop(); store.state().profile = profile; store.save(); enter(); };
  const card = (profile, emoji, title, text) => tilt(h("button", { class: "pick-card " + profile, onclick: () => pick(profile) },
    h("span", { class: "pick-emoji" }, emoji), h("strong", {}, title), h("span", {}, text)), 14);
  app.append(h("section", { class: "picker" },
    trackEyes(teddy("wave small")),
    h("h1", {}, `Hoş geldin ${user.name}! Kim öğrenecek?`),
    h("div", { class: "pick-row" },
      card("adult", "🎓", "Ben", "Kartlar, sınav geri sayımı, çalışma programı ve Brensyt ile pratik"),
      card("kid", "🎈", "Çocuğum", "Animasyonlu dersler, sesli kelimeler ve oyunlar")),
    h("p", { class: "muted" }, "Bunu daha sonra üst menüden değiştirebilirsin.")));
}

function showKids() {
  clear();
  cleanup = renderKids(app, {
    user,
    exit: () => { store.state().profile = "adult"; store.save(); location.hash = "#today"; enter(); },
    logout: doLogout,
  });
}

async function doLogout() {
  await auth.logout();
  store.close();
  resetOutfit();
  user = null;
  location.hash = "";
  showLogin();
}

function showShell() {
  clear();
  const s = store.state();
  const main = h("main", { class: "main" });
  const langSelect = h("select", { class: "lang-select", "aria-label": "Öğrenilen dil", onchange: (e) => {
    s.lang = e.target.value; store.save(); route();
  } }, LANG_LIST.map((l) => h("option", { value: l.code, selected: l.code === s.lang }, `${l.flag} ${l.name}`)));
  const nav = h("nav", { class: "nav" }, ROUTES.map((r) =>
    h("a", { href: "#" + r.id, "data-route": r.id }, h("span", { class: "nav-icon" }, r.icon), r.label)));

  app.append(
    h("header", { class: "top" },
      h("a", { class: "brand", href: "#today" }, teddy("mini"), h("span", {}, "Brensyt")),
      nav,
      h("div", { class: "top-right" },
        langSelect,
        themeButton(),
        h("button", { class: "chip-btn", title: "Çocuk bölümüne geç", onclick: () => { s.profile = "kid"; store.save(); enter(); } }, "🎈 Çocuk"),
        h("button", { class: "chip-btn", onclick: doLogout }, "Çıkış"))),
    main,
    h("footer", { class: "foot" }, "Brensyt 🧸 kelimesi kelimesine değil, anlamıyla çevirir."));

  function route() {
    if (cleanup) { try { cleanup(); } catch { /* yok say */ } cleanup = null; }
    const id = location.hash.slice(1);
    const r = ROUTES.find((x) => x.id === id) || ROUTES[0];
    nav.querySelectorAll("a").forEach((a) => a.classList.toggle("on", a.dataset.route === r.id));
    put(main, );
    main.className = "main page-" + r.id;
    cleanup = r.render(main, { user, lang: LANGS[s.lang], go: (to) => (location.hash = "#" + to), refresh: route }) || null;
    window.scrollTo(0, 0);
  }
  window.onhashchange = () => { if (user && store.state()?.profile === "adult") route(); };
  route();
}

// Telefona kurulum ve internetsiz kullanım için servis çalışanı.
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

await loading();
user = await auth.restore();
if (user) enter(); else showLogin();
