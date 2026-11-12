// Kart köşesi: önce öğren (kartı çevir, dinle, söyle), sonra anlamını yaz. Yanlışta aynı kartta kalınır.
import { put, h, shuffle, confetti, speak, tilt } from "../core/dom.js";
import { teddy, teddyJump } from "../core/teddy.js";
import { state, save, addHistory } from "../core/store.js";
import { todaySet, completeToday, learnedWords, dueWords, recordReview, isCorrect, normalize, addMistake, easeMistake, hardWords } from "../core/daily.js";
import { canListen, listen, VOICE_ERRORS } from "../core/voice.js";
import { ding, growl, fanfare, pop } from "../core/audio.js";
import { familyBox } from "./family.js";

function dots(total, index) {
  return h("div", { class: "dots" }, Array.from({ length: total }, (_, i) =>
    h("i", { class: i < index ? "done" : i === index ? "now" : "" })));
}

function cardFace(word, lang) {
  return [
    h("span", { class: "card-lang" }, `${lang.flag} ${lang.name} · ${word.level}`),
    h("strong", { class: "card-word" }, word.w),
    word.pron && h("span", { class: "card-pron" }, "/" + word.pron + "/"),
  ];
}

function speakBtn(word, lang) {
  return lang.speech && h("button", { class: "round", type: "button", title: "Dinle", onclick: (e) => { e.stopPropagation(); speak(word.w, lang.speech); } }, "🔊");
}

// "Söyle" düğmesi: kelimeyi mikrofona söyle, Brensyt doğru duyduysa "dın".
function sayIt(word, lang) {
  if (!canListen(lang.speech)) return null;
  const note = h("p", { class: "note", role: "status" });
  const btn = h("button", { class: "btn ghost small", type: "button", onclick: async () => {
    btn.disabled = true;
    btn.classList.add("listening");
    note.className = "note";
    note.textContent = "Dinliyorum…";
    try {
      const heard = await listen(lang.speech);
      const target = normalize(word.w);
      if (heard.some((t) => normalize(t).includes(target))) {
        ding();
        note.textContent = "Harika söyledin!";
        note.className = "note good";
      } else {
        growl();
        note.textContent = `Ben “${heard[0]}” duydum. Bir kez dinleyip tekrar dene.`;
        note.className = "note bad";
      }
    } catch (err) {
      note.textContent = VOICE_ERRORS[err.message] || VOICE_ERRORS.failed;
      note.className = "note bad";
    }
    btn.disabled = false;
    btn.classList.remove("listening");
  } }, "🎤 Sen de söyle");
  return h("div", { class: "say-it" }, btn, note);
}

// 1. aşama: kartları tanı.
function learn(box, words, lang, onDone) {
  let i = 0;
  const draw = () => {
    const w = words[i];
    const flip = h("div", { class: "flip study", tabIndex: 0, role: "button", "aria-label": "Kartı çevir",
      onclick: () => { pop(); flip.classList.toggle("flipped"); },
      onkeydown: (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip.click(); } } },
      h("div", { class: "flip-inner" },
        h("div", { class: "face front" }, cardFace(w, lang), speakBtn(w, lang), h("em", {}, "Anlamı için karta dokun ↻")),
        h("div", { class: "face back" }, h("small", {}, "Anlamı"), h("strong", { class: "card-word" }, w.m[0]),
          w.m.length > 1 && h("span", { class: "card-pron" }, "ayrıca: " + w.m.slice(1).join(", ")),
          w.ex && h("p", { class: "card-ex" }, h("b", {}, w.ex), h("br"), w.exTr))));
    put(box, 
      h("p", { class: "phase" }, `Tanışma · ${i + 1}/${words.length}`), dots(words.length, i),
      tilt(h("div", { class: "flip-wrap" }, flip), 8),
      sayIt(w, lang),
      familyBox(w, lang),
      h("div", { class: "row-center" },
        i > 0 && h("button", { class: "btn ghost", onclick: () => { i--; draw(); } }, "← Önceki"),
        h("button", { class: "btn", onclick: () => { if (++i < words.length) draw(); else onDone(); } },
          i < words.length - 1 ? "Sonraki kart →" : "Hazırım, sor bakalım!")));
    speak(w.w, lang.speech);
  };
  draw();
}

