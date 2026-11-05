import type { ChampionshipData } from "@/types/championship";
import { ergastJson } from "./ergast";

interface ErgastDriverStanding {
  position: string; points: string; wins: string;
  Driver: { driverId: string; givenName: string; familyName: string; permanentNumber?: string };
  Constructors: Array<{ name: string; constructorId: string }>;
}
interface ErgastConstructorStanding {
  position: string; points: string; wins: string;
  Constructor: { constructorId: string; name: string };
}
type ErgastDriverStandingsResponse = {
  MRData: { StandingsTable: { StandingsLists: Array<{ DriverStandings?: ErgastDriverStanding[] }> } };
};
type ErgastConstructorStandingsResponse = {
  MRData: { StandingsTable: { StandingsLists: Array<{ ConstructorStandings?: ErgastConstructorStanding[] }> } };
};

export async function fetchChampionship(season = new Date().getFullYear()): Promise<ChampionshipData> {
  const [driversJson, constructorsJson] = await Promise.all([
    ergastJson<ErgastDriverStandingsResponse>(`${season}/driverStandings.json?limit=1000`, 300),
    ergastJson<ErgastConstructorStandingsResponse>(`${season}/constructorStandings.json?limit=1000`, 300),
  ]);

  const driverStandings = (driversJson.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? []).map((s) => ({
    position: Number(s.position),
    driverId: s.Driver.driverId,
    driverName: `${s.Driver.givenName} ${s.Driver.familyName}`,
    permanentNumber: s.Driver.permanentNumber ?? null,
    team: s.Constructors[0]?.name ?? "Unknown",
    teamId: s.Constructors[0]?.constructorId ?? "unknown",
    points: Number(s.points),
    wins: Number(s.wins),
  }));

  const constructorStandings = (constructorsJson.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? []).map((s) => ({
    position: Number(s.position),
    constructorId: s.Constructor.constructorId,
    constructorName: s.Constructor.name,
    points: Number(s.points),
    wins: Number(s.wins),
  }));

  return {
    season,
    drivers: driverStandings,
    constructors: constructorStandings,
    lastUpdated: new Date().toISOString(),
    source: "ergast.com",
  };
}
