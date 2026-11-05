import { ergastJson } from "./ergast";
import type {
  DriverProfile, ConstructorProfile,
  DriverSeason, DriverCareerTotals, DriverHistory,
  ConstructorSeason, ConstructorCareerTotals, ConstructorHistory, ConstructorDriverRecord,
} from "@/types/profile";

const MAX_RESULTS_PER_PAGE = 1000;

interface ErgastRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: { circuitId: string; circuitName: string; Location: { locality: string; country: string } };
  date: string;
  time: string;
  Results: ErgastResult[];
}

interface ErgastResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  status: string;
  grid: string;
  laps: string;
  Driver: { driverId: string; permanentNumber: string; code: string; givenName: string; familyName: string; dateOfBirth: string; nationality: string; url: string };
  Constructor: { constructorId: string; name: string; nationality: string; url: string };
  Time?: { millis: string; time: string };
  FastestLap?: { rank: string; lap: string; Time: { millis: string }; AverageSpeed: { units: string; speed: string } };
}

interface ErgastStandingsList {
  season: string;
  DriverStandings?: ErgastDriverStanding[];
  ConstructorStandings?: ErgastConstructorStanding[];
}

interface ErgastDriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: { driverId: string; givenName: string; familyName: string; permanentNumber: string; code: string; nationality: string; dateOfBirth: string; url: string };
  Constructors: Array<{ constructorId: string; name: string; nationality: string }>;
}

interface ErgastConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: { constructorId: string; name: string; nationality: string; url: string };
}

function natPt(nat: string): string {
  const map: Record<string, string> = {
    British: "Britânico",
    Dutch: "Neerlandês",
    German: "Alemão",
    Finnish: "Finlandês",
    Spanish: "Espanhol",
    Italian: "Italiano",
    French: "Francês",
    Brazilian: "Brasileiro",
    Australian: "Australiano",
    Mexican: "Mexicano",
    Monegasque: "Monegasco",
    Canadian: "Canadense",
    Danish: "Dinamarquês",
    Swedish: "Sueco",
    Russian: "Russo",
    Polish: "Polonês",
    Thai: "Tailandês",
    Chinese: "Chinês",
    Japanese: "Japonês",
    American: "Americano",
    NewZealander: "Neozelandês",
    SouthAfrican: "Sul-africano",
    Argentine: "Argentino",
    Austrian: "Austríaco",
    Belgian: "Belga",
    Hungarian: "Húngaro",
    Irish: "Irlandês",
    Colombian: "Colombiano",
    Venezuelan: "Venezuelano",
    Chilean: "Chileno",
    Indonesian: "Indonésio",
    Malaysian: "Malaio",
    Indian: "Indiano",
    UAE: "Emiradense",
    SaudiArabian: "Saudita",
    Qatari: "Catarense",
    Bahraini: "Bareinita",
    Portuguese: "Português",
    Turkish: "Turco",
  };
  return map[nat] ?? nat;
}

function parseIntSafe(v: string | undefined, def = 0): number {
  if (!v) return def;
  const n = Number(v);
  return Number.isNaN(n) ? def : n;
}

/** Busca todos os resultados do piloto (paginado até 1000 cada página) */
async function fetchAllDriverResults(driverId: string): Promise<ErgastRace[]> {
  const first = await ergastJson<{ MRData: { total: string; RaceTable: { Races: ErgastRace[] } } }>(
    `drivers/${encodeURIComponent(driverId)}/results.json?limit=${MAX_RESULTS_PER_PAGE}`
  );
  const total = parseIntSafe(first?.MRData?.total);
  if (total === 0) return [];
  const all: ErgastRace[] = [...(first.MRData.RaceTable.Races ?? [])];
  if (total > MAX_RESULTS_PER_PAGE) {
    const pages = Math.ceil(total / MAX_RESULTS_PER_PAGE);
    const more = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        ergastJson<{ MRData: { RaceTable: { Races: ErgastRace[] } } }>(
          `drivers/${encodeURIComponent(driverId)}/results.json?limit=${MAX_RESULTS_PER_PAGE}&offset=${(i + 1) * MAX_RESULTS_PER_PAGE}`
        ).catch(() => null)
      )
    );
    for (const page of more) if (page?.MRData?.RaceTable?.Races?.length) all.push(...page.MRData.RaceTable.Races);
  }
  return all.sort((a, b) => Number(a.season) - Number(b.season) || Number(a.round) - Number(b.round));
}

