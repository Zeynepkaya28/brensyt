// Her kullanıcının verisi bu cihazda, kendi anahtarı altında saklanır. Bulut açıksa aynı veri Supabase'e de yazılır.
import { cloudEnabled, schedulePush, pull as cloudPull } from "./cloud.js";

const PREFIX = "brensyt:data:";
let email = null;
let data = null;

const pad = (n) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const daysBetween = (a, b) => Math.round((new Date(b + "T00:00") - new Date(a + "T00:00")) / 86400000);

function defaults() {
  const start = dayKey();
  return {
    profile: null, lang: "en", level: "easy",
    quota: 5, streak: 0, bestStreak: 0, lastDone: null, doneDays: [],
    learned: {}, today: null, history: [], xp: 0, plan: null,
    // YDS ve YDT tarihleri core/exam-dates.js içindeki ÖSYM takviminden doldurulur.
    exams: [
      { id: "yds", name: "YDS", date: "", start },
      { id: "ydt", name: "YDT", date: "", start },
      { id: "ielts", name: "IELTS", date: "", start },
      { id: "toefl", name: "TOEFL", date: "", start },
    ],
  };
}

export function open(userEmail) {
  email = userEmail;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(PREFIX + email)) || {}; } catch { /* bozuk kayıt: sıfırdan başla */ }
  data = { ...defaults(), ...saved };
  return data;
}
export function close() { email = null; data = null; }
export const state = () => data;
export function save() {
  if (!email) return;
  data._at = Date.now();
  localStorage.setItem(PREFIX + email, JSON.stringify(data));
  if (cloudEnabled()) schedulePush(() => data);
}

// Giriş yapınca bulutla eşitler: hangisi daha yeniyse o geçerli olur.
export async function pull() {
  if (!cloudEnabled() || !email) return;
  const remote = await cloudPull();
  if (remote?.data && new Date(remote.updated_at).getTime() > (data._at || 0)) {
    data = { ...defaults(), ...remote.data };
    localStorage.setItem(PREFIX + email, JSON.stringify(data));
  } else save();
}

export function addHistory(entry) {
  data.history.unshift({ date: new Date().toISOString(), ...entry });
  data.history = data.history.slice(0, 200);
  save();
}
