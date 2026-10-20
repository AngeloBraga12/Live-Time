# Desenvolvimento

Guia para rodar, testar e modificar o projeto localmente.

## Sumário

- [Requisitos](#requisitos)
- [Primeiros passos](#primeiros-passos)
- [Scripts](#scripts)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Testes](#testes)
- [Lint](#lint)
- [Convenções](#convenções)
- [Receitas](#receitas)
  - [Adicionar um canal da F1](#adicionar-um-canal-da-f1)
  - [Adicionar um campo ao snapshot](#adicionar-um-campo-ao-snapshot)
  - [Adicionar uma página](#adicionar-uma-página)
  - [Atualizar a fixture de testes](#atualizar-a-fixture-de-testes)
  - [Testar com um hub falso](#testar-com-um-hub-falso)
- [Depuração](#depuração)

## Requisitos

| Ferramenta | Versão |
| --- | --- |
| Node.js | 20.9 ou superior (`engines` no `package.json`). O Docker e a Netlify usam 22. |
| npm | o que acompanha o Node |
| Git | qualquer versão recente |

Versões instaladas pelo `package-lock.json` no momento desta documentação: Next.js 16.4.0, React 19.3.0, Zustand 5.0.15, ws 8.22.0, lucide-react 0.468.0, Tailwind CSS 4.3.3, TypeScript 5.9.3, tsx 4.23.15.

## Primeiros passos

```bash
git clone https://github.com/AngeloBraga12/Live-Time.git
cd Live-Time
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O servidor de desenvolvimento conecta à F1 na primeira requisição; não há nada mais a configurar. Para personalizar, copie `.env.example` para `.env.local`.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Build de produção (`.next/`) com checagem de tipos |
| `npm start` | Serve o build de produção (porta `PORT` ou 3000) |
| `npm test` | Testes com o runner nativo do Node via `tsx --test tests/*.test.ts` |
| `npm run lint` | ESLint com as regras `core-web-vitals` e `typescript` do Next.js |

## Estrutura de pastas

```text
Live-Time/
├── src/
│   ├── app/                      # App Router (páginas e rotas de API)
│   │   ├── layout.tsx            # HTML raiz, lang pt-BR, script de tema
│   │   ├── globals.css           # Estilos (Tailwind + CSS próprio, temas)
│   │   ├── page.tsx              # "/" → redireciona para /multiview
│   │   ├── multiview/page.tsx
│   │   ├── timing/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── telemetry/page.tsx
│   │   ├── race-control/page.tsx
│   │   ├── settings/page.tsx     # "Conexão"
│   │   └── api/
│   │       ├── live-timing/route.ts          # snapshot JSON
│   │       ├── live-timing/stream/route.ts   # SSE
│   │       ├── f1-live/status/route.ts
│   │       ├── health/route.ts
│   │       └── calendar/route.ts
│   ├── components/
│   │   ├── livetiming/           # tabela, Race Control, mapa da pista
│   │   ├── multiview/            # mosaico de vídeos
│   │   └── ui/                   # layout, status, tema, contagem
│   ├── data/f1-calendar.ts       # calendário 2026–2027
│   ├── hooks/                    # useLiveTiming, useF1LiveApiStatus, useCalendar
│   ├── lib/f1/
│   │   ├── feed.ts               # cliente SignalR da F1 (singleton)
│   │   ├── merge.ts              # aplicação de deltas
│   │   ├── normalize.ts          # estado bruto → LiveTimingSnapshot
│   │   └── source.ts             # modo direto / externo
│   ├── store/live-timing-store.ts
│   └── types/live-timing.ts
├── tests/
│   ├── feed.test.ts              # hub SignalR falso
│   ├── merge.test.ts
│   ├── normalize.test.ts
│   └── fixtures/singapore-2026-race.json
├── docs/                         # esta documentação
├── Dockerfile, fly.toml, render.yaml, netlify.toml
├── next.config.ts                # serverExternalPackages: ["ws"], reactStrictMode
├── eslint.config.mjs, postcss.config.mjs, tsconfig.json
└── .env.example
```

O alias `@/` aponta para `src/` (definido em `tsconfig.json`).

## Testes

```bash
npm test
```

São 10 testes, sem rede externa:

| Arquivo | Testes |
| --- | --- |
| `merge.test.ts` | atualiza item de array por índice sem perder os irmãos; acrescenta mensagem de Race Control enviada como objeto indexado; cria novo stint no fim da lista; mescla objetos em profundidade e aplica `_deleted` |
| `normalize.test.ts` | converte tempos de volta; sessão do GP de Singapura encerrada; pilotos ordenados com dados completos; Race Control da mais recente para a mais antiga com piloto identificado; deltas ao vivo atualizam bandeira, voltas e posições |
| `feed.test.ts` | conecta a um hub falso (cookie, negotiate, handshake, Subscribe), aplica deltas de safety car, volta, setor e Race Control, e reconecta sozinho após a queda do socket |

A fixture `singapore-2026-race.json` é o estado real da corrida de Singapura 2026 obtido do feed, o que garante que a normalização é testada com dados de verdade.

Para rodar um arquivo só:

```bash
npx tsx --test tests/normalize.test.ts
```

## Lint

```bash
npm run lint
```

Estado atual: 3 erros e 3 avisos (6 problemas) herdados de versões anteriores, que **não impedem o build**:

| Arquivo | Regra | Situação |
| --- | --- | --- |
| `components/ui/theme-toggle.tsx` | `react-hooks/set-state-in-effect` | `setState` dentro de `useEffect` para ler o tema inicial |
| `components/ui/countdown.tsx` | `react-hooks/set-state-in-effect` | idem para o relógio |
| `components/multiview/multiview-console.tsx` | `react-hooks/set-state-in-effect` | idem para ler o `localStorage` |
| `hooks/use-calendar.ts` | `no-unused-vars` (aviso) | `updateClock` declarado e não usado |
| `app/calendar/page.tsx` | `exhaustive-deps` (aviso) | `events` recalculado a cada renderização dentro de `useMemo` |
| `postcss.config.mjs` | `no-anonymous-default-export` (aviso) | objeto exportado sem nome |

Corrigir esses pontos é uma boa primeira contribuição (por exemplo, inicializar o estado com uma função em `useState` ou usar `useSyncExternalStore`).

## Convenções

- **Idioma**: textos da interface, comentários e mensagens de commit em português. Nomes de código em inglês.
- **TypeScript estrito**; tipos de domínio em `src/types/live-timing.ts`.
- **Funções puras** em `merge.ts` e `normalize.ts`: sem rede, sem `Date.now()` implícito quando possível (o horário é parâmetro), fáceis de testar.
- **Servidor x cliente**: tudo que toca a F1 fica em `src/lib/f1/` e só é importado por rotas de API. Componentes de cliente leem apenas a store.
- **Rotas** declaram `runtime = "nodejs"` e `dynamic = "force-dynamic"`.
- **Commits** pequenos, em branches; nunca direto na `main` (veja [CONTRIBUTING.md](../CONTRIBUTING.md)).

## Receitas

### Adicionar um canal da F1

Exemplo: `TopThree`.

1. Em `src/lib/f1/feed.ts`, acrescente o nome em `TOPICS`. O tipo `Topic` e o `FeedState` se ajustam sozinhos.
2. Em `src/lib/f1/normalize.ts`, leia `state.TopThree` e converta para o formato desejado.
3. Exponha no snapshot (veja a próxima receita).
4. Adicione um teste em `tests/normalize.test.ts`. Se a fixture não tiver o canal, crie um estado mínimo no próprio teste.

Lembre-se: canais terminados em `.z` (`CarData.z`, `Position.z`) exigem login de F1 TV e vêm comprimidos; não funcionam sem autenticação.

### Adicionar um campo ao snapshot

1. Acrescente o campo ao tipo em `src/types/live-timing.ts` (por exemplo, em `SessionInfo`).
2. Preencha em `mapSession` / `mapDriver` / `mapRaceControl` no `normalize.ts`.
3. Se for de sessão, inclua um valor padrão em `emptySession` na store.
4. Use na página com `useLiveTimingStore((s) => s.session.novoCampo)`.
5. Documente em [MODELO-DE-DADOS.md](MODELO-DE-DADOS.md).

### Adicionar uma página

1. Crie `src/app/minha-pagina/page.tsx` com `"use client"`.
2. Envolva o conteúdo em `<SectionWorkspace active="/minha-pagina" title="..." description="...">`; isso já conecta ao live timing.
3. Para aparecer no menu, inclua `["/minha-pagina", "Nome", Icone]` no array `links` de `components/ui/section-workspace.tsx` (o ícone vem do `lucide-react`).

### Atualizar a fixture de testes

O estado bruto pode ser salvo com um script que usa o próprio `f1Feed` (não precisa do servidor rodando).

Crie um arquivo temporário `dump.mts` na raiz do projeto:

```ts
import { writeFileSync } from "node:fs";
import { f1Feed } from "./src/lib/f1/feed";

await f1Feed.ensure();
writeFileSync("tests/fixtures/nova-sessao.json", JSON.stringify(f1Feed.getState(), null, 2));
process.exit(0);
```

E rode:

```bash
npx tsx dump.mts && rm dump.mts
```

O arquivo terá as 12 chaves de `TOPICS` com o estado da última sessão publicada pela F1. Depois ajuste os testes que dependem de nomes, posições ou contagens.

### Testar com um hub falso

`F1_SIGNALR_URL` redireciona o feed. O `tests/feed.test.ts` mostra um hub completo com `http.createServer` + `WebSocketServer` do `ws`. Para usar no `next dev`:

```bash
F1_SIGNALR_URL=http://127.0.0.1:5055/signalrcore npm run dev
```

## Depuração

| Quero ver | Como |
| --- | --- |
| Estado da conexão com a F1 | `curl localhost:3000/api/f1-live/status` |
| Snapshot normalizado | `curl localhost:3000/api/live-timing \| jq .snapshot.session` |
| Eventos em tempo real | `curl -N localhost:3000/api/live-timing/stream` |
| Store no navegador | React DevTools, ou expor temporariamente `useLiveTimingStore` em `window` durante o desenvolvimento e chamar `getState()` no console |
| Estado bruto da F1 | Script com `f1Feed.getState()` (veja [Atualizar a fixture](#atualizar-a-fixture-de-testes)) |

No `next dev`, o singleton fica em `globalThis.__liveTimeF1Feed`, então o hot reload não abre conexões duplicadas.
