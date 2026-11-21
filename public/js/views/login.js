// Giriş ekranı: Google ile bağlan veya e-posta + şifre. "Şifremi unuttum" ve yeni şifre belirleme de burada.
import { h, tilt } from "../core/dom.js";
import { teddy, trackEyes } from "../core/teddy.js";
import * as auth from "../core/auth.js";

const HELLOS = ["Merhaba!", "Hello!", "Hallo!", "¡Hola!", "Bonjour !", "Olá!", "Silav!", "Привет!", "你好！"];

export function renderLogin(root, onAuth) {
  let mode = "login"; // login | register | reset
  const bear = trackEyes(teddy("wave big"));
  const bubble = h("div", { class: "bubble" }, HELLOS[0]);
  let i = 0;
  const timer = setInterval(() => {
    if (!bubble.isConnected) return clearInterval(timer);
    bubble.classList.remove("pop");
    void bubble.offsetWidth;
    bubble.textContent = HELLOS[++i % HELLOS.length];
    bubble.classList.add("pop");
  }, 1800);

  const error = h("p", { class: "form-error", role: "alert" });
  const name = h("input", { type: "text", placeholder: "Adın", autocomplete: "name", maxLength: 40 });
  const email = h("input", { type: "email", placeholder: "E-posta", autocomplete: "email", required: true });
  // Şifre yazılırken Brensyt beresini gözlerine indirir.
  const pass = h("input", {
    type: "password", placeholder: "Şifre", required: true, minLength: 8, autocomplete: "current-password",
    onfocus: () => bear.classList.add("shy"), onblur: () => bear.classList.remove("shy"),
  });
  const nameRow = h("label", { class: "field", hidden: true }, h("span", {}, "Ad"), name);
  const passRow = h("label", { class: "field" }, h("span", {}, "Şifre"), pass);
  const submit = h("button", { class: "btn wide", type: "submit" }, "Giriş yap");
  const title = h("h2", {}, "Tekrar hoş geldin");
  const hint = h("p", { class: "muted tiny", hidden: true }, "E-posta adresini yaz; kayıtlıysa şifreni yenilemen için bir bağlantı gönderelim.");
  const forgot = h("button", { class: "link", type: "button", onclick: () => setMode("reset") }, "Şifremi unuttum");
  const switcher = h("button", { class: "link", type: "button", onclick: () => setMode(mode === "login" ? "register" : "login") }, "Hesabın yok mu? Kayıt ol");

  function setMode(next) {
    mode = next;
    const reg = mode === "register", reset = mode === "reset";
    nameRow.hidden = !reg;
    passRow.hidden = reset;
    hint.hidden = !reset;
    forgot.hidden = mode !== "login";
    title.textContent = reg ? "Brensyt ile tanış" : reset ? "Şifreni yenile" : "Tekrar hoş geldin";
    submit.textContent = reg ? "Kayıt ol" : reset ? "Bağlantı gönder" : "Giriş yap";
    switcher.textContent = reg ? "Zaten hesabın var mı? Giriş yap" : reset ? "← Girişe dön" : "Hesabın yok mu? Kayıt ol";
    pass.autocomplete = reg ? "new-password" : "current-password";
    pass.required = !reset;
    error.textContent = "";
    error.className = "form-error";
  }

  const form = h("form", { class: "login-form", novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    error.textContent = "";
    error.className = "form-error";
    submit.disabled = true;
    try {
      if (mode === "reset") {
        error.textContent = await auth.sendReset(email.value);
        error.className = "form-error ok";
        return;
      }
      const u = mode === "register"
        ? await auth.register(name.value, email.value, pass.value)
        : await auth.login(email.value, pass.value);
      if (u.pending) { error.textContent = u.pending; error.className = "form-error ok"; return; }
      onAuth(u);
    } catch (err) {
      error.textContent = err.message;
      bear.classList.add("nope");
      setTimeout(() => bear.classList.remove("nope"), 600);
    } finally { submit.disabled = false; }
  } },
    title,
    hint,
    nameRow,
    h("label", { class: "field" }, h("span", {}, "E-posta"), email),
    passRow,
    error, submit, forgot, switcher);

  // Süresi dolmuş ya da kullanılmış bir e-posta bağlantısıyla gelindiyse açıkla.
  if (auth.linkExpired()) {
    error.textContent = "Bağlantının süresi dolmuş ya da daha önce kullanılmış. “Şifremi unuttum” ile yenisini isteyebilirsin.";
  }

  const gBox = h("div", { class: "google-box" });
  const gFallback = h("button", { class: "btn ghost wide", type: "button", onclick: () => {
    if (auth.cloudEnabled()) {
      if (!auth.googleEnabled()) { error.textContent = "Google ile giriş yakında açılacak. Şimdilik e-posta ile devam edebilirsin."; return; }
      auth.googleOAuth().catch((e) => (error.textContent = e.message));
      return;
    }
    error.textContent = "Google ile giriş için sunucudaki .env dosyasına GOOGLE_CLIENT_ID eklenmeli (README'de anlatılıyor). Şimdilik e-posta ile devam edebilirsin.";
  } }, h("span", { class: "g-logo" }, "G"), "Google ile bağlan");
  gBox.append(gFallback);
  auth.googleButton(gBox, onAuth, (e) => (error.textContent = e.message))
    .then((ok) => { if (ok) gFallback.remove(); }).catch(() => {});

  root.append(h("section", { class: "login" },
    h("div", { class: "login-stage" },
      h("div", { class: "stage-3d" }, tilt(h("div", { class: "stage-inner" }, bubble, bear), 16)),
      h("h1", { class: "logo-word" }, "Brensyt"),
      h("p", { class: "tagline" }, "Kırmızı atkılı dil arkadaşın. Dokuz dil, her gün birkaç kelime, bol bol sohbet.")),
    h("div", { class: "login-card" },
      form,
      h("div", { class: "or" }, h("span", {}, "ya da")),
      gBox,
      h("p", { class: "muted tiny" }, auth.cloudEnabled()
        ? "Şifren Supabase'de şifrelenmiş olarak saklanır; biz göremeyiz."
        : "Şifren bu cihazda yalnızca şifrelenmiş özet olarak saklanır."))));
}

