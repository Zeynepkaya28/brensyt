// Çocuk bölümü: hikâye kitabı, ebeveyn kilidi ve günlük süre sınırı.
import { put, h, speak } from "../core/dom.js";
import { teddy } from "../core/teddy.js";
import { state, save, dayKey } from "../core/store.js";
import { pop, fanfare } from "../core/audio.js";

// Sayfa: [resim, en, de, es, fr, tr, pt, ku, ru, zh]
const ORDER = ["en", "de", "es", "fr", "tr", "pt", "ku", "ru", "zh"];
const STORY = {
  title: "Brensyt ve kedi",
  pages: [
    ["🧸", "This is Brensyt.", "Das ist Brensyt.", "Este es Brensyt.", "Voici Brensyt.", "Bu Brensyt.", "Este é Brensyt.", "Ev Brensyt e.", "Это Бренсит.", "这是Brensyt。"],
    ["🧣", "Brensyt has a red scarf.", "Brensyt hat einen roten Schal.", "Brensyt tiene una bufanda roja.", "Brensyt a une écharpe rouge.", "Brensyt'in kırmızı bir atkısı var.", "Brensyt tem um cachecol vermelho.", "Şaleke Brensyt a sor heye.", "У Бренсита красный шарф.", "Brensyt有一条红围巾。"],
    ["🐱", "He sees a cat.", "Er sieht eine Katze.", "Ve un gato.", "Il voit un chat.", "Bir kedi görüyor.", "Ele vê um gato.", "Ew pisîkekê dibîne.", "Он видит кошку.", "他看见一只猫。"],
    ["🥛", "The cat wants milk.", "Die Katze will Milch.", "El gato quiere leche.", "Le chat veut du lait.", "Kedi süt istiyor.", "O gato quer leite.", "Pisîk şîr dixwaze.", "Кошка хочет молока.", "猫想喝牛奶。"],
    ["🤝", "Brensyt gives it milk.", "Brensyt gibt ihr Milch.", "Brensyt le da leche.", "Brensyt lui donne du lait.", "Brensyt ona süt veriyor.", "Brensyt lhe dá leite.", "Brensyt şîr dide wê.", "Бренсит даёт ей молоко.", "Brensyt给它牛奶。"],
    ["❤️", "Now they are friends.", "Jetzt sind sie Freunde.", "Ahora son amigos.", "Maintenant, ils sont amis.", "Artık arkadaşlar.", "Agora eles são amigos.", "Niha ew heval in.", "Теперь они друзья.", "现在他们是朋友。"],
  ],
};

// Hikâye kitabı: sayfa çevrilir, cümle seslendirilir; cümleye dokununca anlamı görünür.
export function story(stage, { lang, code, back }) {
  let i = 0;
  const col = ORDER.indexOf(code) + 1, meaningCol = ORDER.indexOf(code === "tr" ? "en" : "tr") + 1;
  const draw = () => {
    const page = STORY.pages[i];
    const meaning = h("p", { class: "story-meaning", hidden: true }, page[meaningCol]);
    put(stage, h("div", { class: "book" },
      h("div", { class: "book-page" }, h("div", { class: "book-pic" }, page[0]),
        h("button", { class: "book-text", title: "Anlamını göster", onclick: () => { pop(); meaning.hidden = !meaning.hidden; } }, page[col]),
        meaning,
        h("p", { class: "muted tiny" }, `${STORY.title} · ${i + 1}/${STORY.pages.length} · anlamı için cümleye dokun`)),
      h("div", { class: "row-center" },
        h("button", { class: "round big", title: "Önceki sayfa", disabled: i === 0, onclick: () => { i--; draw(); } }, "◀"),
        lang.speech && h("button", { class: "round big", title: "Dinle", onclick: () => speak(page[col], lang.speech) }, "🔊"),
        i < STORY.pages.length - 1
          ? h("button", { class: "round big", title: "Sonraki sayfa", onclick: () => { i++; draw(); } }, "▶")
          : h("button", { class: "btn", onclick: () => { fanfare(); back(); } }, "Bitti 🎉"))),
      h("div", { class: "row-center" }, h("button", { class: "btn ghost", onclick: back }, "← Dersler")));
    speak(page[col], lang.speech);
  };
  draw();
}

