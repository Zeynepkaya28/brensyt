// Brensyt: kırmızı atkılı, kahverengi bereli ayıcık. Tek bir SVG; hareketler CSS sınıflarıyla verilir.
const SVG = `
<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Brensyt ayıcık">
  <ellipse class="t-shadow" cx="100" cy="243" rx="52" ry="6" fill="#3b2a1e" opacity=".18"/>
  <g class="t-all">
    <ellipse class="t-leg t-leg-l" cx="76" cy="222" rx="20" ry="16" fill="#8f5c2e"/>
    <ellipse class="t-leg t-leg-r" cx="124" cy="222" rx="20" ry="16" fill="#8f5c2e"/>
    <ellipse cx="100" cy="180" rx="48" ry="50" fill="#a9713c"/>
    <ellipse cx="100" cy="188" rx="29" ry="31" fill="#e8c39a"/>
    <g class="t-arm t-arm-l"><ellipse cx="54" cy="172" rx="13" ry="27" fill="#96622f" transform="rotate(14 54 172)"/></g>
    <g class="t-arm t-arm-r"><ellipse cx="146" cy="172" rx="13" ry="27" fill="#96622f" transform="rotate(-14 146 172)"/></g>
    <g class="t-head">
      <circle cx="56" cy="50" r="21" fill="#a9713c"/><circle cx="56" cy="50" r="11" fill="#e8c39a"/>
      <circle cx="144" cy="50" r="21" fill="#a9713c"/><circle cx="144" cy="50" r="11" fill="#e8c39a"/>
      <circle cx="100" cy="88" r="54" fill="#b47a42"/>
      <ellipse cx="100" cy="106" rx="25" ry="19" fill="#f0d3ae"/>
      <ellipse cx="100" cy="97" rx="9" ry="6.5" fill="#3b2a1e"/>
      <path class="t-mouth" d="M88 108 Q100 120 112 108" fill="none" stroke="#3b2a1e" stroke-width="3" stroke-linecap="round"/>
      <g class="t-eyes">
        <circle cx="80" cy="80" r="8.5" fill="#fff"/><circle cx="120" cy="80" r="8.5" fill="#fff"/>
        <g class="t-pupils"><circle cx="80" cy="81" r="4.6" fill="#2a1c12"/><circle cx="120" cy="81" r="4.6" fill="#2a1c12"/></g>
      </g>
      <g class="t-glasses" fill="none" stroke="#2a1c12" stroke-width="3"><circle cx="80" cy="80" r="12.5"/><circle cx="120" cy="80" r="12.5"/><path d="M92.5 80 h15 M67.5 80 l-12 -5 M132.5 80 l12 -5"/></g>
      <circle cx="68" cy="100" r="6" fill="#e58f7b" opacity=".55"/><circle cx="132" cy="100" r="6" fill="#e58f7b" opacity=".55"/>
      <g class="t-beret">
        <path d="M46 52 Q52 14 108 16 Q164 20 156 54 Q100 34 46 52Z" style="fill:var(--t-beret,#5b3a1e)"/>
        <path d="M46 52 Q100 34 156 54 L154 60 Q100 42 48 58Z" style="fill:var(--t-beret-d,#442a14)"/>
        <path d="M112 17 q4 -11 9 -8" fill="none" style="stroke:var(--t-beret-d,#442a14)" stroke-width="4" stroke-linecap="round"/>
        <g class="t-flower"><circle cx="140" cy="30" r="6" fill="#ff8fb1"/><circle cx="150" cy="37" r="6" fill="#ff8fb1"/><circle cx="140" cy="44" r="6" fill="#ff8fb1"/><circle cx="131" cy="37" r="6" fill="#ff8fb1"/><circle cx="140" cy="37" r="5" fill="#ffd23f"/></g>
      </g>
    </g>
    <path class="t-star" d="M100 176 l4.4 9 9.9 1.4 -7.2 7 1.7 9.8 -8.8 -4.6 -8.8 4.6 1.7 -9.8 -7.2 -7 9.9 -1.4z" fill="#ffd23f" stroke="#c9952e" stroke-width="1.5"/>
    <g class="t-scarf">
      <path d="M58 134 Q100 158 142 134 L144 148 Q100 172 56 148Z" style="fill:var(--t-scarf,#d62828)"/>
      <g class="t-scarf-tail">
        <path d="M118 150 l20 -4 l8 46 l-21 4z" style="fill:var(--t-scarf-d,#c21f1f)"/>
        <path d="M126 196 l-1 9 M132 195 l0 9 M138 194 l1 9 M144 192 l2 9" style="stroke:var(--t-scarf,#d62828)" stroke-width="3" stroke-linecap="round"/>
        <path d="M122 163 l22 -4 M124 177 l22 -4" stroke="#f3d9a4" stroke-width="3"/>
      </g>
    </g>
  </g>
</svg>`;

export function teddy(cls = "") {
  const wrap = document.createElement("div");
  wrap.className = "teddy " + cls;
  wrap.innerHTML = SVG; // sabit, güvenilir içerik
  return wrap;
}

// Göz bebekleri fareyi izler.
export function trackEyes(el) {
  const pupils = el.querySelector(".t-pupils");
  const move = (e) => {
    if (!el.isConnected) return document.removeEventListener("pointermove", move);
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.33);
    const d = Math.hypot(dx, dy) || 1, k = Math.min(3.2, d / 40);
    pupils.setAttribute("transform", `translate(${(dx / d) * k} ${(dy / d) * k})`);
  };
  document.addEventListener("pointermove", move);
  return el;
}

// Teddy ekrana atlar ve bir mesaj gösterir.
export function teddyJump(message, sub = "") {
  return new Promise((resolve) => {
    const o = document.createElement("div");
    o.className = "jump-overlay";
    const b = document.createElement("div");
    b.className = "jump-bubble";
    const big = document.createElement("strong");
    big.textContent = message;
    const small = document.createElement("span");
    small.textContent = sub;
    b.append(big, small);
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Tamam";
    btn.onclick = () => { o.remove(); resolve(); };
    o.append(b, teddy("jump"), btn);
    document.body.append(o);
    btn.focus();
  });
}
