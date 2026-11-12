// Süreli sınav: sorular yalnızca kullanıcının öğrendiği kelimelerden gelir.
// Soru tipleri: anlam seçme, kelime seçme, dinleme, boşluk doldurma, cümle sıralama.
import { put, h, shuffle, confetti, speak } from "../core/dom.js";
import { teddy, teddyJump } from "../core/teddy.js";
import { state, save, addHistory } from "../core/store.js";
import { learnedWords, deckWords, addMistake, hardWords } from "../core/daily.js";
import { renderMock } from "./mock.js";
import { renderDuel } from "./duel.js";
import { ding, growl, fanfare } from "../core/audio.js";

const SECONDS = { mc: 12, reverse: 12, listen: 14, blank: 16, order: 28 };
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildQuestions(known, lang, count) {
  const deck = deckWords(lang.code);
  const others = (w, pick) => shuffle(deck.filter((x) => x.w !== w.w && pick(x) !== pick(w))).slice(0, 3).map(pick);
  return shuffle(known).slice(0, count).map((w, i) => {
    const tokens = w.ex ? w.ex.split(" ") : [];
    const kinds = ["mc", "reverse", lang.speech && "listen", w.ex && "blank", tokens.length >= 3 && tokens.length <= 9 && "order"].filter(Boolean);
    const type = kinds[i % kinds.length];
    const meaning = (x) => x.m[0], word = (x) => x.w;
    if (type === "order") {
      let mixed = shuffle(tokens);
      if (mixed.join(" ") === w.ex) mixed = [...tokens].reverse();
      return { type, word: w, tokens: mixed, answer: w.ex, hint: w.exTr };
    }
    if (type === "blank") {
      return { type, word: w, prompt: w.ex.replace(new RegExp(escapeRe(w.w), "i"), "_____"), hint: w.exTr, answer: w.w, options: shuffle([w.w, ...others(w, word)]) };
    }
    if (type === "reverse") return { type, word: w, prompt: w.m[0], answer: w.w, options: shuffle([w.w, ...others(w, word)]) };
    return { type, word: w, prompt: w.w, answer: w.m[0], options: shuffle([w.m[0], ...others(w, meaning)]) };
  });
}

