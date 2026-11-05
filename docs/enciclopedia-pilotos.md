# Enciclopédia de pilotos — método e cobertura

**Data de corte:** 5 de novembro de 2026. **Idioma:** português brasileiro.

## Escopo deste recorte

O índice `/drivers` contém os 24 pilotos que participaram de pelo menos um Grande Prêmio concluído até o GP da Cidade do México (1º de novembro de 2026). Isso inclui os substitutos que pontuaram/constaram nas classificações FIA: Yuki Tsunoda e Ryo Hirakawa. Esteban Ocon permanece incluído porque já participou de etapa em 2026, embora a Haas tenha anunciado em 4 de novembro que ele não voltaria a competir no restante do campeonato.

Rafael Câmara tem uma página porque foi anunciado oficialmente como titular da Haas para 2027. A equipe também anunciou em 4 de novembro sua estreia no GP de São Paulo, programado para 6–8 de novembro. Esse evento ainda não havia começado no corte; por isso ele não integra o conjunto de participantes efetivos de GPs de 2026. A página registra essa participação futura como programada, não como resultado disputado.

## Rotas e dados

- `/drivers`: índice de participantes de 2026, confirmados para 2027 e situação sem confirmação oficial; agrupamentos navegáveis por equipe e nacionalidade; marcos de estreantes e campeões.
- `/driver/{driverId}`: perfil independente, resumo de identificação, totais e estatísticas por temporada, resultados de GPs e tabela separada de Sprints de 2026, situação para 2027 e bibliografia.
- `/api/driver/{driverId}`: histórico de carreira do espelho Ergast/Jolpica.
- `/api/driver/{driverId}/season/{year}`: resultados de GPs e Sprints, consultados em rotas distintas da API.

Os nomes dos campos refletem os dados efetivamente cobertos pela fonte. “GPs com resultado” conta entradas de resultados retornadas pela base histórica e não deve ser lido como número de inscrições, participações em sessões ou largadas efetivas. O grid 1 identifica pole position de GP na fonte; poles de Sprint não são somadas à estatística de GP. Pontos de Sprint permanecem em tabela separada.

## Regra para 2027

“Confirmado” exige anúncio oficial da equipe, F1 ou piloto, ou um contrato público que cubra explicitamente 2027. Uma renovação “plurianual” anunciada sem duração específica não é automaticamente inferida como incluindo 2027. Para pilotos sem evidência primária suficiente, o índice exibe **sem confirmação oficial**. Essa indicação não afirma que o piloto esteja sem contrato nem que perdeu a vaga. Notícias e especulações não são convertidas em confirmação.

O número exibido na ficha é o número atual de carro no cadastro de 2026; número projetado para 2027 só pode ser apresentado após confirmação oficial. Rafael Câmara não tinha número de corrida anunciado neste recorte.

## Limites documentais

O app já apresenta os históricos estatísticos disponíveis via Ergast/Jolpica e resultados individuais 2026, além das fontes oficiais do campeonato e anúncios 2027 registrados nos perfis. A cobertura editorial solicitada para biografias longas, kart e categorias de base, resultados completos por temporada nessas séries, chefes/engenheiros, comparação detalhada com companheiros, fotos com licença, idiomas, altura, peso, apelidos e legado não está integralmente pesquisada nesta edição. Esses campos são declarados indisponíveis em vez de estimados. Recordes históricos além das estatísticas existentes também não são reproduzidos sem fonte específica.

F1DB é uma fonte aberta complementar sob CC BY 4.0 e requer atribuição ao ser incorporada. A API Jolpica/Ergast é espelho comunitário do formato Ergast e não é uma fonte oficial da FIA; estatísticas correntes devem ser conferidas nas classificações e resultados oficiais. Páginas oficiais da FIA/F1/equipes e comunicados primários são preferidos para participação, classificação e contratos.

## Fontes de referência

- [Classificações FIA 2026](https://www.fia.com/events/fia-formula-one-world-championship/season-2026/2026-classifications)
- [Resultados e classificação de pilotos da F1](https://www.formula1.com/en/results/2026/drivers)
- [F1DB — arquivo estruturado, licença CC BY 4.0](https://github.com/f1db/f1db)
- [Comunicado Haas de 4 de novembro — Ocon/Câmara](https://www.haasf1team.com/news/team-statement-driver-update-0)
- [Comunicado Haas — Câmara 2027](https://haasf1team.com/news/rafael-camara-confirmed-tgr-haas-f1-team-2027)
- [Comunicados oficiais individuais de 2027, vinculados nas fichas](../src/data/encyclopedia.ts)

## Atualização e auditoria

Ao atualizar o diretório, primeiro confirmar o último GP concluído e consultar classificações/resultados oficiais por etapa. Validar a lista de participantes pelo conjunto de resultados, não só pelo quadro de titulares. Deduplicar pelo `driverId` Jolpica, verificar substituições e mudanças de construtor, comparar pontos e posições da temporada com a FIA, e conservar a separação entre GPs e Sprint. Registrar data, URL direta e natureza da evidência de cada anúncio de equipe. Revisar links e contratos expirados a cada atualização.