// 2. aşama: anlamını yaz. Doğruysa tik + "dın", yanlışsa ayı homurtusu ve aynı kart.
// onWord(kelime, ilkDenemedeBildi) her kart geçildiğinde çağrılır.
function quiz(box, words, lang, onDone, onWord) {
  let i = 0, mistakes = 0;
  const draw = () => {
    const w = words[i];
    let firstTry = true;
    const flip = h("div", { class: "flip quiz" },
      h("div", { class: "flip-inner" },
        h("div", { class: "face front" }, cardFace(w, lang), speakBtn(w, lang)),
        h("div", { class: "face back ok" }, h("span", { class: "tick" }, "✓"), h("strong", { class: "card-word" }, w.m[0]))));
    const input = h("input", { type: "text", class: "answer", placeholder: `${lang.answerIn} anlamını yaz`, autocomplete: "off", autocapitalize: "off", spellcheck: false, maxLength: 60 });
    const note = h("p", { class: "note", role: "status" });
    let locked = false;
    const form = h("form", { class: "answer-form", onsubmit: (e) => {
      e.preventDefault();
      if (locked || !input.value.trim()) return;
      if (isCorrect(input.value, w.m)) {
        locked = true;
        ding();
        flip.classList.add("flipped");
        note.textContent = "Doğru!";
        note.className = "note good";
        onWord?.(w, firstTry);
        setTimeout(() => { if (++i < words.length) draw(); else onDone(mistakes); }, 1100);
      } else {
        mistakes++;
        if (firstTry) addMistake(lang.code, w.w);
        firstTry = false;
        growl();
        flip.classList.remove("shake");
        void flip.offsetWidth;
        flip.classList.add("shake");
        note.textContent = `Hrrr! Olmadı. Doğrusu: “${w.m[0]}”. Şimdi sen yaz, sonra devam ederiz.`;
        note.className = "note bad";
        input.value = "";
        input.focus();
      }
    } }, input, h("button", { class: "btn" }, "Kontrol et"));
    put(box, 
      h("p", { class: "phase" }, `Sıra sende · ${i + 1}/${words.length}`), dots(words.length, i),
      h("div", { class: "flip-wrap" }, flip), form, note);
    input.focus();
  };
  draw();
}

