# Apex Timing (Live-Time)

Painel Next.js (App Router, TypeScript, Tailwind, Zustand) com live timing da F1, Race Control, multiview e calendário.

Os dados ao vivo vêm da [`f1-livetiming-api`](https://github.com/julesr0y/f1-livetiming-api), que se conecta ao feed oficial SignalR da F1 e expõe os dados por REST. **A OpenF1 não é usada.** O calendário é local (`src/data/f1-calendar.ts`).

## Como funciona

`npm start` executa `scripts/run-site.mjs`, que num só processo:

1. inicia a `f1-livetiming-api` (dependência do projeto) em `127.0.0.1:3001`;
2. espera ela responder e sobe o Next.js na porta pública (`PORT`, padrão 3000);
3. reinicia a API se ela encerrar (com espera crescente) ou se ficar desconectada do feed da F1 por mais de 5 minutos;
4. encerra tudo junto ao receber SIGTERM/SIGINT.

O navegador nunca fala com a API: ele consulta as rotas do Next (`/api/live-timing`, `/api/f1-live/status`, `/api/calendar`), que leem a API por loopback.

Fora de sessões ao vivo o feed da F1 pode ficar sem dados; o painel mostra a API como offline e volta sozinho quando a próxima sessão começar.

## Executar localmente

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev        # site + API
```

Abra `http://localhost:3000`.

## Deploy

A API mantém uma conexão WebSocket permanente com a F1, então o serviço precisa de um **processo sempre ligado**. Plataformas serverless (Vercel, Netlify) não servem para hospedar a API; veja "API separada" abaixo.

### Docker (qualquer host)

```bash
docker build -t live-time .
docker run -p 3000:3000 live-time
```

Só a porta 3000 é pública. A API fica interna ao container.

### Fly.io

```bash
fly launch --no-deploy --copy-config   # ajuste o nome do app
fly deploy
```

`fly.toml` já mantém 1 máquina sempre ligada e usa `/api/health`.

### Render

Crie um Blueprint apontando para este repositório (`render.yaml`). Use um plano pago: os gratuitos hibernam e derrubam a conexão com o feed.

### API separada (opcional)

Se o site ficar em outro host (por exemplo Vercel), hospede a `f1-livetiming-api` em um container próprio e defina no site:

```
F1_LIVETIMING_API_URL=https://sua-api.exemplo.com
```

Com um host não-local, o site não inicia API nenhuma.

## Variáveis de ambiente

Todas opcionais (veja `.env.example`):

| Variável | Padrão | Efeito |
| --- | --- | --- |
| `PORT` | `3000` | Porta pública do site |
| `F1_LIVETIMING_API_PORT` | `3001` | Porta interna da API local |
| `F1_LIVETIMING_API_URL` | — | API externa; desativa a API local |
| `F1_LIVETIMING_API_AUTOSTART` | `true` | `false` impede iniciar a API local |
| `F1_LIVETIMING_WATCHDOG_MINUTES` | `5` | Minutos desconectada antes de reiniciar a API (0 desativa) |

## Endpoints do site

| Rota | Descrição |
| --- | --- |
| `/api/health` | Health check (sempre 200 com o site no ar; traz o estado do feed) |
| `/api/f1-live/status` | Estado da conexão da API com o feed |
| `/api/live-timing` | Snapshot normalizado (sessão, pilotos, Race Control) |
| `/api/calendar` | Calendário e próxima etapa |

## Estrutura

```text
scripts/run-site.mjs        # supervisor: API + Next.js
src/lib/f1-livetiming-api.ts# cliente e normalização dos dados da API
src/app/api/                # rotas do Next (live-timing, status, calendar, health)
src/hooks/, src/store/      # polling e estado (Zustand)
src/data/f1-calendar.ts     # calendário
Dockerfile, fly.toml, render.yaml
```

A f1-livetiming-api é licenciada sob Apache-2.0.
