export type DriverEntry = {
  id: string; name: string; nationality: string; team: string; number: string;
  note?: string; status2027: "confirmed" | "undecided"; team2027?: string;
  announcementDate?: string; contract?: string; statusSource?: string;
};

// Snapshot of drivers who appeared in a 2026 Grand Prix by 5 November 2026.
// Source of participation/team/number: FIA 2026 classifications and F1 results.
export const drivers2026: DriverEntry[] = [
  {id:"antonelli",name:"Kimi Antonelli",nationality:"Italiano",team:"Mercedes",number:"12",status2027:"undecided"},
  {id:"max_verstappen",name:"Max Verstappen",nationality:"Neerlandês",team:"Red Bull Racing",number:"3",status2027:"confirmed",team2027:"Red Bull Racing",contract:"Extensão confirmada até 2030",announcementDate:"2026-08-20",statusSource:"https://www.formula1.com/en/latest/article/verstappen-signs-contract-extension-with-red-bull-until-the-end-of-2030.4gUd8JEkYnKmD6bNMS5syw"},
  {id:"hamilton",name:"Lewis Hamilton",nationality:"Britânico",team:"Ferrari",number:"44",status2027:"undecided"},
  {id:"russell",name:"George Russell",nationality:"Britânico",team:"Mercedes",number:"63",status2027:"confirmed",team2027:"Mercedes",contract:"Acordo plurianual; equipe indicou continuidade"},
  {id:"leclerc",name:"Charles Leclerc",nationality:"Monegasco",team:"Ferrari",number:"16",status2027:"undecided"},
  {id:"norris",name:"Lando Norris",nationality:"Britânico",team:"McLaren",number:"1",status2027:"confirmed",team2027:"McLaren",contract:"Contrato até pelo menos 2030",announcementDate:"2026-08-29",statusSource:"https://www.mclaren.com/racing/formula-1/2026/lando-norris-contract-extension-2030/"},
  {id:"piastri",name:"Oscar Piastri",nationality:"Australiano",team:"McLaren",number:"81",status2027:"confirmed",team2027:"McLaren",contract:"Contrato plurianual inclui pelo menos 2027",statusSource:"https://www.mclaren.com/racing/formula-1/2025/oscar-piastri-commits-to-mclaren-with-multi-year-contract-extension/"},
  {id:"hadjar",name:"Isack Hadjar",nationality:"Francês",team:"Red Bull Racing",number:"6",status2027:"confirmed",team2027:"Red Bull Racing",contract:"Extensão anunciada pela equipe",announcementDate:"2026-09-23",statusSource:"https://www.redbullracing.com/int-en/oracle-red-bull-racing-2027-driver-lineup"},
  {id:"lawson",name:"Liam Lawson",nationality:"Neozelandês",team:"Racing Bulls",number:"30",status2027:"undecided"},
  {id:"gasly",name:"Pierre Gasly",nationality:"Francês",team:"Alpine",number:"10",status2027:"confirmed",team2027:"Alpine",contract:"Contrato até pelo menos 2028; equipe confirmou dupla 2027",announcementDate:"2026-08-27",statusSource:"https://www.formula1.com/en/latest/article/alpine-announce-colapinto-contract-extension-as-team-confirms-unchanged-2027-line-up.DL3dVyZLJm5cHryWcHyPq.DL3dVyZLJm5cHryWcHyPq"},
  {id:"lindblad",name:"Arvid Lindblad",nationality:"Britânico",team:"Racing Bulls",number:"41",status2027:"undecided"},
  {id:"colapinto",name:"Franco Colapinto",nationality:"Argentino",team:"Alpine",number:"43",status2027:"confirmed",team2027:"Alpine",contract:"Extensão anunciada para 2027",announcementDate:"2026-08-27",statusSource:"https://www.formula1.com/en/latest/article/alpine-announce-colapinto-contract-extension-as-team-confirms-unchanged-2027-line-up.DL3dVyZLJm5cHryWcHyPq.DL3dVyZLJm5cHryWcHyPq"},
  {id:"bearman",name:"Oliver Bearman",nationality:"Britânico",team:"Haas F1 Team",number:"87",status2027:"undecided"},
  {id:"bortoleto",name:"Gabriel Bortoleto",nationality:"Brasileiro",team:"Audi",number:"5",status2027:"undecided"},
  {id:"hulkenberg",name:"Nico Hülkenberg",nationality:"Alemão",team:"Audi",number:"27",status2027:"undecided"},
  {id:"ocon",name:"Esteban Ocon",nationality:"Francês",team:"Haas F1 Team",number:"31",note:"Haas anunciou em 4 nov. que não voltará a competir em 2026",status2027:"undecided"},
  {id:"alonso",name:"Fernando Alonso",nationality:"Espanhol",team:"Aston Martin",number:"14",status2027:"confirmed",team2027:"Aston Martin",contract:"Extensão de contrato anunciada",announcementDate:"2026-09-29",statusSource:"https://www.formula1.com/en/latest/article/alonso-and-stroll-to-stay-at-aston-martin-in-2027-as-team-confirm-unchanged-line-up.7xg2Sct45vzW92UaiE8YXR"},
  {id:"sainz",name:"Carlos Sainz",nationality:"Espanhol",team:"Williams",number:"55",status2027:"undecided"},
  {id:"albon",name:"Alexander Albon",nationality:"Tailandês",team:"Williams",number:"23",status2027:"confirmed",team2027:"Williams",contract:"Renovação plurianual anunciada",announcementDate:"2026-08-18",statusSource:"https://www.williamsf1.com/articles/d4277353-e590-4de6-a82e-f8e8ff634c8e/alex-albon-extends-record-breaking-journey-with-atlassian-williams-f1-team"},
  {id:"tsunoda",name:"Yuki Tsunoda",nationality:"Japonês",team:"Racing Bulls",number:"22",note:"Participação como substituto",status2027:"undecided"},
  {id:"ryo_hirakawa",name:"Ryo Hirakawa",nationality:"Japonês",team:"Haas F1 Team",number:"39",note:"Participação como substituto",status2027:"undecided"},
  {id:"stroll",name:"Lance Stroll",nationality:"Canadense",team:"Aston Martin",number:"18",status2027:"confirmed",team2027:"Aston Martin",contract:"Extensão de contrato anunciada",announcementDate:"2026-09-29",statusSource:"https://www.formula1.com/en/latest/article/alonso-and-stroll-to-stay-at-aston-martin-in-2027-as-team-confirm-unchanged-line-up.7xg2Sct45vzW92UaiE8YXR"},
  {id:"bottas",name:"Valtteri Bottas",nationality:"Finlandês",team:"Cadillac",number:"77",status2027:"undecided"},
  {id:"perez",name:"Sergio Pérez",nationality:"Mexicano",team:"Cadillac",number:"11",status2027:"undecided"},
];

