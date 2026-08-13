const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const MAX_CLICKS = 10000;

function emptyDb() {
  return { links: [], clicks: [] };
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return emptyDb();
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    return {
      links: Array.isArray(parsed.links) ? parsed.links : [],
      clicks: Array.isArray(parsed.clicks) ? parsed.clicks : [],
    };
  } catch {
    return emptyDb();
  }
}

function writeDb(db) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const safe = {
    links: Array.isArray(db.links) ? db.links : [],
    clicks: Array.isArray(db.clicks) ? db.clicks.slice(-MAX_CLICKS) : [],
  };

  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(safe, null, 2), "utf8");
  try {
    fs.renameSync(tmp, DB_FILE);
  } catch {
    fs.copyFileSync(tmp, DB_FILE);
    fs.unlinkSync(tmp);
  }
}

module.exports = { readDb, writeDb, DB_FILE };
