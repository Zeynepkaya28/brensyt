// "Bugün" sayfası: seri, günlük hedef, sınav geri sayımları ve günün kalıbı.
import { put, h, tilt } from "../core/dom.js";
import { teddy, trackEyes } from "../core/teddy.js";
import { state, save, dayKey, daysBetween } from "../core/store.js";
import { todaySet, currentStreak, learnedSet, dueWords, MAX_QUOTA } from "../core/daily.js";
import { pop, ding } from "../core/audio.js";
import { askDates, AI_ERRORS } from "../core/ai.js";
import { questBox, reminderBox } from "../core/quests.js";

const DAY_NAMES = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function weekDots(s) {
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const done = s.doneDays.includes(dayKey(d));
    dots.push(h("div", { class: "day-dot" + (done ? " done" : "") + (i === 0 ? " now" : "") },
      h("i", {}, done ? "✓" : ""), h("span", {}, DAY_NAMES[d.getDay()])));
  }
  return h("div", { class: "week" }, dots);
}

function countdown(exam, rerender) {
  const s = state(), today = dayKey();
  const left = exam.date ? daysBetween(today, exam.date) : null;
  const total = exam.date ? Math.max(1, daysBetween(exam.start, exam.date)) : 1;
  const pct = exam.date ? Math.min(100, Math.max(0, (daysBetween(exam.start, today) / total) * 100)) : 0;
  const dateInput = h("input", { type: "date", value: exam.date, min: today, "aria-label": exam.name + " sınav tarihi", onchange: (e) => {
    exam.date = e.target.value; exam.guess = false; exam.source = ""; exam.note = ""; exam.official = false; exam.start = today; save(); rerender();
  } });
  const custom = !["yds", "ydt", "ielts", "toefl"].includes(exam.id);
  return h("article", { class: "count-card" + (left !== null && left <= 30 && left >= 0 ? " soon" : "") },
    h("header", {},
      h("strong", {}, exam.name),
      exam.guess && h("span", { class: "tag", title: "Resmi takvimden kontrol edip düzenle" }, "tahmini tarih"),
      exam.source && h("a", { class: "tag live", href: exam.source, target: "_blank", rel: "noopener noreferrer", title: `Kaynağı aç · ${exam.checked || ""} tarihinde kontrol edildi` }, exam.official ? "ÖSYM takvimi ✓" : "canlı ✓"),
      custom && h("button", { class: "x", title: "Sil", onclick: () => { s.exams = s.exams.filter((e) => e !== exam); save(); rerender(); } }, "×")),
    left === null
      ? h("p", { class: "count-empty" }, "Sınav tarihini seç, geri sayım başlasın.")
      : h("p", { class: "count-num" }, left < 0 ? "Geçti" : left === 0 ? "Bugün!" : String(left), left > 0 && h("small", {}, " gün kaldı")),
    h("div", { class: "bar", role: "progressbar", "aria-valuenow": Math.round(pct), "aria-valuemin": 0, "aria-valuemax": 100 },
      h("i", { style: { width: pct + "%" } }), h("span", { class: "bar-bear", style: { left: pct + "%" } }, "🧸")),
    exam.note && h("p", { class: "muted tiny count-note" }, exam.note),
    dateInput);
}

