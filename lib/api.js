// Brensyt AI logic, shared by the local server (server.js) and the Netlify function.
// Only web-standard APIs and the Anthropic SDK are used here.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.BRENSYT_MODEL || "claude-opus-5-5";

const client = new Anthropic();

const LANGS = {
  en: "English", de: "German", es: "Spanish", fr: "French", tr: "Turkish",
  pt: "Portuguese", ku: "Kurdish (Kurmanji)", ru: "Russian", zh: "Mandarin Chinese",
};
const LEVELS = {
  easy: "EASY (A1–A2): very short sentences, basic vocabulary, explain everything in Turkish, one new idea at a time.",
  medium: "MEDIUM (B1–B2): mix the target language with Turkish explanations, introduce collocations and common idioms, correct mistakes with a short reason.",
  hard: "HARD (C1–C2): speak mostly in the target language, use nuanced idioms and register differences, point out subtle errors and exam-style traps.",
};
const MODES = ["translate", "topic", "plan", "writing", "speaking"];

function systemPrompt({ lang, level, mode, topic }) {
  const base = `You are Brensyt, a friendly teddy bear who wears a red scarf and a brown beret. You are an expert translator and language teacher. The learner's native language is Turkish and they are studying ${LANGS[lang]}.

Translation rules — these matter most:
- Never translate word for word. Translate the meaning, tone and register, the way a native speaker would actually say it.
- Idioms, proverbs, phrasal verbs and fixed expressions must be rendered with the natural equivalent in the other language. When a literal version would sound absurd, show it briefly as "kelimesi kelimesine" so the learner sees why it is wrong, then give the natural version.
- If a sentence is ambiguous or depends on context (formal/informal, region, gender), give the main options and say when each is used.
- For Kurdish use Kurmanji in Latin script; for Chinese add pinyin; for Russian add a Latin transliteration at the easy level.

Teaching level: ${LEVELS[level]}

Write explanations in Turkish unless the level says otherwise. Keep answers compact: no long preambles. Use plain text with short lines; no markdown tables.`;

  if (mode === "translate") {
    return `${base}

Mode: translation desk. Translate what the learner sends (Turkish ↔ ${LANGS[lang]}), then add at most three short notes on patterns worth remembering. When web search is available and the phrase is an idiom, a technical term or you are not sure of current usage, search for it and rely on reputable dictionaries and corpora.`;
  }
  if (mode === "speaking") {
    return `${base}

Mode: speaking examiner. The learner answered a speaking question aloud in ${LANGS[lang]} (section: "${topic || "Günlük konuşma"}"); you receive the speech-to-text transcript, so ignore punctuation and obvious transcription slips. Answer in Turkish, in this order:
1) "Genel izlenim": two sentences on fluency, coherence and how fully the question was answered.
2) "Daha doğal hali": the answer rewritten the way a fluent speaker would say it, in ${LANGS[lang]}.
3) "Dikkat et": at most five grammar or word-choice slips as "söylenen → doğrusu" with a short reason.
4) "Kullanabileceğin kalıplar": three useful expressions for this question.
5) If the section names IELTS or TOEFL, add "Tahmini puan" as a range and say clearly that it is an estimate from a transcript and cannot judge pronunciation.`;
  }
  if (mode === "writing") {
    return `${base}

Mode: writing coach. The learner sends a short text written in ${LANGS[lang]} (task: "${topic || "serbest yazı"}"). Answer in Turkish, in this order:
1) "Düzeltilmiş hali": the corrected text, keeping the learner's ideas and voice.
2) "Önemli hatalar": at most six mistakes, each as "yanlış → doğru" with a one-line reason.
3) "İki ipucu": two concrete things to practise next.
4) If the task names IELTS or TOEFL, add "Tahmini puan" with a band or score range and say clearly that it is only an estimate.`;
  }
  if (mode === "plan") {
    return `${base}

Mode: study planner. Build a realistic study programme from the learner's details: a weekly table as plain text (day → tasks with minutes), balanced across vocabulary, reading, listening, grammar and practice tests, with a review day each week and the exam date as the anchor. Mention the app's own tools where they fit: daily word cards, review, timed exam, and conversation practice with you.`;
  }
  return `${base}

Mode: conversation practice. Today's topic: "${topic || "günlük hayat"}". Open by announcing the topic ("Bugünkü konumuz: …"), teach 3–4 useful expressions for it, then run a short back-and-forth exercise: ask one question at a time, wait for the answer, correct it kindly, and move on. Stay on the topic.`;
}

export function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

// ---- API handlers --------------------------------------------------------

