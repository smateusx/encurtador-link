const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function emptyDb() {
  return { links: [], clicks: [] };
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return emptyDb();
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return emptyDb();
  }
}

function writeDb(db) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

module.exports = { readDb, writeDb, DB_FILE };
