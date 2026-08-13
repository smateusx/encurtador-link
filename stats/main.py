import json
from collections import Counter
from datetime import date, timedelta
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
        parsed = json.loads(DB_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"links": [], "clicks": []}
    return {
        "links": parsed.get("links") if isinstance(parsed.get("links"), list) else [],
        "clicks": parsed.get("clicks") if isinstance(parsed.get("clicks"), list) else [],
    }


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/stats")
def stats():
    db = load_db()
    links = db["links"]
    clicks = [c for c in db["clicks"] if isinstance(c, dict) and c.get("code")]

    by_code = Counter(c.get("code") for c in clicks)
    by_day = Counter(
        str(c.get("at") or "")[:10]
        for c in clicks
        if str(c.get("at") or "")[:10]
    )

    cutoff = (date.today() - timedelta(days=13)).isoformat()
    days = sorted(day for day in by_day if len(day) == 10 and day >= cutoff)

    top = sorted(
        (
            {
                "code": link.get("code"),
                "url": link.get("url"),
                "clicks": by_code.get(link.get("code"), 0),
            }
            for link in links
            if isinstance(link, dict) and link.get("code")
        ),
        key=lambda item: item["clicks"],
        reverse=True,
    )[:5]

    return {
        "totalLinks": len(links),
        "totalClicks": len(clicks),
        "byDay": [{"day": day, "count": by_day[day]} for day in days],
        "top": top,
        "source": "python",
    }