async function handleChat(body, res) {
  const lang = LANGS[body.lang] ? body.lang : null;
  const level = LEVELS[body.level] ? body.level : null;
  const mode = MODES.includes(body.mode) ? body.mode : null;
  if (!lang || !level || !mode || !Array.isArray(body.messages)) return json(res, 400, { error: "bad_request" });

  const messages = body.messages.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content ?? "").slice(0, 4000),
  })).filter((m) => m.content.trim());
  if (!messages.length || messages[0].role !== "user" || messages.at(-1).role !== "user") {
    return json(res, 400, { error: "bad_request" });
  }
  const topic = String(body.topic ?? "").replace(/[\r\n"]/g, " ").slice(0, 120);

  const params = {
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium" },
    system: systemPrompt({ lang, level, mode, topic }),
    messages,
  };
  if (body.search) params.tools = [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }];

  res.writeHead(200, { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" });
  const send = (obj) => res.write(JSON.stringify(obj) + "\n");

  // If Opus declines a request, the API re-runs it on a fallback model in the same call.
  let useFallbacks = true;
  const run = () => {
    const stream = useFallbacks
      ? client.beta.messages.stream({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
      : client.messages.stream(params);
    stream.on("text", (t) => send({ t: "text", v: t }));
    return stream.finalMessage();
  };

  try {
    const sources = new Map();
    for (let i = 0; i < 4; i++) {
      let msg;
      try { msg = await run(); }
      catch (err) {
        if (useFallbacks && err instanceof Anthropic.BadRequestError) { useFallbacks = false; msg = await run(); }
        else throw err;
      }
      for (const block of msg.content) {
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) {
            if (r.type === "web_search_result" && /^https?:\/\//.test(r.url)) sources.set(r.url, r.title || r.url);
          }
        }
      }
      if (msg.stop_reason === "pause_turn") { params.messages = [...params.messages, { role: "assistant", content: msg.content }]; continue; }
      if (msg.stop_reason === "refusal") send({ t: "text", v: "\n(Brensyt bu isteğe yardımcı olamıyor.)" });
      break;
    }
    if (sources.size) send({ t: "sources", v: [...sources].slice(0, 6).map(([url, title]) => ({ url, title })) });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || /api[_ ]?key|auth/i.test(err?.message || "")) send({ t: "error", v: "no_ai" });
    else if (err instanceof Anthropic.RateLimitError) send({ t: "error", v: "busy" });
    else { console.error("chat error:", err?.message || err); send({ t: "error", v: "failed" }); }
  }
  res.end();
}

// ---- Structured generation: reading passages and mock exams -----------------

const QUESTION = {
  type: "object", additionalProperties: false, required: ["topic", "q", "options", "answer", "why"],
  properties: {
    topic: { type: "string" }, q: { type: "string" },
    options: { type: "array", items: { type: "string" } },
    answer: { type: "integer" }, why: { type: "string" },
  },
};
const SCHEMAS = {
  reading: {
    type: "object", additionalProperties: false, required: ["title", "text", "glossary", "questions"],
    properties: {
      title: { type: "string" }, text: { type: "string" },
      glossary: { type: "array", items: { type: "object", additionalProperties: false, required: ["w", "m"], properties: { w: { type: "string" }, m: { type: "string" } } } },
      questions: { type: "array", items: QUESTION },
    },
  },
  mock: {
    type: "object", additionalProperties: false, required: ["questions"],
    properties: { questions: { type: "array", items: QUESTION } },
  },
  listening: {
    type: "object", additionalProperties: false, required: ["title", "lines", "questions"],
    properties: {
      title: { type: "string" },
      lines: { type: "array", items: { type: "object", additionalProperties: false, required: ["speaker", "text"], properties: { speaker: { type: "string" }, text: { type: "string" } } } },
      questions: { type: "array", items: QUESTION },
    },
  },
  family: {
    type: "object", additionalProperties: false, required: ["syn", "ant", "col"],
    properties: {
      syn: { type: "array", items: { type: "string" } }, ant: { type: "array", items: { type: "string" } }, col: { type: "array", items: { type: "string" } },
    },
  },
};
const EXAMS = {
  YDS: "the Turkish YDS exam (vocabulary, grammar, cloze test, sentence completion, Turkish–English and English–Turkish translation, paragraph comprehension)",
  YDT: "the Turkish YDT university entrance language exam (vocabulary, grammar, cloze test, sentence completion, dialogue completion, translation, paragraph questions)",
  IELTS: "IELTS Academic Reading (a short passage inside the question text, then True/False/Not Given, matching or multiple-choice items rewritten as four-option questions)",
  TOEFL: "TOEFL iBT Reading (a short academic passage inside the question text, then vocabulary-in-context, inference and detail questions)",
};
const LENGTHS = { easy: "90–130 words, A2 level", medium: "150–200 words, B1–B2 level", hard: "220–280 words, C1 level" };

function jsonPrompt(kind, { lang, level, exam, count, word }) {
  const meaningLang = lang === "tr" ? "English" : "Turkish";
  if (kind === "listening") {
    return `Write an original everyday dialogue in ${LANGS[lang]} between two speakers, "A" and "B", for listening practice. Difficulty: ${level} (${level === "easy" ? "8 short lines, A2" : level === "medium" ? "10 lines, B1–B2" : "12 lines, C1, natural idiomatic speech"}). Pick a concrete situation (shop, station, doctor, phone call, office, university) and vary it.
Return "title"; "lines" (each with "speaker": "A" or "B", and "text": only the spoken words, no stage directions); and "questions": 4 listening-comprehension questions in ${LANGS[lang]} about details that are only in the dialogue, each with exactly 4 "options", zero-based "answer", "topic" set to "Dinleme", and "why": one sentence in Turkish.`;
  }
  if (kind === "family") {
    return `For the ${LANGS[lang]} word "${word}", give its word family for an exam-focused learner: "syn" (up to 4 common synonyms), "ant" (up to 3 common antonyms, empty list if none), "col" (up to 4 frequent collocations or fixed phrases that contain the word). All items in ${LANGS[lang]}, most common first.`;
  }
  if (kind === "reading") {
    return `Write an original reading passage in ${LANGS[lang]} for a learner whose native language is Turkish. Length and difficulty: ${LENGTHS[level]}. Choose a concrete, interesting topic (daily life, travel, science, culture, history) and vary it between requests.
Return: "title"; "text" (the passage, plain text, paragraphs separated by a blank line); "glossary" with the 8 most useful words or expressions exactly as they appear in the text ("w") and their natural ${meaningLang} meaning in this context ("m"); and "questions": 4 comprehension questions written in ${LANGS[lang]}, each with exactly 4 "options", the zero-based index of the correct one in "answer", "topic" set to "Okuma", and "why": one sentence in Turkish explaining the answer.`;
  }
  return `Write ${count} original multiple-choice practice questions in the style of ${EXAMS[exam]}. Target language: ${LANGS[lang]}. Difficulty: ${level}. Do not copy real exam questions.
Each question has: "topic" (one short Turkish label such as "Kelime", "Dil bilgisi", "Cloze", "Cümle tamamlama", "Çeviri", "Okuma"), "q" (the full question text, including any short passage it needs), exactly 4 "options", "answer" (zero-based index of the correct option) and "why" (one sentence in Turkish explaining why it is correct). Spread the questions across the exam's question types and put the correct answer in varied positions.`;
}

function parseJsonText(text) {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no json");
  return JSON.parse(text.slice(start, end + 1));
}

function cleanQuestions(list, max) {
  return (Array.isArray(list) ? list : []).slice(0, max).map((x) => ({
    topic: String(x.topic || "Genel").slice(0, 40), q: String(x.q || "").slice(0, 3000),
    options: (Array.isArray(x.options) ? x.options : []).slice(0, 4).map((o) => String(o).slice(0, 400)),
    answer: Number.isInteger(x.answer) ? x.answer : -1, why: String(x.why || "").slice(0, 600),
  })).filter((x) => x.q && x.options.length === 4 && x.answer >= 0 && x.answer < 4);
}

async function handleJson(body, res) {
  const kind = SCHEMAS[body.kind] ? body.kind : null;
  const lang = LANGS[body.lang] ? body.lang : null;
  const level = LEVELS[body.level] ? body.level : null;
  const exam = EXAMS[body.exam] ? body.exam : "YDS";
  const count = Math.min(20, Math.max(5, Number(body.count) || 10));
  const word = String(body.word ?? "").replace(/[^\p{L}\p{N} '’-]/gu, "").slice(0, 40);
  if (kind === "family" && !word) return json(res, 400, { error: "bad_request" });
  if (!kind || !lang || !level) return json(res, 400, { error: "bad_request" });

  const params = {
    model: MODEL, max_tokens: 32000, output_config: { effort: "low" },
    messages: [{ role: "user", content: jsonPrompt(kind, { lang, level, exam, count, word }) + "\n\nReply with a single JSON object and nothing else." }],
  };
  const run = (withSchema) => client.messages.stream(withSchema
    ? { ...params, output_config: { ...params.output_config, format: { type: "json_schema", schema: SCHEMAS[kind] } } }
    : params).finalMessage();
  try {
    let msg;
    try { msg = await run(true); }
    catch (err) { if (err instanceof Anthropic.BadRequestError) msg = await run(false); else throw err; }
    if (msg.stop_reason === "refusal") return json(res, 200, { error: "failed" });
    const data = parseJsonText(msg.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
    if (kind === "family") {
      const items = (list, max) => (Array.isArray(list) ? list : []).slice(0, max).map((x) => String(x).slice(0, 60)).filter(Boolean);
      return json(res, 200, { data: { syn: items(data.syn, 4), ant: items(data.ant, 3), col: items(data.col, 4) } });
    }
    if (kind === "listening") {
      return json(res, 200, { data: {
        title: String(data.title || "").slice(0, 200),
        lines: (Array.isArray(data.lines) ? data.lines : []).slice(0, 16).map((l) => ({ speaker: l.speaker === "B" ? "B" : "A", text: String(l.text || "").slice(0, 400) })).filter((l) => l.text),
        questions: cleanQuestions(data.questions, 6),
      } });
    }
    if (kind === "reading") {
      return json(res, 200, { data: {
        title: String(data.title || "").slice(0, 200), text: String(data.text || "").slice(0, 6000),
        glossary: (Array.isArray(data.glossary) ? data.glossary : []).slice(0, 12).map((g) => ({ w: String(g.w || "").slice(0, 60), m: String(g.m || "").slice(0, 120) })).filter((g) => g.w && g.m),
        questions: cleanQuestions(data.questions, 6),
      } });
    }
    return json(res, 200, { data: { questions: cleanQuestions(data.questions, count) } });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || /api[_ ]?key|auth/i.test(err?.message || "")) return json(res, 200, { error: "no_ai" });
    if (err instanceof Anthropic.RateLimitError) return json(res, 200, { error: "busy" });
    console.error("json error:", err?.message || err);
    return json(res, 200, { error: "failed" });
  }
}

// ---- Live exam dates: looked up on official sites with web search -----------

async function handleDates(body, res) {
  const names = (Array.isArray(body.exams) ? body.exams : []).slice(0, 8)
    .map((n) => String(n).replace(/[^\p{L}\p{N} ./+-]/gu, "").slice(0, 24)).filter(Boolean);
  if (!names.length) return json(res, 400, { error: "bad_request" });
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Today is ${today}. Use web search on official sources to find the next upcoming exam date after today for each of these exams, for a candidate in Türkiye: ${names.join(", ")}.
Sources to prefer: osym.gov.tr (the ÖSYM exam calendar) for YDS, e-YDS, YDT, YKS and YÖKDİL; ielts.org, britishcouncil.org.tr or ieltsidpturkiye.com for IELTS; ets.org for TOEFL iBT. For exams with many sessions (IELTS, TOEFL) give the nearest upcoming test date offered in Türkiye.
If you cannot confirm a date from a reliable page, leave "date" empty rather than guessing.
Reply with a single JSON object and nothing else: {"exams":[{"name":"<exactly as given>","date":"YYYY-MM-DD or empty","note":"one short Turkish note, e.g. başvuru tarihleri or which session","source":"URL of the page that states the date"}]}`;
  const params = {
    model: MODEL, max_tokens: 16000, output_config: { effort: "low" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
    messages: [{ role: "user", content: prompt }],
  };
  try {
    let msg;
    for (let i = 0; i < 5; i++) {
      msg = await client.messages.stream(params).finalMessage();
      if (msg.stop_reason !== "pause_turn") break;
      params.messages = [...params.messages, { role: "assistant", content: msg.content }];
    }
    if (msg.stop_reason === "refusal") return json(res, 200, { error: "failed" });
    const data = parseJsonText(msg.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
    const exams = (Array.isArray(data.exams) ? data.exams : []).slice(0, 8).map((x) => ({
      name: String(x.name || "").slice(0, 24),
      date: /^\d{4}-\d{2}-\d{2}$/.test(x.date) && x.date > today ? x.date : "",
      note: String(x.note || "").slice(0, 160),
      source: /^https:\/\//.test(x.source || "") ? String(x.source).slice(0, 300) : "",
    })).filter((x) => names.includes(x.name));
    return json(res, 200, { data: { exams, checked: today } });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || /api[_ ]?key|auth/i.test(err?.message || "")) return json(res, 200, { error: "no_ai" });
    if (err instanceof Anthropic.RateLimitError) return json(res, 200, { error: "busy" });
    console.error("dates error:", err?.message || err);
    return json(res, 200, { error: "failed" });
  }
}

// Routes an /api request to its handler. Returns false when the path is not an AI route.
export async function dispatch(pathname, body, res) {
  if (pathname === "/api/chat") { await handleChat(body, res); return true; }
  if (pathname === "/api/json") { await handleJson(body, res); return true; }
  if (pathname === "/api/dates") { await handleDates(body, res); return true; }
  return false;
}
