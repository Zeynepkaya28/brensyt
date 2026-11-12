// Brensyt AI endpoints on Netlify: /api/chat, /api/json, /api/dates.
// Every request must carry a Supabase login token. The token is checked, and the daily quota is counted,
// by a single call to the bump_ai_usage database function, so no secret database key is needed here.
import { dispatch, json } from "../../lib/api.js";

// The Supabase address and publishable key are public values (they are also in public/config.js),
// so they have working defaults here; the environment can override them.
const PUBLIC_DEFAULTS = {
  SUPABASE_URL: "https://xlvsptlpzwffnsqdgvqj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_5IAif0zfSFvZNuGVIgNbEA_SF_mvJS4",
};
const env = (name) => Netlify.env.get(name) || PUBLIC_DEFAULTS[name];
const userLimit = () => Number(env("AI_DAILY_LIMIT_PER_USER")) || 40;
const globalLimit = () => Number(env("AI_DAILY_LIMIT_GLOBAL")) || 1500;

const reply = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

// A small stand-in for Node's response object, so the shared handlers can stream through a web Response.
function webResponse() {
  const enc = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  let resolveHead;
  const head = new Promise((resolve) => { resolveHead = resolve; });
  const res = {
    headersSent: false,
    setHeader() {},
    writeHead(status, headers) { res.headersSent = true; resolveHead(new Response(readable, { status, headers })); },
    write(chunk) { writer.write(typeof chunk === "string" ? enc.encode(chunk) : chunk).catch(() => {}); },
    end(chunk) { if (chunk) res.write(chunk); writer.close().catch(() => {}); },
  };
  return { res, response: head };
}

export default async (req) => {
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  if (origin) { try { if (new URL(origin).host !== url.host) return reply(403, { error: "forbidden" }); } catch { return reply(403, { error: "forbidden" }); } }
  if (!/^application\/json/.test(req.headers.get("content-type") || "")) return reply(415, { error: "json_only" });

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || token.length > 4000 || !env("SUPABASE_URL") || !env("SUPABASE_PUBLISHABLE_KEY")) return reply(401, { error: "login_required" });

  let allowed;
  try {
    const q = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/bump_ai_usage`, {
      method: "POST",
      headers: { apikey: env("SUPABASE_PUBLISHABLE_KEY"), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ user_limit: userLimit(), global_limit: globalLimit() }),
    });
    if (q.status === 401 || q.status === 403) return reply(401, { error: "login_required" });
    if (!q.ok) return reply(502, { error: "failed" });
    allowed = await q.json();
  } catch { return reply(502, { error: "failed" }); }
  if (allowed !== true) return reply(429, { error: "quota" });

  const text = await req.text();
  if (text.length > 64 * 1024) return reply(413, { error: "too_large" });
  let body;
  try { body = JSON.parse(text); } catch { return reply(400, { error: "bad_request" }); }

  const { res, response } = webResponse();
  dispatch(url.pathname, body, res)
    .then((handled) => { if (!handled) json(res, 404, { error: "not_found" }); })
    .catch((err) => {
      console.error("api error:", err?.message || err);
      if (!res.headersSent) json(res, 500, { error: "server_error" }); else res.end();
    });
  return response;
};

export const config = { path: ["/api/chat", "/api/json", "/api/dates"], method: ["POST"] };
