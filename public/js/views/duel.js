// Düello: aynı cihazda iki kişi sırayla aynı soruları cevaplar. Hızlı ve doğru olan kazanır.
// (İnternet üzerinden düello için bulut hesap gerekir; bu sürüm tek cihazda oynanır.)
import { put, h, shuffle, confetti } from "../core/dom.js";
import { teddy } from "../core/teddy.js";
import { addHistory } from "../core/store.js";
import { deckWords } from "../core/daily.js";
import { ding, growl, fanfare } from "../core/audio.js";

const ROUNDS = 6, SECONDS = 8;

export function renderDuel(box, ctx) {
  const lang = ctx.lang;
  let timer = null;

  function intro() {
    const a = h("input", { type: "text", maxLength: 16, value: ctx.user.name, "aria-label": "1. oyuncu" });
    const b = h("input", { type: "text", maxLength: 16, placeholder: "Arkadaşının adı", "aria-label": "2. oyuncu" });
    put(box, h("div", { class: "done-box" }, h("span", { class: "chicken" }, "⚔️"), h("h2", {}, "Kelime düellosu"),
      h("p", {}, `İki kişi aynı ${ROUNDS} ${lang.name} kelimeyi sırayla cevaplar. Her soru ${SECONDS} saniye; doğru cevap 10 puan, hız bonusu ayrıca.`),
      h("div", { class: "plan-form" }, h("label", { class: "field" }, h("span", {}, "1. oyuncu"), a), h("label", { class: "field" }, h("span", {}, "2. oyuncu"), b)),
      h("button", { class: "btn", onclick: () => start([a.value.trim() || "1. oyuncu", b.value.trim() || "2. oyuncu"]) }, "Başla")));
  }

  function start(names) {
    const deck = deckWords(lang.code);
    const questions = shuffle(deck).slice(0, ROUNDS).map((w) => ({
      prompt: w.w, answer: w.m[0],
      options: shuffle([w.m[0], ...shuffle(deck.filter((x) => x.m[0] !== w.m[0])).slice(0, 3).map((x) => x.m[0])]),
    }));
    const scores = [0, 0];
    turn(0);

    function turn(player) {
      put(box, h("div", { class: "done-box" }, teddy("wave"), h("h2", {}, `Sıra ${names[player]}'de`),
        player === 1 && h("p", {}, `${names[0]}: ${scores[0]} puan. Geçebilecek misin?`),
        h("p", { class: "muted" }, player === 1 ? `${names[0]} ekrana bakmasın!` : "Hazır olunca başla."),
        h("button", { class: "btn", onclick: () => ask(player, 0) }, "Hazırım")));
    }

    function ask(player, i) {
      if (i >= questions.length) return player === 0 ? turn(1) : finish();
      const q = questions[i];
      let left = SECONDS * 10, locked = false;
      const fill = h("i", { style: { width: "100%" } });
      const done = (ok) => {
        clearInterval(timer);
        if (ok) { scores[player] += 10 + Math.round(left / 10); ding(); } else growl();
        setTimeout(() => ask(player, i + 1), ok ? 450 : 1000);
      };
      put(box, h("p", { class: "phase" }, `${names[player]} · soru ${i + 1}/${questions.length} · ${scores[player]} puan`),
        h("div", { class: "bar" }, fill), h("h2", { class: "q-prompt" }, q.prompt),
        h("div", { class: "options" }, q.options.map((opt) => h("button", { class: "option", onclick: (e) => {
          if (locked) return;
          locked = true;
          const ok = opt === q.answer;
          e.currentTarget.classList.add(ok ? "right" : "wrong");
          done(ok);
        } }, opt))));
      timer = setInterval(() => {
        left--;
        fill.style.width = (left / (SECONDS * 10)) * 100 + "%";
        if (left <= 0 && !locked) { locked = true; done(false); }
      }, 100);
    }

    function finish() {
      const tie = scores[0] === scores[1], winner = scores[0] > scores[1] ? 0 : 1;
      fanfare();
      confetti();
      addHistory({ type: "duel", lang: lang.code, topic: tie ? "Berabere" : `${names[winner]} kazandı`, correct: scores[0], total: scores[1] });
      put(box, h("div", { class: "done-box" }, teddy("jump"), h("h2", {}, tie ? "Berabere!" : `${names[winner]} kazandı! 🏆`),
        h("div", { class: "duel-score" }, names.map((n, p) => h("div", { class: !tie && p === winner ? "win" : "" }, h("span", {}, n), h("b", {}, String(scores[p]))))),
        h("button", { class: "btn", onclick: intro }, "Rövanş")));
    }
  }

  intro();
  return () => clearInterval(timer);
}