// E-postadaki sıfırlama bağlantısından gelen kullanıcı yeni şifresini burada belirler.
export function renderRecovery(root, onDone) {
  const bear = trackEyes(teddy("wave big"));
  const error = h("p", { class: "form-error", role: "alert" });
  const mk = (placeholder) => h("input", { type: "password", placeholder, required: true, minLength: 8, autocomplete: "new-password",
    onfocus: () => bear.classList.add("shy"), onblur: () => bear.classList.remove("shy") });
  const one = mk("Yeni şifre"), two = mk("Yeni şifre (tekrar)");
  const submit = h("button", { class: "btn wide", type: "submit" }, "Şifreyi kaydet");
  const form = h("form", { class: "login-form", novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    error.textContent = "";
    if (one.value !== two.value) { error.textContent = "İki şifre aynı değil."; return; }
    submit.disabled = true;
    try {
      await auth.setNewPassword(one.value);
      onDone();
    } catch (err) {
      error.textContent = err.message;
      submit.disabled = false;
    }
  } },
    h("h2", {}, "Yeni şifreni belirle"),
    h("p", { class: "muted tiny" }, "En az 8 karakter; harf ve rakam içermeli."),
    h("label", { class: "field" }, h("span", {}, "Yeni şifre"), one),
    h("label", { class: "field" }, h("span", {}, "Tekrar"), two),
    error, submit);
  root.append(h("section", { class: "login" },
    h("div", { class: "login-stage" }, h("div", { class: "stage-3d" }, tilt(h("div", { class: "stage-inner" }, bear), 16)), h("h1", { class: "logo-word" }, "Brensyt")),
    h("div", { class: "login-card" }, form)));
}
