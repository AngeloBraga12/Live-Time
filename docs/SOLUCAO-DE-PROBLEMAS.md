# Solução de problemas

## Diagnóstico rápido

```bash
BASE=https://live-time-silk.vercel.app   # ou http://localhost:3000
curl -s $BASE/api/health
curl -s $BASE/api/f1-live/status
curl -N --max-time 5 $BASE/api/live-timing/stream
```

| Resultado de `/api/f1-live/status` | Significado |
| --- | --- |
| `connected: true`, `lastMessageAt` recente | Tudo certo, sessão ao vivo. |
| `connected: true`, `lastMessageAt` de dias atrás | Normal fora de fins de semana: a F1 mantém o estado da última sessão e não envia nada novo. |
| `connected: false`, `status: "DISCONNECTED"` com `error` | A conexão com a F1 falhou; leia a mensagem (tabela abaixo). |
| `status: "UNAVAILABLE"` | Erro inesperado ou API externa fora do ar (modo `external`). |
| HTTP 404 | O deploy não contém as rotas de API (build antigo ou publicado como site estático). |

## Mensagens de erro do feed

| Mensagem | Causa provável | O que fazer |
| --- | --- | --- |
| `Negotiate com a F1 falhou (HTTP 4xx/5xx).` | Serviço da F1 fora do ar, bloqueio de região/IP ou mudança no endpoint | Tente de novo em alguns minutos. Se persistir em todas as plataformas, a F1 pode ter mudado o protocolo. |
| `A F1 não devolveu token de conexão.` | Resposta inesperada do negotiate | Idem. |
| `Tempo esgotado ao conectar ao feed da F1.` | Rede lenta ou estado inicial não chegou em 8 s | Normalmente se resolve na próxima tentativa (automática). |
| `Handshake recusado: ...` / `Assinatura recusada: ...` | Protocolo SignalR rejeitado | Verifique se `F1_SIGNALR_URL` não foi alterada. |
| `A F1 encerrou a conexão...` | Servidor da F1 fechou (manutenção, reinício) | Reconecta sozinho em 2 s se houver alguém assistindo. |
| `f1-livetiming-api respondeu HTTP ...` | Modo externo com a API fora do ar | Corrija a API externa ou remova `F1_LIVETIMING_API_URL` para voltar à conexão direta. |

## Problemas no site

### A tabela mostra "Último resultado" em vez da sessão ao vivo

Esperado entre fins de semana: a F1 mantém a última sessão no feed, e a página inicial só trata como ao vivo quando o nome da etapa do feed bate com a etapa atual do calendário. Se acontecer **durante** uma sessão:

1. Confira `session.meetingName` em `/api/live-timing`.
2. Confira se o nome, a cidade ou o país dessa etapa em `src/data/f1-calendar.ts` aparecem nesse texto (sem acentos, minúsculas). Se a F1 usar outro nome, ajuste o calendário.
3. Confira as datas da etapa no calendário (comparação em UTC).

### "Sem dados da F1 no momento"

A conexão com a F1 não entregou pilotos.

- Veja `/api/f1-live/status` (acima); o campo `error` explica a falha.
- Se só o seu navegador falha, verifique extensões que bloqueiam requisições (bloqueadores de anúncios às vezes barram `eventsource`).

### Dados demoram ou "pulam"

- Em DevTools → Network, filtre por `stream`. Se a requisição estiver `pending` sem eventos, algum proxy está bufferizando. Em servidor próprio, configure `proxy_buffering off` (veja [DEPLOY.md](DEPLOY.md#docker)).
- Se aparecem várias requisições a `/api/live-timing` a cada 2 s, o site entrou no modo de fallback (o stream falhou 3 vezes). Ele volta a tentar o stream depois de 60 s.

### Reconexões a cada 25 s ou 290 s

É o comportamento previsto nas plataformas serverless (evento `reconnect`). O navegador reabre em 0,5 s e os dados continuam.

### A conexão some com a aba em segundo plano

Proposital: após 2 minutos oculta, a aba pausa a conexão para poupar a cota gratuita. Ao voltar para a aba, reconecta na hora.

### Telemetria vazia (acelerador, freio, marcha)

Esses dados vêm do canal `CarData.z`, que exige login de assinante F1 TV. A API devolve a velocidade do speed trap quando disponível, mas a tela não exibe telemetria.

### Replay de sessões antigas

Não disponível: o arquivo estático da F1 (`livetiming.formula1.com/static`) responde HTTP 401.

### Endereços antigos

`/timing`, `/multiview`, `/telemetry`, `/race-control` e `/settings` foram removidos no redesign e redirecionam para `/`.

## Problemas de deploy

| Sintoma | Solução |
| --- | --- |
| Vercel não faz deploy automático | Em GitHub → Settings → Applications → Vercel, confirme o acesso ao repositório `Live-Time`. No projeto da Vercel, Settings → Git deve mostrar o repositório conectado e a branch de produção `main`. |
| Build falha com erro de tipos | Rode `npm run build` localmente; o Next.js verifica tipos durante o build. |
| `Module not found: ws` / `bufferutil` | Garanta que `next.config.ts` mantém `serverExternalPackages: ["ws"]`. |
| Netlify publica, mas `/api/*` dá 404 | Confirme que o build usou o `netlify.toml` (publish `.next`) e que o adaptador do Next.js foi aplicado no log do deploy. |
| Docker não fica "healthy" | `docker logs <container>`; o health check chama `/api/health` dentro do contêiner na porta `PORT`. |
| Render/Fly demoram na primeira visita | A máquina estava dormindo (`plan: free` / `auto_stop_machines`). É esperado. |

## Testes falhando

| Teste | Causa comum |
| --- | --- |
| `feed.test.ts` | Porta local bloqueada ou máquina muito lenta (o teste de reconexão espera 2,6 s). Rode de novo isoladamente. |
| `normalize.test.ts` | Mudança na normalização ou fixture substituída sem atualizar os valores esperados. |

## Ainda com problemas

Abra uma [issue no GitHub](https://github.com/AngeloBraga12/Live-Time/issues) com a saída de `/api/f1-live/status`, a URL do deploy, a plataforma e o horário (com fuso).
