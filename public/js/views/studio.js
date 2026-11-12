// Atölye: dil bilgisi kartları, okuma parçaları ve yazma pratiği.
import { put, h, speak } from "../core/dom.js";
import { teddy } from "../core/teddy.js";
import { state, save, addHistory } from "../core/store.js";
import { deckWords, addCustomWord, normalize } from "../core/daily.js";
import { askBrensyt, askJson, AI_ERRORS } from "../core/ai.js";
import { GRAMMAR } from "../langs/grammar.js";
import { ding, growl, pop } from "../core/audio.js";
import { listening } from "./listening.js";
import { speaking } from "./speaking.js";

// Yapay zekâ anahtarı olmadan da denenebilsin diye hazır bir İngilizce parça.
const SAMPLE = {
  en: {
    title: "A Small Habit",
    text: "Every morning, Elif walks to the bakery near her house. She buys fresh bread and says hello to the baker. The walk takes only ten minutes, but it changes her whole day.\n\nLast year she felt tired all the time. Her doctor did not give her medicine. Instead, he told her to go outside every morning. Although it was difficult at first, she did not give up. Now she sleeps better and has more energy.",
    glossary: [
      { w: "bakery", m: "fırın" }, { w: "fresh", m: "taze" }, { w: "whole", m: "bütün" }, { w: "tired", m: "yorgun" },
      { w: "medicine", m: "ilaç" }, { w: "Instead", m: "onun yerine" }, { w: "give up", m: "pes etmek" }, { w: "energy", m: "enerji" },
    ],
    questions: [
      { topic: "Okuma", q: "Where does Elif go every morning?", options: ["To the doctor", "To the bakery", "To school", "To the park"], answer: 1, why: "İlk cümlede fırına yürüdüğü söyleniyor." },
      { topic: "Okuma", q: "What did the doctor tell her to do?", options: ["Take medicine", "Sleep more", "Go outside every morning", "Eat less bread"], answer: 2, why: "Doktor ilaç vermek yerine her sabah dışarı çıkmasını söylüyor." },
      { topic: "Okuma", q: "How does she feel now?", options: ["More tired", "Angry", "The same as before", "More energetic"], answer: 3, why: "Son cümle: daha iyi uyuyor ve daha enerjik." },
    ],
  },
};

function mcq(q, onAnswer) {
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
      why.textContent = q.why || "";
      onAnswer(ok);
    } }, opt))), why);
}

function grammar(box, lang) {
  const topics = GRAMMAR[lang.code] || [];
  put(box, ...topics.map((t) => {
    let answered = 0, correct = 0;
    return h("details", { class: "grammar-card" },
      h("summary", {}, h("span", { class: "g-icon" }, "📐"), t.title),
      h("p", {}, t.text),
      h("ul", { class: "g-examples" }, t.examples.map(([a, b]) => h("li", {},
        h("b", {}, a), lang.speech && h("button", { class: "round tiny-btn", title: "Dinle", onclick: () => speak(a, lang.speech) }, "🔊"), h("span", {}, b)))),
      h("h3", {}, "Mini alıştırma"),
      t.quiz.map((q) => mcq({ q: q.q, options: q.options, answer: q.a }, (ok) => {
        answered++;
        if (ok) correct++;
        if (answered === t.quiz.length) {
          state().xp += correct * 4;
          save();
          addHistory({ type: "grammar", lang: lang.code, topic: t.title, correct, total: t.quiz.length });
        }
      })));
  }));
}

