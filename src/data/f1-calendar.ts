export type GrandPrixEvent = {
  season: number;
  round: number;
  country: string;
  location: string;
  name: string;
  circuit: string;
  startDate: string;
  raceDate: string;
  endDate: string;
  url: string;
};

export const F1_CALENDAR_SOURCES: Record<number, string> = {
  2026: "https://www.formula1.com/en/racing/2026",
  2027: "https://www.formula1.com/en/racing/2027",
};

// Dates match the official season calendars. Exact session start times are not
// inferred; a date-only countdown is used until F1 publishes them.
export const F1_CALENDAR: Record<number, GrandPrixEvent[]> = {
  2026: [
    [1,"Australia","Melbourne","Australian Grand Prix","Albert Park Grand Prix Circuit","2026-03-06","2026-03-08"],
    [2,"China","Shanghai","Chinese Grand Prix","Shanghai International Circuit","2026-03-13","2026-03-15"],
    [3,"Japan","Suzuka","Japanese Grand Prix","Suzuka International Racing Course","2026-03-27","2026-03-29"],
    [4,"United States","Miami Gardens","Miami Grand Prix","Miami International Autodrome","2026-05-01","2026-05-03"],
    [5,"Canada","Montreal","Canadian Grand Prix","Circuit Gilles-Villeneuve","2026-05-22","2026-05-24"],
    [6,"Monaco","Monte Carlo","Monaco Grand Prix","Circuit de Monaco","2026-06-05","2026-06-07"],
    [7,"Spain","Barcelona","Barcelona-Catalunya Grand Prix","Circuit de Barcelona-Catalunya","2026-06-12","2026-06-14"],
    [8,"Austria","Spielberg","Austrian Grand Prix","Red Bull Ring","2026-06-26","2026-06-28"],
    [9,"United Kingdom","Silverstone","British Grand Prix","Silverstone Circuit","2026-07-03","2026-07-05"],
    [10,"Belgium","Stavelot","Belgian Grand Prix","Circuit de Spa-Francorchamps","2026-07-17","2026-07-19"],
    [11,"Hungary","Mogyoród","Hungarian Grand Prix","Hungaroring","2026-07-24","2026-07-26"],
    [12,"Netherlands","Zandvoort","Dutch Grand Prix","Circuit Zandvoort","2026-08-21","2026-08-23"],
    [13,"Italy","Monza","Italian Grand Prix","Autodromo Nazionale Monza","2026-09-04","2026-09-06"],
    [14,"Spain","Madrid","Spanish Grand Prix","Madring","2026-09-11","2026-09-13"],
    [15,"Azerbaijan","Baku","Azerbaijan Grand Prix","Baku City Circuit","2026-09-24","2026-09-26"],
    [16,"Malaysia","Kuala Lumpur","Bahrain Grand Prix in Malaysia","Sepang International Circuit","2026-10-02","2026-10-04"],
    [17,"Singapore","Marina Bay","Singapore Grand Prix","Marina Bay Street Circuit","2026-10-09","2026-10-11"],
    [18,"United States","Austin","United States Grand Prix","Circuit of The Americas","2026-10-23","2026-10-25"],
    [19,"Mexico","Mexico City","Mexico City Grand Prix","Autódromo Hermanos Rodríguez","2026-10-30","2026-11-01"],
    [20,"Brazil","São Paulo","São Paulo Grand Prix","Autódromo José Carlos Pace","2026-11-06","2026-11-08"],
    [21,"United States","Las Vegas","Las Vegas Grand Prix","Las Vegas Strip Circuit","2026-11-19","2026-11-21"],
    [22,"Qatar","Lusail","Qatar Grand Prix","Lusail International Circuit","2026-11-27","2026-11-29"],
    [23,"United Arab Emirates","Abu Dhabi","Abu Dhabi Grand Prix","Yas Marina Circuit","2026-12-04","2026-12-06"],
  ].map(([round,country,location,name,circuit,startDate,endDate]) => ({
    season: 2026, round: Number(round), country: String(country), location: String(location), name: String(name), circuit: String(circuit),
    startDate: String(startDate), raceDate: String(endDate), endDate: String(endDate),
    url: F1_CALENDAR_SOURCES[2026],
  })),
  2027: [
    [1,"Bahrain","Sakhir","Bahrain Grand Prix","Bahrain International Circuit","2027-03-12","2027-03-14"],
    [2,"Saudi Arabia","Jeddah","Saudi Arabian Grand Prix","Jeddah Corniche Circuit","2027-03-19","2027-03-21"],
    [3,"Australia","Melbourne","Australian Grand Prix","Albert Park Grand Prix Circuit","2027-04-02","2027-04-04"],
    [4,"Japan","Suzuka","Japanese Grand Prix","Suzuka International Racing Course","2027-04-09","2027-04-11"],
    [5,"China","Shanghai","Chinese Grand Prix","Shanghai International Circuit","2027-04-16","2027-04-18"],
    [6,"United States","Miami Gardens","Miami Grand Prix","Miami International Autodrome","2027-04-30","2027-05-02"],
    [7,"Canada","Montreal","Canadian Grand Prix","Circuit Gilles-Villeneuve","2027-05-21","2027-05-23"],
    [8,"Monaco","Monte Carlo","Monaco Grand Prix","Circuit de Monaco","2027-06-04","2027-06-06"],
    [9,"Portugal","Portimão","Portuguese Grand Prix","Autódromo Internacional do Algarve","2027-06-18","2027-06-20"],
    [10,"United Kingdom","Silverstone","British Grand Prix","Silverstone Circuit","2027-07-02","2027-07-04"],
    [11,"Austria","Spielberg","Austrian Grand Prix","Red Bull Ring","2027-07-09","2027-07-11"],
    [12,"Belgium","Stavelot","Belgian Grand Prix","Circuit de Spa-Francorchamps","2027-07-23","2027-07-25"],
    [13,"Hungary","Mogyoród","Hungarian Grand Prix","Hungaroring","2027-07-30","2027-08-01"],
    [14,"Italy","Monza","Italian Grand Prix","Autodromo Nazionale Monza","2027-09-03","2027-09-05"],
    [15,"Spain","Madrid","Spanish Grand Prix","Madring","2027-09-10","2027-09-12"],
    [16,"Azerbaijan","Baku","Azerbaijan Grand Prix","Baku City Circuit","2027-09-24","2027-09-26"],
    [17,"Türkiye","Istanbul","Turkish Grand Prix","Istanbul Park","2027-10-01","2027-10-03"],
    [18,"Singapore","Marina Bay","Singapore Grand Prix","Marina Bay Street Circuit","2027-10-08","2027-10-10"],
    [19,"United States","Austin","United States Grand Prix","Circuit of The Americas","2027-10-22","2027-10-24"],
    [20,"Mexico","Mexico City","Mexico City Grand Prix","Autódromo Hermanos Rodríguez","2027-10-29","2027-10-31"],
    [21,"Brazil","São Paulo","São Paulo Grand Prix","Autódromo José Carlos Pace","2027-11-05","2027-11-07"],
    [22,"United States","Las Vegas","Las Vegas Grand Prix","Las Vegas Strip Circuit","2027-11-18","2027-11-20"],
    [23,"Qatar","Lusail","Qatar Grand Prix","Lusail International Circuit","2027-12-03","2027-12-05"],
    [24,"United Arab Emirates","Abu Dhabi","Abu Dhabi Grand Prix","Yas Marina Circuit","2027-12-10","2027-12-12"],
  ].map(([round,country,location,name,circuit,startDate,endDate]) => ({
    season: 2027, round: Number(round), country: String(country), location: String(location), name: String(name), circuit: String(circuit),
    startDate: String(startDate), raceDate: String(endDate), endDate: String(endDate),
    url: F1_CALENDAR_SOURCES[2027],
  })),
};

export const F1_SEASONS = [2026, 2027] as const;

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }

export function eventForDate(date = new Date()): GrandPrixEvent | undefined {
  const today = dateKey(date);
  const all = F1_SEASONS.flatMap((season) => F1_CALENDAR[season]);
  return all.find((event) => today >= event.startDate && today <= event.endDate)
    ?? all.find((event) => event.raceDate >= today);
}

export function nextGrandPrix(date = new Date()): GrandPrixEvent | undefined {
  const today = dateKey(date);
  return F1_SEASONS.flatMap((season) => F1_CALENDAR[season])
    .find((event) => event.raceDate >= today);
}

export function formatWeekend(event: GrandPrixEvent, locale = "pt-BR") {
  const start = new Date(`${event.startDate}T12:00:00Z`);
  const end = new Date(`${event.endDate}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "UTC" });
  const startText = formatter.format(start).replace(" de ", " ").toUpperCase();
  const endText = formatter.format(end).replace(" de ", " ").toUpperCase();
  return `${startText} — ${endText} ${event.season}`;
}
