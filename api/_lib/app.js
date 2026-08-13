const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { readDb, writeDb } = require("./db");
const { computeStats } = require("./stats");

const app = express();
const PYTHON_URL = process.env.PYTHON_URL || "http://127.0.0.1:8001";
const MAX_URL_LENGTH = 2048;
const onVercel = Boolean(process.env.VERCEL);

app.use(cors());
app.use(express.json({ limit: "16kb" }));

function wrap(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function makeCode(url, size = 7) {
  if (onVercel && url) {
    return Buffer.from(url).toString("base64url");
  }
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(size);
  let code = "";
  for (let i = 0; i < size; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function normalizeUrl(value) {
  let raw = String(value || "").trim();
  if (!raw) return "";
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
    raw = `https://${raw}`;
  }
  return raw;
}

function isValidUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (!u.hostname) return false;
    const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (local && u.pathname.startsWith("/r/")) return false;
    return u.hostname.includes(".") || local;
  } catch {
    return false;
  }
}

function publicBase(req) {
  const forwarded = req.get("x-forwarded-proto");
  const proto = forwarded || req.protocol || "https";
  return `${proto}://${req.get("host")}`;
}

function notFoundPage() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link não encontrado</title>
  <style>
    body { font-family: Georgia, serif; max-width: 40rem; margin: 12vh auto; padding: 0 1.5rem; color: #1a1a1a; }
    a { color: #1a1a1a; }
  </style>
</head>
<body>
  <h1>Este link não existe</h1>
  <p>O código pode estar errado ou o link foi apagado.</p>
  <p><a href="/">Voltar ao início</a></p>
</body>
</html>`;
}

async function listLinks(_req, res) {
  const db = await readDb();
  const links = db.links
    .map((link) => ({
      ...link,
      clicks: db.clicks.filter((c) => c.code === link.code).length,
      shortUrl: `/r/${link.code}`,
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(links);
}

async function createLink(req, res) {
  const url = normalizeUrl(req.body?.url);
  if (!url) {
    return res.status(400).json({ error: "Cole um endereço para encurtar." });
  }
  if (url.length > MAX_URL_LENGTH) {
    return res.status(400).json({ error: "Este endereço é longo demais." });
  }
  if (!isValidUrl(url)) {
    return res.status(400).json({
      error: "URL inválida. Use um endereço completo, como exemplo.com ou https://exemplo.com",
    });
  }

  const db = await readDb();
  const existing = db.links.find((l) => l.url === url);
  if (existing) {
    return res.status(200).json({
      ...existing,
      reused: true,
      clicks: db.clicks.filter((c) => c.code === existing.code).length,
      shortUrl: `${publicBase(req)}/r/${existing.code}`,
    });
  }

  let code = makeCode(url);
  while (db.links.some((l) => l.code === code)) {
    code = makeCode(url);
  }

  const link = {
    code,
    url,
    createdAt: new Date().toISOString(),
  };
  db.links.push(link);
  await writeDb(db);

  res.status(201).json({
    ...link,
    reused: false,
    clicks: 0,
    shortUrl: `${publicBase(req)}/r/${code}`,
  });
}

async function deleteLink(req, res) {
  const code = String(req.params.code || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const db = await readDb();
  const index = db.links.findIndex((l) => l.code === code);
  if (index === -1) {
    return res.status(404).json({ error: "Link não encontrado. Ele pode já ter sido apagado." });
  }

  const [removed] = db.links.splice(index, 1);
  db.clicks = db.clicks.filter((c) => c.code !== code);
  await writeDb(db);
  res.json({ message: "deleted", code: removed.code });
}

async function stats(_req, res) {
  const fallback = { ...computeStats(await readDb()), source: "node" };
  if (onVercel) {
    return res.json(fallback);
  }
  try {
    const response = await fetch(`${PYTHON_URL}/stats`, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(1500) : undefined,
    });
    if (!response.ok) {
      return res.json(fallback);
    }
    const data = await response.json();
    res.json({ ...fallback, ...data, source: data.source || "python" });
  } catch {
    res.json(fallback);
  }
}

async function health(_req, res) {
  if (onVercel) {
    return res.json({ ok: true, python: false });
  }
  let python = false;
  try {
    const response = await fetch(`${PYTHON_URL}/health`, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(800) : undefined,
    });
    python = response.ok;
  } catch {
    python = false;
  }
  res.json({ ok: true, python });
}

async function redirect(req, res) {
  const code = String(req.params.code || req.query.go || "").replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  );
  const db = await readDb();
  let link = db.links.find((l) => l.code === code);
  if (!link) {
    try {
      const url = Buffer.from(code, "base64url").toString("utf8");
      if (isValidUrl(url)) link = { code, url };
    } catch {
      link = null;
    }
  }
  if (!link) {
    return res.status(404).type("html").send(notFoundPage());
  }

  db.clicks.push({
    code: link.code,
    at: new Date().toISOString(),
  });
  await writeDb(db);
  res.redirect(302, link.url);
}

const api = express.Router();
api.get("/health", wrap(health));
api.get("/links", wrap(listLinks));
api.post("/links", wrap(createLink));
api.delete("/links/:code", wrap(deleteLink));
api.get("/stats", wrap(stats));

app.use(
  wrap(async (req, res, next) => {
    if (req.method !== "GET") return next();
    const go = String(req.query.go || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!go) return next();
    req.params = { ...req.params, code: go };
    return redirect(req, res);
  })
);

app.use("/api", api);
app.use("/", api);
app.get("/r/:code", wrap(redirect));
app.get("/api/r/:code", wrap(redirect));
app.get("/api/r", wrap(redirect));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Algo falhou no servidor. Tente de novo." });
});

module.exports = app;
