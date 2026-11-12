// Brensyt server: serves the app and proxies AI requests so the API key never reaches the browser.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dispatch, json } from "./lib/api.js";

try { process.loadEnvFile(); } catch { /* no .env file — fine */ }

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, "public");
const PORT = Number(process.env.PORT) || 5173;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// ---- small helpers -------------------------------------------------------

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json",
  ".png": "image/png", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon",
};

function securityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' https://accounts.google.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' data: https:; " +
    "connect-src 'self' https://accounts.google.com https://*.supabase.co; frame-src https://accounts.google.com; " +
    "object-src 'none'; base-uri 'none'; form-action 'self'"
  );
}

async function readJson(req, limit = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error("too large"), { status: 413 });
    chunks.push(c);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("bad json"), { status: 400 }); }
}

// Simple per-IP rate limit: 30 AI requests per 5 minutes.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 5 * 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 30;
}

// Requests must come from our own page (blocks other sites from using the proxy).
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

// Checks a Google sign-in token with Google and returns the verified profile.
async function handleGoogle(body, res) {
  if (!GOOGLE_CLIENT_ID) return json(res, 503, { error: "google_not_configured" });
  const { credential } = body;
  if (typeof credential !== "string" || credential.length > 4096) return json(res, 400, { error: "bad_request" });
  const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
  if (!r.ok) return json(res, 401, { error: "invalid_token" });
  const info = await r.json();
  if (info.aud !== GOOGLE_CLIENT_ID || info.email_verified !== "true") return json(res, 401, { error: "invalid_token" });
  json(res, 200, { email: info.email, name: info.name || info.email });
}

async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bulunamadı");
  }
}

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  try {
    const { pathname } = new URL(req.url, "http://localhost");
    if (pathname.startsWith("/api/")) {
      if (!sameOrigin(req)) return json(res, 403, { error: "forbidden" });
      if (req.method === "GET" && pathname === "/api/config") return json(res, 200, { googleClientId: GOOGLE_CLIENT_ID });
      if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });
      if (!/^application\/json/.test(req.headers["content-type"] || "")) return json(res, 415, { error: "json_only" });
      if (rateLimited(req.socket.remoteAddress)) return json(res, 429, { error: "busy" });
      const body = await readJson(req);
      if (pathname === "/api/google") return await handleGoogle(body, res);
      if (await dispatch(pathname, body, res)) return;
      return json(res, 404, { error: "not_found" });
    }
    if (req.method !== "GET") { res.writeHead(405); return res.end(); }
    await serveStatic(req, res, pathname);
  } catch (err) {
    if (!res.headersSent) json(res, err.status || 500, { error: "server_error" });
    else res.end();
  }
});

server.listen(PORT, "127.0.0.1", () => console.log(`Brensyt hazır: http://localhost:${PORT}`));
