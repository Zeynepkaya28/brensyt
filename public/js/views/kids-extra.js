// Çocuk bölümü ekleri: kelime şarkısı (karaoke) ve boyama sayfası.
import { put, h, speak, confetti } from "../core/dom.js";
import { teddy } from "../core/teddy.js";
import { tone, pop, fanfare } from "../core/audio.js";

const MELODY = [523, 587, 659, 784, 659, 587, 523, 784]; // do re mi sol mi re do sol

// Şarkı: her kelime ritimle iki kez söylenir, resim zıplar. Durdurmak için dönen işlevi çağır.
export function song(stage, lesson, { lang, code, back }) {
  let step = 0;
  const pic = h("div", { class: "song-pic" });
  const line = h("div", { class: "song-line" });
  const beats = h("div", { class: "song-beats" }, lesson.items.map(() => h("i")));
  put(stage, h("div", { class: "song" },
    h("h2", {}, `${lesson.icon} ${lesson.title} şarkısı`), pic, line, beats, teddy("jump small")),
    h("div", { class: "row-center" }, h("button", { class: "btn ghost", onclick: () => { stop(); back(); } }, "← Geri")));

  const total = lesson.items.length * 2;
  const play = () => {
    if (step >= total) {
      stop();
      fanfare();
      confetti(40);
      line.textContent = "🎉 Bravo!";
      return;
    }
    const it = lesson.items[step % lesson.items.length], word = it.words[code];
    pic.textContent = it.pic;
    pic.classList.toggle("digit", it.pic.length === 1);
    pic.classList.remove("beat");
    void pic.offsetWidth;
    pic.classList.add("beat");
    put(line, h("strong", {}, word), h("span", {}, `${word}, ${word}!`));
    [...beats.children].forEach((b, n) => b.classList.toggle("on", n === step % lesson.items.length));
    const base = MELODY[step % MELODY.length];
    tone(base, 0, 0.25, "triangle", 0.18);
    tone(base * 1.25, 0.3, 0.25, "triangle", 0.18);
    tone(base * 1.5, 0.6, 0.4, "triangle", 0.18);
    speak(word, lang.speech);
    step++;
  };
  const timer = setInterval(play, 1900);
  function stop() { clearInterval(timer); window.speechSynthesis?.cancel(); }
  play();
  return stop;
}

// Boyama renkleri: her renk dokuz dilde söylenir (null: o dilde adı yok, İngilizcesi gösterilir).
export const PALETTE = [
  { id: "red", hex: "#e53935", words: {"en":"red","de":"rot","es":"rojo","fr":"rouge","tr":"kırmızı","pt":"vermelho","ku":"sor","ru":"красный","zh":"红色"} },
  { id: "orange", hex: "#fb8c00", words: {"en":"orange","de":"orange","es":"naranja","fr":"orange","tr":"turuncu","pt":"laranja","ku":"pirteqalî","ru":"оранжевый","zh":"橙色"} },
  { id: "peach", hex: "#ffab91", words: {"en":"peach","de":"pfirsich","es":"melocotón","fr":"pêche","tr":"şeftali","pt":"pêssego","ku":"xox","ru":"персиковый","zh":"桃色"} },
  { id: "gold", hex: "#ffc107", words: {"en":"gold","de":"gold","es":"dorado","fr":"or","tr":"altın","pt":"dourado","ku":"zêrîn","ru":"золотой","zh":"金色"} },
  { id: "yellow", hex: "#fdd835", words: {"en":"yellow","de":"gelb","es":"amarillo","fr":"jaune","tr":"sarı","pt":"amarelo","ku":"zer","ru":"жёлтый","zh":"黄色"} },
  { id: "lime", hex: "#9ccc65", words: {"en":"light green","de":"hellgrün","es":"verde claro","fr":"vert clair","tr":"açık yeşil","pt":"verde-claro","ku":null,"ru":"светло-зелёный","zh":"浅绿色"} },
  { id: "green", hex: "#43a047", words: {"en":"green","de":"grün","es":"verde","fr":"vert","tr":"yeşil","pt":"verde","ku":"kesk","ru":"зелёный","zh":"绿色"} },
  { id: "darkgreen", hex: "#1b5e20", words: {"en":"dark green","de":"dunkelgrün","es":"verde oscuro","fr":"vert foncé","tr":"koyu yeşil","pt":"verde-escuro","ku":null,"ru":"тёмно-зелёный","zh":"深绿色"} },
  { id: "teal", hex: "#00acc1", words: {"en":"turquoise","de":"türkis","es":"turquesa","fr":"turquoise","tr":"turkuaz","pt":"turquesa","ku":null,"ru":"бирюзовый","zh":"青绿色"} },
  { id: "lightblue", hex: "#4fc3f7", words: {"en":"light blue","de":"hellblau","es":"celeste","fr":"bleu clair","tr":"açık mavi","pt":"azul-claro","ku":null,"ru":"голубой","zh":"浅蓝色"} },
  { id: "blue", hex: "#1e88e5", words: {"en":"blue","de":"blau","es":"azul","fr":"bleu","tr":"mavi","pt":"azul","ku":"şîn","ru":"синий","zh":"蓝色"} },
  { id: "navy", hex: "#1a237e", words: {"en":"navy blue","de":"dunkelblau","es":"azul marino","fr":"bleu marine","tr":"lacivert","pt":"azul-marinho","ku":null,"ru":"тёмно-синий","zh":"深蓝色"} },
  { id: "lavender", hex: "#b39ddb", words: {"en":"lavender","de":"lavendel","es":"lavanda","fr":"lavande","tr":"lavanta","pt":"lavanda","ku":null,"ru":"лавандовый","zh":"薰衣草色"} },
  { id: "purple", hex: "#8e24aa", words: {"en":"purple","de":"lila","es":"morado","fr":"violet","tr":"mor","pt":"roxo","ku":"mor","ru":"фиолетовый","zh":"紫色"} },
  { id: "pink", hex: "#f48fb1", words: {"en":"pink","de":"rosa","es":"rosa","fr":"rose","tr":"pembe","pt":"rosa","ku":"pembe","ru":"розовый","zh":"粉色"} },
  { id: "burgundy", hex: "#8e0000", words: {"en":"burgundy","de":"bordeaux","es":"burdeos","fr":"bordeaux","tr":"bordo","pt":"bordô","ku":null,"ru":"бордовый","zh":"酒红色"} },
  { id: "brown", hex: "#795548", words: {"en":"brown","de":"braun","es":"marrón","fr":"marron","tr":"kahverengi","pt":"marrom","ku":"qehweyî","ru":"коричневый","zh":"棕色"} },
  { id: "beige", hex: "#d7ccc8", words: {"en":"beige","de":"beige","es":"beige","fr":"beige","tr":"bej","pt":"bege","ku":null,"ru":"бежевый","zh":"米色"} },
  { id: "gray", hex: "#9e9e9e", words: {"en":"gray","de":"grau","es":"gris","fr":"gris","tr":"gri","pt":"cinza","ku":"gewr","ru":"серый","zh":"灰色"} },
  { id: "silver", hex: "#b0bec5", words: {"en":"silver","de":"silber","es":"plata","fr":"argent","tr":"gümüş","pt":"prata","ku":"zîvîn","ru":"серебряный","zh":"银色"} },
  { id: "black", hex: "#333333", words: {"en":"black","de":"schwarz","es":"negro","fr":"noir","tr":"siyah","pt":"preto","ku":"reş","ru":"чёрный","zh":"黑色"} },
  { id: "white", hex: "#ffffff", words: {"en":"white","de":"weiß","es":"blanco","fr":"blanc","tr":"beyaz","pt":"branco","ku":"spî","ru":"белый","zh":"白色"} },
];
const nameOf = (c, code) => (c.words ? c.words[code] ?? c.words.en : "🎨");

