// Brensyt ile sohbet: çeviri masası ya da "bugünkü konumuz" egzersizi. Seviye ve konu geçmişe kaydedilir.
import { put, h, speak } from "../core/dom.js";
import { teddy, trackEyes } from "../core/teddy.js";
import { state, save, addHistory } from "../core/store.js";
import { askBrensyt, AI_ERRORS } from "../core/ai.js";
import { pop } from "../core/audio.js";

const LEVELS = [["easy", "Kolay"], ["medium", "Orta"], ["hard", "Zor"]];
const TOPICS = ["Kafede sipariş", "Havalimanında", "Kendini tanıtma", "İş görüşmesi", "Doktorda", "Yol tarifi", "Alışveriş", "Hava durumu", "Hobiler", "Sınav kompozisyonu"];

export function renderChat(root, ctx) {
  const s = state(), lang = ctx.lang;
  let mode = "topic", topic = TOPICS[new Date().getDate() % TOPICS.length], search = true;
  let messages = [], busy = false, logged = false;

  const log = h("div", { class: "chat-log", "aria-live": "polite" });
  const bear = trackEyes(teddy("small"));
  const input = h("textarea", { rows: 2, maxLength: 2000, placeholder: "Brensyt'e yaz…", onkeydown: (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  } });
  const sendBtn = h("button", { class: "btn" }, "Gönder");
  const form = h("form", { class: "chat-form", onsubmit: (e) => { e.preventDefault(); send(input.value); } }, input, sendBtn);

  function bubble(role, text = "") {
    const body = h("div", { class: "msg-text" }, text);
    const el = h("div", { class: "msg " + role }, role === "assistant" && h("span", { class: "msg-face" }, "🧸"), body);
    log.append(el);
    log.scrollTop = log.scrollHeight;
    return { el, body };
  }

  function intro() {
    messages = [];
    logged = false;
    put(log, );
    const idiom = lang.idioms[Math.floor(Math.random() * lang.idioms.length)];
    bubble("assistant", mode === "topic"
      ? `Bugünkü konumuz: ${topic}. Hazırsan “başlayalım” yaz, ${lang.name} pratiğine geçelim!`
      : `Çeviri masasına hoş geldin! Türkçe ya da ${lang.name} bir cümle yaz; kelimesi kelimesine değil, anlamıyla çevireyim.\n\nÖrnek: “${idiom.p}” → “${idiom.nat}” (“${idiom.lit}” değil!)`);
  }

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    input.value = "";
    bubble("user", text);
    messages.push({ role: "user", content: text });
    if (!logged) {
      logged = true;
      addHistory({ type: "chat", lang: lang.code, level: s.level, mode, topic: mode === "topic" ? topic : "Çeviri masası" });
    }
    const reply = bubble("assistant", "");
    reply.el.classList.add("typing");
    bear.classList.add("talk");
    try {
      const full = await askBrensyt({ lang: lang.code, level: s.level, mode, topic, search, messages },
        (t) => { reply.el.classList.remove("typing"); reply.body.textContent = t; log.scrollTop = log.scrollHeight; },
        (sources) => {
          const list = h("div", { class: "sources" }, h("small", {}, "Kaynaklar"));
          for (const src of sources) {
            if (!/^https?:\/\//.test(src.url)) continue;
            list.append(h("a", { href: src.url, target: "_blank", rel: "noopener noreferrer" }, src.title || src.url));
          }
          reply.el.append(list);
        });
      messages.push({ role: "assistant", content: full || "…" });
      if (full) reply.el.append(h("button", { class: "round read-btn", type: "button", title: "Sesli oku", onclick: () => speak(full, "tr-TR") }, "🔊"));
    } catch (err) {
      messages.pop();
      reply.el.classList.remove("typing");
      reply.el.classList.add("error");
      reply.body.textContent = AI_ERRORS[err.message] || AI_ERRORS.failed;
    } finally {
      busy = false;
      sendBtn.disabled = false;
      bear.classList.remove("talk");
      log.scrollTop = log.scrollHeight;
      input.focus();
    }
  }

  const seg = (items, current, onPick) => {
    const box = h("div", { class: "seg" });
    const draw = (cur) => put(box, ...items.map(([value, label]) =>
      h("button", { type: "button", class: value === cur ? "on" : "", onclick: () => { pop(); draw(value); onPick(value); } }, label)));
    draw(current);
    return box;
  };

  const topicInput = h("input", { type: "text", value: topic, maxLength: 80, "aria-label": "Bugünkü konu", onchange: (e) => { topic = e.target.value.trim() || TOPICS[0]; intro(); } });
  const topicBox = h("div", { class: "side-block" },
    h("h3", {}, "Bugünkü konumuz"), topicInput,
    h("div", { class: "chips" }, TOPICS.map((t) => h("button", { type: "button", class: "chip", onclick: () => { topic = t; topicInput.value = t; pop(); intro(); } }, t))));

  const side = h("aside", { class: "chat-side" },
    h("div", { class: "side-bear" }, bear, h("p", {}, h("b", {}, "Brensyt"), h("br"), `${lang.flag} ${lang.name} öğretmenin`)),
    h("div", { class: "side-block" }, h("h3", {}, "Ne yapalım?"),
      seg([["topic", "Konu egzersizi"], ["translate", "Çeviri masası"]], mode, (v) => { mode = v; topicBox.hidden = v !== "topic"; intro(); })),
    h("div", { class: "side-block" }, h("h3", {}, "Seviye"),
      seg(LEVELS, s.level, (v) => { s.level = v; save(); intro(); })),
    topicBox,
    h("label", { class: "check" }, h("input", { type: "checkbox", checked: search, onchange: (e) => (search = e.target.checked) }), "Kaynak taraması yap (sözlük ve güncel kullanım)"),
    h("button", { class: "btn ghost small", type: "button", onclick: intro }, "Yeni sohbet"));

  root.append(h("div", { class: "chat" }, side, h("section", { class: "chat-main" }, log, form)));
  intro();
}