/** Busca total de vitórias, poles, voltas rápidas */
async function fetchCareerCounts(driverId: string): Promise<{ wins: number; poles: number; fastest: number }> {
  const [w, p, f] = await Promise.all([
    ergastJson<{ MRData: { total: string } }>(`drivers/${encodeURIComponent(driverId)}/results/1.json?limit=1`).catch(() => ({ MRData: { total: "0" } })),
    ergastJson<{ MRData: { total: string } }>(`drivers/${encodeURIComponent(driverId)}/results/grid/1.json?limit=1`).catch(() => ({ MRData: { total: "0" } })),
    ergastJson<{ MRData: { total: string } }>(`drivers/${encodeURIComponent(driverId)}/results/fastest/1.json?limit=1`).catch(() => ({ MRData: { total: "0" } })),
  ]);
  return {
    wins: parseIntSafe(w?.MRData?.total),
    poles: parseIntSafe(p?.MRData?.total),
    fastest: parseIntSafe(f?.MRData?.total),
  };
}

/** Busca posição final no campeonato para um piloto em uma temporada */
async function fetchSeasonPosition(driverId: string, season: string): Promise<number | null> {
  const data = await ergastJson<{ MRData: { StandingsTable: { StandingsLists: ErgastStandingsList[] } } }>(
    `${season}/drivers/${encodeURIComponent(driverId)}/driverStandings.json`
  ).catch(() => null);
  const list = data?.MRData?.StandingsTable?.StandingsLists?.[0];
  const standing = list?.DriverStandings?.[0];
  return standing ? parseIntSafe(standing.position) : null;
}

/** Busca posição final no campeonato para um construtor em uma temporada */
async function fetchConstructorSeasonPosition(constructorId: string, season: string): Promise<number | null> {
  const data = await ergastJson<{ MRData: { StandingsTable: { StandingsLists: ErgastStandingsList[] } } }>(
    `${season}/constructors/${encodeURIComponent(constructorId)}/constructorStandings.json`
  ).catch(() => null);
  const list = data?.MRData?.StandingsTable?.StandingsLists?.[0];
  const standing = list?.ConstructorStandings?.[0];
  return standing ? parseIntSafe(standing.position) : null;
}

/** Busca todos os pilotos que correram por um construtor */
async function fetchConstructorDrivers(constructorId: string): Promise<{
  driverId: string;
  givenName: string;
  familyName: string;
}[]> {
  const data = await ergastJson<{ MRData: { DriverTable: { Drivers: Array<{ driverId: string; givenName: string; familyName: string }> } } }>(
    `constructors/${encodeURIComponent(constructorId)}/drivers.json?limit=1000`
  ).catch(() => null);
  return data?.MRData?.DriverTable?.Drivers ?? [];
}

/** Busca resultados de um construtor (todas as corridas) */
async function fetchAllConstructorResults(constructorId: string): Promise<ErgastRace[]> {
  const first = await ergastJson<{ MRData: { total: string; RaceTable: { Races: ErgastRace[] } } }>(
    `constructors/${encodeURIComponent(constructorId)}/results.json?limit=${MAX_RESULTS_PER_PAGE}`
  );
  const total = parseIntSafe(first?.MRData?.total);
  if (total === 0) return [];
  const all: ErgastRace[] = [...(first.MRData.RaceTable.Races ?? [])];
  if (total > MAX_RESULTS_PER_PAGE) {
    const pages = Math.ceil(total / MAX_RESULTS_PER_PAGE);
    const more = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        ergastJson<{ MRData: { RaceTable: { Races: ErgastRace[] } } }>(
          `constructors/${encodeURIComponent(constructorId)}/results.json?limit=${MAX_RESULTS_PER_PAGE}&offset=${(i + 1) * MAX_RESULTS_PER_PAGE}`
        ).catch(() => null)
      )
    );
    for (const page of more) if (page?.MRData?.RaceTable?.Races?.length) all.push(...page.MRData.RaceTable.Races);
  }
  return all.sort((a, b) => Number(a.season) - Number(b.season) || Number(a.round) - Number(b.round));
}

