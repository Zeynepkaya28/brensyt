// Ödüller: rozetler ve Brensyt'in dolabı (bal puanıyla atkı, bere, aksesuar).
import { put, h, tilt, confetti } from "../core/dom.js";
import { teddy, trackEyes } from "../core/teddy.js";
import { state } from "../core/store.js";
import { WARDROBE, outfit, owns, wear, badges } from "../core/outfit.js";
import { ding, growl } from "../core/audio.js";
import { buyFreeze, FREEZE_PRICE, MAX_FREEZES } from "../core/daily.js";
import { leaderboard } from "./board.js";

const TITLES = { scarf: "Atkılar", beret: "Bereler", extra: "Aksesuarlar" };

export function renderRewards(root, ctx) {
  const s = state();
  const honey = h("strong", { class: "honey" });
  const shelves = h("div", { class: "shelves" });
  const note = h("p", { class: "note", role: "status" });

  function draw() {
    const o = outfit();
    honey.textContent = `🍯 ${s.xp} bal puanı`;
    put(shelves, ...Object.entries(WARDROBE).map(([kind, items]) => h("div", { class: "shelf" },
      h("h3", {}, TITLES[kind]),
      h("div", { class: "shelf-items" }, items.map((item) => {
        const owned = owns(kind, item.id);
        const on = kind === "extra" ? o.extras.includes(item.id) : o[kind] === item.id;
        return h("button", { class: "item" + (on ? " on" : "") + (owned ? "" : " locked"), title: item.name, onclick: () => {
          const wasOwned = owned;
          if (!wear(kind, item.id)) {
            growl();
            note.textContent = `${item.name} için ${item.price - s.xp} bal puanı daha gerekiyor. Kart ve sınavlarla bal toplayabilirsin.`;
            note.className = "note bad";
            return;
          }
          ding();
          if (!wasOwned) confetti(30);
          note.textContent = wasOwned ? "" : `${item.name} artık senin!`;
          note.className = "note good";
          draw();
        } },
          item.colors ? h("i", { class: "swatch", style: { background: item.colors[0] } }) : h("span", { class: "item-icon" }, item.icon),
          h("span", {}, item.name),
          h("small", {}, on ? "Üzerinde" : owned ? "Giy" : `🍯 ${item.price}`));
      })))));
  }

  // Seri dondurma: bir günü kaçırsan da seri bozulmaz.
  const freeze = h("div", { class: "freeze" });
  function drawFreeze() {
    const have = s.freezes || 0;
    put(freeze, 
      h("span", { class: "freeze-icon" }, "🧊"),
      h("div", {}, h("strong", {}, `Seri dondurma · ${have}/${MAX_FREEZES}`),
        h("p", { class: "muted tiny" }, "Bir gün çalışamazsan serin bozulmaz. Kaçırdığın günden sonraki ilk çalışmada bir tanesi harcanır.")),
      h("button", { class: "btn small", disabled: have >= MAX_FREEZES, onclick: () => {
        if (buyFreeze()) { ding(); draw(); drawFreeze(); }
        else { growl(); note.textContent = `Seri dondurma ${FREEZE_PRICE} bal puanı.`; note.className = "note bad"; }
      } }, have >= MAX_FREEZES ? "Dolu" : `🍯 ${FREEZE_PRICE}`));
  }
  drawFreeze();
  const list = badges();
  root.append(
    h("h1", {}, "Ödüller"),
    h("section", { class: "two-col rewards" },
      h("div", { class: "closet" },
        h("h2", {}, "Brensyt'in dolabı"),
        h("div", { class: "closet-top" }, tilt(h("div", { class: "closet-bear" }, trackEyes(teddy("wave"))), 12), h("div", {}, honey,
          h("p", { class: "muted" }, "Yeni kelime 10, tekrar 3, sınavda her doğru 5 bal kazandırır."))),
        shelves, freeze, note),
      h("div", {},
        h("h2", {}, `Rozetler · ${list.filter((b) => b.done).length}/${list.length}`),
        h("div", { class: "badge-grid" }, list.map((b) => h("div", { class: "badge-card" + (b.done ? " done" : "") },
          h("span", { class: "badge-icon" }, b.icon), h("strong", {}, b.name), h("span", {}, b.text),
          h("small", {}, b.done ? "Kazanıldı" : b.progress)))),
        leaderboard(ctx.user.name))));
  draw();
}
