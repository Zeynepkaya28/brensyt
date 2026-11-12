// Konuşma sınavı provası: soruyu gör, mikrofona cevapla (ya da yaz), Brensyt değerlendirsin.
import { put, h, shuffle, speak } from "../core/dom.js";
import { state, addHistory } from "../core/store.js";
import { askBrensyt, AI_ERRORS } from "../core/ai.js";
import { canListen, listenLong, VOICE_ERRORS } from "../core/voice.js";

const SECONDS = 60;
// [sınav bölümü, soru (İngilizce modülde İngilizce sorulur), Türkçe açıklaması]
const PROMPTS = {
  "IELTS Speaking Part 1": [
    ["Tell me about your hometown.", "Yaşadığın şehri anlat."],
    ["What do you do in your free time?", "Boş zamanlarında ne yaparsın?"],
    ["Do you prefer mornings or evenings? Why?", "Sabahları mı akşamları mı seversin? Neden?"],
    ["What kind of food do you like?", "Ne tür yemekleri seversin?"],
  ],
  "IELTS Speaking Part 2": [
    ["Describe a person who has influenced you. Say who they are, how you met, and why they matter to you.", "Seni etkileyen bir insanı anlat."],
    ["Describe a place you would like to visit. Say where it is, what you would do there, and why.", "Gitmek istediğin bir yeri anlat."],
    ["Describe a skill you would like to learn and explain why.", "Öğrenmek istediğin bir beceriyi anlat."],
  ],
  "TOEFL Independent Speaking": [
    ["Some people like to study alone, others in a group. Which do you prefer and why?", "Tek başına mı grupla mı çalışmayı seversin?"],
    ["Do you agree or disagree: it is better to live in a big city than in a small town.", "Büyük şehirde yaşamak daha mı iyi?"],
  ],
  "Günlük konuşma": [
    ["Introduce yourself.", "Kendini tanıt."],
    ["Describe what you did yesterday.", "Dün ne yaptığını anlat."],
    ["Talk about your family.", "Aileni anlat."],
    ["What are your plans for the weekend?", "Hafta sonu planların neler?"],
  ],
};

export function speaking(box, lang) {
  const s = state();
  const english = lang.code === "en";
  const kinds = english ? Object.keys(PROMPTS) : ["Günlük konuşma"];
  let kind = kinds[0], prompt = null, stopMic = null, timer = null, startedAt = 0;

  const kindSelect = h("select", { "aria-label": "Sınav bölümü", onchange: (e) => { kind = e.target.value; newPrompt(); } }, kinds.map((k) => h("option", { value: k }, k)));
  const question = h("div", { class: "speak-q" });
  const transcript = h("textarea", { rows: 6, maxLength: 3000, placeholder: `Cevabın burada yazıya dökülür. Mikrofon yoksa ${lang.name} olarak buraya yazabilirsin.` });
  const clock = h("span", { class: "clock" }, "1:00");
  const stats = h("p", { class: "muted tiny" });
  const note = h("p", { class: "note", role: "status" });
  const out = h("div", { class: "plan-ai" });

  function newPrompt() {
    stopRecording();
    prompt = shuffle(PROMPTS[kind])[0];
    transcript.value = "";
    stats.textContent = "";
    out.className = "plan-ai";
    put(question, h("small", {}, kind), h("strong", {}, english ? prompt[0] : prompt[1]),
      english && h("span", { class: "muted" }, prompt[1]),
      english && h("button", { class: "round tiny-btn", title: "Soruyu dinle", onclick: () => speak(prompt[0], lang.speech) }, "🔊"));
  }

  function stopRecording() {
    clearInterval(timer);
    timer = null;
    stopMic?.();
    stopMic = null;
    micBtn.textContent = "🎤 Cevaplamaya başla";
    micBtn.classList.remove("listening");
    if (startedAt) {
      const secs = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const words = transcript.value.trim() ? transcript.value.trim().split(/\s+/).length : 0;
      stats.textContent = `${secs} saniye konuştun, ${words} kelime (dakikada yaklaşık ${Math.round((words / secs) * 60)} kelime).`;
      startedAt = 0;
    }
  }

  const micBtn = h("button", { class: "btn", disabled: !canListen(lang.speech), onclick: () => {
    if (stopMic) return stopRecording();
    note.textContent = "";
    transcript.value = "";
    startedAt = Date.now();
    let left = SECONDS;
    clock.textContent = "1:00";
    micBtn.textContent = "⏹ Bitir";
    micBtn.classList.add("listening");
    stopMic = listenLong(lang.speech, (text) => (transcript.value = text), (err) => {
      note.textContent = VOICE_ERRORS[err] || VOICE_ERRORS.failed;
      note.className = "note bad";
      startedAt = 0;
      stopRecording();
    });
    timer = setInterval(() => {
      left--;
      clock.textContent = `0:${String(Math.max(0, left)).padStart(2, "0")}`;
      if (left <= 0) stopRecording();
    }, 1000);
  } }, "🎤 Cevaplamaya başla");

  const judge = h("button", { class: "btn ghost", onclick: async () => {
    stopRecording();
    if (transcript.value.trim().length < 15) { note.textContent = "Önce birkaç cümle söyle ya da yaz."; note.className = "note bad"; return; }
    judge.disabled = true;
    out.className = "plan-ai show";
    out.textContent = "Brensyt dinliyor…";
    try {
      await askBrensyt({ lang: lang.code, level: s.level, mode: "speaking", topic: kind, search: false,
        messages: [{ role: "user", content: `Soru: ${prompt[0]}\n\nCevabımın yazıya dökülmüş hali:\n${transcript.value}` }] }, (t) => (out.textContent = t));
      addHistory({ type: "speaking", lang: lang.code, level: s.level, topic: kind });
    } catch (err) { out.textContent = AI_ERRORS[err.message] || AI_ERRORS.failed; }
    judge.disabled = false;
  } }, "🧸 Brensyt değerlendirsin");

  put(box, h("div", { class: "writing" },
    h("div", { class: "row-left" }, h("label", { class: "field" }, h("span", {}, "Bölüm"), kindSelect),
      h("button", { class: "btn ghost small", onclick: newPrompt }, "Başka soru")),
    question,
    h("div", { class: "row-left" }, micBtn, clock),
    !canListen(lang.speech) && h("p", { class: "muted tiny" }, "Bu tarayıcıda ya da bu dilde konuşma tanıma yok; cevabını yazarak da değerlendirtebilirsin."),
    transcript, stats, note, h("div", { class: "row-left" }, judge), out));
  newPrompt();
  return stopRecording;
}
