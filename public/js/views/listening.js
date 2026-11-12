// Dinleme çalışması: dikte (duyduğunu yaz) ve diyalog (dinle, soruları cevapla).
import { put, h, shuffle } from "../core/dom.js";
import { teddy } from "../core/teddy.js";
import { state, save, addHistory } from "../core/store.js";
import { deckWords, normalize } from "../core/daily.js";
import { askJson, AI_ERRORS } from "../core/ai.js";
import { ding, growl, fanfare } from "../core/audio.js";

// Yapay zekâ anahtarı olmadan da denenebilsin diye hazır bir İngilizce diyalog.
const SAMPLE = {
  en: {
    title: "At the café",
    lines: [
      { speaker: "A", text: "Good morning! What would you like?" },
      { speaker: "B", text: "Good morning. A cup of tea and a cheese sandwich, please." },
      { speaker: "A", text: "Would you like milk in your tea?" },
      { speaker: "B", text: "No, thank you. Just a little sugar." },
      { speaker: "A", text: "That is four pounds fifty, please." },
      { speaker: "B", text: "Here you are. Thank you very much." },
    ],
    questions: [
      { topic: "Dinleme", q: "What does the customer order to drink?", options: ["Coffee", "Tea", "Milk", "Water"], answer: 1, why: "“A cup of tea” diyor." },
      { topic: "Dinleme", q: "What does the customer want in the tea?", options: ["Milk", "Lemon", "A little sugar", "Nothing"], answer: 2, why: "Süt istemiyor, “just a little sugar” diyor." },
      { topic: "Dinleme", q: "How much does it cost?", options: ["£4.15", "£5.40", "£14.50", "£4.50"], answer: 3, why: "“Four pounds fifty”." },
    ],
  },
};

// Satırları sırayla okur; iki konuşmacı farklı ses tonuyla ayrılır.
function readAloud(lines, langCode, onEnd) {
  speechSynthesis.cancel();
  lines.forEach((line, i) => {
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = langCode;
    u.rate = 0.9;
    u.pitch = line.speaker === "B" ? 0.75 : 1.25;
    if (i === lines.length - 1) u.onend = onEnd;
    speechSynthesis.speak(u);
  });
}

function dictation(out, lang) {
  const pool = shuffle(deckWords(lang.code).filter((w) => w.ex)).slice(0, 5);
  if (!pool.length) return put(out, h("p", { class: "muted" }, "Bu dilde henüz örnek cümle yok."));
  let i = 0, points = 0;
  const next = () => {
    if (i >= pool.length) {
      const s = state();
      s.xp += points * 4;
      save();
      addHistory({ type: "listening", lang: lang.code, topic: "Dikte", correct: points, total: pool.length });
      if (points === pool.length) fanfare();
      return put(out, h("div", { class: "done-box" }, teddy(points >= 4 ? "jump" : ""), h("h2", {}, "Dikte bitti"),
        h("p", { class: "score" }, `${points} / ${pool.length}`), h("button", { class: "btn", onclick: () => dictation(out, lang) }, "Yeni dikte")));
    }
    const w = pool[i];
    const say = (rate) => { const u = new SpeechSynthesisUtterance(w.ex); u.lang = lang.speech; u.rate = rate; speechSynthesis.cancel(); speechSynthesis.speak(u); };
    const input = h("input", { type: "text", class: "answer", placeholder: "Duyduğun cümleyi yaz", autocomplete: "off", spellcheck: false, maxLength: 200 });
    const result = h("div", { class: "dict-result" });
    let checked = false;
    const form = h("form", { class: "answer-form wide", onsubmit: (e) => {
      e.preventDefault();
      if (checked) { i++; return next(); }
      if (!input.value.trim()) return;
      checked = true;
      const target = w.ex.split(/\s+/), typed = new Set(normalize(input.value).split(" "));
      const ok = normalize(input.value) === normalize(w.ex);
      if (ok) { points++; ding(); } else growl();
      put(result, h("p", { class: ok ? "note good" : "note bad" }, ok ? "Tam isabet!" : "Doğrusu:"),
        h("p", { class: "dict-line" }, target.map((t) => h("span", { class: typed.has(normalize(t)) ? "hit" : "miss" }, t + " "))),
        h("p", { class: "muted" }, w.exTr));
      form.querySelector("button").textContent = "Devam →";
    } }, input, h("button", { class: "btn" }, "Kontrol et"));
    put(out, h("p", { class: "phase" }, `Dikte ${i + 1}/${pool.length}`),
      h("div", { class: "row-center" },
        h("button", { class: "round listen-btn", title: "Dinle", onclick: () => say(0.9) }, "🔊"),
        h("button", { class: "round big", title: "Yavaş dinle", onclick: () => say(0.55) }, "🐢")),
      form, result);
    say(0.9);
    input.focus();
  };
  next();
}

