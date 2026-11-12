// Supabase bağlantısı: giriş, ilerlemenin buluta kaydı ve lider tablosu. config.js boşsa her şey yalnızca bu cihazda çalışır.
const cfg = () => window.BRENSYT || {};
export const cloudEnabled = () => Boolean(cfg().supabaseUrl && cfg().supabaseKey);
export const googleEnabled = () => cloudEnabled() && Boolean(cfg().googleLogin);

let pending;
export function client() {
  if (!cloudEnabled()) return Promise.resolve(null);
  pending ??= import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm").then(({ createClient }) =>
    createClient(cfg().supabaseUrl, cfg().supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }));
  return pending;
}

// Oturum açmış kullanıcının erişim anahtarı (yapay zekâ isteklerinde sunucuya gönderilir).
export async function accessToken() {
  try {
    const c = await client();
    if (!c) return "";
    const { data } = await c.auth.getSession();
    return data.session?.access_token || "";
  } catch { return ""; }
}

let timer = null, uid = null, who = "";
export function bindUser(id, name) { uid = id; who = name; }

// İlerlemeyi buluta yazar (kısa bir gecikmeyle, art arda kayıtları birleştirir).
export function schedulePush(getData) {
  if (!uid) return;
  clearTimeout(timer);
  timer = setTimeout(() => push(getData()), 3000);
}

export async function push(data) {
  if (!uid || !data) return;
  try {
    const c = await client();
    const stamp = new Date(data._at || Date.now()).toISOString();
    const words = Object.values(data.learned || {}).reduce((n, l) => n + l.length, 0);
    await c.from("progress").upsert({ user_id: uid, data, updated_at: stamp });
    await c.from("profiles").upsert({ user_id: uid, display_name: (who || "?").slice(0, 40), words, best_streak: data.bestStreak || 0, updated_at: stamp });
  } catch { /* bağlantı yoksa bir sonraki kayıtta yeniden denenir */ }
}

export async function pull() {
  if (!uid) return null;
  try {
    const c = await client();
    const { data } = await c.from("progress").select("data, updated_at").eq("user_id", uid).maybeSingle();
    return data || null;
  } catch { return null; }
}

export async function topProfiles() {
  try {
    const c = await client();
    const { data, error } = await c.from("profiles").select("display_name, words, best_streak").order("words", { ascending: false }).limit(10);
    return error ? null : data;
  } catch { return null; }
}