export function renderExam(root, ctx) {
  const lang = ctx.lang;
  const box = h("div", { class: "exam-zone" });
  let timer = null;
  let stopMock = null;
  const tabs = h("div", { class: "tabs" },
    h("button", { class: "on", onclick: (e) => pick(e, () => intro()) }, "Kelime sınavı"),
    h("button", { onclick: (e) => pick(e, () => { stopMock = renderMock(box, ctx); }) }, "Deneme sınavı"),
    h("button", { onclick: (e) => pick(e, () => { stopMock = renderDuel(box, ctx); }) }, "Düello ⚔️"));
  function pick(e, open) {
    clearInterval(timer);
    stopMock?.();
    stopMock = null;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === e.currentTarget));
    open();
  }
  root.append(h("h1", {}, "Süreli sınav"), tabs, box);

  function intro() {
    const known = learnedWords(lang.code);
    if (known.length < 4) {
      return put(box, h("div", { class: "done-box" }, teddy(""),
        h("h2", {}, "Önce biraz çalışalım"),
        h("p", {}, `Sınav, öğrendiğin kelimelerden hazırlanır. ${lang.name} için en az 4 kelime öğrenmen gerekiyor (şu an ${known.length}).`),
        h("button", { class: "btn", onclick: () => ctx.go("cards") }, "Kartlara git")));
    }
    const hard = hardWords(lang.code).map((x) => x.word);
    const sizes = [5, 10, 20].filter((n) => n <= known.length);
    if (!sizes.length) sizes.push(known.length);
    put(box, h("div", { class: "done-box" }, teddy("wave"),
      h("h2", {}, `${lang.flag} ${lang.name} sınavı`),
      h("p", {}, `Öğrendiğin ${known.length} kelimeden karışık sorular gelecek: anlam, dinleme, boşluk doldurma, cümle sıralama. Süre bitince Brensyt araya girer.`),
      h("div", { class: "row-center" }, sizes.map((n) =>
        h("button", { class: "btn", onclick: () => run(buildQuestions(known, lang, n)) }, `${n} soru`)),
        hard.length >= 4 && h("button", { class: "btn ghost", onclick: () => run(buildQuestions(hard, lang, Math.min(10, hard.length))) }, "Zor kelimelerimden sor"))));
  }

  function run(questions) {
    const total = questions.reduce((n, q) => n + SECONDS[q.type], 0);
    let left = total, i = 0, correct = 0, over = false, locked = false;
    const wrong = [];
    const fill = h("i");
    const clock = h("span", { class: "clock" });
    const stage = h("div", { class: "question" });
    put(box, h("div", { class: "timer" }, h("div", { class: "bar" }, fill), clock), stage);

    const tick = () => {
      fill.style.width = (left / total) * 100 + "%";
      fill.parentElement.classList.toggle("low", left <= 10);
      clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    };
    tick();
    timer = setInterval(async () => {
      left--;
      tick();
      if (left <= 0) {
        over = true;
        clearInterval(timer);
        growl();
        await teddyJump(lang.timeUp, "Süre bitti!");
        finish(true);
      }
    }, 1000);

    function answered(ok, q, wait) {
      if (ok) { correct++; ding(); } else { growl(); wrong.push(q); addMistake(lang.code, q.word.w); }
      setTimeout(() => {
        if (over) return;
        locked = false;
        if (++i < questions.length) ask(); else { clearInterval(timer); finish(false); }
      }, wait);
    }

    function optionButtons(q) {
      return h("div", { class: "options" }, q.options.map((opt) => h("button", { class: "option", onclick: (e) => {
        if (over || locked) return;
        locked = true;
        const ok = opt === q.answer;
        e.currentTarget.classList.add(ok ? "right" : "wrong");
        if (!ok) [...stage.querySelectorAll(".option")].find((b) => b.textContent === q.answer)?.classList.add("right");
        answered(ok, q, ok ? 550 : 1300);
      } }, opt)));
    }

    function orderQuestion(q) {
      const built = [];
      const answerRow = h("div", { class: "order-answer" });
      const pool = h("div", { class: "order-pool" });
      const check = h("button", { class: "btn", disabled: true, onclick: () => {
        if (over || locked) return;
        locked = true;
        const ok = built.map((b) => b.text).join(" ") === q.answer;
        answerRow.classList.add(ok ? "right" : "wrong");
        if (!ok) put(answerRow, h("span", { class: "order-fix" }, q.answer));
        answered(ok, q, ok ? 700 : 2200);
      } }, "Kontrol et");
      const draw = () => {
        put(answerRow, ...built.map((b, n) => h("button", { class: "token", onclick: () => { if (!locked) { built.splice(n, 1); draw(); } } }, b.text)));
        put(pool, ...q.tokens.map((text, n) => ({ text, n })).filter((t) => !built.some((b) => b.n === t.n))
          .map((t) => h("button", { class: "token", onclick: () => { if (!locked) { built.push(t); draw(); } } }, t.text)));
        check.disabled = built.length !== q.tokens.length;
      };
      draw();
      return [h("p", { class: "q-hint" }, "Kelimeleri sıraya diz: ", h("b", {}, q.hint)), answerRow, pool, h("div", { class: "row-center" }, check)];
    }

    function ask() {
      const q = questions[i];
      const label = { mc: "Anlamı ne?", reverse: `${lang.name} karşılığı ne?`, listen: "Dinle, anlamını seç", blank: "Boşluğa hangisi gelir?", order: "Cümleyi kur" }[q.type];
      const head = h("p", { class: "phase" }, `Soru ${i + 1}/${questions.length} · ${label}`);
      if (q.type === "order") return put(stage, head, ...orderQuestion(q));
      if (q.type === "listen") {
        put(stage, head,
          h("button", { class: "round listen-btn", title: "Tekrar dinle", onclick: () => speak(q.prompt, lang.speech) }, "🔊"),
          optionButtons(q));
        return speak(q.prompt, lang.speech);
      }
      put(stage, head,
        h("h2", { class: "q-prompt" + (q.type === "blank" ? " sentence" : "") }, q.prompt),
        q.type === "blank" && h("p", { class: "q-hint" }, q.hint),
        optionButtons(q));
    }

    function finish(timedOut) {
      window.speechSynthesis?.cancel();
      const score = Math.round((correct / questions.length) * 100);
      const s = state();
      s.xp += correct * 5;
      if (!timedOut && score === 100) s.perfectExams = (s.perfectExams || 0) + 1;
      save();
      addHistory({ type: "exam", lang: lang.code, score, correct, total: questions.length, timedOut });
      if (!timedOut && score >= 80) { fanfare(); confetti(); }
      put(box, h("div", { class: "done-box" }, teddy(score >= 80 ? "jump" : ""),
        h("h2", {}, timedOut ? lang.timeUp : score >= 80 ? "Harika iş!" : "Bitti!"),
        h("p", { class: "score" }, `${correct} / ${questions.length}`, h("small", {}, ` · %${score}`)),
        wrong.length ? h("div", { class: "wrong-list" }, h("h3", {}, "Bir daha bakalım"),
          wrong.map((q) => h("p", {}, h("b", {}, q.word.w), " → ", q.word.m.join(", ")))) : null,
        h("div", { class: "row-center" },
          h("button", { class: "btn", onclick: intro }, "Yeni sınav"),
          h("button", { class: "btn ghost", onclick: () => ctx.go("cards") }, "Kartlara dön"))));
    }
    ask();
  }

  intro();
  return () => { clearInterval(timer); stopMock?.(); window.speechSynthesis?.cancel(); };
}
