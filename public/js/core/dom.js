// Küçük DOM yardımcıları. Kullanıcı ve yapay zekâ metinleri her zaman düz metin olarak eklenir (innerHTML yok).
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style") Object.assign(el.style, v);
    else if (k in el && k !== "list") el[k] = v;
    else el.setAttribute(k, v);
  }
  el.append(...kids.flat(3).filter((x) => x != null && x !== false));
  return el;
}

// Bir öğenin içeriğini değiştirir; boş (null/false) parçaları atlar, listeleri açar.
export function put(el, ...kids) {
  el.replaceChildren(...kids.flat(3).filter((x) => x != null && x !== false));
  return el;
}

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function confetti(count = 70) {
  const colors = ["#d62828", "#e9b44c", "#2f7d5b", "#a9713c", "#3d6fb4"];
  const box = h("div", { class: "confetti" });
  for (let i = 0; i < count; i++) {
    box.append(h("i", { style: {
      left: Math.random() * 100 + "%", background: colors[i % colors.length],
      animationDelay: Math.random() * 0.5 + "s", animationDuration: 1.6 + Math.random() * 1.4 + "s",
    } }));
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 3500);
}

// Fareyi izleyerek bir öğeyi 3B eğer.
export function tilt(el, max = 10) {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
  });
  el.addEventListener("pointerleave", () => (el.style.transform = ""));
  return el;
}

export function speak(text, langCode) {
  if (!langCode || !("speechSynthesis" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langCode;
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  return true;
}
