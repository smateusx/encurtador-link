const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { readDb, writeDb } = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;
const PYTHON_URL = process.env.PYTHON_URL || "http://127.0.0.1:8001";

app.use(cors());
app.use(express.json());

function makeCode(size = 7) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(size);
  let code = "";
  for (let i = 0; i < size; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/links", (_req, res) => {
  const db = readDb();
  const links = db.links
    .map((link) => ({
      ...link,
      clicks: db.clicks.filter((c) => c.code === link.code).length,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(links);
});

app.post("/api/links", (req, res) => {
  const url = String(req.body?.url || "").trim();
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "URL inválida. Use http:// ou https://" });
  }

  const db = readDb();
  const existing = db.links.find((l) => l.url === url);
  if (existing) {
    return res.status(201).json({
      ...existing,
      clicks: db.clicks.filter((c) => c.code === existing.code).length,
      shortUrl: `${req.protocol}://${req.get("host")}/r/${existing.code}`,
    });
  }

  let code = makeCode();
  while (db.links.some((l) => l.code === code)) {
    code = makeCode();
  }

  const link = {
    code,
    url,
    createdAt: new Date().toISOString(),
  };
  db.links.push(link);
  writeDb(db);

  res.status(201).json({
    ...link,
    clicks: 0,
    shortUrl: `${req.protocol}://${req.get("host")}/r/${code}`,
  });
});

app.get("/api/stats", async (_req, res) => {
  try {
    const response = await fetch(`${PYTHON_URL}/stats`);
    if (!response.ok) {
      throw new Error("python_error");
    }
    const data = await response.json();
    res.json(data);
  } catch {
    const db = readDb();
    res.json({
      totalLinks: db.links.length,
      totalClicks: db.clicks.length,
      byDay: [],
      top: [],
      source: "node-fallback",
    });
  }
});

app.get("/r/:code", (req, res) => {
  const db = readDb();
  const link = db.links.find((l) => l.code === req.params.code);
  if (!link) {
    return res.status(404).send("Link não encontrado");
  }

  db.clicks.push({
    code: link.code,
    at: new Date().toISOString(),
  });
  writeDb(db);
  res.redirect(link.url);
});

app.listen(PORT, () => {
  console.log(`Node.js API em http://localhost:${PORT}`);
});
