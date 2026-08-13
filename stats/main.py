import json
from collections import Counter
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

DB_FILE = Path(__file__).resolve().parent.parent / "api" / "data" / "db.json"

app = FastAPI(title="Encurtador Stats")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_db():
    if not DB_FILE.exists():
        return {"links": [], "clicks": []}
    try:
        return json.loads(DB_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"links": [], "clicks": []}


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/stats")
def stats():
    db = load_db()
    links = db.get("links", [])
    clicks = db.get("clicks", [])

    by_code = Counter(c.get("code") for c in clicks)
    by_day = Counter((c.get("at") or "")[:10] for c in clicks if c.get("at"))

    top = []
    for link in links:
        top.append(
            {
                "code": link.get("code"),
                "url": link.get("url"),
                "clicks": by_code.get(link.get("code"), 0),
            }
        )
    top.sort(key=lambda item: item["clicks"], reverse=True)

    return {
        "totalLinks": len(links),
        "totalClicks": len(clicks),
        "byDay": [
            {"day": day, "count": count}
            for day, count in sorted(by_day.items())
            if day
        ],
        "top": top[:5],
        "source": "python",
    }
