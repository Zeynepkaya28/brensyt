// Giriş. Bulut ayarı (config.js) varsa Supabase ile; yoksa bu cihazda (şifre PBKDF2 özetiyle) çalışır.
import { cloudEnabled, googleEnabled, client, bindUser } from "./cloud.js";

export { cloudEnabled, googleEnabled };
export { accessToken } from "./cloud.js";

const USERS = "brensyt:users";
const SESSION = "brensyt:session";
const ITER = 210000;

const users = () => { try { return JSON.parse(localStorage.getItem(USERS)) || {}; } catch { return {}; } };
const putUsers = (u) => localStorage.setItem(USERS, JSON.stringify(u));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const unhex = (s) => new Uint8Array(s.match(/../g).map((b) => parseInt(b, 16)));

async function hash(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITER }, key, 256));
}
function sameText(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const cleanEmail = (e) => String(e).trim().toLowerCase();
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
const strongEnough = (p) => p.length >= 8 && /\p{L}/u.test(p) && /\d/.test(p);

export function session() { try { return JSON.parse(sessionStorage.getItem(SESSION)); } catch { return null; } }
function startSession(email, name, id = null) {
  const s = { email, name, id };
  sessionStorage.setItem(SESSION, JSON.stringify(s));
  if (id) bindUser(id, name);
  return s;
}

// Supabase oturumunu sayfa açılırken geri yükler (Google dönüşü dahil).
export async function restore() {
  if (!cloudEnabled()) return session();
  try {
    const c = await client();
    const { data } = await c.auth.getSession();
    const u = data.session?.user;
    if (!u) { sessionStorage.removeItem(SESSION); return null; }
    return startSession(u.email, displayName(u), u.id);
  } catch { return session(); }
}
const displayName = (u) => String(u.user_metadata?.name || u.user_metadata?.full_name || u.email.split("@")[0]).slice(0, 40);

export async function logout() {
  sessionStorage.removeItem(SESSION);
  bindUser(null, "");
  if (cloudEnabled()) { try { await (await client()).auth.signOut(); } catch { /* yok say */ } }
}

function cloudError(err) {
  const m = String(err?.message || "");
  if (/invalid login/i.test(m)) return new Error("E-posta veya şifre hatalı.");
  if (/not confirmed/i.test(m)) return new Error("E-postanı henüz doğrulamadın. Gelen kutundaki bağlantıya tıkla, sonra giriş yap.");
  if (/already registered|already been registered/i.test(m)) return new Error("Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.");
  if (/rate limit|too many/i.test(m)) return new Error("Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.");
  if (/invalid.*email|email.*invalid/i.test(m)) return new Error("Geçerli bir e-posta adresi gir.");
  return new Error("İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene.");
}

export async function register(name, emailRaw, password) {
  const email = cleanEmail(emailRaw);
  name = String(name).trim().slice(0, 40);
  if (!name) throw new Error("Adını yazar mısın?");
  if (!validEmail(email)) throw new Error("Geçerli bir e-posta adresi gir.");
  if (!strongEnough(password)) throw new Error("Şifre en az 8 karakter olmalı; harf ve rakam içermeli.");

  if (cloudEnabled()) {
    const { data, error } = await (await client()).auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: location.origin } });
    if (error) throw cloudError(error);
    if (!data.session) return { pending: "Doğrulama e-postası gönderdik. Gelen kutundaki bağlantıya tıkla, sonra giriş yap." };
    return startSession(email, name, data.user.id);
  }

  const all = users();
  if (all[email]) throw new Error("Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  all[email] = { name, salt: hex(salt), hash: await hash(password, salt), fails: 0, lockUntil: 0 };
  putUsers(all);
  return startSession(email, name);
}

export async function login(emailRaw, password) {
  const email = cleanEmail(emailRaw);

  if (cloudEnabled()) {
    const { data, error } = await (await client()).auth.signInWithPassword({ email, password });
    if (error) throw cloudError(error);
    return startSession(email, displayName(data.user), data.user.id);
  }

  const all = users(), u = all[email];
  const generic = new Error("E-posta veya şifre hatalı.");
  if (!u || !u.hash) { await hash(password, new Uint8Array(16)); throw generic; }
  if (u.lockUntil > Date.now()) {
    throw new Error(`Çok fazla hatalı deneme. ${Math.ceil((u.lockUntil - Date.now()) / 60000)} dakika sonra tekrar dene.`);
  }
  const ok = sameText(await hash(password, unhex(u.salt)), u.hash);
  if (!ok) {
    u.fails = (u.fails || 0) + 1;
    if (u.fails >= 5) { u.lockUntil = Date.now() + 5 * 60000; u.fails = 0; }
    putUsers(all);
    throw generic;
  }
  u.fails = 0;
  u.lockUntil = 0;
  putUsers(all);
  return startSession(email, u.name);
}

// Google ile giriş (Supabase). Önce panelde Google sağlayıcısı açılmalı ve config.js'te googleLogin: true yapılmalı.
export async function googleOAuth() {
  const { error } = await (await client()).auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin } });
  if (error) throw new Error("Google ile giriş şu an açılamadı.");
}

// Yerel mod: sunucuda GOOGLE_CLIENT_ID ayarlıysa Google'ın kendi düğmesi; kimlik sunucuda doğrulanır.
export async function googleButton(container, onDone, onError) {
  if (cloudEnabled()) return false;
  let clientId = "";
  try { clientId = (await (await fetch("/api/config")).json()).googleClientId; } catch { /* sunucu yok */ }
  if (!clientId) return false;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = res;
    s.onerror = rej;
    document.head.append(s);
  });
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: async ({ credential }) => {
      try {
        const r = await fetch("/api/google", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }),
        });
        if (!r.ok) throw new Error("Google girişi doğrulanamadı.");
        const { email, name } = await r.json();
        const all = users();
        all[email] ??= { name, google: true };
        putUsers(all);
        onDone(startSession(email, all[email].name));
      } catch (e) { onError(e); }
    },
  });
  window.google.accounts.id.renderButton(container, {
    theme: "outline", size: "large", shape: "pill", text: "continue_with", locale: "tr", width: 300,
  });
  return true;
}