const PICTURE = `
<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Boyama resmi">
  <g stroke="#3b2a1e" stroke-width="4" stroke-linejoin="round" fill="#fff">
    <rect class="paint" x="0" y="0" width="400" height="190"/>
    <rect class="paint" x="0" y="190" width="400" height="70"/>
    <circle class="paint" cx="335" cy="55" r="32"/>
    <path class="paint" d="M40 70 q10 -28 38 -18 q22 -22 44 2 q30 -4 26 24 q-4 18 -30 16 h-70 q-26 -4 -8 -24z"/>
    <rect class="paint" x="205" y="120" width="26" height="80"/>
    <circle class="paint" cx="218" cy="92" r="46"/>
    <rect class="paint" x="50" y="120" width="120" height="90"/>
    <path class="paint" d="M38 122 L110 62 L182 122Z"/>
    <rect class="paint" x="96" y="160" width="30" height="50"/>
    <rect class="paint" x="62" y="134" width="26" height="24"/>
    <rect class="paint" x="134" y="134" width="26" height="24"/>
    <circle class="paint" cx="300" cy="212" r="20"/>
    <path class="paint" d="M286 196 l-8 -14 l16 6z"/>
    <path class="paint" d="M314 196 l8 -14 l-16 6z"/>
  </g>
</svg>`;

// Boyama: bir renk seç, resimde bir yere dokun. Rengin adı seçilen dilde söylenir.
export function coloring(stage, { lang, code, back }) {
  let current = PALETTE[0];
  const name = h("strong", { class: "color-name" });
  const palette = h("div", { class: "palette" });
  const choose = (c) => {
    current = c;
    name.textContent = nameOf(c, code);
    name.style.color = c.hex === "#ffffff" ? "#9e9e9e" : c.hex;
    if (c.words) speak(nameOf(c, code), c.words[code] ? lang.speech : "en-US");
    [...palette.children].forEach((b) => b.classList.toggle("on", b.dataset.id === c.id));
  };
  palette.append(...PALETTE.map((c) => h("button", { class: "paint-pot", "data-id": c.id, title: nameOf(c, code), style: { background: c.hex }, onclick: () => choose(c) })));
  // Kendi rengini seç: tarayıcının renk seçicisi.
  palette.append(h("input", { type: "color", class: "paint-pot custom", "data-id": "custom", value: "#00bcd4", title: "Kendi rengini seç",
    oninput: (e) => choose({ id: "custom", hex: e.target.value, words: null }) }));
  const canvas = h("div", { class: "canvas" });
  canvas.innerHTML = PICTURE; // sabit, güvenilir içerik
  canvas.addEventListener("click", (e) => {
    if (!e.target.classList?.contains("paint")) return;
    pop();
    e.target.setAttribute("fill", current.hex);
  });
  put(stage, h("div", { class: "coloring" },
    h("h2", {}, "🖍️ Boyama sayfası"),
    h("div", { class: "paint-layout" },
      h("div", { class: "paint-side" }, h("p", {}, "Renk: ", name), palette), canvas)),
    h("div", { class: "row-center" },
      h("button", { class: "btn ghost", onclick: back }, "← Dersler"),
      h("button", { class: "btn", onclick: () => canvas.querySelectorAll(".paint").forEach((p) => p.setAttribute("fill", "#fff")) }, "Temizle")));
  choose(current);
}