export function renderCards(root, ctx) {
  const lang = ctx.lang;
  let mode = "today";
  const box = h("div", { class: "card-zone" });
  const reviewTab = h("button", { "data-m": "review", onclick: () => show("review") });
  const tabs = h("div", { class: "tabs" },
    h("button", { "data-m": "today", onclick: () => show("today") }, "Bugünün kartları"), reviewTab,
    h("button", { "data-m": "hard", onclick: () => show("hard") }, "Zor kelimelerim"));
  const drawBadge = () => {
    const n = dueWords(lang.code).length;
    put(reviewTab, "Tekrar köşesi", n ? h("span", { class: "badge" }, String(n)) : "");
  };

  function finished(title, text) {
    drawBadge();
    put(box, h("div", { class: "done-box" }, teddy("jump"), h("h2", {}, title), h("p", {}, text),
      h("div", { class: "row-center" },
        h("button", { class: "btn", onclick: () => show("review") }, "Tekrar yap"),
        h("button", { class: "btn ghost", onclick: () => ctx.go("exam") }, "Sınava gir"))));
  }

  function showToday() {
    const set = todaySet(lang.code);
    if (set.done) return finished("Bugünlük tamam!", "Yarın yeni kartlar seni bekliyor. İstersen eski kelimeleri tekrar et.");
    if (!set.words.length) return finished("Deste bitti!", `${lang.name} destesindeki tüm kelimeleri öğrendin. Tekrar köşesiyle taze tut.`);
    learn(box, set.words, lang, () => quiz(box, shuffle(set.words), lang, async (mistakes) => {
      const r = completeToday(lang.code);
      addHistory({ type: "cards", lang: lang.code, count: set.words.length, mistakes });
      fanfare();
      confetti();
      await teddyJump(`${set.words.length} kelime cebinde!`, r.quotaUp
        ? `7 günlük seri tamam! Artık günde ${r.quota} kelime öğreneceksin.`
        : r.frozen ? `Seri dondurman kullanıldı, serin bozulmadı: ${r.streak} gün!`
        : `Serin: ${r.streak} gün. 7 güne ulaşınca günlük kelime sayın bir artar.`);
      ctx.refresh();
    }));
  }

  // Tekrar: önce zamanı gelen kelimeler. Bilinen kelime daha geç, takılınan kelime ertesi gün yeniden gelir.
  function showReview(practice = false) {
    const known = learnedWords(lang.code);
    if (!known.length) {
      return put(box, h("div", { class: "done-box" }, teddy(""), h("h2", {}, "Henüz tekrar edilecek kelime yok"),
        h("p", {}, "Önce bugünün kartlarını bitir; öğrendiklerin burada birikir.")));
    }
    const due = dueWords(lang.code);
    if (!due.length && !practice) {
      return put(box, h("div", { class: "done-box" }, teddy("wave"), h("h2", {}, "Bugünlük tekrar yok"),
        h("p", {}, "Zamanı gelen kelime kalmadı. Kelimeler unutmaya yüz tuttuğu gün burada belirir."),
        h("button", { class: "btn ghost", onclick: () => showReview(true) }, "Yine de pratik yap")));
    }
    const batch = practice ? shuffle(known).slice(0, 10) : due.slice(0, 20);
    quiz(box, shuffle(batch), lang, (mistakes) => {
      state().xp += batch.length * 3;
      save();
      addHistory({ type: "review", lang: lang.code, count: batch.length, mistakes });
      fanfare();
      confetti(40);
      finished("Tekrar bitti!", `${batch.length} kelimeyi yeniden gördün${mistakes ? `, ${mistakes} kez takıldın. Takıldıkların yarın tekrar gelecek` : ", hiç takılmadın"}.`);
    }, practice ? null : (w, firstTry) => recordReview(lang.code, w.w, firstTry));
  }

  // Hata defteri: en çok takılınan kelimeler. İlk denemede bilinen kelimenin hata sayısı bir azalır.
  function showHard() {
    const hard = hardWords(lang.code);
    if (!hard.length) {
      return put(box, h("div", { class: "done-box" }, teddy("wave"), h("h2", {}, "Hata defterin boş"),
        h("p", {}, "Kartlarda ya da sınavda takıldığın kelimeler burada birikir.")));
    }
    put(box, h("div", { class: "done-box" },
      h("h2", {}, "Zor kelimelerim"),
      h("p", {}, "En çok takıldıkların üstte. Çalıştıkça ve bildikçe listeden düşerler."),
      h("ul", { class: "hard-list" }, hard.slice(0, 30).map(({ word, count }) =>
        h("li", {}, h("b", {}, word.w), h("span", {}, word.m.join(", ")), h("small", {}, count + " hata")))),
      h("button", { class: "btn", onclick: () => {
        const batch = hard.slice(0, 12).map((x) => x.word);
        quiz(box, shuffle(batch), lang, (mistakes) => {
          state().xp += batch.length * 3;
          save();
          addHistory({ type: "review", lang: lang.code, count: batch.length, mistakes });
          fanfare();
          showHard();
        }, (w, firstTry) => { if (firstTry) easeMistake(lang.code, w.w); });
      } }, "Bunları çalış")));
  }

  function show(m) {
    mode = m;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.m === mode));
    if (mode === "today") showToday(); else if (mode === "hard") showHard(); else showReview();
  }

  root.append(h("h1", {}, "Kart köşesi"),
    h("p", { class: "lead" }, `Her gün ${state().quota} yeni kelime. Kartı çevir, dinle, söyle; sonra anlamını yaz.`), tabs, box);
  drawBadge();
  show("today");
}
