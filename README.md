# Encurtaí

Encurtador de links **100% local e grátis**.

| Parte | Pasta | Porta | Função |
|---|---|---|---|
| React | `frontend` | 5173 | Tela |
| Node.js | `api` | 3001 | Cria link, redireciona, registra clique |
| Python | `stats` | 8001 | Estatísticas (totais, ranking, cliques por dia) |

Sem Firebase, sem OpenAI, sem cartão. Os dados ficam em `api/data/db.json`.

## Como rodar

Abra **3 terminais**.

### 1) API Node.js

```bash
cd encurtador-link/api
npm install
npm run dev
```

### 2) Estatísticas Python

```bash
cd encurtador-link/stats
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

### 3) Frontend React

```bash
cd encurtador-link/frontend
npm install
npm run dev
```

Abra http://localhost:5173

1. Cole uma URL (`https://...`)
2. Clique em **Encurtar**
3. Abra o link curto (`/r/xxxxxx`) — isso conta 1 clique
4. Volte na tela e veja o gráfico (Python)

## API

- `POST /api/links` `{ "url": "https://exemplo.com" }`
- `GET /api/links`
- `GET /api/stats` (Node.js chama o Python)
- `GET /r/:code` redireciona e grava o clique
