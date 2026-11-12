// Geçmiş: sohbet konuları ve seviyeleri, kart günleri, sınav sonuçları.
import { h } from "../core/dom.js";
import { charts } from "./charts.js";
import { resultsBox } from "./results.js";
import { state } from "../core/store.js";
import { LANGS } from "../langs/index.js";

const LEVEL = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const KIND = {
  chat: (e) => ["🧸", `Brensyt ile: ${e.topic}`, `Seviye: ${LEVEL[e.level] || "-"}`],
  cards: (e) => ["🃏", `${e.count} yeni kelime öğrenildi`, e.mistakes ? `${e.mistakes} kez takıldın` : "Hatasız!"],
  review: (e) => ["🔁", `${e.count} kelime tekrar edildi`, e.mistakes ? `${e.mistakes} kez takıldın` : "Hatasız!"],
  exam: (e) => ["⏱️", `Sınav: ${e.correct}/${e.total} (%${e.score})`, e.timedOut ? "Süre bitti" : "Zamanında bitti"],
  plan: (e) => ["🗓️", e.topic, `Seviye: ${LEVEL[e.level] || "-"}`],
  idiom: (e) => ["🐔", `Tavuk avı: ${e.correct}/${e.total}`, ""],
  listening: (e) => ["🎧", `Dinleme: ${e.topic}`, `${e.correct}/${e.total} doğru`],
  speaking: (e) => ["🎤", `Konuşma provası: ${e.topic}`, `Seviye: ${LEVEL[e.level] || "-"}`],
  duel: (e) => ["⚔️", `Düello: ${e.topic}`, `${e.correct} – ${e.total}`],
  mock: (e) => ["📝", `${e.exam} denemesi: ${e.correct}/${e.total} (%${e.score})`, e.timedOut ? "Süre bitti" : ""],
  reading: (e) => ["📰", `Okuma: ${e.topic}`, `${e.correct}/${e.total} doğru`],
  writing: (e) => ["✍️", `Yazma: ${e.topic}`, `Seviye: ${LEVEL[e.level] || "-"}`],
  grammar: (e) => ["📐", `Dil bilgisi: ${e.topic}`, `${e.correct}/${e.total} doğru`],
};

export function renderHistory(root) {
  const s = state();
  const fmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  root.append(h("h1", {}, "Geçmiş ve ilerleme"),
    h("p", { class: "lead" }, `En uzun serin ${s.bestStreak} gün. Toplam ${Object.values(s.learned).reduce((n, l) => n + l.length, 0)} kelime öğrendin.`),
    charts(),
    resultsBox(),
    s.history.length
      ? h("ol", { class: "timeline" }, s.history.map((e) => {
        const [icon, title, sub] = (KIND[e.type] || (() => ["•", e.type, ""]))(e);
        const lang = LANGS[e.lang];
        return h("li", {}, h("span", { class: "tl-icon" }, icon),
          h("div", {}, h("strong", {}, title), h("span", {}, [lang && `${lang.flag} ${lang.name}`, sub].filter(Boolean).join(" · ")),
            h("time", {}, fmt.format(new Date(e.date)))));
      }))
      : h("p", { class: "muted" }, "Henüz kayıt yok. İlk kartlarını bitirince burada görünecek."));
}
