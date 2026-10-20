# Modelo de dados

O feed da F1 usa nomes em PascalCase e valores em texto (`"1:36.282"`, `"true"`, `"+5.123"`). O projeto converte isso em tipos TypeScript estáveis, definidos em [`src/types/live-timing.ts`](../src/types/live-timing.ts). A conversão acontece em [`src/lib/f1/normalize.ts`](../src/lib/f1/normalize.ts), sempre no servidor.

## Sumário

- [LiveTimingPollResponse](#livetimingpollresponse)
- [LiveTimingSnapshot](#livetimingsnapshot)
- [SessionInfo](#sessioninfo)
- [DriverTiming](#drivertiming)
- [RaceControlMessage](#racecontrolmessage)
- [Tipos enumerados](#tipos-enumerados)
- [Regras de conversão](#regras-de-conversão)
- [Funções exportadas](#funções-exportadas)

## LiveTimingPollResponse

Envelope devolvido por `/api/live-timing` e pelo evento `snapshot` do stream.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `connected` | boolean | `true` só quando a origem está conectada **e** há snapshot. |
| `lastMessageAt` | string \| null | Último dado recebido da F1 (ISO-8601). |
| `snapshot` | `LiveTimingSnapshot`? | Ausente quando `connected` é `false`. |
| `error` | string? | Mensagem de erro (respostas 502 e evento `offline`). |

## LiveTimingSnapshot

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `session` | `SessionInfo` | Dados da sessão. |
| `drivers` | `DriverTiming[]` | Pilotos ordenados por posição. |
| `raceControl` | `RaceControlMessage[]` | Até 50 mensagens, a mais recente primeiro. |
| `emittedAt` | string | Hora em que o servidor montou o snapshot. |

## SessionInfo

| Campo | Tipo | Origem no feed |
| --- | --- | --- |
| `eventName` | string | `SessionInfo.Meeting.OfficialName` (ou `meetingName`) |
| `meetingName` | string | `SessionInfo.Meeting.Name` (ou `OfficialName`). Comparado com o calendário pela página inicial. |
| `circuitName` | string | `SessionInfo.Meeting.Circuit.ShortName` |
| `locality` | string | `SessionInfo.Meeting.Location` |
| `country` | string | `SessionInfo.Meeting.Country.Name` |
| `timezone` | string | `UTC` + sinal + `GmtOffset` (ex.: `UTC+08:00`); `UTC` se ausente |
| `sessionName` | string | `SessionInfo.Name` (`Race`, `Qualifying`, `Practice 1`, `Sprint`...); padrão `Live Session` |
| `status` | `SessionStatus` | Ver [regra de status](#status-da-sessão) |
| `currentLap` | number | `LapCount.CurrentLap` (0 se ausente) |
| `totalLaps` | number | `LapCount.TotalLaps` (0 se ausente; treinos e quali não têm) |
| `scheduledStart` | string | `SessionInfo.StartDate` + `GmtOffset` (ex.: `2026-10-11T20:00:00+08:00`) |
| `trackTemperatureC` | number \| null | `WeatherData.TrackTemp` |
| `airTemperatureC` | number \| null | `WeatherData.AirTemp` |
| `trackFlag` | `TrackFlag` | Ver [bandeira](#bandeira-da-pista) |

## DriverTiming

As linhas de cada piloto são montadas por `mergedLines()`, que junta, pelo número do carro, nesta ordem de precedência (a última sobrescreve):

1. `DriverList[n]` (identidade)
2. `TimingAppData.Lines[n]` (stints)
3. `TimingData.Lines[n]` (tempos)
4. `TimingStats.Lines[n].PersonalBestLapTime`

| Campo | Tipo | Origem / regra |
| --- | --- | --- |
| `driverId` | string | Número do carro como texto (`"1"`, `"44"`) |
| `position` | number \| null | `Position`; se ausente, índice + 1 |
| `abbreviation` | string | `Tla` (`VER`); padrão `#n` |
| `fullName` | string | `FullName` → `BroadcastName` → `Car n` |
| `team` | `TeamId` | Derivado de `TeamName` (ver [equipes](#equipes)) |
| `teamName` | string | `TeamName`; padrão `Unknown` |
| `teamColour` | string? | `#` + `TeamColour`, só se for hexadecimal de 6 dígitos |
| `carNumber` | number | `RacingNumber` |
| `completedLaps` | number | `NumberOfLaps` (0) |
| `gapToLeader` | string | Ver [diferenças](#diferenças-gap-e-intervalo) |
| `interval` | string | Ver [diferenças](#diferenças-gap-e-intervalo) |
| `lastLapSeconds` | number \| null | `LastLapTime.Value` convertido |
| `bestLapSeconds` | number \| null | `BestLapTimes[parte]` (quali) → `BestLapTime` → `PersonalBestLapTime` |
| `sectors` | 3 × `SectorTime` | `Sectors[0..2]` |
| `tire` | `TireState` | Último item de `Stints` |
| `pitStatus` | `"track" \| "pit-lane" \| "in-pit" \| "unknown"` | `InPit` → `in-pit`; `PitOut` → `pit-lane`; fora de prova → `unknown`; senão `track` |
| `telemetry` | `{ speedKph }`? | `Speeds.ST` (speed trap) → `Speeds.FL` (linha de chegada). Acelerador, freio e marcha não estão disponíveis (exigem `CarData.z`). |
| `updatedAt` | string | Igual a `emittedAt` |

`previousPosition` e `tire.estimatedLifeLaps` existem no tipo, mas o feed não fornece esses dados; ficam ausentes.

### SectorTime

| Campo | Regra |
| --- | --- |
| `sector` | 1, 2 ou 3 |
| `timeSeconds` | `Sectors[i].Value` convertido; `null` se o setor ainda não foi completado |
| `status` | `OverallFastest: true` → `session-best` (roxo); `PersonalFastest: true` → `personal-best` (verde); com valor → `normal`; vazio → `unknown` |

### TireState

| Campo | Regra |
| --- | --- |
| `compound` | `Compound` em maiúsculas, se for `SOFT`, `MEDIUM`, `HARD`, `INTERMEDIATE` ou `WET`; senão `UNKNOWN` (inclui `TEST_UNKNOWN`) |
| `ageLaps` | `TotalLaps` do stint (inclui voltas feitas antes, se o pneu já era usado) |
| `condition` | `New` é a string `"true"` (ou booleano `true`) → `new`; senão `used` |

## RaceControlMessage

| Campo | Regra |
| --- | --- |
| `id` | `rc-<índice>-<Utc>` |
| `timestamp` | `Utc`; recebe `Z` no fim se não tiver fuso (a F1 envia UTC sem sufixo) |
| `lap` | `Lap`, se presente |
| `severity` | Ver [severidade](#severidade-do-race-control) |
| `category` | Ver [categoria](#categoria-do-race-control) |
| `message` | `Message` → `Flag` → `Race control` |
| `subject` | `RacingNumber` → sigla do piloto (`VER`) ou `#n`; senão `Sector` → `SETOR n`; senão ausente |

Apenas as 50 últimas mensagens são mantidas, em ordem da mais recente para a mais antiga.

## Tipos enumerados

```ts
type TeamId = "mclaren" | "ferrari" | "red-bull" | "mercedes" | "aston-martin"
  | "alpine" | "williams" | "rb" | "sauber" | "haas" | "cadillac" | "unknown";
type TireCompound = "UNKNOWN" | "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";
type TrackFlag = "unknown" | "green" | "yellow" | "double-yellow" | "red" | "blue" | "chequered";
type SectorStatus = "personal-best" | "session-best" | "normal" | "unknown";
type SessionStatus = "scheduled" | "green" | "safety-car" | "virtual-safety-car" | "red-flag" | "chequered" | "finished";
type RaceControlSeverity = "info" | "warning" | "critical" | "green";
```

`double-yellow`, `blue` e o status `chequered` existem no tipo para uso da interface, mas a normalização atual não os produz.

## Regras de conversão

### Tempos

`lapSeconds()` aceita número, texto numérico ou `m:ss.mmm`, e também objetos `{ Value }`:

| Entrada | Saída |
| --- | --- |
| `"1:36.282"` | `96.282` |
| `"28.713"` | `28.713` |
| `{ "Value": "1:35.001" }` | `95.001` |
| `""`, `null`, texto inválido | `null` |

### Diferenças (gap e intervalo)

O tipo da sessão (`SessionInfo.Type`) define a fonte:

| Sessão | `gapToLeader` | `interval` |
| --- | --- | --- |
| `Race` (corrida e sprint) | `GapToLeader` | `IntervalToPositionAhead.Value` |
| `Qualifying` / `Practice` | `Stats[SessionPart-1].TimeDiffToFastest` → `TimeDiffToFastest` → `GapToLeader` | `Stats[SessionPart-1].TimeDifftoPositionAhead` (grafia da F1, com "to" minúsculo) → `TimeDiffToPositionAhead` → `IntervalToPositionAhead` |

Valores especiais:

| Situação | `gapToLeader` |
| --- | --- |
| P1 sem diferença | `LEADER` |
| Outras posições sem diferença | `—` |
| `Retired` | `OUT` |
| `KnockedOut` (eliminado em Q1/Q2) | `KO` |
| `Stopped` | `STOP` |

`interval` sem valor vira `—`. Os valores são mantidos como texto da F1 (`+5.123`, `1L`, `+1 LAP`).

### Status da sessão

Avaliado na ordem abaixo, com `SessionStatus.Status` (ou `SessionInfo.SessionStatus`) em minúsculas e o código de `TrackStatus.Status`:

| Ordem | Condição | `status` |
| --- | --- | --- |
| 1 | `finished`, `finalised` ou `ends` | `finished` |
| 2 | `aborted` ou TrackStatus `5` | `red-flag` |
| 3 | TrackStatus `6` ou `7` | `virtual-safety-car` |
| 4 | TrackStatus `4` | `safety-car` |
| 5 | `started` | `green` |
| 6 | qualquer outro | `scheduled` |

### Bandeira da pista

| TrackStatus | Significado na F1 | `trackFlag` |
| --- | --- | --- |
| (sessão encerrada) | — | `chequered` |
| `1` | Pista livre | `green` |
| `2` | Bandeira amarela | `yellow` |
| `4` | Safety car | `yellow` |
| `5` | Bandeira vermelha | `red` |
| `6` | VSC acionado | `yellow` |
| `7` | VSC terminando | `yellow` |
| outro | — | `unknown` |

### Equipes

`teamId()` procura trechos em `TeamName` (sem diferenciar maiúsculas):

| Trecho | `TeamId` |
| --- | --- |
| `mclaren` | `mclaren` |
| `ferrari` | `ferrari` |
| `red bull` | `red-bull` |
| `mercedes` | `mercedes` |
| `aston martin` | `aston-martin` |
| `alpine` | `alpine` |
| `williams` | `williams` |
| `racing bulls` ou exatamente `rb` | `rb` |
| `sauber` ou `audi` | `sauber` |
| `haas` | `haas` |
| `cadillac` | `cadillac` |
| outro | `unknown` |

A cor exibida vem de `TeamColour` do feed, com classes CSS `team-<id>` como alternativa.

### Severidade do Race Control

| Condição (`Flag` / `Message` em maiúsculas) | `severity` |
| --- | --- |
| `Flag = RED` ou mensagem contém `RED FLAG` | `critical` |
| `Flag` contém `YELLOW`, ou mensagem contém `SAFETY CAR`, `PENALTY` ou `INVESTIGATION` | `warning` |
| `Flag = GREEN` ou `CLEAR`, ou mensagem contém `GREEN LIGHT` | `green` |
| outro | `info` |

### Categoria do Race Control

| Condição (avaliada em ordem) | `category` |
| --- | --- |
| Mensagem contém `PENALTY` | `penalty` |
| Contém `INVESTIGATION` ou `NOTED`, ou `Category = CarEvent` | `incident` |
| Contém `PIT EXIT`, `PIT LANE` ou `PIT ENTRY` | `pit-lane` |
| Contém `RAIN`, `WEATHER` ou `SLIPPERY` | `weather` |
| `Category` = `Flag`, `SafetyCar` ou `Drs` | `track-status` |
| outro | `session` |

### Ordenação dos pilotos

Por `Position`; se ausente, por `Line`; se ambos faltarem, vão para o fim (999). Empates são resolvidos pelo número do carro.

## Funções exportadas

| Função | Arquivo | Descrição |
| --- | --- | --- |
| `applyDelta(alvo, delta)` | `merge.ts` | Aplica um delta da F1 (ver [FEED-F1.md](FEED-F1.md#como-os-deltas-são-aplicados)). |
| `isObject(valor)` | `merge.ts` | Verifica se é objeto simples. |
| `lapSeconds(valor)` | `normalize.ts` | Converte tempo em segundos. |
| `mergedLines(estado)` | `normalize.ts` | Junta as quatro fontes por número do carro. |
| `mapDrivers(estado, updatedAt?)` | `normalize.ts` | Lista ordenada de `DriverTiming`. |
| `mapRaceControl(estado, linhas)` | `normalize.ts` | Lista de `RaceControlMessage`. |
| `mapSession(estado)` | `normalize.ts` | `SessionInfo`. |
| `buildSnapshot(estado, emittedAt)` | `normalize.ts` | `LiveTimingSnapshot` completo. |
