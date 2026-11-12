// Giriş ekranı: Google ile bağlan veya e-posta + şifre.
import { h, tilt } from "../core/dom.js";
import { teddy, trackEyes } from "../core/teddy.js";
import * as auth from "../core/auth.js";

const HELLOS = ["Merhaba!", "Hello!", "Hallo!", "¡Hola!", "Bonjour !", "Olá!", "Silav!", "Привет!", "你好！"];

export function renderLogin(root, onAuth) {
  let mode = "login";
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
  const submit = h("button", { class: "btn wide", type: "submit" }, "Giriş yap");
  const title = h("h2", {}, "Tekrar hoş geldin");
  const switcher = h("button", { class: "link", type: "button", onclick: toggle }, "Hesabın yok mu? Kayıt ol");

  function toggle() {
    mode = mode === "login" ? "register" : "login";
    const reg = mode === "register";
    nameRow.hidden = !reg;
    title.textContent = reg ? "Brensyt ile tanış" : "Tekrar hoş geldin";
    submit.textContent = reg ? "Kayıt ol" : "Giriş yap";
    switcher.textContent = reg ? "Zaten hesabın var mı? Giriş yap" : "Hesabın yok mu? Kayıt ol";
    pass.autocomplete = reg ? "new-password" : "current-password";
    error.textContent = "";
  }

  const form = h("form", { class: "login-form", novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    error.textContent = "";
    error.className = "form-error";
    submit.disabled = true;
    try {
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
    nameRow,
    h("label", { class: "field" }, h("span", {}, "E-posta"), email),
    h("label", { class: "field" }, h("span", {}, "Şifre"), pass),
    error, submit, switcher);

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
      h("p", { class: "muted tiny" }, "Şifren bu cihazda yalnızca şifrelenmiş özet olarak saklanır."))));
}
