// Sesli pratik: tarayıcının konuşma tanıma özelliğiyle kullanıcının söylediğini dinler.
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const canListen = (langCode) => Boolean(Recognition && langCode);

// Kullanıcının söylediği metni döndürür. Mikrofon izni verilmezse ya da ses duyulmazsa hata fırlatır.
export function listen(langCode) {
  return new Promise((resolve, reject) => {
    const rec = new Recognition();
    rec.lang = langCode;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    let done = false;
    rec.onresult = (e) => {
      done = true;
      resolve([...e.results[0]].map((alt) => alt.transcript));
    };
    rec.onerror = (e) => { done = true; reject(new Error(e.error || "failed")); };
    rec.onend = () => { if (!done) reject(new Error("no-speech")); };
    try { rec.start(); } catch { reject(new Error("failed")); }
  });
}

// Uzun konuşmayı dinler; yazıya dökülen metni onText ile bildirir. Durdurmak için dönen işlevi çağır.
export function listenLong(langCode, onText, onError) {
  const rec = new Recognition();
  rec.lang = langCode;
  rec.continuous = true;
  rec.interimResults = true;
  let stopped = false, kept = "";
  rec.onresult = (e) => {
    let live = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) kept += e.results[i][0].transcript + " "; else live += e.results[i][0].transcript;
    }
    onText((kept + live).trim());
  };
  rec.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") { stopped = true; onError(e.error); } };
  rec.onend = () => { if (!stopped) { try { rec.start(); } catch { /* zaten çalışıyor */ } } };
  try { rec.start(); } catch { onError("failed"); }
  return () => { stopped = true; try { rec.stop(); } catch { /* yok say */ } };
}

export const VOICE_ERRORS = {
  "not-allowed": "Mikrofon izni verilmedi. Tarayıcının adres çubuğundan mikrofona izin verebilirsin.",
  "service-not-allowed": "Bu tarayıcıda konuşma tanıma kapalı. Chrome ya da Edge ile deneyebilirsin.",
  "no-speech": "Seni duyamadım. Mikrofona yakın, net bir sesle tekrar dener misin?",
  network: "Konuşma tanıma için internet bağlantısı gerekiyor.",
  failed: "Dinleyemedim. Tekrar dener misin?",
};
