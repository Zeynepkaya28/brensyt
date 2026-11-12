// Sesler dosya olmadan, tarayıcının ses motoruyla üretilir.
let ctx;
function ac() {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function tone(freq, start, dur, type = "sine", vol = 0.25) {
  const a = ac(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + start;
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur);
}

// Doğru cevap: "dın!"
export function ding() { tone(1318, 0, 0.5); tone(1760, 0.09, 0.7); }

// Yanlış cevap: ayıcık homurtusu
export function growl() {
  const a = ac(), t = a.currentTime;
  const o = a.createOscillator(), lfo = a.createOscillator(), lfoGain = a.createGain();
  const filter = a.createBiquadFilter(), g = a.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(95, t);
  o.frequency.linearRampToValueAtTime(120, t + 0.25);
  o.frequency.linearRampToValueAtTime(62, t + 0.9);
  lfo.frequency.value = 26;
  lfoGain.gain.value = 22;
  lfo.connect(lfoGain).connect(o.frequency);
  filter.type = "lowpass";
  filter.frequency.value = 520;
  filter.Q.value = 6;
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.4, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
  o.connect(filter).connect(g).connect(a.destination);
  o.start(t); lfo.start(t);
  o.stop(t + 1); lfo.stop(t + 1);
}

export function fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.45, "triangle", 0.2)); }
export function pop() { tone(520, 0, 0.12, "triangle", 0.15); }