async function fetchConstructorWinCount(constructorId: string): Promise<number> {
  const data = await ergastJson<{ MRData: { total: string } }>(
    `constructors/${encodeURIComponent(constructorId)}/results/1.json?limit=1`
  ).catch(() => ({ MRData: { total: "0" } }));
  return parseIntSafe(data?.MRData?.total);
}

async function fetchConstructorPoleCount(constructorId: string): Promise<number> {
  const data = await ergastJson<{ MRData: { total: string } }>(
    `constructors/${encodeURIComponent(constructorId)}/results/grid/1.json?limit=1`
  ).catch(() => ({ MRData: { total: "0" } }));
  return parseIntSafe(data?.MRData?.total);
}

async function fetchConstructorFastCount(constructorId: string): Promise<number> {
  const data = await ergastJson<{ MRData: { total: string } }>(
    `constructors/${encodeURIComponent(constructorId)}/results/fastest/1.json?limit=1`
  ).catch(() => ({ MRData: { total: "0" } }));
  return parseIntSafe(data?.MRData?.total);
}

/** Agrupa resultados do piloto por temporada e calcula estatísticas */
function computeDriverSeasons(
  races: ErgastRace[],
  driverId: string,
  careerCounts: { wins: number; poles: number; fastest: number }
): { seasons: DriverSeason[]; totals: Omit<DriverCareerTotals, "worldChampionships" | "championshipSeasons"> } {
  const bySeason = new Map<string, DriverSeason>();
  let firstRace: DriverCareerTotals["firstRace"] = undefined;
  let firstPodium: DriverCareerTotals["firstPodium"] = undefined;
  let firstWin: DriverCareerTotals["firstWin"] = undefined;
  let firstPole: DriverCareerTotals["firstPole"] = undefined;

  for (const race of races) {
    const result = race.Results.find((r) => r.Driver.driverId === driverId);
    if (!result) continue;
    const season = race.season;
    let s = bySeason.get(season);
    if (!s) {
      s = {
        season,
        team: result.Constructor.name,
        teamId: result.Constructor.constructorId,
        races: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        fastestLaps: 0,
        points: 0,
        position: null,
      };
      bySeason.set(season, s);
    }
    s.races++;
    const pos = parseIntSafe(result.position);
    const pts = parseIntSafe(result.points);
    const grid = parseIntSafe(result.grid);
    const fl = result.FastestLap?.rank === "1";
    if (pos === 1) {
      s.wins++;
      if (!firstWin) firstWin = { season, round: race.round, raceName: race.raceName, circuit: race.Circuit.circuitName, country: race.Circuit.Location.country, date: race.date, position: pos };
    }
    if (pos <= 3 && pos > 0) {
      s.podiums++;
      if (!firstPodium) firstPodium = { season, round: race.round, raceName: race.raceName, circuit: race.Circuit.circuitName, country: race.Circuit.Location.country, date: race.date, position: pos };
    }
    if (grid === 1) {
      s.poles++;
      if (!firstPole) firstPole = { season, round: race.round, raceName: race.raceName, circuit: race.Circuit.circuitName, country: race.Circuit.Location.country, date: race.date };
    }
    if (fl) s.fastestLaps++;
    s.points += pts;
    if (!firstRace) firstRace = { season, round: race.round, raceName: race.raceName, circuit: race.Circuit.circuitName, country: race.Circuit.Location.country, date: race.date, position: pos };
  }

  const seasons = Array.from(bySeason.values()).sort((a, b) => Number(b.season) - Number(a.season));
  const totalRaces = races.length;
  const totalWins = careerCounts.wins;
  const totalPodiums = seasons.reduce((s, x) => s + x.podiums, 0);
  const totalPoles = careerCounts.poles;
  const totalFastest = careerCounts.fastest;
  const totalPoints = seasons.reduce((s, x) => s + x.points, 0);

  return {
    seasons,
    totals: {
      seasons: seasons.length,
      races: totalRaces,
      wins: totalWins,
      podiums: totalPodiums,
      poles: totalPoles,
      fastestLaps: totalFastest,
      points: totalPoints,
      firstSeason: seasons[seasons.length - 1]?.season ?? "",
      lastSeason: seasons[0]?.season ?? "",
      firstRace,
      firstPodium,
      firstWin,
      firstPole,
    },
  };
}

