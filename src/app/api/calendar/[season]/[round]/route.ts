import { NextResponse } from "next/server";
import { F1_CALENDAR, F1_SEASONS, F1_SPRINT_ROUNDS } from "@/data/f1-calendar";
import { ergastJson } from "@/lib/f1/ergast";

type TimedSession = { date: string; time?: string };
type ResultRecord = {
  position: string;
  Driver: { givenName: string; familyName: string; code?: string };
  Constructor: { name: string };
};
type RaceRecord = {
  date?: string;
  time?: string;
  FirstPractice?: TimedSession;
  SecondPractice?: TimedSession;
  ThirdPractice?: TimedSession;
  SprintQualifying?: TimedSession;
  Sprint?: TimedSession;
  Qualifying?: TimedSession;
  Results?: ResultRecord[];
  SprintResults?: ResultRecord[];
};
type RaceResponse = { MRData?: { RaceTable?: { Races?: RaceRecord[] } } };

type SessionDefinition = {
  key: keyof RaceRecord;
  label: string;
  dayOffset: number;
};

function weekendSessions(isSprintWeekend: boolean): SessionDefinition[] {
  return isSprintWeekend
    ? [
        { key: "FirstPractice", label: "Treino Livre 1", dayOffset: 0 },
        { key: "SprintQualifying", label: "Classificação Sprint", dayOffset: 0 },
        { key: "Sprint", label: "Sprint", dayOffset: 1 },
        { key: "Qualifying", label: "Classificação", dayOffset: 1 },
        { key: "Results", label: "Corrida", dayOffset: 2 },
      ]
    : [
        { key: "FirstPractice", label: "Treino Livre 1", dayOffset: 0 },
        { key: "SecondPractice", label: "Treino Livre 2", dayOffset: 0 },
        { key: "ThirdPractice", label: "Treino Livre 3", dayOffset: 1 },
        { key: "Qualifying", label: "Classificação", dayOffset: 1 },
        { key: "Results", label: "Corrida", dayOffset: 2 },
      ];
}

function dateOffset(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function podium(records: ResultRecord[] = []) {
  return records
    .filter((record) => ["1", "2", "3"].includes(record.position))
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((record) => ({
      position: Number(record.position),
      driver: `${record.Driver.givenName} ${record.Driver.familyName}`,
      code: record.Driver.code ?? "",
      team: record.Constructor.name,
    }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ season: string; round: string }> },
) {
  const { season: seasonParam, round: roundParam } = await params;
  if (!/^20\d{2}$/.test(seasonParam) || !/^\d+$/.test(roundParam)) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const season = Number(seasonParam);
  const round = Number(roundParam);
  const event = F1_CALENDAR[season as (typeof F1_SEASONS)[number]]?.find((item) => item.round === round);
  if (!F1_SEASONS.includes(season as (typeof F1_SEASONS)[number]) || !event) {
    return NextResponse.json({ error: "Grande Prêmio não encontrado" }, { status: 404 });
  }

  const isSprintWeekend = F1_SPRINT_ROUNDS[season]?.includes(round) ?? false;
  const [scheduleResponse, raceResultsResponse, sprintResultsResponse] = await Promise.all([
    ergastJson<RaceResponse>(`${season}/${round}.json?limit=1`, 3600).catch(() => null),
    ergastJson<RaceResponse>(`${season}/${round}/results.json?limit=100`, 3600).catch(() => null),
    isSprintWeekend
      ? ergastJson<RaceResponse>(`${season}/${round}/sprint.json?limit=100`, 3600).catch(() => null)
      : Promise.resolve(null),
  ]);

  const scheduleRace = scheduleResponse?.MRData?.RaceTable?.Races?.[0];
  const raceResult = raceResultsResponse?.MRData?.RaceTable?.Races?.[0];
  const sprintResult = sprintResultsResponse?.MRData?.RaceTable?.Races?.[0];

  const sessions = weekendSessions(isSprintWeekend).map(({ key, label, dayOffset }) => {
    const actual = key === "Results"
      ? (scheduleRace?.date && scheduleRace.time ? { date: scheduleRace.date, time: scheduleRace.time } : undefined)
      : scheduleRace?.[key] as TimedSession | undefined;
    return {
      label,
      date: actual?.date ?? dateOffset(event.startDate, dayOffset),
      time: actual?.time,
      timeZone: "UTC",
    };
  }).sort((a, b) => `${a.date}T${a.time ?? "00:00:00Z"}`.localeCompare(`${b.date}T${b.time ?? "00:00:00Z"}`));

  return NextResponse.json({
    event,
    sprintWeekend: isSprintWeekend,
    sessions,
    raceStart: scheduleRace?.date && scheduleRace.time
      ? { date: scheduleRace.date, time: scheduleRace.time }
      : null,
    racePodium: podium(raceResult?.Results),
    sprintPodium: podium(sprintResult?.SprintResults),
    raceResultsAvailable: (raceResult?.Results?.length ?? 0) > 0,
    sprintResultsAvailable: (sprintResult?.SprintResults?.length ?? 0) > 0,
    scheduleSource: scheduleRace ? "Jolpica / Ergast API" : null,
    resultsSource: raceResult || sprintResult ? "Jolpica / Ergast API" : null,
    sources: {
      official: event.url,
      data: "https://api.jolpi.ca/ergast/f1/",
    },
  }, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  });
}
