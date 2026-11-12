// Günlük görevler ve çalışma hatırlatması.
import { h } from "./dom.js";
import { state, save, dayKey } from "./store.js";
import { ding } from "./audio.js";

const QUEST_BONUS = 20;

export function quests() {
  const s = state(), today = dayKey();
  const kinds = new Set(s.history.filter((e) => dayKey(new Date(e.date)) === today).map((e) => e.type));
  const has = (...types) => types.some((t) => kinds.has(t));
  const list = [
    { icon: "🃏", text: "Bugünün kartlarını bitir", go: "cards", done: s.lastDone === today },
    { icon: "⏱️", text: "Bir tekrar ya da sınav yap", go: "exam", done: has("review", "exam", "mock") },
    { icon: "🧸", text: "Kalıp avı, atölye ya da Brensyt ile sohbet", go: "idioms", done: has("idiom", "chat", "reading", "writing", "grammar", "listening", "speaking", "duel") },
  ];
  const all = list.every((q) => q.done);
  let justWon = false;
  if (all && s.questBonus !== today) {
    s.questBonus = today;
    s.xp += QUEST_BONUS;
    save();
    justWon = true;
  }
  return { list, all, justWon };
}

export function questBox(ctx) {
  const { list, all, justWon } = quests();
  if (justWon) ding();
  return h("div", { class: "quest-box" },
    h("h2", {}, "Günün görevleri"),
    h("ul", { class: "quests" }, list.map((q) => h("li", { class: q.done ? "done" : "" },
      h("i", {}, q.done ? "✓" : q.icon), h("span", {}, q.text),
      !q.done && h("button", { class: "chip-btn", onclick: () => ctx.go(q.go) }, "Git")))),
    h("p", { class: all ? "note good" : "muted tiny" }, all
      ? `Üçü de tamam! +${QUEST_BONUS} bal puanı kazandın.`
      : `Üçünü de bitirirsen +${QUEST_BONUS} bal puanı.`));
}

// Hatırlatma: seçilen saatte, o gün kartlar bitmediyse bildirim gösterir.
// Tarayıcı kuralı gereği yalnızca uygulama açıkken (ya da telefona kurulu ve arka planda çalışırken) çalışır.
export function reminderBox() {
  const s = state();
  s.reminder ??= { on: false, time: "19:00" };
  const supported = "Notification" in window;
  const note = h("p", { class: "muted tiny" });
  const status = () => {
    note.textContent = !supported ? "Bu tarayıcı bildirimleri desteklemiyor."
      : s.reminder.on ? `Her gün ${s.reminder.time}'de, kartların bitmediyse hatırlatacağım (uygulama açıkken).`
      : "Kapalı. Açarsan tarayıcı bildirim izni ister.";
  };
  const time = h("input", { type: "time", value: s.reminder.time, "aria-label": "Hatırlatma saati", onchange: (e) => {
    s.reminder.time = e.target.value || "19:00"; save(); status();
  } });
  const toggle = h("button", { class: "btn small", disabled: !supported, onclick: async () => {
    if (!s.reminder.on && Notification.permission !== "granted") {
      const answer = await Notification.requestPermission();
      if (answer !== "granted") { note.textContent = "Bildirim izni verilmedi; tarayıcı ayarlarından açabilirsin."; return; }
    }
    s.reminder.on = !s.reminder.on;
    save();
    toggle.textContent = s.reminder.on ? "Kapat" : "Aç";
    status();
  } }, s.reminder.on ? "Kapat" : "Aç");
  status();
  return h("div", { class: "quest-box" }, h("h2", {}, "Hatırlatma 🔔"),
    h("div", { class: "reminder-row" }, time, toggle), note);
}

let ticking = false;
export function startReminder() {
  if (ticking) return;
  ticking = true;
  const check = async () => {
    const s = state(), today = dayKey();
    if (!s?.reminder?.on || !("Notification" in window) || Notification.permission !== "granted") return;
    const now = new Date();
    const hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    if (hhmm < s.reminder.time || s.lastDone === today || s.remindedOn === today) return;
    s.remindedOn = today;
    save();
    const text = { body: "Bugünün kartları seni bekliyor. Serini bozma!", icon: "/icon.svg", tag: "brensyt-daily" };
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification("Brensyt 🧸", text); else new Notification("Brensyt 🧸", text);
  };
  setInterval(check, 60_000);
  setTimeout(check, 5000);
}
