import { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [url, setUrl] = useState("");
  const [created, setCreated] = useState(null);
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [listRes, statsRes] = await Promise.all([
      fetch(`${API}/api/links`),
      fetch(`${API}/api/stats`),
    ]);
    setLinks(await listRes.json());
    setStats(await statsRes.json());
  }

  useEffect(() => {
    load().catch(() => setError("Não consegui falar com a API. Subiu o Node.js?"));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setCreated(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao encurtar");
        return;
      }
      setCreated(data);
      setUrl("");
      await load();
    } catch {
      setError("API fora do ar. Rode o Node.js na porta 3001.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text) {
    await navigator.clipboard.writeText(text);
  }

  const maxDay = Math.max(1, ...(stats?.byDay || []).map((d) => d.count));

  return (
    <main className="page">
      <header className="hero">
        <h1>Encurtaí</h1>
        <p>Encurtador local e grátis. React + Node.js + Python.</p>
      </header>

      <section className="card">
        <form className="row" onSubmit={onSubmit}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole uma URL (https://...)"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Encurtando..." : "Encurtar"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        {created && (
          <div className="result">
            <div>
              <div className="muted">Link curto</div>
              <a href={created.shortUrl} target="_blank" rel="noreferrer">
                {created.shortUrl}
              </a>
            </div>
            <button className="ghost" type="button" onClick={() => copy(created.shortUrl)}>
              Copiar
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Estatísticas (Python)</h2>
        <p className="hint">
          Fonte: {stats?.source === "python" ? "serviço Python" : "Node.js (fallback)"}
        </p>
        <div className="stats">
          <div className="stat">
            <span className="muted">Links</span>
            <strong>{stats?.totalLinks ?? 0}</strong>
          </div>
          <div className="stat">
            <span className="muted">Cliques</span>
            <strong>{stats?.totalClicks ?? 0}</strong>
          </div>
        </div>
        <div className="bars">
          {(stats?.byDay || []).map((item) => (
            <div className="bar-row" key={item.day}>
              <span>{item.day.slice(5)}</span>
              <div className="bar">
                <span style={{ width: `${(item.count / maxDay) * 100}%` }} />
              </div>
              <span>{item.count}</span>
            </div>
          ))}
          {!stats?.byDay?.length && <p className="muted">Ainda não há cliques.</p>}
        </div>
      </section>

      <section className="card">
        <h2>Seus links</h2>
        <table>
          <thead>
            <tr>
              <th>Curto</th>
              <th>Original</th>
              <th>Cliques</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.code}>
                <td>
                  <a href={`${API}/r/${link.code}`} target="_blank" rel="noreferrer">
                    /r/{link.code}
                  </a>
                </td>
                <td>{link.url}</td>
                <td>{link.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!links.length && <p className="muted">Nenhum link ainda.</p>}
      </section>
    </main>
  );
}
