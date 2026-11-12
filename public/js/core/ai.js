// Brensyt'in yapay zekâsına bağlanır. Anahtar sunucuda durur; tarayıcı yalnızca /api ile konuşur.
// Herkese açık sitede her istek, giriş yapmış kullanıcının anahtarıyla gider.
import { accessToken } from "./cloud.js";

async function headers() {
  const token = await accessToken();
  return token ? { "Content-Type": "application/json", Authorization: "Bearer " + token } : { "Content-Type": "application/json" };
}

// Sunucunun verdiği hatayı (giriş, kota, yoğunluk) tek bir koda çevirir.
async function failure(res) {
  if (res.status === 401) return new Error("login_required");
  if (res.status === 429) {
    let code = "busy";
    try { code = (await res.json()).error === "quota" ? "quota" : "busy"; } catch { /* yok say */ }
    return new Error(code);
  }
  return new Error("failed");
}

export async function askBrensyt({ lang, level, mode, topic, search, messages }, onText, onSources) {
  let res;
  try {
    res = await fetch("/api/chat", {
      method: "POST", headers: await headers(),
      body: JSON.stringify({ lang, level, mode, topic, search, messages }),
    });
  } catch { throw new Error("offline"); }
  if (!res.ok || !res.body) throw await failure(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const ev = JSON.parse(line);
      if (ev.t === "text") { full += ev.v; onText(full); }
      else if (ev.t === "sources") onSources?.(ev.v);
      else if (ev.t === "error") throw new Error(ev.v);
    }
  }
  return full;
}

// Yapılandırılmış içerik ister: kind "reading" (okuma parçası) ya da "mock" (deneme sınavı).
export async function askJson(kind, params) {
  let res;
  try {
    res = await fetch("/api/json", {
      method: "POST", headers: await headers(), body: JSON.stringify({ kind, ...params }),
    });
  } catch { throw new Error("offline"); }
  if (!res.ok) throw await failure(res);
  const out = await res.json();
  if (out.error) throw new Error(out.error);
  return out.data;
}

// Sınav tarihlerini resmi sitelerden canlı olarak arar.
export async function askDates(exams) {
  let res;
  try {
    res = await fetch("/api/dates", { method: "POST", headers: await headers(), body: JSON.stringify({ exams }) });
  } catch { throw new Error("offline"); }
  if (!res.ok) throw await failure(res);
  const out = await res.json();
  if (out.error) throw new Error(out.error);
  return out.data;
}

export const AI_ERRORS = {
  no_ai: "Yapay zekâ anahtarı henüz ayarlanmamış. Sunucu klasöründeki .env dosyasına ANTHROPIC_API_KEY ekleyip uygulamayı yeniden başlatınca bu özellik açılır.",
  busy: "Şu an çok yoğunum, bir dakika sonra tekrar dener misin?",
  quota: "Bugünlük yapay zekâ hakkın doldu. Yarın yeniden dene; kartlar, tekrar ve sınav sınırsız devam ediyor.",
  login_required: "Bu özellik için giriş yapmış olman gerekiyor. Çıkış yapıp yeniden giriş yapmayı dene.",
  offline: "Sunucuya ulaşamadım. Uygulamanın “npm start” ile çalıştığından emin ol.",
  failed: "Bir şeyler ters gitti. Tekrar dener misin?",
};
