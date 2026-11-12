// Brensyt'in dolabı ve rozetler. Varsayılan kıyafet: kırmızı atkı, kahverengi bere.
import { state, save } from "./store.js";

export const WARDROBE = {
  scarf: [
    { id: "red", name: "Kırmızı atkı", price: 0, colors: ["#d62828", "#c21f1f"] },
    { id: "navy", name: "Lacivert atkı", price: 80, colors: ["#27408b", "#1d3170"] },
    { id: "green", name: "Yeşil atkı", price: 80, colors: ["#2f7d5b", "#22614a"] },
    { id: "mustard", name: "Hardal atkı", price: 120, colors: ["#d99a1c", "#b57f12"] },
    { id: "purple", name: "Mor atkı", price: 120, colors: ["#7b3fa0", "#5f2f7d"] },
  ],
  beret: [
    { id: "brown", name: "Kahverengi bere", price: 0, colors: ["#5b3a1e", "#442a14"] },
    { id: "black", name: "Siyah bere", price: 80, colors: ["#2b2b2b", "#151515"] },
    { id: "bordo", name: "Bordo bere", price: 120, colors: ["#7a1f2b", "#5a151f"] },
    { id: "blue", name: "Mavi bere", price: 120, colors: ["#3d6fb4", "#2c558f"] },
  ],
  extra: [
    { id: "flower", name: "Bere çiçeği", price: 100, icon: "🌸" },
    { id: "glasses", name: "Okuma gözlüğü", price: 150, icon: "👓" },
    { id: "star", name: "Yıldız rozeti", price: 200, icon: "⭐" },
  ],
};
const DEFAULT = { scarf: "red", beret: "brown", extras: [] };

export function outfit() {
  const s = state();
  s.outfit ??= structuredClone(DEFAULT);
  s.owned ??= ["scarf:red", "beret:brown"];
  return s.outfit;
}
export const owns = (kind, id) => { outfit(); return state().owned.includes(`${kind}:${id}`); };

// Kıyafeti sayfadaki bütün Brensyt çizimlerine uygular.
export function applyOutfit(o = state() ? outfit() : DEFAULT) {
  const root = document.documentElement;
  const scarf = WARDROBE.scarf.find((x) => x.id === o.scarf) || WARDROBE.scarf[0];
  const beret = WARDROBE.beret.find((x) => x.id === o.beret) || WARDROBE.beret[0];
  root.style.setProperty("--t-scarf", scarf.colors[0]);
  root.style.setProperty("--t-scarf-d", scarf.colors[1]);
  root.style.setProperty("--t-beret", beret.colors[0]);
  root.style.setProperty("--t-beret-d", beret.colors[1]);
  for (const x of WARDROBE.extra) root.classList.toggle("wear-" + x.id, o.extras.includes(x.id));
}
export const resetOutfit = () => applyOutfit(DEFAULT);

// Satın al (bal puanı yeterliyse) ve giy. Zaten sahipse yalnızca giyer/çıkarır.
export function wear(kind, id) {
  const s = state(), o = outfit();
  const item = WARDROBE[kind].find((x) => x.id === id);
  if (!owns(kind, id)) {
    if (s.xp < item.price) return false;
    s.xp -= item.price;
    s.owned.push(`${kind}:${id}`);
  }
  if (kind === "extra") o.extras = o.extras.includes(id) ? o.extras.filter((x) => x !== id) : [...o.extras, id];
  else o[kind] = id;
  save();
  applyOutfit();
  return true;
}

export function badges() {
  const s = state();
  const total = Object.values(s.learned).reduce((n, l) => n + l.length, 0);
  const langs = Object.values(s.learned).filter((l) => l.length).length;
  const goal = (value, target) => ({ done: value >= target, progress: `${Math.min(value, target)}/${target}` });
  return [
    { icon: "🐾", name: "İlk adım", text: "İlk kelimeni öğren", ...goal(total, 1) },
    { icon: "🔥", name: "Bir hafta", text: "7 günlük seri yap", ...goal(s.bestStreak, 7) },
    { icon: "🌋", name: "Bir ay", text: "30 günlük seri yap", ...goal(s.bestStreak, 30) },
    { icon: "📗", name: "Elli kelime", text: "50 kelime öğren", ...goal(total, 50) },
    { icon: "📚", name: "Yüz kelime", text: "100 kelime öğren", ...goal(total, 100) },
    { icon: "🏛️", name: "Kelime hazinesi", text: "250 kelime öğren", ...goal(total, 250) },
    { icon: "🌍", name: "Çok dilli", text: "3 farklı dilde kelime öğren", ...goal(langs, 3) },
    { icon: "🎯", name: "Tam isabet", text: "Bir sınavı hatasız bitir", ...goal(s.perfectExams || 0, 1) },
    { icon: "💬", name: "Sohbet kuşu", text: "Brensyt ile 5 sohbet yap", ...goal(s.history.filter((e) => e.type === "chat").length, 5) },
    { icon: "🐔", name: "Tavuk avcısı", text: "Kalıp oyununda 8/8 yap", ...goal(s.idiomBest || 0, 8) },
    { icon: "🧣", name: "Şık ayı", text: "Dolaptan 3 parça al", ...goal((s.owned || []).length - 2, 3) },
  ];
}
