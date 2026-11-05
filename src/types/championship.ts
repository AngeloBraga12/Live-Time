export type DriverStanding = {
  position: number;
  driverId: string;
  driverName: string;
  permanentNumber: string | null;
  team: string;
  teamId: string;
  points: number;
  wins: number;
};

export type ConstructorStanding = {
  position: number;
  constructorId: string;
  constructorName: string;
  points: number;
  wins: number;
};

export type ChampionshipData = {
  season: number;
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
  lastUpdated: string;
  source: string;
};
