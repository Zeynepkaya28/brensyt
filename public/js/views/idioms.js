// Kalıp defteri ve "Tavuk avı" oyunu: kelimesi kelimesine çeviri mi, doğal çeviri mi?
import { put, h, shuffle, confetti, speak } from "../core/dom.js";
import { teddy } from "../core/teddy.js";
import { state, save, addHistory } from "../core/store.js";
import { ding, growl, fanfare, pop } from "../core/audio.js";

export function renderIdioms(root, ctx) {
  const lang = ctx.lang, s = state();
  const zone = h("div", { class: "hunt" });

  function start() {
    put(zone, h("div", { class: "done-box" }, h("span", { class: "chicken" }, "🐔"),
      h("h2", {}, "Tavuk avı"),
      h("p", {}, "Her kalıp için iki çeviri göreceksin. Biri kelimesi kelimesine “tavuk çevirisi”, diğeri doğal karşılığı. Doğal olanı seç!"),
      s.idiomBest ? h("p", { class: "muted" }, `En iyi skorun: ${s.idiomBest}`) : null,
      h("button", { class: "btn", onclick: play }, "Ava başla")));
  }

  function play() {
    const rounds = shuffle(lang.idioms).slice(0, 8);
    let i = 0, score = 0;
    const next = () => {
      if (i >= rounds.length) {
        s.idiomBest = Math.max(s.idiomBest || 0, score);
        s.xp += score * 4;
        save();
        addHistory({ type: "idiom", lang: lang.code, correct: score, total: rounds.length });
        if (score === rounds.length) { fanfare(); confetti(); }
        return put(zone, h("div", { class: "done-box" }, teddy(score >= 6 ? "jump" : ""),
          h("h2", {}, score === rounds.length ? "Hiç tavuk kaçmadı!" : "Av bitti"),
          h("p", { class: "score" }, `${score} / ${rounds.length}`),
          h("button", { class: "btn", onclick: play }, "Tekrar oyna")));
      }
      const it = rounds[i];
      let locked = false;
      const verdict = h("p", { class: "note", role: "status" });
      const choice = (text, natural) => h("button", { class: "option", onclick: (e) => {
        if (locked) return;
        locked = true;
        e.currentTarget.classList.add(natural ? "right" : "wrong");
        if (natural) { score++; ding(); verdict.textContent = "Doğal çeviri bu!"; verdict.className = "note good"; }
        else { growl(); verdict.textContent = "🐔 Gıt gıt! Bu tavuk çevirisiydi."; verdict.className = "note bad"; }
        setTimeout(() => { i++; next(); }, natural ? 800 : 1500);
      } }, text);
      put(zone, 
        h("p", { class: "phase" }, `Kalıp ${i + 1}/${rounds.length} · skor ${score}`),
        h("h2", { class: "q-prompt sentence" }, it.p, " ",
          lang.speech && h("button", { class: "round", title: "Dinle", onclick: () => speak(it.p.replace(/\s*\(.*\)/, ""), lang.speech) }, "🔊")),
        h("div", { class: "options one-col" }, shuffle([choice(it.lit, false), choice(it.nat, true)])),
        verdict);
    };
    next();
  }

  root.append(
    h("h1", {}, "Kalıp defteri"),
    h("p", { class: "lead" }, `${lang.name} deyimleri kelimesi kelimesine çevrilmez. Önce oyunla dene, sonra defterdeki kartları çevirerek çalış.`),
    zone,
    h("h2", { class: "section-title" }, `${lang.flag} ${lang.name} kalıpları`),
    h("div", { class: "idiom-grid" }, lang.idioms.map((it) => {
      const card = h("button", { class: "flip idiom", "aria-label": "Kalıp kartını çevir", onclick: () => { pop(); card.classList.toggle("flipped"); } },
        h("div", { class: "flip-inner" },
          h("div", { class: "face front" }, h("strong", {}, it.p), h("p", { class: "strike" }, it.lit), h("em", {}, "Çevir ↻")),
          h("div", { class: "face back" }, h("small", {}, "Doğal karşılığı"), h("strong", {}, it.nat))));
      return h("div", { class: "flip-wrap" }, card);
    })));
  start();
}
