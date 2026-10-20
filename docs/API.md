# Referência da API HTTP

Todas as rotas ficam em `src/app/api/` e rodam no runtime Node.js (`export const runtime = "nodejs"`), porque a conexão com a F1 usa o pacote `ws`. Nenhuma rota exige autenticação. Todas respondem JSON, exceto o stream, que responde `text/event-stream`.

| Método | Rota | Uso | Cache | `maxDuration` |
| --- | --- | --- | --- | --- |
| GET | [`/api/live-timing/stream`](#get-apilive-timingstream) | Tempo real (SSE), usado pelo site | nenhum | 300 s |
| GET | [`/api/live-timing`](#get-apilive-timing) | Snapshot único (fallback do stream) | CDN 1 s | 15 s |
| GET | [`/api/f1-live/status`](#get-apif1-livestatus) | Estado da conexão com a F1 | CDN 2 s | 15 s |
| GET | [`/api/health`](#get-apihealth) | Health check de plataforma | nenhum | 15 s |
| GET | [`/api/calendar`](#get-apicalendar) | Calendário 2026–2027 | 5 min | padrão |

Base URL de produção: `https://live-time-silk.vercel.app`. Localmente: `http://localhost:3000`.

---

## GET /api/live-timing/stream

Fluxo de Server-Sent Events com o live timing normalizado. Arquivo: [`src/app/api/live-timing/stream/route.ts`](../src/app/api/live-timing/stream/route.ts).

### Cabeçalhos da resposta

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-store, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

### Sequência de mensagens

```text
retry: 500

event: snapshot
data: {"connected":true,"lastMessageAt":"2026-10-11T14:32:10.512Z","snapshot":{...}}

: ping

event: snapshot
data: {...}

event: reconnect
data: {"afterMs":500}
```

| Item | Quando | Conteúdo |
| --- | --- | --- |
| `retry: 500` | Primeira linha | Diz ao `EventSource` para esperar 500 ms antes de reabrir. |
| `event: snapshot` | Logo ao abrir e a cada mudança do feed (no máximo 1 por segundo) | Um [`LiveTimingPollResponse`](MODELO-DE-DADOS.md#livetimingpollresponse). Só é enviado se algo mudou. |
| `event: offline` | Quando a conexão com a F1 falha | `{ "connected": false, "lastMessageAt": null, "error": "mensagem" }` |
| `: ping` | A cada 15 s | Comentário SSE (ignorado pelo navegador). Mantém proxies abertos. |
| `event: reconnect` | Ao fim da janela (`F1_STREAM_SECONDS`) | `{ "afterMs": 500 }`; o servidor fecha em seguida e o navegador reabre. |

Quando não há sessão ou a F1 ainda não mandou estado, `snapshot` chega com `connected: false` e sem o campo `snapshot`.

### Janela do stream

| Ambiente | Padrão |
| --- | --- |
| `F1_STREAM_SECONDS` definida (> 0) | valor da variável |
| Netlify (`NETLIFY` presente) | 25 s |
| Vercel (`VERCEL` presente) | 290 s |
| Outros | 1800 s |

### Exemplos

```bash
# Ver o fluxo bruto (-N desativa o buffer do curl)
curl -N https://live-time-silk.vercel.app/api/live-timing/stream
```

```js
// Navegador
const source = new EventSource("/api/live-timing/stream");
source.addEventListener("snapshot", (event) => {
  const { connected, snapshot } = JSON.parse(event.data);
  if (connected) console.log(snapshot.session.sessionName, snapshot.drivers[0]?.abbreviation);
});
source.addEventListener("offline", (event) => console.warn(JSON.parse(event.data).error));
```

---

## GET /api/live-timing

Snapshot único, no mesmo formato do evento `snapshot`. Usado pelo site como alternativa quando o stream falha três vezes seguidas. Arquivo: [`src/app/api/live-timing/route.ts`](../src/app/api/live-timing/route.ts).

### Resposta 200

```json
{
  "connected": true,
  "lastMessageAt": "2026-10-11T14:32:10.512Z",
  "snapshot": {
    "session": {
      "eventName": "FORMULA 1 SINGAPORE AIRLINES SINGAPORE GRAND PRIX 2026",
      "meetingName": "Singapore Grand Prix",
      "circuitName": "Singapore",
      "locality": "Marina Bay",
      "country": "Singapore",
      "timezone": "UTC+08:00",
      "sessionName": "Race",
      "status": "finished",
      "currentLap": 62,
      "totalLaps": 62,
      "scheduledStart": "2026-10-11T20:00:00+08:00",
      "trackTemperatureC": 31.2,
      "airTemperatureC": 28.9,
      "trackFlag": "chequered"
    },
    "drivers": [
      {
        "driverId": "1",
        "position": 1,
        "abbreviation": "VER",
        "fullName": "Max VERSTAPPEN",
        "team": "red-bull",
        "teamName": "Red Bull Racing",
        "teamColour": "#4781D7",
        "carNumber": 1,
        "completedLaps": 62,
        "gapToLeader": "LEADER",
        "interval": "—",
        "lastLapSeconds": 96.282,
        "bestLapSeconds": 94.513,
        "sectors": [
          { "sector": 1, "timeSeconds": 28.713, "status": "normal" },
          { "sector": 2, "timeSeconds": 38.101, "status": "personal-best" },
          { "sector": 3, "timeSeconds": 29.468, "status": "session-best" }
        ],
        "tire": { "compound": "HARD", "ageLaps": 34, "condition": "used" },
        "pitStatus": "track",
        "telemetry": { "speedKph": 297 },
        "updatedAt": "2026-10-11T14:32:10.600Z"
      }
    ],
    "raceControl": [
      {
        "id": "rc-41-2026-10-11T13:58:02",
        "timestamp": "2026-10-11T13:58:02Z",
        "lap": 62,
        "severity": "info",
        "category": "track-status",
        "message": "CHEQUERED FLAG"
      }
    ],
    "emittedAt": "2026-10-11T14:32:10.600Z"
  }
}
```

Os valores acima são ilustrativos; a estrutura é a de [`LiveTimingSnapshot`](MODELO-DE-DADOS.md#livetimingsnapshot).

### Cabeçalhos

```http
Cache-Control: public, max-age=0, s-maxage=1, stale-while-revalidate=4
CDN-Cache-Control: public, s-maxage=1, stale-while-revalidate=4
```

O navegador não guarda cache (`max-age=0`), mas a CDN serve a mesma resposta por 1 s a todos os visitantes e pode servir uma cópia de até 4 s enquanto revalida.

### Resposta 502

Erro ao falar com a F1 (ou com a API externa):

```json
{ "connected": false, "lastMessageAt": null, "error": "Tempo esgotado ao conectar ao feed da F1." }
```

Com `Cache-Control: no-store`.

---

## GET /api/f1-live/status

Estado da conexão com a origem dos dados, útil para diagnóstico e monitoramento (o site não consulta esta rota). Arquivo: [`src/app/api/f1-live/status/route.ts`](../src/app/api/f1-live/status/route.ts).

### Resposta 200

```json
{
  "service": "F1 SignalR (conexão direta)",
  "mode": "direct",
  "connected": true,
  "status": "CONNECTED",
  "lastMessageAt": "2026-10-20T13:05:41.120Z",
  "uptimeSeconds": 412,
  "timestamp": "2026-10-20T13:12:33.004Z",
  "apiBaseUrl": "wss://livetiming.formula1.com/signalrcore"
}
```

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `service` | string | `"F1 SignalR (conexão direta)"` ou `"f1-livetiming-api"`. |
| `mode` | `"direct" \| "external"` | Modo de origem (ver [ARQUITETURA.md](ARQUITETURA.md#modo-externo-f1-livetiming-api)). |
| `connected` | boolean | Socket aberto e estado completo recebido. |
| `status` | string | `IDLE`, `CONNECTING`, `CONNECTED`, `DISCONNECTED` ou `UNAVAILABLE`. |
| `lastMessageAt` | ISO-8601 \| null | Último dado recebido da F1 (pings não contam). Fora de sessão pode ficar horas no passado. |
| `uptimeSeconds` | number \| null | Há quanto tempo a conexão atual está aberta. |
| `timestamp` | ISO-8601 | Hora da resposta. |
| `apiBaseUrl` | string | Endpoint usado (WebSocket da F1 ou URL da API externa). |
| `error` | string? | Presente só quando desconectado com erro. |

Cabeçalhos: `s-maxage=2, stale-while-revalidate=5`. Em erro inesperado responde **503** com o mesmo formato, `status: "UNAVAILABLE"` e `no-store`.

---

## GET /api/health

Para health checks de Docker, Fly.io e Render. **Sempre responde 200** enquanto o servidor estiver de pé, mesmo sem sessão ao vivo; o estado do feed vai no corpo. Arquivo: [`src/app/api/health/route.ts`](../src/app/api/health/route.ts).

```json
{ "ok": true, "site": "up", "feed": { "service": "F1 SignalR (conexão direta)", "mode": "direct", "connected": true, "status": "CONNECTED", "...": "..." } }
```

Cabeçalho: `Cache-Control: no-store`.

---

## GET /api/calendar

Calendário local (não depende da F1). O site usa o calendário embutido no código e não consulta esta rota; ela existe para integrações. Arquivo: [`src/app/api/calendar/route.ts`](../src/app/api/calendar/route.ts), dados em [`src/data/f1-calendar.ts`](../src/data/f1-calendar.ts).

```json
{
  "seasons": [2026, 2027],
  "events": {
    "2026": [
      {
        "season": 2026,
        "round": 18,
        "country": "United States",
        "location": "Austin",
        "name": "United States Grand Prix",
        "circuit": "Circuit of The Americas",
        "startDate": "2026-10-23",
        "raceDate": "2026-10-25",
        "endDate": "2026-10-25",
        "url": "https://www.formula1.com/en/racing/2026"
      }
    ],
    "2027": []
  },
  "sources": {
    "2026": "https://www.formula1.com/en/racing/2026",
    "2027": "https://www.formula1.com/en/racing/2027"
  },
  "nextEvent": { "season": 2026, "round": 18, "name": "United States Grand Prix", "...": "..." }
}
```

| Campo | Descrição |
| --- | --- |
| `seasons` | Temporadas disponíveis (`F1_SEASONS`). |
| `events` | Objeto indexado pelo ano, com a lista de etapas (23 em 2026, 24 em 2027). |
| `sources` | Páginas oficiais da F1 usadas como referência para cada temporada. |
| `nextEvent` | Primeira etapa cuja data da corrida (`raceDate`) é hoje ou depois, calculada por `nextGrandPrix(agora)` em UTC. Ausente quando o calendário acabou. |

Campos de cada etapa (`GrandPrixEvent`):

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `season` | number | Ano. |
| `round` | number | Número da etapa. |
| `country`, `location` | string | País e cidade. |
| `name` | string | Nome do Grande Prêmio (em inglês, como no feed da F1). |
| `circuit` | string | Nome do circuito. |
| `startDate` | `YYYY-MM-DD` | Sexta-feira do fim de semana. |
| `raceDate` | `YYYY-MM-DD` | Dia da corrida (igual a `endDate`). |
| `endDate` | `YYYY-MM-DD` | Último dia do fim de semana. |
| `url` | string | Página da temporada na F1. |

Cabeçalho: `Cache-Control: public, max-age=300, stale-while-revalidate=3600`.

---

## Códigos de status

| Código | Rotas | Significado |
| --- | --- | --- |
| 200 | todas | Sucesso. Fora de sessão, `connected` pode ser `false`. |
| 502 | `/api/live-timing` | Falha ao obter o snapshot da origem. |
| 503 | `/api/f1-live/status` | Falha inesperada ao calcular o estado. |

## Limites e boas práticas para quem consome

- Prefira o stream; ele envia só quando algo muda.
- Se usar polling, 1–2 s é suficiente: a CDN já agrega as chamadas em janelas de 1 s.
- Não confie em `lastMessageAt` para saber se há sessão ao vivo; use `session.status` e compare `session.meetingName` com o calendário (como faz a página inicial).
- Os dados são da F1 e servidos apenas para visualização pessoal; veja o aviso em [README](../README.md#aviso-legal).
