# Apex Timing

Painel Next.js App Router, TypeScript, Tailwind CSS, Zustand e Lucide. O projeto consome a API OpenF1; não inclui classificação, voltas, mensagens ou telemetria geradas localmente.

## Executar

```powershell
cd D:\apex-timing
npm install
npm run dev
```

Abra `http://localhost:3000`. O script de desenvolvimento seleciona Webpack, necessário nesta instalação do Next.js 16 no Windows.

## Autenticação OpenF1

No app, escolha **Entrar no OpenF1** e informe suas credenciais da conta OpenF1. O servidor troca as credenciais por um token; o token fica em cookie `HttpOnly` e as senhas não são persistidas. Não coloque credenciais em código, `.env` ou no chat.

Dados históricos OpenF1 são acessíveis publicamente; o feed em tempo real exige assinatura/acesso ativo. O app faz polling autenticado dos endpoints REST a cada 10 segundos e retransmite atualizações ao navegador via SSE. Campos ausentes ficam vazios. O OpenF1 é uma API comunitária não oficial, independente da FIA/F1.

Em **Configurações**, escolha uma sessão de 2026 publicada ou a opção mais recente. O GP dos EUA está agendado para 25/10/2026 às 15:00 CDT; antes de uma sessão ocorrer, ainda não haverá timing real dessa corrida. As prévias de vídeo também permanecem vazias até que fontes HLS/WebRTC autorizadas sejam configuradas.

## Rotas e estrutura

```text
src/
├── app/
│   ├── api/
│   │   ├── live-timing/route.ts       # SSE para o browser, polling OpenF1 no servidor
│   │   └── openf1/
│   │       ├── auth/route.ts          # troca OAuth e cookie HttpOnly
│   │       ├── session/route.ts       # normalização dos endpoints OpenF1
│   │       └── sessions/route.ts      # sessões publicadas para seleção
│   ├── multiview/page.tsx
│   ├── race-control/page.tsx
│   ├── settings/page.tsx
│   ├── telemetry/page.tsx
│   └── page.tsx                       # Live Timing
├── components/
│   ├── ui/                            # autenticação, shell, contagem e estado
│   ├── multiview/                     # grade de fontes configuráveis
│   └── livetiming/                    # tabela, setores e Race Control
├── hooks/use-live-timing.ts           # cliente SSE
├── store/live-timing-store.ts         # Zustand
└── types/live-timing.ts               # contratos tipados
```
