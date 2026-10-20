# Como contribuir

Obrigado por ajudar a melhorar o Live-Time. Este guia resume o fluxo de trabalho do repositório.

## Regras do repositório

- **Nunca faça push direto na `main`.** A `main` é publicada automaticamente em produção pela Vercel ([live-time-silk.vercel.app](https://live-time-silk.vercel.app)).
- Toda mudança entra por **Pull Request**, que recebe uma URL de preview da Vercel.
- Textos da interface, documentação e mensagens de commit em **português**.

## Passo a passo

```bash
git checkout main && git pull
git checkout -b tipo/descricao-curta      # ex.: fix/contraste-calendario
# ... alterações ...
npm test && npm run build
git add -A && git commit -m "Corrige contraste do calendário no tema claro"
git push -u origin fix/contraste-calendario
gh pr create --fill                       # ou pelo site do GitHub
```

### Nomes de branch

| Prefixo | Uso |
| --- | --- |
| `feat/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `docs/` | Documentação |
| `refactor/` | Mudança interna sem alterar comportamento |
| `test/` | Testes |
| `chore/` | Configuração, dependências |

### Mensagens de commit

Frase curta no imperativo, em português, descrevendo o efeito: `Adiciona aba de rádio das equipes`, `Corrige ordem do Race Control`.

## Checklist do Pull Request

- [ ] `npm test` passa
- [ ] `npm run build` passa
- [ ] `npm run lint` sem erros nem avisos
- [ ] Testado na URL de preview da Vercel
- [ ] Documentação atualizada (`README.md` e `docs/`) se mudou comportamento, rota, variável ou tipo
- [ ] Entrada no [CHANGELOG.md](CHANGELOG.md)

## Onde mexer

| Quero... | Arquivo | Guia |
| --- | --- | --- |
| Mudar a conexão com a F1 | `src/lib/f1/feed.ts` | [docs/FEED-F1.md](docs/FEED-F1.md) |
| Mudar como os dados são convertidos | `src/lib/f1/normalize.ts` | [docs/MODELO-DE-DADOS.md](docs/MODELO-DE-DADOS.md) |
| Mudar uma rota de API | `src/app/api/**/route.ts` | [docs/API.md](docs/API.md) |
| Mudar a interface | `src/app/*/page.tsx`, `src/components/` | [docs/FRONTEND.md](docs/FRONTEND.md) |
| Atualizar o calendário | `src/data/f1-calendar.ts` | [docs/FRONTEND.md](docs/FRONTEND.md#calendário-local) |
| Mudar o deploy | `netlify.toml`, `Dockerfile`, `fly.toml`, `render.yaml` | [docs/DEPLOY.md](docs/DEPLOY.md) |

## Ideias de contribuição

- Usar `ExtrapolatedClock` para mostrar o tempo restante de treinos e qualificações.
- Exibir `TeamRadio` ou `PitLaneTimeCollection`.
- Mapa da pista com a posição dos carros (depende de `Position.z`, que hoje exige login de F1 TV).
- Horários das sessões no calendário (hoje a contagem é só por data).
