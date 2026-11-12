// ÖSYM'nin açıkladığı sınav tarihleri (11 Kasım 2026'da kontrol edildi).
// Sınav geçince sıradaki oturuma kendiliğinden geçilir. Yeni takvim açıklanınca bu listeye ekleyin
// ya da Bugün sayfasındaki "Tarihleri canlı güncelle" düğmesini kullanın.
import { state, save, dayKey } from "./store.js";

const OSYM_2026 = "https://www.osym.gov.tr/Sayfa/SinavTakvimi/tr-TR";
const OSYM_2027 = "https://www.universitego.com/osym-sinav-takvimi/";
export const OFFICIAL = {
  yds: [
    { date: "2026-11-22", note: "2026-YDS/2 · saat 10.15 · sonuçlar 10 Aralık 2026", source: OSYM_2026 },
    { date: "2027-03-28", note: "2027-YDS/1 · başvuru 3–11 Şubat 2027", source: OSYM_2027 },
    { date: "2027-11-21", note: "2027-YDS/2", source: OSYM_2027 },
  ],
  ydt: [
    { date: "2027-06-20", note: "2027-YKS 3. oturum (YDT) · başvuru 4 Şubat–2 Mart 2027", source: OSYM_2027 },
  ],
};
const CHECKED = "2026-11-11";

// Tahmini ya da geçmiş kalmış YDS/YDT tarihlerini açıklanan en yakın oturumla değiştirir.
// Kullanıcının elle girdiği tarihe dokunmaz.
export function syncOfficialDates() {
  const s = state(), today = dayKey();
  let changed = false;
  for (const exam of s.exams) {
    const list = OFFICIAL[exam.id];
    if (!list) continue;
    const stale = exam.guess || !exam.date || (exam.official && exam.date < today);
    if (!stale) continue;
    const next = list.find((x) => x.date >= today);
    if (!next) { if (exam.guess) { exam.date = ""; exam.guess = false; changed = true; } continue; }
    Object.assign(exam, { ...next, guess: false, official: true, checked: CHECKED, start: exam.official ? today : exam.start });
    changed = true;
  }
  if (changed) save();
}
