// İlerleme grafikleri: haftalık öğrenilen kelime, sınav puanları, konu bazında deneme başarısı.
import { h } from "../core/dom.js";
import { state, dayKey, daysBetween } from "../core/store.js";

function weekly(s) {
  const today = dayKey(), weeks = Array(8).fill(0);
  for (const list of Object.values(s.learned)) {
    for (const x of list) {
      const w = Math.floor(daysBetween(x.d, today) / 7);
      if (w >= 0 && w < 8) weeks[7 - w]++;
    }
  }
  return weeks;
}

function columns(values, labels, suffix = "") {
  const max = Math.max(1, ...values);
  return h("div", { class: "cols" }, values.map((v, i) => h("div", { class: "col" },
    h("b", {}, v ? v + suffix : ""), h("i", { style: { height: Math.max(3, (v / max) * 100) + "%" } }), h("span", {}, labels[i]))));
}

export function charts() {
  const s = state();
  const weeks = weekly(s);
  const exams = s.history.filter((e) => e.type === "exam" || e.type === "mock").slice(0, 10).reverse();
  const topics = {};
  for (const e of s.history) {
    if (e.type !== "mock" || !e.topics) continue;
    for (const [name, [c, t]] of Object.entries(e.topics)) {
      topics[name] ??= [0, 0];
      topics[name][0] += c;
      topics[name][1] += t;
    }
  }
  const ranked = Object.entries(topics).map(([name, [c, t]]) => ({ name, pct: Math.round((c / t) * 100), t })).sort((a, b) => b.pct - a.pct);

  return h("section", { class: "charts" },
    h("div", { class: "chart" }, h("h3", {}, "Haftalık öğrenilen kelime"),
      columns(weeks, weeks.map((_, i) => (i === 7 ? "bu hafta" : `-${7 - i}`)))),
    h("div", { class: "chart" }, h("h3", {}, "Son sınav puanları"),
      exams.length ? columns(exams.map((e) => e.score), exams.map((e) => (e.type === "mock" ? e.exam : "kelime")), "%")
        : h("p", { class: "muted" }, "Henüz sınav yok.")),
    h("div", { class: "chart" }, h("h3", {}, "Konu bazında deneme başarısı"),
      ranked.length ? h("div", { class: "topic-bars" }, ranked.map((r) => h("div", { class: "topic-bar" },
        h("span", {}, r.name), h("div", { class: "bar" }, h("i", { style: { width: r.pct + "%" } })), h("b", {}, `%${r.pct}`))))
        : h("p", { class: "muted" }, "Deneme sınavı çözünce en güçlü ve en zayıf konuların burada görünür.")));
}
