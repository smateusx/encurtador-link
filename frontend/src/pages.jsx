import { useEffect, useMemo, useRef } from "react";
import Logo from "./Logo.jsx";

const API = import.meta.env.VITE_API_URL || "";

function formatDay(isoDay) {
  if (!isoDay) return "";
  const [y, m, d] = isoDay.split("-");
  return `${d}/${m}`;
}

export function Home({ go }) {
  return (
    <section className="home">
      <div className="home-hero">
        <img
          className="illust illust-hero"
          src="/illustrations/hero-links.png"
          alt=""
        />
        <Logo className="logo logo-hero" />
        <h1 className="brand brand-hero">Encurtaí</h1>
        <p className="tagline home-lead">
          Encurte um endereço e acompanhe os cliques.
        </p>
        <div className="home-actions">
          <button type="button" onClick={() => go("/encurtar")}>
            Encurtar um link
          </button>
          <button type="button" className="ghost" onClick={() => go("/ajuda")}>
            Como funciona
          </button>
        </div>
      </div>
      <div className="home-grid">
        <a
          className="card card-link"
          href="/encurtar"
          onClick={(e) => {
            e.preventDefault();
            go("/encurtar");
          }}
        >
          <img src="/illustrations/feat-encurtar.png" alt="" className="illust" />
          <h2>Encurte</h2>
          <p>Cole o endereço original e receba um link curto para enviar.</p>
        </a>
        <a
          className="card card-link"
          href="/links"
          onClick={(e) => {
            e.preventDefault();
            go("/links");
          }}
        >
          <img src="/illustrations/feat-acompanhar.png" alt="" className="illust" />
          <h2>Acompanhe</h2>
          <p>Veja quantas vezes cada atalho foi aberto, por dia.</p>
        </a>
        <a
          className="card card-link"
          href="/links"
          onClick={(e) => {
            e.preventDefault();
            go("/links");
          }}
        >
          <img src="/illustrations/feat-apagar.png" alt="" className="illust" />
          <h2>Apague</h2>
          <p>Se não quiser mais o atalho, remova. O site original continua no ar.</p>
        </a>
      </div>
    </section>
  );
}

export function Help({ go }) {
  return (
    <section className="card help-page">
      <img className="illust illust-wide" src="/illustrations/help-path.png" alt="" />
      <h1 className="page-title">Como usar</h1>
      <ol>
        <li>Abra Encurtar e cole o endereço original. Copie da barra do navegador, não do resultado do Google.</li>
        <li>Clique em Encurtar e copie o atalho gerado.</li>
        <li>Envie o link curto para quem quiser.</li>
        <li>Cada abertura conta um clique em Meus links.</li>
        <li>Apagar remove só o atalho; a página original não some.</li>
      </ol>
      <button type="button" onClick={() => go("/encurtar")}>
        Ir encurtar
      </button>
    </section>
  );
}

export function Shorten({
  url,
  setUrl,
  created,
  error,
  notice,
  loading,
  apiUp,
  onSubmit,
  copy,
}) {
  const inputRef = useRef(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <section className="card card-center" aria-labelledby="encurtar-titulo">
      <h1 id="encurtar-titulo" className="page-title">
        Novo link
      </h1>
      {apiUp === false && (
        <p className="msg error" role="alert">
          A API está offline. No terminal da pasta api, rode npm run dev.
        </p>
      )}
      <form className="form-stack" onSubmit={onSubmit}>
        <label htmlFor="encurtar">Endereço original</label>
        <div className="compose">
          <input
            id="encurtar"
            ref={inputRef}
            type="text"
            inputMode="url"
            autoComplete="url"
            maxLength={2048}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="exemplo.com/pagina"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "form-error" : undefined}
          />
          <button id="enviar" type="submit" disabled={loading || !url.trim()}>
            {loading ? "Encurtando…" : "Encurtar"}
          </button>
        </div>
      </form>
      <div aria-live="polite">
        {error && (
          <p id="form-error" className="msg error explain" role="alert">
            {error}
          </p>
        )}
        {notice && !error && <p className="msg ok">{notice}</p>}
      </div>
      {created && (
        <div className="result">
          <div>
            <div className="msg">Seu link curto</div>
            <a href={created.shortUrl} target="_blank" rel="noreferrer">
              {created.shortUrl.startsWith("http")
                ? created.shortUrl
                : `${origin}${created.shortUrl}`}
            </a>
          </div>
          <div>
            <button
              className="ghost"
              type="button"
              onClick={() =>
                copy(
                  created.shortUrl.startsWith("http")
                    ? created.shortUrl
                    : `${origin}${created.shortUrl}`
                )
              }
            >
              Copiar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function Links({
  links,
  stats,
  search,
  setSearch,
  error,
  notice,
  copy,
  remove,
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const maxDay = Math.max(1, ...(stats?.byDay || []).map((d) => d.count));
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      (link) =>
        link.code.toLowerCase().includes(q) ||
        String(link.url).toLowerCase().includes(q)
    );
  }, [links, search]);

  return (
    <>
      <section className="card card-center" aria-labelledby="stats-titulo">
        <h1 id="stats-titulo" className="page-title">
          Movimento
        </h1>
        <div className="stats">
          <div className="stat">
            <span>Links criados</span>
            <strong>{stats?.totalLinks ?? 0}</strong>
          </div>
          <div className="stat">
            <span>Cliques no total</span>
            <strong>{stats?.totalClicks ?? 0}</strong>
          </div>
        </div>
        <div className="bars" aria-label="Cliques por dia">
          {(stats?.byDay || []).map((item) => (
            <div className="bar-row" key={item.day}>
              <span>{formatDay(item.day)}</span>
              <div className="bar">
                <span style={{ width: `${(item.count / maxDay) * 100}%` }} />
              </div>
              <span>{item.count}</span>
            </div>
          ))}
          {!stats?.byDay?.length && (
            <p className="empty">Ainda não há cliques. Abra um link curto para ver o gráfico.</p>
          )}
        </div>
      </section>

      <section className="card card-center" aria-labelledby="lista-titulo">
        <h2 id="lista-titulo">Seus links</h2>
        {error && (
          <p className="msg error" role="alert">
            {error}
          </p>
        )}
        {notice && !error && <p className="msg ok">{notice}</p>}
        <label htmlFor="busca">Buscar na lista</label>
        <input
          id="busca"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="código ou endereço"
        />
        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Curto</th>
                  <th>Original</th>
                  <th className="num">Cliques</th>
                  <th className="actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((link) => {
                  const shortHref = `${origin}/r/${link.code}`;
                  return (
                    <tr key={link.code}>
                      <td>
                        <a href={`/r/${link.code}`} target="_blank" rel="noreferrer">
                          /r/{link.code}
                        </a>
                      </td>
                      <td>{link.url}</td>
                      <td className="num">{link.clicks}</td>
                      <td className="actions">
                        <div className="action-row">
                          <button
                            className="ghost"
                            type="button"
                            onClick={() => copy(shortHref)}
                          >
                            Copiar
                          </button>
                          <button
                            className="danger"
                            type="button"
                            onClick={() => remove(link.code)}
                          >
                            Apagar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">
            {links.length
              ? "Nenhum resultado para essa busca. Limpe o campo para ver todos."
              : "Você ainda não criou links. Use o menu Encurtar."}
          </p>
        )}
      </section>
    </>
  );
}

export { API };
