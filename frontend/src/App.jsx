import { useEffect, useState } from "react";
import "./App.css";
import Logo from "./Logo.jsx";
import { API, Help, Home, Links, Shorten } from "./pages.jsx";

const ROUTES = {
  "/": "Início",
  "/encurtar": "Encurtar",
  "/links": "Meus links",
  "/ajuda": "Ajuda",
};

function currentPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return ROUTES[path] ? path : "/";
}

export default function App() {
  const [page, setPage] = useState(currentPath);
  const [menuOpen, setMenuOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [created, setCreated] = useState(null);
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [apiUp, setApiUp] = useState(null);

  function go(to) {
    const next = to.replace(/\/+$/, "") || "/";
    window.history.pushState({}, "", next);
    setPage(next);
    setMenuOpen(false);
    setError("");
    setNotice("");
    window.scrollTo(0, 0);
  }

  async function load() {
    const [listRes, statsRes, healthRes] = await Promise.all([
      fetch(`${API}/api/links`),
      fetch(`${API}/api/stats`),
      fetch(`${API}/api/health`),
    ]);
    if (!listRes.ok || !statsRes.ok) {
      throw new Error("api");
    }
    setLinks(await listRes.json());
    setStats(await statsRes.json());
    setApiUp(healthRes.ok);
  }

  useEffect(() => {
    const onPop = () => setPage(currentPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (page === "/" || page === "/ajuda") return;
    load().catch(() => {
      setApiUp(false);
      setError("Não foi possível carregar os dados. Confira se a API Node.js está ligada.");
    });
  }, [page]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    const value = url.trim();
    if (!value) {
      setError("Cole um endereço para encurtar.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não deu para encurtar este endereço.");
        return;
      }
      setCreated(data);
      setUrl("");
      setNotice(
        data.reused
          ? "Este endereço já tinha um link curto. Reaproveitamos o mesmo."
          : "Link curto criado."
      );
      await load();
    } catch {
      setError("A API está fora do ar. No terminal da pasta api, rode npm run dev.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Link copiado.");
      setError("");
    } catch {
      setError("Não foi possível copiar. Selecione o texto e use Ctrl+C.");
    }
  }

  async function remove(code) {
    const ok = window.confirm(
      "Apagar este link curto? Quem tiver o endereço não vai mais abrir."
    );
    if (!ok) return;
    setError("");
    try {
      const res = await fetch(`${API}/api/links/${code}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível apagar.");
        return;
      }
      if (created?.code === code) setCreated(null);
      setNotice("Link apagado.");
      await load();
    } catch {
      setError("Falha ao apagar. Tente de novo.");
    }
  }

  return (
    <div className="shell">
      <a className="skip" href="#conteudo">
        Ir para o conteúdo
      </a>

      <header className="site-header">
        <a
          className="brand-link"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go("/");
          }}
        >
          <Logo className="logo logo-nav" />
          <span className="brand brand-nav">Encurtaí</span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="menu-principal"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Fechar" : "Menu"}
        </button>

        <nav id="menu-principal" className={menuOpen ? "nav open" : "nav"}>
          {Object.entries(ROUTES).map(([path, label]) => (
            <a
              key={path}
              href={path}
              className={page === path ? "active" : ""}
              aria-current={page === path ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(path);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="conteudo" className="page">
        {page === "/" && <Home go={go} />}
        {page === "/encurtar" && (
          <Shorten
            url={url}
            setUrl={(value) => {
              setUrl(value);
              if (error) setError("");
            }}
            created={created}
            error={error}
            notice={notice}
            loading={loading}
            apiUp={apiUp}
            onSubmit={onSubmit}
            copy={copy}
          />
        )}
        {page === "/links" && (
          <Links
            links={links}
            stats={stats}
            search={search}
            setSearch={setSearch}
            error={error}
            notice={notice}
            copy={copy}
            remove={remove}
          />
        )}
        {page === "/ajuda" && <Help go={go} />}
      </main>
    </div>
  );
}
