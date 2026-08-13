# Encurtaí

Encurtador de links gratuito, com interface limpa.

## Sobre o projeto

**Parte teórica.** O Encurtaí aplica o conceito de encurtamento de URL: um código curto aponta para um endereço longo e o servidor redireciona quem abre o atalho (HTTP 302), registrando o clique. A API segue o modelo REST (criar, listar, apagar e consultar). O sistema é separado em camadas — interface, regras de negócio e estatísticas — e usa validação de entrada para reduzir erro do usuário, no espírito das heurísticas de Nielsen (feedback, prevenção de erro, controle e consistência).

**Parte prática.** Foi construído um app funcional com React (Vite) na interface, Node.js/Express na API e Python/FastAPI nas estatísticas em ambiente local. Dá para criar, copiar e apagar links, ver cliques por dia e redirecionar `/r/:código`. Os dados locais ficam em JSON. O código está no GitHub e a versão online na Vercel: https://encurtador-link-two.vercel.app/

| Parte | Pasta | Porta | Função |
|---|---|---|---|
| React | `frontend` | 5173 | Interface |
| Node.js | `api` | 3001 | Criar, redirecionar, apagar, registrar clique |
| Python | `stats` | 8001 | Estatísticas (local) |

No computador, os dados ficam em `api/data/db.json`. Na Vercel, a API Node.js responde em `/api` e `/r`.

## Como rodar local

Três terminais:

```bash
cd encurtador-link/api
npm install
npm run dev
```

```bash
cd encurtador-link/stats
py -3.12 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

```bash
cd encurtador-link/frontend
npm install
npm run dev
```

Abra http://localhost:5173

## API

- `POST /api/links` `{ "url": "https://exemplo.com" }`
- `GET /api/links`
- `DELETE /api/links/:code`
- `GET /api/stats`
- `GET /api/health`
- `GET /r/:code` redireciona e conta o clique
