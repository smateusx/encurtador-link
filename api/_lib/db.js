const fs = require("fs");
const os = require("os");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const TMP_FILE = path.join(os.tmpdir(), "encurtai-db.json");
const MAX_CLICKS = 10000;

function emptyDb() {
  return { links: [], clicks: [] };
}

function normalize(parsed) {
  return {
    links: Array.isArray(parsed?.links) ? parsed.links : [],
    clicks: Array.isArray(parsed?.clicks) ? parsed.clicks : [],
  };
}

function remoteUrl() {
  const id = process.env.JSONBLOB_ID;
  if (!id) return "";
  return `https://jsonblob.com/api/jsonBlob/${id}`;
}

function readFromFile(file) {
  if (!fs.existsSync(file)) return emptyDb();
  try {
    return normalize(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    return emptyDb();
  }
}

function writeToFile(file, db) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const safe = {
    links: Array.isArray(db.links) ? db.links : [],
    clicks: Array.isArray(db.clicks) ? db.clicks.slice(-MAX_CLICKS) : [],
  };
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(safe, null, 2), "utf8");
  try {
    fs.renameSync(tmp, file);
  } catch {
    fs.copyFileSync(tmp, file);
    fs.unlinkSync(tmp);
  }
}

async function readRemoteDb() {
  const res = await fetch(remoteUrl(), { headers: { Accept: "application/json" } });
  if (!res.ok) return emptyDb();
  try {
    return normalize(await res.json());
  } catch {
    return emptyDb();
  }
}

async function writeRemoteDb(db) {
  const safe = {
    links: Array.isArray(db.links) ? db.links : [],
    clicks: Array.isArray(db.clicks) ? db.clicks.slice(-MAX_CLICKS) : [],
  };
  const res = await fetch(remoteUrl(), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(safe),
  });
  if (!res.ok) {
    throw new Error("Não foi possível salvar os dados.");
  }
}

function vercelStore() {
  if (!global.__encurtaiDb) {
    global.__encurtaiDb = readFromFile(TMP_FILE);
  }
  return global.__encurtaiDb;
}

async function readDb() {
  if (remoteUrl()) return readRemoteDb();
  if (process.env.VERCEL) return vercelStore();
  return readFromFile(DB_FILE);
}

async function writeDb(db) {
  const safe = {
    links: Array.isArray(db.links) ? db.links : [],
    clicks: Array.isArray(db.clicks) ? db.clicks.slice(-MAX_CLICKS) : [],
  };
  if (remoteUrl()) return writeRemoteDb(safe);
  if (process.env.VERCEL) {
    global.__encurtaiDb = safe;
    try {
      writeToFile(TMP_FILE, safe);
    } catch {
      // /tmp pode falhar; a memória da instância ainda guarda os dados
    }
    return;
  }
  writeToFile(DB_FILE, safe);
}

module.exports = { readDb, writeDb, DB_FILE };
