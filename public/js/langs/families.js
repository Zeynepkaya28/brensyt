// Kelime aileleri: eş anlamlılar, zıt anlamlılar ve sık kullanılan kalıplar.
// Biçim: kelime | eş anlamlılar | zıt anlamlılar | kalıplar   (virgülle ayrılır; boş bırakılabilir)
// Listede olmayan kelimeler için kart ekranındaki düğme Brensyt'ten ister.
const RAW = {
  en: `
abandon|leave, desert, give up|keep, continue|abandon a plan, abandon hope
achieve|accomplish, attain, reach|fail|achieve a goal, achieve success
adequate|sufficient, enough|inadequate, insufficient|adequate supply, adequate time
ancient|old, antique|modern, recent|ancient history, ancient civilization
benefit|advantage, gain|drawback, disadvantage|benefit from, for the benefit of
decline|decrease, drop, refuse|increase, rise, accept|a sharp decline, decline an offer
demand|request, need|supply|meet the demand, in demand
efficient|effective, productive|inefficient, wasteful|energy efficient, efficient use
enhance|improve, boost|reduce, worsen|enhance performance, enhance quality
essential|vital, crucial, necessary|unnecessary, optional|essential for, an essential part
evidence|proof||strong evidence, evidence suggests that
expand|grow, extend, enlarge|shrink, contract|expand a business, expand rapidly
increase|rise, grow|decrease, decline|a sharp increase, an increase in prices
maintain|keep, preserve, sustain|neglect, abandon|maintain contact, maintain standards
obtain|get, acquire, gain|lose|obtain permission, obtain information
prevent|stop, avoid, hinder|allow, cause|prevent someone from, prevent disease
provide|supply, offer, give|withhold|provide support, provide someone with
reduce|decrease, cut, lower|increase, raise|reduce costs, reduce the risk
require|need, demand||require attention, be required to
significant|important, considerable, major|insignificant, minor|a significant difference, a significant impact
sufficient|enough, adequate|insufficient|sufficient evidence, sufficient funds
threat|danger, risk|safety|pose a threat, under threat
improve|enhance, develop|worsen, deteriorate|improve skills, improve significantly
crucial|vital, essential, critical|trivial, unimportant|play a crucial role, crucial for
`,
};

const list = (t) => (t || "").split(",").map((x) => x.trim()).filter(Boolean);
export const FAMILIES = Object.fromEntries(Object.entries(RAW).map(([lang, block]) => [lang,
  Object.fromEntries(block.trim().split("\n").map((line) => {
    const [w, syn, ant, col] = line.split("|");
    return [w, { syn: list(syn), ant: list(ant), col: list(col) }];
  }))]));
