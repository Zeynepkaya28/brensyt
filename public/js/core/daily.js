// Günlük kelime mantığı: günde 5 kelime; her tamamlanan 7 günlük seride +1 (en fazla 100).
// Tekrar mantığı (aralıklı tekrar): bilinen kelime 1, 3, 7, 14, 30 gün sonra yeniden sorulur; takılınan kelime ertesi gün gelir.
import { LANGS } from "../langs/index.js";
import { state, save, dayKey, daysBetween } from "./store.js";

export const MAX_QUOTA = 100;
export const INTERVALS = [1, 3, 7, 14, 30];
export const FREEZE_PRICE = 150;
export const MAX_FREEZES = 2;
const LEVEL_ORDER = {
  easy: ["Benim", "A1", "A2", "B1", "B2", "C1"],
  medium: ["Benim", "A2", "B1", "B2", "A1", "C1"],
  hard: ["Benim", "C1", "B2", "B1", "A2", "A1"],
};

function dayAfter(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

// Dilin destesi: modüldeki kelimeler + kullanıcının okuma parçalarından eklediği kendi kelimeleri.
export function deckWords(lang) {
  const base = LANGS[lang].words;
  const have = new Set(base.map((x) => x.w));
  const mine = (state().custom?.[lang] || []).filter((x) => !have.has(x.w))
    .map((x) => ({ w: x.w, m: [x.m], pron: "", ex: "", exTr: "", level: "Benim" }));
  return [...base, ...mine];
}
export function addCustomWord(lang, w, m) {
  const s = state();
  s.custom ??= {};
  s.custom[lang] ??= [];
  if (deckWords(lang).some((x) => x.w === w)) return false;
  s.custom[lang].push({ w: w.slice(0, 60), m: m.slice(0, 120) });
  save();
  return true;
}
const wordMap = (lang) => new Map(deckWords(lang).map((x) => [x.w, x]));

export function learnedSet(lang) { return state().learned[lang] || []; }

export function learnedWords(lang) {
  const byWord = wordMap(lang);
  return learnedSet(lang).map((x) => byWord.get(x.w)).filter(Boolean);
}

// Bugün tekrar zamanı gelmiş kelimeler (en çok gecikenden başlayarak).
export function dueWords(lang) {
  const byWord = wordMap(lang), today = dayKey();
  return learnedSet(lang)
    .filter((x) => (x.due || x.d) <= today && byWord.has(x.w))
    .sort((a, b) => (a.due || a.d).localeCompare(b.due || b.d))
    .map((x) => byWord.get(x.w));
}

// Tekrar sonucu: ilk denemede bilindiyse aralık uzar, takılındıysa başa döner.
export function recordReview(lang, word, firstTry) {
  const entry = learnedSet(lang).find((x) => x.w === word);
  if (!entry) return;
  entry.box = firstTry ? Math.min((entry.box ?? 0) + 1, INTERVALS.length - 1) : 0;
  entry.due = dayAfter(INTERVALS[entry.box]);
  save();
}

// ---- Hata defteri: en çok takılınan kelimeler ----
export function addMistake(lang, word) {
  const s = state();
  s.mistakes ??= {};
  s.mistakes[lang] ??= {};
  s.mistakes[lang][word] = (s.mistakes[lang][word] || 0) + 1;
  save();
}
export function easeMistake(lang, word) {
  const m = state().mistakes?.[lang];
  if (!m?.[word]) return;
  if (--m[word] <= 0) delete m[word];
  save();
}
export function hardWords(lang) {
  const byWord = wordMap(lang);
  return Object.entries(state().mistakes?.[lang] || {})
    .filter(([w]) => byWord.has(w)).sort((a, b) => b[1] - a[1])
    .map(([w, count]) => ({ word: byWord.get(w), count }));
}

// ---- Seri ----
// Bir gün kaçırıldıysa ve "seri dondurma" varsa seri bozulmaz (dondurma, sonraki tamamlanan günde harcanır).
function streakAlive(s, today) {
  if (!s.lastDone) return false;
  const gap = daysBetween(s.lastDone, today);
  return gap <= 1 || (gap === 2 && (s.freezes || 0) > 0);
}
export function currentStreak() {
  const s = state();
  return streakAlive(s, dayKey()) ? s.streak : 0;
}
export function buyFreeze() {
  const s = state();
  if (s.xp < FREEZE_PRICE || (s.freezes || 0) >= MAX_FREEZES) return false;
  s.xp -= FREEZE_PRICE;
  s.freezes = (s.freezes || 0) + 1;
  save();
  return true;
}

export function todaySet(lang) {
  const s = state(), key = dayKey();
  if (!s.today || s.today.date !== key) s.today = { date: key, sets: {} };
  if (!s.today.sets[lang]) {
    const known = new Set(learnedSet(lang).map((x) => x.w));
    const order = LEVEL_ORDER[s.level] || LEVEL_ORDER.easy;
    const rank = (x) => { const i = order.indexOf(x.level); return i < 0 ? order.length : i; };
    const words = deckWords(lang).filter((x) => !known.has(x.w))
      .sort((a, b) => rank(a) - rank(b)).slice(0, s.quota).map((x) => x.w);
    s.today.sets[lang] = { words, done: false };
    save();
  }
  const set = s.today.sets[lang];
  const byWord = wordMap(lang);
  return { done: set.done, words: set.words.map((w) => byWord.get(w)).filter(Boolean) };
}

// Günün kartları bitince çağrılır. Seriyi ve günlük kelime sayısını günceller.
export function completeToday(lang) {
  const s = state(), key = dayKey(), set = s.today.sets[lang];
  if (set.done) return { quotaUp: false, streak: s.streak, quota: s.quota };
  set.done = true;
  s.learned[lang] = [...learnedSet(lang), ...set.words.map((w) => ({ w, d: key, box: 0, due: dayAfter(1) }))];
  s.xp += set.words.length * 10;
  let quotaUp = false, frozen = false;
  if (s.lastDone !== key) {
    const gap = s.lastDone ? daysBetween(s.lastDone, key) : 99;
    if (gap === 2 && (s.freezes || 0) > 0) { s.freezes--; frozen = true; }
    s.streak = gap === 1 || frozen ? s.streak + 1 : 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.lastDone = key;
    s.doneDays = [...new Set([...s.doneDays, key])].slice(-60);
    if (s.streak % 7 === 0 && s.quota < MAX_QUOTA) { s.quota += 1; quotaUp = true; }
  }
  save();
  return { quotaUp, frozen, streak: s.streak, quota: s.quota };
}

const fold = (t) => t.toLocaleLowerCase("tr")
  .replace(/[.,!?;:'"“”‘’()¡¿。！？]/g, " ").replace(/\s+/g, " ").trim().replace(/^(to|-e|-a) /, "");
const ascii = (t) => t.replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ç/g, "c")
  .replace(/ö/g, "o").replace(/ü/g, "u").replace(/â/g, "a").replace(/î/g, "i");
export const normalize = (t) => ascii(fold(t));

// Yazılan anlam kabul edilen anlamlardan biriyle eşleşiyor mu? (büyük/küçük harf ve Türkçe karakter hoşgörülü)
export function isCorrect(answer, meanings) {
  const a = normalize(answer);
  return a.length > 0 && meanings.some((m) => normalize(m) === a);
}
