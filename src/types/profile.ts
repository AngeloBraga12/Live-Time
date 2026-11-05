export type DriverProfile = {
  driverId: string;
  givenName: string;
  familyName: string;
  permanentNumber: string | null;
  nationality: string;
  dateOfBirth: string | null;
  url: string;
};

export type ConstructorProfile = {
  constructorId: string;
  name: string;
  nationality: string;
  url: string;
};

/** Resumo de uma temporada para piloto */
export type DriverSeason = {
  season: string;
  team: string;
  teamId: string;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  points: number;
  position: number | null;
};

/** Totais da carreira */
export type DriverCareerTotals = {
  seasons: number;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  points: number;
  worldChampionships: number;
  championshipSeasons: string[];
  firstSeason: string;
  lastSeason: string;
  firstRace?: { season: string; round: string; raceName: string; circuit: string; country: string; date: string; position: number };
  firstPodium?: { season: string; round: string; raceName: string; circuit: string; country: string; date: string; position: number };
  firstWin?: { season: string; round: string; raceName: string; circuit: string; country: string; date: string; position: number };
  firstPole?: { season: string; round: string; raceName: string; circuit: string; country: string; date: string };
};

/** Histórico completo do piloto */
export type DriverHistory = {
  profile: DriverProfile;
  totals: DriverCareerTotals;
  seasons: DriverSeason[];
};

/** Resumo de uma temporada para construtor */
export type ConstructorSeason = {
  season: string;
  chassis?: string;
  engine?: string;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  points: number;
  position: number | null;
};

/** Totais de carreira do construtor */
export type ConstructorCareerTotals = {
  seasons: number;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  points: number;
  worldChampionships: number;
  championshipSeasons: string[];
  firstSeason: string;
  lastSeason: string;
  firstWin?: { season: string; round: string; raceName: string; circuit: string; country: string; date: string };
  firstPole?: { season: string; round: string; raceName: string; circuit: string; country: string; date: string };
};

/** Histórico completo do construtor */
export type ConstructorHistory = {
  profile: ConstructorProfile;
  totals: ConstructorCareerTotals;
  seasons: ConstructorSeason[];
  drivers?: ConstructorDriverRecord[];
};

/** Pilotos que correram pelo construtor */
export type ConstructorDriverRecord = {
  driverId: string;
  givenName: string;
  familyName: string;
  races: number;
  wins: number;
  poles: number;
  fastestLaps: number;
  podiums: number;
  firstRace: string;
  lastRace: string;
};