export function renderToday(root, ctx) {
  const s = state(), lang = ctx.lang;
  const set = todaySet(lang.code);
  const streak = currentStreak();
  const learned = learnedSet(lang.code).length;
  const toNext = 7 - (streak % 7);
  const due = dueWords(lang.code).length;
  const idiom = lang.idioms[new Date().getDate() % lang.idioms.length];

  const hero = h("section", { class: "hero" },
    trackEyes(teddy("wave")),
    h("div", {},
      h("h1", {}, `Merhaba ${ctx.user.name}!`),
      h("p", { class: "lead" }, set.done
        ? `Bugünün ${lang.name} kartlarını bitirdin. Tekrar yaparak pekiştirebilirsin.`
        : set.words.length
          ? `Bugün seni ${set.words.length} yeni ${lang.name} kelime bekliyor.`
          : `${lang.name} destesindeki bütün kelimeleri öğrendin. Tekrar ve sınavla taze tut.`),
      h("div", { class: "hero-actions" },
        h("button", { class: "btn", onclick: () => ctx.go("cards") }, set.done || !set.words.length ? "Tekrar yap" : "Kartlara başla"),
        h("button", { class: "btn ghost", onclick: () => ctx.go("brensyt") }, "Brensyt ile konuş")),
      due ? h("p", { class: "due-note" }, "🔁 Bugün tekrar zamanı gelen ", h("b", {}, String(due)), " kelime var.") : null));

  const stats = h("section", { class: "stats" },
    h("div", { class: "stat flame" }, h("b", {}, String(streak)), h("span", {}, "günlük seri"), weekDots(s)),
    h("div", { class: "stat" }, h("b", {}, String(s.quota)), h("span", {}, "kelime / gün"),
      h("p", { class: "muted tiny" }, s.quota >= MAX_QUOTA ? "En üst seviyedesin!" : `${toNext} gün daha seri yaparsan ${s.quota + 1} olur`),
      h("div", { class: "bar thin" }, h("i", { style: { width: ((streak % 7) / 7) * 100 + "%" } }))),
    h("div", { class: "stat" }, h("b", {}, String(learned)), h("span", {}, `${lang.name} kelime öğrenildi`), h("p", { class: "muted tiny" }, `destede ${lang.words.length} kelime`)),
    h("div", { class: "stat" }, h("b", {}, String(s.xp)), h("span", {}, "bal puanı 🍯")));

  // Günün kalıbı: dokununca 3B döner; ön yüz kelimesi kelimesine, arka yüz doğal çeviri.
  const flip = h("button", { class: "flip idiom", "aria-label": "Günün kalıbı kartını çevir", onclick: () => { pop(); flip.classList.toggle("flipped"); } },
    h("div", { class: "flip-inner" },
      h("div", { class: "face front" }, h("small", {}, "Günün kalıbı"), h("strong", {}, idiom.p),
        h("p", { class: "strike" }, "Kelimesi kelimesine: ", idiom.lit), h("em", {}, "Doğrusunu görmek için çevir ↻")),
      h("div", { class: "face back" }, h("small", {}, "Doğal karşılığı"), h("strong", {}, idiom.nat),
        h("p", {}, "Brensyt böyle çevirir: anlamı taşır, kelimeleri değil."))));

  const counts = h("div", { class: "count-grid" });
  const drawCounts = () => put(counts, ...s.exams.map((e) => countdown(e, drawCounts)));
  drawCounts();
  // Tarihleri resmi sitelerden canlı çeker (Brensyt'in yapay zekâsı ve web araması ile).
  const liveNote = h("span", { class: "muted tiny" }, s.datesChecked ? `Son kontrol: ${s.datesChecked}` : "Tarihler resmi sitelerden aranır.");
  const liveBtn = h("button", { class: "btn ghost small", onclick: async () => {
    liveBtn.disabled = true;
    liveNote.className = "muted tiny";
    liveNote.textContent = "Brensyt resmi sitelere bakıyor… (bir dakika sürebilir)";
    try {
      const { exams, checked } = await askDates(s.exams.map((e) => e.name));
      let found = 0;
      for (const live of exams) {
        const exam = s.exams.find((e) => e.name === live.name);
        if (!exam || !live.date) continue;
        Object.assign(exam, { date: live.date, guess: false, official: false, source: live.source, note: live.note, checked, start: exam.start > live.date ? dayKey() : exam.start });
        found++;
      }
      s.datesChecked = checked;
      save();
      drawCounts();
      ding();
      liveNote.textContent = found ? `${found} sınavın tarihi güncellendi. Kaynağı görmek için “canlı ✓” etiketine dokun.` : "Doğrulanabilen yeni bir tarih bulunamadı; tarihleri elle girebilirsin.";
    } catch (err) {
      liveNote.className = "note bad";
      liveNote.textContent = AI_ERRORS[err.message] || AI_ERRORS.failed;
    }
    liveBtn.disabled = false;
  } }, "🔄 Tarihleri canlı güncelle");
  const newName = h("input", { type: "text", placeholder: "Sınav adı (ör. YÖKDİL)", maxLength: 24 });
  const newDate = h("input", { type: "date", min: dayKey() });
  const addForm = h("form", { class: "add-exam", onsubmit: (e) => {
    e.preventDefault();
    if (!newName.value.trim() || !newDate.value) return;
    s.exams.push({ id: "x" + Date.now(), name: newName.value.trim(), date: newDate.value, start: dayKey() });
    save(); newName.value = ""; newDate.value = ""; drawCounts();
  } }, newName, newDate, h("button", { class: "btn small" }, "Ekle"));

  root.append(hero, stats, h("section", { class: "two-col quests-row" }, questBox(ctx), reminderBox()),
    h("section", { class: "two-col" },
      h("div", {}, h("h2", {}, "Sınav geri sayımı"), h("div", { class: "row-left" }, liveBtn, liveNote), counts, addForm),
      h("div", {}, h("h2", {}, "Tavuk çevirisine son"), tilt(h("div", { class: "flip-wrap" }, flip), 8))));
}