function reading(box, lang) {
  const s = state();
  const out = h("div", {});

  function show(p) {
    const deck = new Map(deckWords(lang.code).map((x) => [normalize(x.w), x.m.join(", ")]));
    const gloss = new Map(p.glossary.map((g) => [normalize(g.w), g.m]));
    const tip = h("div", { class: "word-tip", hidden: true });
    const lookup = (raw, el) => {
      const key = normalize(raw);
      const meaning = gloss.get(key) || deck.get(key);
      pop();
      tip.hidden = false;
      const inDeck = deck.has(key);
      put(tip, h("b", {}, raw.replace(/[.,!?;:"“”()。，！？]/g, "")), " — ", meaning || "Bu kelime sözlükçede yok; Brensyt'e sorabilirsin.",
        meaning && !inDeck && h("button", { class: "chip-btn", onclick: (e) => {
          addCustomWord(lang.code, raw.replace(/[.,!?;:"“”()。，！？]/g, "").toLowerCase(), meaning);
          e.currentTarget.replaceWith(h("span", { class: "note good" }, " Destene eklendi ✓"));
        } }, "+ Desteme ekle"),
        inDeck && h("span", { class: "muted tiny" }, " (destende var)"));
      el.after(tip);
    };
    let answered = 0, correct = 0;
    put(out, h("article", { class: "passage" },
      h("h2", {}, p.title, " ", lang.speech && h("button", { class: "round", title: "Sesli dinle", onclick: () => speak(p.text, lang.speech) }, "🔊")),
      p.text.split(/\n+/).map((para) => h("p", {}, para.split(/(\s+)/).map((tok) => /\s+/.test(tok) || !tok ? tok
        : h("span", { class: "tok" + (gloss.has(normalize(tok)) ? " key" : ""), onclick: (e) => lookup(tok, e.currentTarget) }, tok)))),
      h("p", { class: "muted tiny" }, "Bir kelimeye dokun: anlamını gör, istersen kart destene ekle. Altı çizili kelimeler sözlükçede var.")),
      h("div", { class: "glossary" }, p.glossary.map((g) => h("span", {}, h("b", {}, g.w), " " + g.m))),
      h("h2", { class: "section-title" }, "Anlama soruları"),
      p.questions.map((q) => mcq(q, (ok) => {
        answered++;
        if (ok) correct++;
        if (answered === p.questions.length) {
          s.xp += correct * 5;
          save();
          addHistory({ type: "reading", lang: lang.code, topic: p.title, correct, total: p.questions.length });
        }
      })));
  }

  const ask = h("button", { class: "btn", onclick: async () => {
    ask.disabled = true;
    put(out, h("div", { class: "done-box" }, teddy("walk"), h("h2", {}, "Brensyt bir parça yazıyor…")));
    try { show(await askJson("reading", { lang: lang.code, level: s.level })); }
    catch (err) { put(out, h("p", { class: "note bad" }, AI_ERRORS[err.message] || AI_ERRORS.failed)); }
    ask.disabled = false;
  } }, "🧸 Seviyeme göre yeni parça");
  put(box, h("div", { class: "row-left" }, ask,
    SAMPLE[lang.code] && h("button", { class: "btn ghost", onclick: () => show(SAMPLE[lang.code]) }, "Hazır örnek parça")), out);
  if (SAMPLE[lang.code]) show(SAMPLE[lang.code]);
}

const TASKS = [
  ["Serbest yazı", "Bugün ne yaptığını ya da sevdiğin bir şeyi anlat."],
  ["IELTS Writing Task 2", "Some people think children should start learning a foreign language at primary school. Do you agree or disagree?"],
  ["TOEFL Independent Writing", "Do you prefer studying alone or with a group? Use reasons and examples."],
  ["E-posta / dilekçe", "Bir kursa kayıt olmak için kısa ve resmi bir e-posta yaz."],
];

function writing(box, lang) {
  const s = state();
  const task = h("select", {}, TASKS.map(([name], i) => h("option", { value: i }, name)));
  const hint = h("p", { class: "muted" }, TASKS[0][1]);
  const text = h("textarea", { rows: 8, maxLength: 3000, placeholder: `${lang.name} yazmaya başla…` });
  const count = h("span", { class: "muted tiny" }, "0 kelime");
  const out = h("div", { class: "plan-ai" });
  task.onchange = () => (hint.textContent = TASKS[task.value][1]);
  text.oninput = () => (count.textContent = `${text.value.trim() ? text.value.trim().split(/\s+/).length : 0} kelime`);
  const send = h("button", { class: "btn", onclick: async () => {
    if (text.value.trim().length < 20) { out.className = "plan-ai show"; out.textContent = "Önce birkaç cümle yaz, sonra bakalım."; return; }
    send.disabled = true;
    out.className = "plan-ai show";
    out.textContent = "Brensyt okuyor…";
    const name = TASKS[task.value][0];
    try {
      await askBrensyt({ lang: lang.code, level: s.level, mode: "writing", topic: name, search: false,
        messages: [{ role: "user", content: `Görev: ${TASKS[task.value][1]}\n\nYazım:\n${text.value}` }] }, (t) => (out.textContent = t));
      addHistory({ type: "writing", lang: lang.code, level: s.level, topic: name });
    } catch (err) { out.textContent = AI_ERRORS[err.message] || AI_ERRORS.failed; }
    send.disabled = false;
  } }, "🧸 Brensyt düzeltsin");
  put(box, h("div", { class: "writing" },
    h("label", { class: "field" }, h("span", {}, "Görev"), task), hint, text,
    h("div", { class: "row-left" }, send, count), out));
}

export function renderStudio(root, ctx) {
  const lang = ctx.lang;
  const box = h("div", { class: "studio" });
  const pages = [["Dil bilgisi", grammar], ["Okuma", reading], ["Dinleme", listening], ["Konuşma", speaking], ["Yazma", writing]];
  let leave = null;
  const tabs = h("div", { class: "tabs" }, pages.map(([name, draw], i) => h("button", { class: i === 0 ? "on" : "", onclick: (e) => {
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === e.currentTarget));
    window.speechSynthesis?.cancel();
    leave?.();
    leave = draw(box, lang) || null;
  } }, name)));
  root.append(h("h1", {}, "Atölye"),
    h("p", { class: "lead" }, `${lang.flag} ${lang.name}: kuralı öğren, parça oku, kendi cümlelerini yaz.`), tabs, box);
  grammar(box, lang);
  return () => { leave?.(); window.speechSynthesis?.cancel(); };
}
