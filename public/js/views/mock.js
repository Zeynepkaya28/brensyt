// Deneme sınavı: Brensyt, seçilen sınavın tarzında özgün sorular hazırlar. Sonuçta konu bazında başarı gösterilir.
import { put, h, confetti } from "../core/dom.js";
import { teddy, teddyJump } from "../core/teddy.js";
import { state, save, addHistory } from "../core/store.js";
import { askJson, AI_ERRORS } from "../core/ai.js";
import { ding, growl, fanfare } from "../core/audio.js";

const SECONDS_PER_QUESTION = 75;

export function renderMock(box, ctx) {
  const lang = ctx.lang, s = state();
  let timer = null, alive = true;

  function intro(message) {
    const exam = h("select", {}, ["YDS", "YDT", "IELTS", "TOEFL"].map((x) => h("option", { value: x }, x)));
    const count = h("select", {}, [5, 10, 20].map((n) => h("option", { value: n, selected: n === 10 }, n + " soru")));
    put(box, h("div", { class: "done-box" }, teddy("wave"),
      h("h2", {}, "Deneme sınavı"),
      h("p", {}, `Brensyt seçtiğin sınavın tarzında, ${lang.name} için özgün sorular hazırlar. Soru başına ${SECONDS_PER_QUESTION} saniye; sonunda konu konu başarını görürsün.`),
      message && h("p", { class: "note bad" }, message),
      h("div", { class: "plan-form" },
        h("label", { class: "field" }, h("span", {}, "Sınav"), exam),
        h("label", { class: "field" }, h("span", {}, "Uzunluk"), count)),
      h("button", { class: "btn", onclick: () => load(exam.value, Number(count.value)) }, "Soruları hazırla")));
  }

  async function load(exam, count) {
    put(box, h("div", { class: "done-box" }, teddy("walk"),
      h("h2", {}, "Brensyt soruları yazıyor…"), h("p", { class: "muted" }, "Bu bir dakika kadar sürebilir.")));
    try {
      const data = await askJson("mock", { lang: lang.code, level: s.level, exam, count });
      if (!alive) return;
      if (!data.questions.length) throw new Error("failed");
      run(exam, data.questions);
    } catch (err) { if (alive) intro(AI_ERRORS[err.message] || AI_ERRORS.failed); }
  }

  function run(exam, questions) {
    const total = questions.length * SECONDS_PER_QUESTION;
    let left = total, i = 0, over = false, locked = false;
    const picks = [];
    const fill = h("i"), clock = h("span", { class: "clock" }), stage = h("div", { class: "question" });
    put(box, h("div", { class: "timer" }, h("div", { class: "bar" }, fill), clock), stage);
    const tick = () => {
      fill.style.width = (left / total) * 100 + "%";
      fill.parentElement.classList.toggle("low", left <= 30);
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

    function ask() {
      const q = questions[i];
      put(stage, 
        h("p", { class: "phase" }, `Soru ${i + 1}/${questions.length} · ${q.topic}`),
        h("p", { class: "mock-q" }, q.q),
        h("div", { class: "options one-col" }, q.options.map((opt, n) => h("button", { class: "option left", onclick: (e) => {
          if (over || locked) return;
          locked = true;
          picks[i] = n;
          e.currentTarget.classList.add("picked");
          setTimeout(() => {
            if (over) return;
            locked = false;
            if (++i < questions.length) ask(); else { clearInterval(timer); finish(false); }
          }, 250);
        } }, h("b", {}, "ABCD"[n] + ") "), opt))));
    }

    function finish(timedOut) {
      const topics = {};
      let correct = 0;
      questions.forEach((q, n) => {
        const ok = picks[n] === q.answer;
        if (ok) correct++;
        topics[q.topic] ??= [0, 0];
        topics[q.topic][1]++;
        if (ok) topics[q.topic][0]++;
      });
      const score = Math.round((correct / questions.length) * 100);
      s.xp += correct * 6;
      save();
      addHistory({ type: "mock", lang: lang.code, exam, score, correct, total: questions.length, timedOut, topics });
      if (score >= 80) { fanfare(); confetti(); } else ding();
      put(box, h("div", { class: "done-box wide" },
        h("h2", {}, `${exam} denemesi bitti`),
        h("p", { class: "score" }, `${correct} / ${questions.length}`, h("small", {}, ` · %${score}`)),
        h("div", { class: "topic-bars" }, Object.entries(topics).map(([name, [c, t]]) => h("div", { class: "topic-bar" },
          h("span", {}, name), h("div", { class: "bar" }, h("i", { style: { width: (c / t) * 100 + "%" } })), h("b", {}, `${c}/${t}`)))),
        h("div", { class: "wrong-list" }, h("h3", {}, "Soruların çözümü"),
          questions.map((q, n) => h("details", { class: picks[n] === q.answer ? "ok" : "bad" },
            h("summary", {}, `${picks[n] === q.answer ? "✓" : "✗"} ${n + 1}. ${q.topic}`),
            h("p", { class: "mock-q" }, q.q),
            h("p", {}, h("b", {}, "Doğru cevap: "), `${"ABCD"[q.answer]}) ${q.options[q.answer]}`),
            picks[n] !== undefined && picks[n] !== q.answer && h("p", {}, h("b", {}, "Senin cevabın: "), `${"ABCD"[picks[n]]}) ${q.options[picks[n]]}`),
            h("p", { class: "muted" }, q.why)))),
        h("button", { class: "btn", onclick: () => intro() }, "Yeni deneme")));
    }
    ask();
  }

  intro();
  return () => { alive = false; clearInterval(timer); };
}
