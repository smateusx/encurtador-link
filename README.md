# Encurtaí

Encurtador de links gratuito, com interface limpa.

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
