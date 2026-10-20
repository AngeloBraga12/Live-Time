# Apex Timing (Live-Time)

Painel Next.js (App Router, TypeScript, Tailwind, Zustand) para acompanhar o live timing da F1 em tempo real: classificação, setores, pneus, clima, Race Control, multiview e calendário.

Site no ar: **[live-time-silk.vercel.app](https://live-time-silk.vercel.app)** (deploy automático a cada push na `main`).

Os dados vêm **direto do feed oficial de live timing da F1** (SignalR Core em `livetiming.formula1.com`), gratuito e sem chave. Não existe serviço separado para hospedar: o próprio servidor do Next.js abre a conexão quando alguém acessa o site. Funciona na **Vercel**, na **Netlify**, em Docker ou localmente.

## Como funciona

```text
Navegador ──SSE──▶ /api/live-timing/stream ──┐
          └─poll─▶ /api/live-timing ─────────┤  Next.js (função serverless ou servidor)
                                             ▼
                              src/lib/f1/feed.ts ──WebSocket──▶ livetiming.formula1.com
```

1. Ao abrir qualquer página, o navegador conecta em `/api/live-timing/stream` (Server-Sent Events).
2. O servidor abre o WebSocket SignalR com a F1 e assina os canais. A F1 responde em ~1 s com o **estado completo** da sessão, então até uma função que acabou de acordar já entrega a classificação inteira.
3. Os deltas seguintes são aplicados em memória e enviados ao navegador no máximo 1 vez por segundo.
4. Funções serverless têm tempo máximo (300 s na Vercel gratuita, 60 s na Netlify). O stream fecha um pouco antes (290 s / 25 s) com o evento `reconnect` e o navegador reabre sozinho em ~0,5 s.
5. Se o stream falhar 3 vezes seguidas, o painel consulta `/api/live-timing` a cada 2 s e volta a tentar o stream depois de 1 minuto.
6. Com a aba em segundo plano por 2 minutos a conexão é pausada, para poupar a cota gratuita, e retomada quando você volta.

Fora de fim de semana de corrida o feed mantém os dados da última sessão. O painel só mostra esses dados quando eles são do GP atual do calendário.

## Executar localmente

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Testes: `npm test`.

## Deploy

### Vercel (recomendado)

1. Importe o repositório em [vercel.com/new](https://vercel.com/new). O framework Next.js é detectado sozinho.
2. Não precisa de variável de ambiente nenhuma.
3. Pronto: cada push na `main` gera um novo deploy.

No plano Hobby (gratuito) cada stream dura até 300 s; o projeto já usa 290 s. As rotas de snapshot e status têm cache de 1 a 2 s na CDN, então vários visitantes ao mesmo tempo não multiplicam as execuções.

### Netlify

1. Importe o repositório em [app.netlify.com](https://app.netlify.com). O `netlify.toml` já define build e Node 22.
2. Sem variáveis de ambiente.

Na Netlify as funções com streaming duram no máximo 60 s, por isso o stream é renovado a cada 25 s. Funciona, mas a Vercel é a opção mais suave.

### Docker / Fly.io / Render

```bash
docker build -t live-time .
docker run -p 3000:3000 live-time
```

`fly.toml` e `render.yaml` continuam disponíveis. Como a conexão com a F1 é aberta sob demanda, a máquina pode hibernar sem acessos.

## Variáveis de ambiente

Todas opcionais (veja `.env.example`):

| Variável | Padrão | Efeito |
| --- | --- | --- |
| `F1_STREAM_SECONDS` | 290 (Vercel), 25 (Netlify), 1800 (outros) | Duração de cada stream antes de o navegador reabrir |
| `F1_LIVETIMING_API_URL` | — | Usa uma instância externa da [f1-livetiming-api](https://github.com/julesr0y/f1-livetiming-api) em vez da conexão direta |

## Endpoints do site

| Rota | Descrição |
| --- | --- |
| `/api/live-timing/stream` | Stream SSE: eventos `snapshot`, `offline` e `reconnect` |
| `/api/live-timing` | Snapshot normalizado (sessão, pilotos, Race Control) |
| `/api/f1-live/status` | Estado da conexão com o feed |
| `/api/health` | Health check (sempre 200 com o site no ar) |
| `/api/calendar` | Calendário e próxima etapa |

## Estrutura

```text
src/lib/f1/feed.ts        # cliente SignalR: conexão, assinatura, deltas, reconexão
src/lib/f1/merge.ts       # aplica deltas (inclui listas indexadas: setores, stints, mensagens)
src/lib/f1/normalize.ts   # estado bruto da F1 → LiveTimingSnapshot
src/lib/f1/source.ts      # escolhe conexão direta ou API externa
src/app/api/              # rotas do Next
src/hooks/use-live-timing.ts  # streaming no navegador com fallback para polling
tests/                    # testes com estado real do GP de Singapura 2026
```

## Limitações

- Os dados de telemetria do carro (`CarData.z`) e posição na pista (`Position.z`) exigem login F1 TV e não são assinados.
- O feed é não oficial para uso por terceiros e pode mudar sem aviso.