function computeConstructorSeasons(
  races: ErgastRace[],
  constructorId: string,
  careerCounts: { wins: number; poles: number; fastest: number }
): { seasons: ConstructorSeason[]; totals: Omit<ConstructorCareerTotals, "worldChampionships" | "championshipSeasons"> } {
  const bySeason = new Map<string, ConstructorSeason>();
  let firstWin: ConstructorCareerTotals["firstWin"] = undefined;
  let firstPole: ConstructorCareerTotals["firstPole"] = undefined;

  for (const race of races) {
    const ourResults = race.Results.filter((r) => r.Constructor.constructorId === constructorId);
    if (ourResults.length === 0) continue;
    const season = race.season;
    let s = bySeason.get(season);
    if (!s) {
      s = {
        season,
        races: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        fastestLaps: 0,
        points: 0,
        position: null,
      };
      bySeason.set(season, s);
    }
    s.races += ourResults.length;
    let bestPos = 999;
    for (const r of ourResults) {
      const pos = parseIntSafe(r.position);
      const pts = parseIntSafe(r.points);
      const grid = parseIntSafe(r.grid);
      const fl = r.FastestLap?.rank === "1";
      if (pos === 1) {
        s.wins++;
        if (!firstWin) firstWin = { season, round: race.round, raceName: race.raceName, circuit: race.Circuit.circuitName, country: race.Circuit.Location.country, date: race.date };
      }
      if (pos <= 3 && pos > 0) s.podiums++;
      if (grid === 1) {
        s.poles++;
        if (!firstPole) firstPole = { season, round: race.round, raceName: race.raceName, circuit: race.Circuit.circuitName, country: race.Circuit.Location.country, date: race.date };
      }
      if (fl) s.fastestLaps++;
      s.points += pts;
      if (pos > 0 && pos < bestPos) bestPos = pos;
    }
  }

  const seasons = Array.from(bySeason.values()).sort((a, b) => Number(b.season) - Number(a.season));
  const totalRaces = races.length;
  const totalWins = careerCounts.wins;
  const totalPodiums = seasons.reduce((s, x) => s + x.podiums, 0);
  const totalPoles = careerCounts.poles;
  const totalFastest = careerCounts.fastest;
  const totalPoints = seasons.reduce((s, x) => s + x.points, 0);

  return {
    seasons,
    totals: {
      seasons: seasons.length,
      races: totalRaces,
      wins: totalWins,
      podiums: totalPodiums,
      poles: totalPoles,
      fastestLaps: totalFastest,
      points: totalPoints,
      firstSeason: seasons[seasons.length - 1]?.season ?? "",
      lastSeason: seasons[0]?.season ?? "",
      firstWin,
      firstPole,
    },
  };
}

