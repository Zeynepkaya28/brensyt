// Çocuk bölümü: animasyonlu "video" dersler, sesli kelimeler, eşleştirme ve hafıza oyunu, ebeveyn özeti.
import { put, h, shuffle, confetti, speak, tilt } from "../core/dom.js";
import { teddy, trackEyes } from "../core/teddy.js";
import { state, save, addHistory } from "../core/store.js";
import { LANGS, LANG_LIST } from "../langs/index.js";
import { ding, growl, fanfare, pop } from "../core/audio.js";
import { song, coloring } from "./kids-extra.js";
import { story, parentGate, limitControl, watchLimit } from "./kids-more.js";

// Sıra: en, de, es, fr, tr, pt, ku, ru, zh
const ORDER = ["en", "de", "es", "fr", "tr", "pt", "ku", "ru", "zh"];
const item = (pic, ...words) => ({ pic, words: Object.fromEntries(ORDER.map((c, i) => [c, words[i]])) });
const LESSONS = [
  { id: "animals", title: "Hayvanlar", icon: "🐱", sky: "meadow", items: [
    item("🐱", "cat", "Katze", "gato", "chat", "kedi", "gato", "pisîk", "кошка", "猫"),
    item("🐶", "dog", "Hund", "perro", "chien", "köpek", "cachorro", "kûçik", "собака", "狗"),
    item("🐦", "bird", "Vogel", "pájaro", "oiseau", "kuş", "pássaro", "çûk", "птица", "鸟"),
    item("🐟", "fish", "Fisch", "pez", "poisson", "balık", "peixe", "masî", "рыба", "鱼"),
    item("🐴", "horse", "Pferd", "caballo", "cheval", "at", "cavalo", "hesp", "лошадь", "马"),
  ] },
  { id: "colors", title: "Renkler", icon: "🎨", sky: "rainbow", items: [
    item("🔴", "red", "rot", "rojo", "rouge", "kırmızı", "vermelho", "sor", "красный", "红色"),
    item("🔵", "blue", "blau", "azul", "bleu", "mavi", "azul", "şîn", "синий", "蓝色"),
    item("🟢", "green", "grün", "verde", "vert", "yeşil", "verde", "kesk", "зелёный", "绿色"),
    item("🟡", "yellow", "gelb", "amarillo", "jaune", "sarı", "amarelo", "zer", "жёлтый", "黄色"),
    item("⚫", "black", "schwarz", "negro", "noir", "siyah", "preto", "reş", "чёрный", "黑色"),
  ] },
  { id: "numbers", title: "Sayılar", icon: "🔢", sky: "night", items: [
    item("1", "one", "eins", "uno", "un", "bir", "um", "yek", "один", "一"),
    item("2", "two", "zwei", "dos", "deux", "iki", "dois", "du", "два", "二"),
    item("3", "three", "drei", "tres", "trois", "üç", "três", "sê", "три", "三"),
    item("4", "four", "vier", "cuatro", "quatre", "dört", "quatro", "çar", "четыре", "四"),
    item("5", "five", "fünf", "cinco", "cinq", "beş", "cinco", "pênc", "пять", "五"),
  ] },
  { id: "fruits", title: "Meyveler", icon: "🍎", sky: "garden", items: [
    item("🍎", "apple", "Apfel", "manzana", "pomme", "elma", "maçã", "sêv", "яблоко", "苹果"),
    item("🍌", "banana", "Banane", "plátano", "banane", "muz", "banana", "mûz", "банан", "香蕉"),
    item("🍇", "grapes", "Trauben", "uvas", "raisin", "üzüm", "uva", "tirî", "виноград", "葡萄"),
    item("🍊", "orange", "Orange", "naranja", "orange", "portakal", "laranja", "pirteqal", "апельсин", "橙子"),
    item("🍉", "watermelon", "Wassermelone", "sandía", "pastèque", "karpuz", "melancia", "zebeş", "арбуз", "西瓜"),
  ] },
  { id: "family", title: "Ailem", icon: "👨‍👩‍👧", sky: "rainbow", items: [
    item("👩", "mother", "Mutter", "madre", "mère", "anne", "mãe", "dayik", "мама", "妈妈"),
    item("👨", "father", "Vater", "padre", "père", "baba", "pai", "bav", "папа", "爸爸"),
    item("👶", "baby", "Baby", "bebé", "bébé", "bebek", "bebê", "pitik", "малыш", "宝宝"),
    item("👵", "grandma", "Oma", "abuela", "grand-mère", "nine", "avó", "dapîr", "бабушка", "奶奶"),
    item("👴", "grandpa", "Opa", "abuelo", "grand-père", "dede", "avô", "bapîr", "дедушка", "爷爷"),
  ] },
  { id: "body", title: "Vücudum", icon: "✋", sky: "meadow", items: [
    item("👁️", "eye", "Auge", "ojo", "œil", "göz", "olho", "çav", "глаз", "眼睛"),
    item("👂", "ear", "Ohr", "oreja", "oreille", "kulak", "orelha", "guh", "ухо", "耳朵"),
    item("👃", "nose", "Nase", "nariz", "nez", "burun", "nariz", "poz", "нос", "鼻子"),
    item("✋", "hand", "Hand", "mano", "main", "el", "mão", "dest", "рука", "手"),
    item("🦶", "foot", "Fuß", "pie", "pied", "ayak", "pé", "pê", "нога", "脚"),
  ] },
  { id: "food", title: "Sofra", icon: "🍞", sky: "garden", items: [
    item("🍞", "bread", "Brot", "pan", "pain", "ekmek", "pão", "nan", "хлеб", "面包"),
    item("🧀", "cheese", "Käse", "queso", "fromage", "peynir", "queijo", "penîr", "сыр", "奶酪"),
    item("🥛", "milk", "Milch", "leche", "lait", "süt", "leite", "şîr", "молоко", "牛奶"),
    item("🥚", "egg", "Ei", "huevo", "œuf", "yumurta", "ovo", "hêk", "яйцо", "鸡蛋"),
    item("💧", "water", "Wasser", "agua", "eau", "su", "água", "av", "вода", "水"),
  ] },
  { id: "vehicles", title: "Taşıtlar", icon: "🚗", sky: "meadow", items: [
    item("🚗", "car", "Auto", "coche", "voiture", "araba", "carro", "erebe", "машина", "汽车"),
    item("🚌", "bus", "Bus", "autobús", "bus", "otobüs", "ônibus", "otobus", "автобус", "公共汽车"),
    item("✈️", "airplane", "Flugzeug", "avión", "avion", "uçak", "avião", "balafir", "самолёт", "飞机"),
    item("🚲", "bicycle", "Fahrrad", "bicicleta", "vélo", "bisiklet", "bicicleta", "bîsîklêt", "велосипед", "自行车"),
    item("🚢", "ship", "Schiff", "barco", "bateau", "gemi", "navio", "keştî", "корабль", "船"),
  ] },
  { id: "home", title: "Evim", icon: "🏠", sky: "garden", items: [
    item("🏠", "house", "Haus", "casa", "maison", "ev", "casa", "mal", "дом", "房子"),
    item("🛏️", "bed", "Bett", "cama", "lit", "yatak", "cama", "nivîn", "кровать", "床"),
    item("🪑", "chair", "Stuhl", "silla", "chaise", "sandalye", "cadeira", "kursî", "стул", "椅子"),
    item("🚪", "door", "Tür", "puerta", "porte", "kapı", "porta", "derî", "дверь", "门"),
    item("🪟", "window", "Fenster", "ventana", "fenêtre", "pencere", "janela", "pencere", "окно", "窗户"),
  ] },
  { id: "weather", title: "Hava", icon: "☀️", sky: "rainbow", items: [
    item("☀️", "sun", "Sonne", "sol", "soleil", "güneş", "sol", "tav", "солнце", "太阳"),
    item("🌧️", "rain", "Regen", "lluvia", "pluie", "yağmur", "chuva", "baran", "дождь", "雨"),
    item("❄️", "snow", "Schnee", "nieve", "neige", "kar", "neve", "berf", "снег", "雪"),
    item("☁️", "cloud", "Wolke", "nube", "nuage", "bulut", "nuvem", "ewr", "облако", "云"),
    item("🌈", "rainbow", "Regenbogen", "arcoíris", "arc-en-ciel", "gökkuşağı", "arco-íris", "keskesor", "радуга", "彩虹"),
  ] },
  { id: "school", title: "Okul", icon: "🎒", sky: "night", items: [
    item("📚", "book", "Buch", "libro", "livre", "kitap", "livro", "pirtûk", "книга", "书"),
    item("✏️", "pencil", "Bleistift", "lápiz", "crayon", "kalem", "lápis", "qelem", "карандаш", "铅笔"),
    item("🎒", "backpack", "Rucksack", "mochila", "sac à dos", "sırt çantası", "mochila", "çante", "рюкзак", "书包"),
    item("🏫", "school", "Schule", "escuela", "école", "okul", "escola", "dibistan", "школа", "学校"),
    item("⏰", "clock", "Uhr", "reloj", "horloge", "saat", "relógio", "saet", "часы", "钟"),
  ] },
  { id: "jobs", title: "Meslekler", icon: "🧑‍⚕️", sky: "meadow", items: [
    item("🧑‍⚕️", "doctor", "Arzt", "médico", "médecin", "doktor", "médico", "doktor", "врач", "医生"),
    item("🧑‍🏫", "teacher", "Lehrer", "maestro", "professeur", "öğretmen", "professor", "mamoste", "учитель", "老师"),
    item("🧑‍🍳", "cook", "Koch", "cocinero", "cuisinier", "aşçı", "cozinheiro", "aşpêj", "повар", "厨师"),
    item("👮", "police officer", "Polizist", "policía", "policier", "polis", "policial", "polîs", "полицейский", "警察"),
    item("🧑‍🌾", "farmer", "Bauer", "agricultor", "agriculteur", "çiftçi", "agricultor", "cotkar", "фермер", "农民"),
  ] },
  { id: "nature", title: "Doğa", icon: "🌳", sky: "garden", items: [
    item("🌳", "tree", "Baum", "árbol", "arbre", "ağaç", "árvore", "dar", "дерево", "树"),
    item("🌸", "flower", "Blume", "flor", "fleur", "çiçek", "flor", "kulîlk", "цветок", "花"),
    item("⛰️", "mountain", "Berg", "montaña", "montagne", "dağ", "montanha", "çiya", "гора", "山"),
    item("🌊", "sea", "Meer", "mar", "mer", "deniz", "mar", "derya", "море", "海"),
    item("🌙", "moon", "Mond", "luna", "lune", "ay", "lua", "heyv", "луна", "月亮"),
  ] },
];
const SLIDE_MS = 3800;
const MOVES = ["bounce", "spin", "slide", "grow", "swing"];

