// Dil kayıt defteri. Yeni dil eklemek için: bir modül dosyası yazın ve aşağıdaki listeye ekleyin.
import en from "./en.js";
import de from "./de.js";
import es from "./es.js";
import fr from "./fr.js";
import tr from "./tr.js";
import pt from "./pt.js";
import ku from "./ku.js";
import ru from "./ru.js";
import zh from "./zh.js";

// Satır biçimi: kelime|anlam1/anlam2|okunuş|örnek cümle|cümlenin Türkçesi  —  "# B2" gibi satırlar seviye başlığıdır.
function prepare(mod) {
  const words = [];
  const seen = new Set();
  let level = "A1";
  for (const line of mod.words.trim().split("\n")) {
    if (line.startsWith("#")) { level = line.slice(1).trim(); continue; }
    const [w, m, pron, ex, exTr] = line.split("|");
    if (!w || !m || seen.has(w)) continue; // aynı kelime iki kez yazıldıysa ilki geçerli
    seen.add(w);
    words.push({ w, m: m.split("/"), pron: pron || "", ex: ex || "", exTr: exTr || "", level });
  }
  return { ...mod, words };
}

export const LANGS = Object.fromEntries([en, de, es, fr, tr, pt, ku, ru, zh].map((m) => [m.code, prepare(m)]));
export const LANG_LIST = Object.values(LANGS);
