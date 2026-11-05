# Changelog

Histórico de mudanças do projeto, montado a partir do histórico do Git. Datas no formato AAAA-MM-DD.

## [Não lançado]

### Navegação

- Indicador da aba ativa desliza entre os links do cabeçalho e respeita a preferência por movimento reduzido.

### Calendário e leitura do live timing

- Mapas SVG corrigidos e completados para todos os circuitos listados no calendário, com créditos e licenças registrados.
- Miniaturas de circuitos usam uma base escura consistente, mantendo o traçado visível nos temas claro e escuro.

- Calendário abre na temporada da etapa atual ou da próxima e rola até o GP em destaque.
- Tabela de cronometragem adapta as colunas a cartões rotulados em painéis estreitos e usa uma tabela compacta em telas largas, sem barra horizontal.
- Perfis individuais de pilotos mostram resultados por GP e Sprint de 2026, com os dois tipos de pontuação separados.

### Enciclopédia de pilotos

- Índice atualizado com participantes de 2026, substitutos e pilotos oficialmente confirmados para 2027, com data de corte e critério de confirmação.
- Perfis de pilotos apresentam históricos estatísticos, status contratual e fontes diretas; campos sem comprovação ficam identificados como indisponíveis.

### Campeonato, perfis e mapas de circuitos

- Adicionadas as páginas de classificação do campeonato e perfis históricos de pilotos e construtores.
- Adicionadas rotas `/api/standings`, `/api/driver/[id]` e `/api/constructor/[id]`, com dados da API compatível com Ergast e cache para reduzir chamadas.
- Adicionados mapas SVG locais dos circuitos, metadados e script de atualização com atribuição ao projeto f1db.
- Atualizado o README e os guias de API, frontend, arquitetura, modelo de dados e fontes para corresponder às páginas, rotas e origens disponíveis.

### Redesign no estilo do site da F1

- Nova identidade visual: preto carbono, vermelho F1 (`#e10600`) só em destaques, fundo off-white, fonte Archivo com títulos largos em caixa alta e cartões com o canto superior direito arredondado.
- `/` passa a ser a página ao vivo: topo com sessão, voltas, clima e faixa do estado da pista (ou próxima etapa com contagem regressiva), classificação com alternância Líder/Intervalo e lista da direção de prova.
- Dados da última sessão aparecem como "Último resultado" entre fins de semana, em vez de ficarem escondidos.
- Calendário em cartões, com a próxima etapa em vermelho e países em português.
- Tabela responsiva (colunas somem em 1100, 800 e 560 px), esqueleto de carregamento, link "Pular para o conteúdo" e contraste AA nos dois temas.
- Só a página ao vivo abre conexão com o live timing; o calendário não consome cota.

### Removido no redesign

- Páginas Multiview, Telemetria, Race Control (separada) e Conexão. `/timing`, `/multiview`, `/telemetry`, `/race-control` e `/settings` redirecionam para `/`.
- Indicador "F1 API · CONECTADA/OFFLINE", hook `useF1LiveApiStatus`, componentes sem uso (`MiniSectorTrack`, `MultiviewStrip`, `StatusPill`, `FlagMarker`, `Countdown`, `SectionWorkspace`), ação `addRaceControl` da store e coluna de velocidade.
- Tailwind CSS e PostCSS: os estilos são CSS puro em `globals.css`.

### Qualidade

- Lint zerado (0 erros, 0 avisos), incluindo as correções do PR #4.

### Documentação

- README reescrito com visão geral, arquitetura, rotas, deploy, limitações e solução de problemas.
- Nova pasta `docs/` com guias de arquitetura, API, protocolo do feed da F1, modelo de dados, frontend, deploy, desenvolvimento e solução de problemas.
- `CONTRIBUTING.md` e este `CHANGELOG.md`.
- Link do site em produção e explicação do deploy automático no README (`03e6d4c`).

## 2026-10-20: conexão direta e deploy serverless

### Adicionado (`f4da82a`, PR #2, merge `23671d7`)

- Cliente SignalR próprio (`src/lib/f1/feed.ts`) que conecta direto ao `livetiming.formula1.com`, sem servidor separado.
- Merge de deltas com suporte a listas indexadas e `_deleted` (`src/lib/f1/merge.ts`).
- Normalização do estado bruto da F1 (`src/lib/f1/normalize.ts`), com regras diferentes de diferença para corrida e para quali/treino.
- Stream em tempo real por Server-Sent Events (`/api/live-timing/stream`), com janela ajustada à Vercel (290 s) e à Netlify (25 s).
- Cache de 1 s na CDN para `/api/live-timing` e de 2 s para `/api/f1-live/status`.
- Conexão automática em todas as páginas, com fallback para polling e pausa com a aba em segundo plano.
- `/api/health`, `Dockerfile`, `fly.toml`, `render.yaml` e `netlify.toml`.
- Página `/timing` reconhece a etapa ao vivo pelo calendário e mostra a próxima etapa depois da corrida.
- Testes automatizados (10) com fixture real da corrida de Singapura 2026 e hub SignalR falso.
- Ajustes de contraste nos temas claro e escuro.
- Modo opcional `F1_LIVETIMING_API_URL` para continuar usando uma f1-livetiming-api externa.

### Removido

- `scripts/run-site.mjs` (iniciava a f1-livetiming-api junto com o site) e `src/lib/f1-livetiming-api.ts`, substituídos pela conexão direta.
- `.npmrc`.

### Corrigido

- Marcadores de conflito de merge que tinham ficado no código (`0ef7a27`, PR #1).
- `tsconfig.tsbuildinfo` passou a ser ignorado pelo Git (`9c795e3`).

## 2026-10-16: primeiras versões

- `9c49fa4` F1 live timing project
- `d2f51db` first commit
- `d2b876d`, `3fb160a` Primeiro commit: projeto Live-Time
- `3303d6f` Segundo Commit
- `37afc5c` Commit (introduziu marcadores de conflito, corrigidos depois em `0ef7a27`)