export async function fetchDriverHistory(driverId: string): Promise<DriverHistory | null> {
  const [profile, results, careerCounts] = await Promise.all([
    ergastJson<{ MRData: { DriverTable: { Drivers: DriverProfile[] } } }>(`drivers/${encodeURIComponent(driverId)}.json?limit=1`).catch(() => null),
    fetchAllDriverResults(driverId),
    fetchCareerCounts(driverId),
  ]);

  const prof = profile?.MRData?.DriverTable?.Drivers?.[0];
  if (!prof) return null;

  const { seasons, totals } = computeDriverSeasons(results, driverId, careerCounts);

  // Busca posições finais de campeonato em paralelo
  const positionPromises = seasons.map((s) => fetchSeasonPosition(driverId, s.season).then((pos) => ({ season: s.season, pos })));
  const positions = await Promise.all(positionPromises);
  for (const { season, pos } of positions) {
    const s = seasons.find((x) => x.season === season);
    if (s) s.position = pos;
  }

  const championshipSeasons = seasons.filter((s) => s.position === 1).map((s) => s.season);
  const totalsWithTitles: DriverCareerTotals = {
    ...totals,
    worldChampionships: championshipSeasons.length,
    championshipSeasons,
  };

  return {
    profile: {
      driverId: prof.driverId,
      givenName: prof.givenName,
      familyName: prof.familyName,
      permanentNumber: prof.permanentNumber ?? null,
      nationality: natPt(prof.nationality),
      dateOfBirth: prof.dateOfBirth ?? null,
      url: prof.url,
    },
    totals: totalsWithTitles,
    seasons,
  };
}

export async function fetchConstructorHistory(constructorId: string): Promise<ConstructorHistory | null> {
  const [profile, results, winCount, poleCount, fastCount, driversList] = await Promise.all([
    ergastJson<{ MRData: { ConstructorTable: { Constructors: ConstructorProfile[] } } }>(`constructors/${encodeURIComponent(constructorId)}.json?limit=1`).catch(() => null),
    fetchAllConstructorResults(constructorId),
    fetchConstructorWinCount(constructorId),
    fetchConstructorPoleCount(constructorId),
    fetchConstructorFastCount(constructorId),
    fetchConstructorDrivers(constructorId),
  ]);

  const prof = profile?.MRData?.ConstructorTable?.Constructors?.[0];
  if (!prof) return null;

  const careerCounts = { wins: winCount, poles: poleCount, fastest: fastCount };
  const { seasons, totals } = computeConstructorSeasons(results, constructorId, careerCounts);

  const positionPromises = seasons.map((s) => fetchConstructorSeasonPosition(constructorId, s.season).then((pos) => ({ season: s.season, pos })));
  const positions = await Promise.all(positionPromises);
  for (const { season, pos } of positions) {
    const s = seasons.find((x) => x.season === season);
    if (s) s.position = pos;
  }

  const championshipSeasons = seasons.filter((s) => s.position === 1).map((s) => s.season);

  // Pilotos que correram pela equipe: estatísticas por piloto dentro dos resultados
  const driverStats = new Map<string, ConstructorDriverRecord>();
  for (const race of results) {
    for (const r of race.Results.filter((x) => x.Constructor.constructorId === constructorId)) {
      const dId = r.Driver.driverId;
      let rec = driverStats.get(dId);
      if (!rec) {
        const base = driversList.find((d) => d.driverId === dId);
        rec = {
          driverId: dId,
          givenName: base?.givenName ?? r.Driver.givenName,
          familyName: base?.familyName ?? r.Driver.familyName,
          races: 0,
          wins: 0,
          poles: 0,
          fastestLaps: 0,
          podiums: 0,
          firstRace: race.season,
          lastRace: race.season,
        };
        driverStats.set(dId, rec);
      }
      rec.races++;
      const pos = parseIntSafe(r.position);
      const grid = parseIntSafe(r.grid);
      const fl = r.FastestLap?.rank === "1";
      if (pos === 1) rec.wins++;
      if (pos <= 3 && pos > 0) rec.podiums++;
      if (grid === 1) rec.poles++;
      if (fl) rec.fastestLaps++;
      if (Number(race.season) < Number(rec.firstRace)) rec.firstRace = race.season;
      if (Number(race.season) > Number(rec.lastRace)) rec.lastRace = race.season;
    }
  }

  const drivers = Array.from(driverStats.values())
    .sort((a, b) => b.wins - a.wins || b.podiums - a.podiums || b.races - a.races);

  const totalsWithTitles: ConstructorCareerTotals = {
    ...totals,
    worldChampionships: championshipSeasons.length,
    championshipSeasons,
  };

  return {
    profile: {
      constructorId: prof.constructorId,
      name: prof.name,
      nationality: natPt(prof.nationality),
      url: prof.url,
    },
    totals: totalsWithTitles,
    seasons,
    drivers,
  };
}