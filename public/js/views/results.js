// Gerçek sınav sonuçları: kullanıcı IELTS, TOEFL, YDS vb. puanlarını girer, hedefini belirler, gelişimini görür.
import { put, h } from "../core/dom.js";
import { state, save, dayKey } from "../core/store.js";
import { ding } from "../core/audio.js";

// Her sınavın bölümleri ve puan aralığı.
const EXAMS = {
  IELTS: { parts: ["Listening", "Reading", "Writing", "Speaking"], min: 0, max: 9, step: 0.5,
    total: (p) => { const avg = p.reduce((a, b) => a + b, 0) / 4; return Math.round(avg * 2 + 1e-9) / 2; } },
  TOEFL: { parts: ["Reading", "Listening", "Speaking", "Writing"], min: 0, max: 30, step: 1, total: (p) => p.reduce((a, b) => a + b, 0), totalMax: 120 },
  YDS: { parts: [], min: 0, max: 100, step: 0.25 },
  YDT: { parts: [], min: 0, max: 100, step: 0.25 },
  "YÖKDİL": { parts: [], min: 0, max: 100, step: 0.25 },
  "Diğer": { parts: [], min: 0, max: 1000, step: 0.5 },
};
const fmt = (n) => String(Math.round(n * 100) / 100).replace(".", ",");

export function resultsBox() {
  const s = state();
  s.results ??= [];
  s.targets ??= {};
  const box = h("section", { class: "results" });

  function draw(selected = "IELTS", message = "") {
    const def = EXAMS[selected];
    const exam = h("select", { "aria-label": "Sınav", onchange: (e) => draw(e.target.value) },
      Object.keys(EXAMS).map((name) => h("option", { value: name, selected: name === selected }, name)));
    const date = h("input", { type: "date", value: dayKey(), max: dayKey(), "aria-label": "Sınav tarihi" });
    const num = (label) => h("label", { class: "field" }, h("span", {}, label),
      h("input", { type: "number", min: def.min, max: def.max, step: def.step, inputMode: "decimal", required: true }));
    const partInputs = def.parts.map(num);
    const totalInput = def.parts.length ? null : num("Puan");
    const label = selected === "Diğer" ? h("label", { class: "field" }, h("span", {}, "Sınav adı"), h("input", { type: "text", maxLength: 24, placeholder: "ör. PTE, DELF B2" })) : null;
    const target = h("input", { type: "number", min: def.min, max: def.totalMax || def.max, step: def.step, value: s.targets[selected] ?? "", placeholder: "Hedef", "aria-label": "Hedef puan",
      onchange: (e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) s.targets[selected] = v; else delete s.targets[selected]; save(); draw(selected); } });

    const form = h("form", { class: "result-form", onsubmit: (e) => {
      e.preventDefault();
      const read = (field) => parseFloat(field.querySelector("input").value.replace(",", "."));
      const parts = partInputs.map(read);
      const total = def.parts.length ? def.total(parts) : read(totalInput);
      const bad = [...parts, total].some((v) => !Number.isFinite(v) || v < def.min || v > (def.totalMax || def.max)) || parts.some((v) => v > def.max);
      if (bad || !date.value) return draw(selected, `Puanlar ${def.min}–${def.max} arasında olmalı ve tarih seçilmeli.`);
      const name = label ? (label.querySelector("input").value.trim() || "Diğer") : selected;
      s.results.push({ id: Date.now(), exam: selected, name, date: date.value, total, parts: Object.fromEntries(def.parts.map((p, i) => [p, parts[i]])) });
      s.results.sort((a, b) => b.date.localeCompare(a.date));
      save();
      ding();
      draw(selected);
    } },
      h("label", { class: "field" }, h("span", {}, "Sınav"), exam),
      h("label", { class: "field" }, h("span", {}, "Tarih"), date),
      label, partInputs, totalInput,
      h("button", { class: "btn small" }, "Sonucu kaydet"));

    const mine = s.results.filter((r) => r.exam === selected);
    const goal = s.targets[selected];
    const best = mine.length ? Math.max(...mine.map((r) => r.total)) : null;
    const maxScore = def.totalMax || def.max;
    const timeline = [...mine].reverse().slice(-8);

    put(box,
      h("h2", {}, "Sınav sonuçlarım"),
      h("p", { class: "muted" }, "Girdiğin gerçek sınav puanları burada birikir. IELTS'te genel bant, TOEFL'da toplam puan bölümlerden hesaplanır."),
      form,
      message && h("p", { class: "note bad" }, message),
      h("div", { class: "result-goal" }, h("span", {}, `${selected} hedefim:`), target,
        goal != null && best != null && h("b", { class: best >= goal ? "note good" : "" }, best >= goal ? "Hedefe ulaştın! 🎉" : `En iyi puanın ${fmt(best)}; hedefe ${fmt(goal - best)} puan kaldı.`)),
      timeline.length > 0 && h("div", { class: "cols result-cols" }, timeline.map((r) => h("div", { class: "col" },
        h("b", {}, fmt(r.total)), h("i", { style: { height: Math.max(4, (r.total / maxScore) * 100) + "%" } }), h("span", {}, r.date.slice(2).split("-").reverse().join("."))))),
      s.results.length
        ? h("ul", { class: "result-list" }, s.results.map((r) => h("li", {},
          h("strong", {}, r.name || r.exam), h("time", {}, r.date.split("-").reverse().join(".")),
          h("span", {}, Object.entries(r.parts || {}).map(([k, v]) => `${k[0]} ${fmt(v)}`).join(" · ")),
          h("b", {}, fmt(r.total)),
          h("button", { class: "x", title: "Sil", onclick: () => { s.results = s.results.filter((x) => x.id !== r.id); save(); draw(selected); } }, "×"))))
        : h("p", { class: "muted" }, "Henüz sonuç girmedin."));
  }
  draw();
  return box;
}
