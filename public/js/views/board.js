// Lider tablosu: bulut açıksa herkesin sıralaması (Supabase); değilse bu cihazdaki hesaplar.
import { h, put } from "../core/dom.js";
import { cloudEnabled, topProfiles } from "../core/cloud.js";

function list(rows, currentName) {
  return rows.length
    ? h("ol", {}, rows.map((r, i) => h("li", { class: r.name === currentName ? "me" : "" },
      h("i", {}, ["🥇", "🥈", "🥉"][i] || String(i + 1)), h("span", {}, r.name),
      h("small", {}, `🔥 ${r.streak}`), h("b", {}, `${r.words} kelime`))))
    : h("p", { class: "muted" }, "Henüz kimse yok. İlk kartlarını bitirince sıralamaya girersin.");
}

function localRows() {
  let users = {};
  try { users = JSON.parse(localStorage.getItem("brensyt:users")) || {}; } catch { /* boş */ }
  return Object.entries(users).map(([email, u]) => {
    let d = {};
    try { d = JSON.parse(localStorage.getItem("brensyt:data:" + email)) || {}; } catch { /* boş */ }
    const words = Object.values(d.learned || {}).reduce((n, l) => n + l.length, 0);
    return { name: u.name || "?", words, streak: d.bestStreak || 0 };
  }).sort((a, b) => b.words - a.words || b.streak - a.streak).slice(0, 10);
}

export function leaderboard(currentName) {
  const box = h("div", { class: "board" }, h("h2", {}, "Lider tablosu"));
  if (!cloudEnabled()) {
    box.append(h("p", { class: "muted tiny" }, "Bu cihazdaki hesaplar."), list(localRows(), currentName));
    return box;
  }
  box.append(h("p", { class: "muted tiny" }, "Tüm Brensyt kullanıcıları, öğrenilen kelime sayısına göre."), h("p", { class: "muted" }, "Yükleniyor…"));
  topProfiles().then((rows) => {
    const rest = box.querySelector("p.muted:not(.tiny)");
    const shown = rows ? list(rows.map((r) => ({ name: r.display_name, words: r.words, streak: r.best_streak })), currentName)
      : h("p", { class: "muted" }, "Sıralama şu an yüklenemedi.");
    rest ? rest.replaceWith(shown) : box.append(shown);
  });
  return box;
}