export function renderKids(root, ctx) {
  const s = state();
  let timer = null;
  let stopSong = null;
  const stop = () => { clearInterval(timer); timer = null; stopSong?.(); stopSong = null; window.speechSynthesis?.cancel(); };
  const stage = h("div", { class: "kid-stage" });
  const lang = () => LANGS[s.lang];
  const stars = (lessonId) => s.kidStars?.[s.lang]?.[lessonId] || 0;

  // Ebeveyn özeti: seçili dilde hangi ders kaç yıldızla bitirildi.
  function parentSummary() {
    const done = LESSONS.filter((l) => stars(l.id));
    return h("details", { class: "parent" },
      h("summary", {}, "👪 Ebeveyn özeti"),
      limitControl(),
      h("p", {}, done.length
        ? `${lang().name}: ${done.length}/${LESSONS.length} ders tamamlandı, yaklaşık ${done.length * 5} kelime görüldü.`
        : `${lang().name} için henüz tamamlanan ders yok.`),
      h("ul", {}, LESSONS.map((l) => h("li", {}, `${l.icon} ${l.title}: `, stars(l.id) ? "⭐".repeat(stars(l.id)) + ` (${stars(l.id)}/5)` : "başlanmadı"))));
  }

  const langSelect = h("select", { class: "lang-select", "aria-label": "Dil", onchange: (e) => { s.lang = e.target.value; save(); menu(); } },
    LANG_LIST.map((l) => h("option", { value: l.code, selected: l.code === s.lang }, `${l.flag} ${l.name}`)));

  function menu() {
    stop();
    put(stage, 
      h("div", { class: "kid-hello" }, trackEyes(teddy("wave")),
        h("div", { class: "bubble pop" }, `Merhaba! Bugün ${lang().name} öğreniyoruz. Bir ders seç!`)),
      h("div", { class: "kid-tiles" }, LESSONS.map((l, i) => tilt(h("button", { class: "kid-tile c" + (i % 7), onclick: () => { pop(); play(l); } },
        h("span", { class: "kid-tile-icon" }, l.icon), h("strong", {}, l.title),
        h("span", {}, stars(l.id) ? "⭐".repeat(stars(l.id)) : "▶ İzle ve oyna")), 16))),
      h("div", { class: "row-center" },
        h("button", { class: "btn", onclick: () => { pop(); coloring(stage, { lang: lang(), code: s.lang, back: menu }); } }, "🖍️ Boyama sayfası"),
        h("button", { class: "btn", onclick: () => { pop(); story(stage, { lang: lang(), code: s.lang, back: menu }); } }, "📖 Hikâye kitabı")),
      parentSummary());
  }

  // "Video" oynatıcı: sahneler kendi kendine ilerler, kelime seslendirilir.
  function play(lesson) {
    stop();
    let i = 0, playing = true, elapsed = 0;
    const scene = h("div", { class: "scene " + lesson.sky });
    const fill = h("i");
    const playBtn = h("button", { class: "round big", title: "Oynat / duraklat", onclick: () => { playing = !playing; playBtn.textContent = playing ? "⏸" : "▶"; } }, "⏸");

    function show() {
      const it = lesson.items[i], word = it.words[s.lang];
      elapsed = 0;
      put(scene, 
        h("div", { class: "sun" }), h("div", { class: "cloud c1" }), h("div", { class: "cloud c2" }), h("div", { class: "hill" }),
        h("div", { class: "actor " + MOVES[i % MOVES.length] + (it.pic.length === 1 ? " digit" : "") }, it.pic),
        h("div", { class: "caption" },
          h("strong", {}, [...word].map((ch, n) => h("span", { style: { animationDelay: n * 0.07 + "s" } }, ch))),
          s.lang !== "tr" && h("small", {}, it.words.tr)),
        teddy("point"));
      speak(word, lang().speech);
    }
    const go = (n) => {
      i = n;
      if (i >= lesson.items.length) { stop(); return game(lesson); }
      if (i < 0) i = 0;
      show();
    };
    timer = setInterval(() => {
      if (!playing) return;
      elapsed += 100;
      fill.style.width = ((i + elapsed / SLIDE_MS) / lesson.items.length) * 100 + "%";
      if (elapsed >= SLIDE_MS) go(i + 1);
    }, 100);

    put(stage, 
      h("div", { class: "player" }, scene,
        h("div", { class: "player-bar" },
          h("button", { class: "round", title: "Önceki", onclick: () => go(i - 1) }, "⏮"), playBtn,
          h("button", { class: "round", title: "Sonraki", onclick: () => go(i + 1) }, "⏭"),
          h("div", { class: "bar" }, fill),
          h("button", { class: "round", title: "Tekrar dinle", onclick: () => speak(lesson.items[i].words[s.lang], lang().speech) }, "🔊"))),
      h("div", { class: "row-center" },
        h("button", { class: "btn ghost", onclick: menu }, "← Dersler"),
        h("button", { class: "btn", onclick: () => { stop(); game(lesson); } }, "Oyuna geç 🎮"),
        h("button", { class: "btn", onclick: () => { stop(); memory(lesson); } }, "Hafıza oyunu 🧠"),
        h("button", { class: "btn", onclick: () => { stop(); stopSong = song(stage, lesson, { lang: lang(), code: s.lang, back: () => play(lesson) }); } }, "Şarkı 🎵")));
    show();
  }

  // Oyun: kelimeyi duy, doğru resmi bul.
  function game(lesson) {
    const rounds = shuffle(lesson.items);
    let i = 0, stars = 0;
    const next = () => {
      if (i >= rounds.length) {
        fanfare();
        confetti();
        s.xp += stars * 2;
        s.kidStars ??= {};
        s.kidStars[s.lang] ??= {};
        s.kidStars[s.lang][lesson.id] = Math.max(s.kidStars[s.lang][lesson.id] || 0, stars);
        save();
        addHistory({ type: "review", lang: s.lang, count: rounds.length, mistakes: rounds.length - stars });
        return put(stage, h("div", { class: "kid-end" }, teddy("jump"),
          h("h2", {}, "Aferin sana!"), h("p", { class: "stars" }, "⭐".repeat(stars) + "☆".repeat(rounds.length - stars)),
          h("div", { class: "row-center" },
            h("button", { class: "btn", onclick: () => memory(lesson) }, "Hafıza oyunu 🧠"),
            h("button", { class: "btn ghost", onclick: () => play(lesson) }, "Tekrar izle"),
            h("button", { class: "btn ghost", onclick: menu }, "Başka ders"))));
      }
      const it = rounds[i], word = it.words[s.lang];
      let first = true;
      const choices = shuffle([it, ...shuffle(lesson.items.filter((x) => x !== it)).slice(0, 2)]);
      put(stage, h("div", { class: "kid-game" },
        h("p", { class: "phase" }, `${i + 1} / ${rounds.length}`),
        h("h2", { class: "kid-word" }, word, " ", lang().speech && h("button", { class: "round", onclick: () => speak(word, lang().speech) }, "🔊")),
        h("p", {}, "Hangisi?"),
        h("div", { class: "kid-choices" }, choices.map((c) => h("button", { class: "kid-choice" + (c.pic.length === 1 ? " digit" : ""), onclick: (e) => {
          if (c === it) {
            ding();
            e.currentTarget.classList.add("right");
            if (first) stars++;
            setTimeout(() => { i++; next(); }, 800);
          } else {
            growl();
            first = false;
            e.currentTarget.classList.remove("shake");
            void e.currentTarget.offsetWidth;
            e.currentTarget.classList.add("shake");
          }
        } }, c.pic)))));
      speak(word, lang().speech);
    };
    next();
  }

  // Hafıza oyunu: resmi kelimesiyle eşleştir.
  function memory(lesson) {
    const cards = shuffle(lesson.items.flatMap((it, n) => [
      { pair: n, text: it.pic, pic: true },
      { pair: n, text: it.words[s.lang], pic: false },
    ]));
    let open = [], found = 0, moves = 0, busy = false;
    const counter = h("p", { class: "phase" }, "Hamle: 0");
    const grid = h("div", { class: "memory" }, cards.map((c) => {
      const el = h("button", { class: "flip mem", "aria-label": "Kart", onclick: () => {
        if (busy || el.classList.contains("flipped")) return;
        pop();
        el.classList.add("flipped");
        if (!c.pic) speak(c.text, lang().speech);
        open.push({ c, el });
        if (open.length < 2) return;
        counter.textContent = "Hamle: " + ++moves;
        const [a, b] = open;
        open = [];
        if (a.c.pair === b.c.pair) {
          ding();
          a.el.classList.add("matched");
          b.el.classList.add("matched");
          if (++found === lesson.items.length) setTimeout(() => {
            fanfare();
            confetti();
            put(stage, h("div", { class: "kid-end" }, teddy("jump"), h("h2", {}, "Hepsini buldun!"),
              h("p", {}, `${moves} hamlede bitirdin.`),
              h("div", { class: "row-center" },
                h("button", { class: "btn", onclick: () => memory(lesson) }, "Tekrar oyna"),
                h("button", { class: "btn ghost", onclick: menu }, "Başka ders"))));
          }, 700);
        } else {
          busy = true;
          setTimeout(() => { a.el.classList.remove("flipped"); b.el.classList.remove("flipped"); busy = false; }, 900);
        }
      } }, h("div", { class: "flip-inner" },
        h("div", { class: "face front" }, "🧸"),
        h("div", { class: "face back" + (c.pic ? " pic" : "") + (c.pic && c.text.length === 1 ? " digit" : "") }, c.text)));
      return el;
    }));
    put(stage, h("h2", {}, `${lesson.icon} ${lesson.title}: eşini bul`), counter, grid,
      h("div", { class: "row-center" }, h("button", { class: "btn ghost", onclick: menu }, "← Dersler")));
  }

  root.append(h("div", { class: "kids" },
    h("header", { class: "kid-top" },
      h("span", { class: "kid-logo" }, "🎈 Brensyt Çocuk"),
      h("div", { class: "top-right" }, langSelect,
        h("button", { class: "chip-btn", onclick: async () => { if (await parentGate()) { stop(); stopLimit(); ctx.exit(); } } }, "🎓 Büyükler"),
        h("button", { class: "chip-btn", onclick: async () => { if (await parentGate()) { stop(); stopLimit(); ctx.logout(); } } }, "Çıkış"))),
    stage));
  menu();
  const stopLimit = watchLimit(() => { stop(); stopLimit(); ctx.exit(); });
  return () => { stop(); stopLimit(); };
}
