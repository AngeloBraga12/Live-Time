# Fontes de dados

O projeto mantém separadas as fontes de live timing, resultados históricos e ilustrações dos circuitos. Dados vindos de uma origem externa podem ficar temporariamente indisponíveis; a interface mostra o estado de erro ou o último snapshot em cache, sem inventar valores.

## Live timing — feed público da F1

- Hub SignalR: `https://livetiming.formula1.com/signalrcore`, com negotiate HTTP e WebSocket JSON.
- Cliente: [`src/lib/f1/feed.ts`](../src/lib/f1/feed.ts); conversão do estado histórico: [`src/lib/f1/last-race.ts`](../src/lib/f1/last-race.ts).
- O feed pode fornecer classificação, voltas, setores, pneus, clima e mensagens do Race Control durante uma sessão. Os canais de telemetria protegidos por F1 TV não estão disponíveis sem autenticação.
- Quando não há dados de sessão no feed, o site consulta o resultado oficial da última corrida pela API histórica compatível com Ergast. Esse resultado não contém telemetria, tempos de setor ou dados de pneus; esses campos continuam vazios.
- Opcionalmente, `F1_LIVETIMING_API_URL` muda a origem do live timing para uma instância externa da `f1-livetiming-api`; sem a variável, usa a conexão direta com a F1.

Protocolo, canais e reconexão: [FEED-F1.md](FEED-F1.md). Tipos do snapshot: [MODELO-DE-DADOS.md](MODELO-DE-DADOS.md).

## Campeonato e histórico — API compatível com Ergast

A API original do Ergast foi encerrada. O projeto tenta primeiro o espelho Jolpica (`https://api.jolpi.ca/ergast/f1`) e depois o host histórico (`https://ergast.com/api/f1`); `ERGAST_BASE_URL` permite definir uma base preferencial. A primeira base que responder é reutilizada pela instância do servidor.

- Cliente centralizado: [`src/lib/f1/ergast.ts`](../src/lib/f1/ergast.ts).
- Classificação de pilotos e construtores: [`src/lib/f1/standings.ts`](../src/lib/f1/standings.ts), exposta em `/api/standings?season=2026`.
- Estatísticas de pilotos e equipes: [`src/lib/f1/history.ts`](../src/lib/f1/history.ts), expostas em `/api/driver/{id}` e `/api/constructor/{id}`.
- Último resultado de corrida quando o feed ao vivo não tem sessão: [`src/lib/f1/last-race.ts`](../src/lib/f1/last-race.ts).
- As rotas normalizam os valores numéricos e retornam erros HTTP quando a fonte falha ou não encontra o identificador. Classificações usam cache de 5 minutos; perfis usam cache de 1 hora, com revalidação stale de 24 horas.

## Traçados dos circuitos — f1db

- Os SVGs usados pelo site ficam em `public/maps/`; metadados e caminhos estão em [`src/data/circuits-meta.ts`](../src/data/circuits-meta.ts) e são exibidos por [`circuit-map.tsx`](../src/components/ui/circuit-map.tsx).
- O arquivo [`public/maps/_manifest.json`](../public/maps/_manifest.json) preserva os créditos e licenças identificados para a coleção. Os registros incluem licenças CC BY-SA 3.0 e CC BY-SA 4.0; mantenha os créditos e os termos aplicáveis junto das imagens.
- O script [`scripts/download-maps.mjs`](../scripts/download-maps.mjs) baixa traçados do projeto [f1db/f1-circuits-svg](https://github.com/f1db/f1-circuits-svg), licenciado em CC-BY-4.0, e adapta o contraste ao tema escuro. Atribuição: *Circuit layout artwork by the f1db project (https://github.com/f1db/f1-circuits-svg), CC-BY-4.0*. Ao substituir arquivos por imagens de outra origem, atualize também o manifesto e preserve a atribuição/licença própria.

## Atualizar uma fonte

Centralize novas chamadas históricas em `ergast.ts`, preserve o formato tipado nas rotas e atualize os exemplos em [API.md](API.md) e os tipos em [MODELO-DE-DADOS.md](MODELO-DE-DADOS.md). Ao incluir mapas ou outra arte de terceiros, registre a licença e a atribuição exigida antes de publicar.