export const additional2027: DriverEntry[] = [
  {id:"rafael-camara",name:"Rafael Câmara",nationality:"Brasileiro",team:"F2 — Invicta Racing",number:"—",note:"Estreia na F1 anunciada para o GP de São Paulo (6–8 nov. 2026), posterior à data de corte",status2027:"confirmed",team2027:"Haas F1 Team",contract:"Contrato plurianual; estreia titular prevista em 2027",announcementDate:"2026-10-15",statusSource:"https://haasf1team.com/news/rafael-camara-confirmed-tgr-haas-f1-team-2027"},
];

export const sources = [
  {label:"Classificações oficiais da FIA 2026",url:"https://www.fia.com/events/fia-formula-one-world-championship/season-2026/2026-classifications"},
  {label:"Resultados oficiais da Fórmula 1 — 2026",url:"https://www.formula1.com/en/results/2026/drivers"},
  {label:"F1DB — base histórica aberta (CC BY 4.0)",url:"https://github.com/f1db/f1db"},
  {label:"Alpine — dupla 2027",url:"https://www.formula1.com/en/latest/article/alpine-announce-colapinto-contract-extension-as-team-confirms-unchanged-2027-line-up.DL3dVyZLJm5cHryWcHyPq.DL3dVyZLJm5cHryWcHyPq"},
  {label:"Aston Martin — dupla 2027",url:"https://www.formula1.com/en/latest/article/alonso-and-stroll-to-stay-at-aston-martin-in-2027-as-team-confirm-unchanged-line-up.7xg2Sct45vzW92UaiE8YXR"},
  {label:"Red Bull — extensão de Verstappen e Hadjar",url:"https://www.redbullracing.com/int-en/oracle-red-bull-racing-2027-driver-lineup"},
  {label:"Williams — extensão de Albon",url:"https://www.williamsf1.com/articles/d4277353-e590-4de6-a82e-f8e8ff634c8e/alex-albon-extends-record-breaking-journey-with-atlassian-williams-f1-team"},
  {label:"McLaren — contrato de Norris",url:"https://www.mclaren.com/racing/formula-1/2026/lando-norris-contract-extension-2030/"},
  {label:"Haas — Rafael Câmara 2027",url:"https://haasf1team.com/news/rafael-camara-confirmed-tgr-haas-f1-team-2027"},
  {label:"Haas — alteração da equipe para São Paulo (4 nov. 2026)",url:"https://www.haasf1team.com/news/team-statement-driver-update-0"},
  {label:"F1 — situação da vaga Racing Bulls",url:"https://www.formula1.com/en/latest/article/permane-states-racing-bulls-will-select-their-2027-driver-line-up-in-the-coming-weeks.39Cso2HINAEU5KViOulOZb"},
];

export function findDriver(id: string) {
  return [...drivers2026, ...additional2027].find((driver) => driver.id === id);
}
