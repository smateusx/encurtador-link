function computeStats(db) {
  const links = Array.isArray(db.links) ? db.links : [];
  const clicks = Array.isArray(db.clicks) ? db.clicks : [];
  const byCode = {};
  const byDay = {};

  for (const click of clicks) {
    if (!click || !click.code) continue;
    byCode[click.code] = (byCode[click.code] || 0) + 1;
    const day = String(click.at || "").slice(0, 10);
    if (day.length === 10) {
      byDay[day] = (byDay[day] || 0) + 1;
    }
  }

  const top = links
    .map((link) => ({
      code: link.code,
      url: link.url,
      clicks: byCode[link.code] || 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return {
    totalLinks: links.length,
    totalClicks: clicks.length,
    byDay: Object.keys(byDay)
      .sort()
      .slice(-14)
      .map((day) => ({ day, count: byDay[day] })),
    top,
  };
}

module.exports = { computeStats };
