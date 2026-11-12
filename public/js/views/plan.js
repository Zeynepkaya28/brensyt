// Çalışma programı: önce cihazda hazır bir haftalık plan, istenirse Brensyt kişiselleştirir.
import { put, h } from "../core/dom.js";
import { state, save, addHistory, dayKey, daysBetween } from "../core/store.js";
import { askBrensyt, AI_ERRORS } from "../core/ai.js";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const FOCUS = {
  YDS: ["Okuma parçası + kelime", "Dil bilgisi (bağlaçlar, zamanlar)", "Cümle tamamlama", "Çeviri soruları", "Paragraf + anlam bütünlüğü", "Deneme sınavı", "Yanlış analizi + tekrar"],
  YDT: ["Kelime + eş anlam", "Dil bilgisi", "Cloze test", "Diyalog + durum soruları", "Paragraf", "Deneme sınavı", "Yanlış analizi + tekrar"],
  IELTS: ["Listening bölümleri", "Reading (True/False/NG)", "Writing Task 1", "Speaking Part 2 pratiği", "Writing Task 2", "Tam deneme", "Geri bildirim + tekrar"],
  TOEFL: ["Reading parçaları", "Listening dersleri", "Speaking (independent)", "Integrated writing", "Speaking (integrated)", "Tam deneme", "Geri bildirim + tekrar"],
  Genel: ["Kelime + dinleme", "Dil bilgisi", "Okuma", "Brensyt ile konuşma", "Yazma", "Dizi/podcast + not alma", "Haftalık tekrar"],
};

function localPlan({ exam, minutes, quota }) {
  const focus = FOCUS[exam] || FOCUS.Genel;
  const cardMin = Math.min(Math.round(minutes * 0.25), 20);
  const talkMin = Math.max(10, Math.round(minutes * 0.2));
  return DAYS.map((day, i) => ({
    day,
    tasks: [
      `Kart köşesi: ${quota} yeni kelime (${cardMin} dk)`,
      `${focus[i]} (${Math.max(10, minutes - cardMin - (i % 2 ? talkMin : 0))} dk)`,
      i % 2 ? `Brensyt ile konu egzersizi (${talkMin} dk)` : null,
      i === 5 ? "Uygulamadaki süreli sınav" : null,
      i === 6 ? "Tekrar köşesi: haftanın kelimeleri" : null,
    ].filter(Boolean),
  }));
}

export function renderPlan(root, ctx) {
  const s = state(), lang = ctx.lang;
  const examNames = [...new Set(["Genel", ...s.exams.map((e) => e.name)])];
  const saved = s.plan || { exam: "Genel", minutes: 45 };

  const exam = h("select", {}, examNames.map((n) => h("option", { value: n, selected: n === saved.exam }, n)));
  const minutes = h("select", {}, [20, 30, 45, 60, 90, 120].map((m) => h("option", { value: m, selected: m === saved.minutes }, m + " dakika")));
  const out = h("div", { class: "plan-out" });
  const aiOut = h("div", { class: "plan-ai" });

  function draw() {
    const cfg = { exam: exam.value, minutes: Number(minutes.value), quota: s.quota };
    s.plan = { exam: cfg.exam, minutes: cfg.minutes };
    save();
    const target = s.exams.find((e) => e.name === cfg.exam && e.date);
    const left = target ? daysBetween(dayKey(), target.date) : null;
    put(out, 
      left !== null && left >= 0 && h("p", { class: "lead" }, `${cfg.exam} sınavına ${left} gün var: yaklaşık ${Math.max(1, Math.floor(left / 7))} hafta bu düzeni tekrarlayacağız.`),
      h("div", { class: "plan-grid" }, localPlan(cfg).map((d, i) => h("article", { class: "plan-day" + (i === (new Date().getDay() + 6) % 7 ? " now" : "") },
        h("h3", {}, d.day), h("ul", {}, d.tasks.map((t) => h("li", {}, t)))))));
  }

  const aiBtn = h("button", { class: "btn ghost", type: "button", onclick: async () => {
    aiBtn.disabled = true;
    aiOut.className = "plan-ai show";
    aiOut.textContent = "Brensyt düşünüyor…";
    const target = s.exams.find((e) => e.name === exam.value && e.date);
    const ask = `Bana bir çalışma programı hazırla. Dil: ${lang.name}. Hedef: ${exam.value}${target ? `, sınav tarihi ${target.date}` : ""}. Bugün ${dayKey()}. Günde ${minutes.value} dakikam var. Uygulamada günde ${s.quota} yeni kelime kartı çalışıyorum.`;
    try {
      await askBrensyt({ lang: lang.code, level: s.level, mode: "plan", search: false, messages: [{ role: "user", content: ask }] },
        (t) => (aiOut.textContent = t));
      addHistory({ type: "plan", lang: lang.code, level: s.level, topic: exam.value + " programı" });
    } catch (err) { aiOut.textContent = AI_ERRORS[err.message] || AI_ERRORS.failed; }
    aiBtn.disabled = false;
  } }, "🧸 Brensyt kişiselleştirsin");

  exam.onchange = draw;
  minutes.onchange = draw;
  root.append(h("h1", {}, "Çalışma programı"),
    h("div", { class: "plan-form" },
      h("label", { class: "field" }, h("span", {}, "Hedef"), exam),
      h("label", { class: "field" }, h("span", {}, "Günlük süre"), minutes),
      aiBtn),
    out, aiOut);
  draw();
}