function dialogue(out, lang, d) {
  let answered = 0, correct = 0;
  const script = h("details", { class: "script" }, h("summary", {}, "Metni göster (önce dinlemeyi dene)"),
    d.lines.map((l) => h("p", {}, h("b", {}, l.speaker + ": "), l.text)));
  const playBtn = h("button", { class: "round listen-btn", title: "Dinle", onclick: () => {
    playBtn.classList.add("listening");
    readAloud(d.lines, lang.speech, () => playBtn.classList.remove("listening"));
  } }, "▶");
  put(out, h("h2", {}, d.title), h("div", { class: "row-center" }, playBtn,
    h("button", { class: "btn ghost small", onclick: () => { speechSynthesis.cancel(); playBtn.classList.remove("listening"); } }, "Durdur")),
    h("p", { class: "muted" }, "Diyaloğu dinle, sonra soruları cevapla. İstediğin kadar tekrar dinleyebilirsin."),
    d.questions.map((q) => {
      let locked = false;
      const why = h("p", { class: "muted" });
      return h("div", { class: "mini-q" }, h("p", { class: "mini-q-text" }, q.q),
        h("div", { class: "options" }, q.options.map((opt, n) => h("button", { class: "option", onclick: (e) => {
          if (locked) return;
          locked = true;
          const ok = n === q.answer;
          e.currentTarget.classList.add(ok ? "right" : "wrong");
          if (!ok) e.currentTarget.parentElement.children[q.answer].classList.add("right");
          ok ? ding() : growl();
          why.textContent = q.why;
          answered++;
          if (ok) correct++;
          if (answered === d.questions.length) {
            state().xp += correct * 5;
            save();
            addHistory({ type: "listening", lang: lang.code, topic: d.title, correct, total: d.questions.length });
          }
        } }, opt))), why);
    }), script);
}

export function listening(box, lang) {
  if (!lang.speech || !("speechSynthesis" in window)) {
    return put(box, h("p", { class: "note bad" }, `${lang.name} için bu cihazda seslendirme yok; dinleme çalışması yapılamıyor.`));
  }
  const s = state();
  const out = h("div", { class: "listen-zone" });
  const aiBtn = h("button", { class: "btn", onclick: async () => {
    aiBtn.disabled = true;
    put(out, h("div", { class: "done-box" }, teddy("walk"), h("h2", {}, "Brensyt bir diyalog yazıyor…")));
    try { dialogue(out, lang, await askJson("listening", { lang: lang.code, level: s.level })); }
    catch (err) { put(out, h("p", { class: "note bad" }, AI_ERRORS[err.message] || AI_ERRORS.failed)); }
    aiBtn.disabled = false;
  } }, "🧸 Yeni diyalog");
  put(box, h("div", { class: "row-left" },
    h("button", { class: "btn", onclick: () => dictation(out, lang) }, "✍️ Dikte"), aiBtn,
    SAMPLE[lang.code] && h("button", { class: "btn ghost", onclick: () => dialogue(out, lang, SAMPLE[lang.code]) }, "Hazır örnek diyalog")), out);
  put(out, h("p", { class: "muted" }, "Dikte: cümleyi dinle ve yaz. Diyalog: iki kişinin konuşmasını dinle, soruları cevapla."));
}