// Ebeveyn kilidi: çocuk bölümünden çıkmak ya da ayar değiştirmek için basit bir çarpma sorusu.
export function parentGate() {
  return new Promise((resolve) => {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    const input = h("input", { type: "text", inputMode: "numeric", maxLength: 3, "aria-label": "Cevap", autocomplete: "off" });
    const note = h("p", { class: "note bad" });
    const close = (ok) => { overlay.remove(); resolve(ok); };
    const overlay = h("div", { class: "jump-overlay gate" },
      h("form", { class: "jump-bubble", onsubmit: (e) => {
        e.preventDefault();
        if (Number(input.value) === a * b) close(true);
        else { note.textContent = "Olmadı. Bir büyüğünden yardım iste."; input.value = ""; }
      } },
        h("strong", {}, "Ebeveyn kilidi 🔒"), h("span", {}, `Devam etmek için: ${a} × ${b} = ?`),
        h("div", { class: "reminder-row" }, input, h("button", { class: "btn small" }, "Tamam")), note,
        h("button", { class: "link", type: "button", onclick: () => close(false) }, "Vazgeç")));
    document.body.append(overlay);
    input.focus();
  });
}

// Günlük ekran süresi ayarı (ebeveyn özetinin içinde). Değiştirmek kilidi ister.
export function limitControl() {
  const s = state();
  const select = h("select", { "aria-label": "Günlük süre sınırı", onchange: async (e) => {
    const value = Number(e.target.value);
    if (await parentGate()) { s.kidLimit = value; save(); } else select.value = String(s.kidLimit || 0);
  } }, [[0, "Sınır yok"], [10, "10 dakika"], [15, "15 dakika"], [20, "20 dakika"], [30, "30 dakika"], [45, "45 dakika"]]
    .map(([v, label]) => h("option", { value: v, selected: v === (s.kidLimit || 0) }, label)));
  const used = s.kidTime?.date === dayKey() ? Math.round(s.kidTime.sec / 60) : 0;
  return h("p", { class: "limit-row" }, "Günlük süre sınırı: ", select, h("span", { class: "muted tiny" }, ` Bugün ${used} dakika kullanıldı.`));
}

// Süre sayacı: çocuk bölümü açıkken saniye sayar; sınır dolunca ekranı kapatır. Durdurmak için dönen işlevi çağır.
export function watchLimit(onExit) {
  const s = state();
  let blocked = false;
  const timer = setInterval(() => {
    if (document.hidden || blocked) return;
    const today = dayKey();
    if (s.kidTime?.date !== today) s.kidTime = { date: today, sec: 0, extra: 0 };
    s.kidTime.sec += 5;
    save();
    const limit = (s.kidLimit || 0) * 60 + (s.kidTime.extra || 0);
    if (!s.kidLimit || s.kidTime.sec < limit) return;
    blocked = true;
    window.speechSynthesis?.cancel();
    const overlay = h("div", { class: "jump-overlay gate" },
      h("div", { class: "jump-bubble" }, h("strong", {}, "Bugünlük bu kadar! 😴"), h("span", {}, "Brensyt uyumaya gidiyor. Yarın yine oynarız.")),
      teddy(""),
      h("div", { class: "row-center" },
        h("button", { class: "btn ghost", onclick: async () => { if (await parentGate()) { s.kidTime.extra = (s.kidTime.extra || 0) + 600; save(); overlay.remove(); blocked = false; } } }, "Ebeveyn: 10 dakika daha"),
        h("button", { class: "btn", onclick: async () => { if (await parentGate()) { overlay.remove(); onExit(); } } }, "Ebeveyn: çık")));
    document.body.append(overlay);
  }, 5000);
  return () => { clearInterval(timer); document.querySelectorAll(".jump-overlay.gate").forEach((o) => o.remove()); };
}
