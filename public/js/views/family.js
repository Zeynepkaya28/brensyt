// Kelime ailesi kutusu: kartın altında eş anlamlı, zıt anlamlı ve kalıpları gösterir.
import { put, h } from "../core/dom.js";
import { state, save } from "../core/store.js";
import { askJson, AI_ERRORS } from "../core/ai.js";
import { FAMILIES } from "../langs/families.js";

function rows(f) {
  const row = (label, items, cls) => items?.length ? h("p", { class: "fam-row" }, h("b", {}, label),
    items.map((x) => h("span", { class: "fam-chip " + cls }, x))) : null;
  return [row("Eş anlamlı", f.syn, "syn"), row("Zıt anlamlı", f.ant, "ant"), row("Kalıplar", f.col, "col")];
}

export function familyBox(word, lang) {
  const s = state();
  const saved = FAMILIES[lang.code]?.[word.w] || s.families?.[lang.code]?.[word.w];
  const body = h("div", {});
  if (saved) put(body, rows(saved));
  else {
    const btn = h("button", { class: "btn ghost small", onclick: async () => {
      btn.disabled = true;
      btn.textContent = "Brensyt bakıyor…";
      try {
        const f = await askJson("family", { lang: lang.code, level: s.level, word: word.w });
        s.families ??= {};
        s.families[lang.code] ??= {};
        s.families[lang.code][word.w] = f;
        save();
        put(body, rows(f));
      } catch (err) { put(body, h("p", { class: "note bad" }, AI_ERRORS[err.message] || AI_ERRORS.failed)); }
    } }, "🧸 Bu kelimenin ailesini çıkar");
    put(body, btn);
  }
  return h("details", { class: "family", open: Boolean(saved) }, h("summary", {}, "👪 Kelime ailesi"), body);
}
