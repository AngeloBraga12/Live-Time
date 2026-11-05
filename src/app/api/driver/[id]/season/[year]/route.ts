import { NextResponse } from "next/server";
import { ergastJson } from "@/lib/f1/ergast";

type Result = {number:string;position:string;positionText:string;grid:string;points:string;status:string;Driver:{driverId:string;givenName:string;familyName:string};Constructor:{constructorId:string;name:string};FastestLap?:{rank:string}};
type Race = { round:string; raceName:string; date:string; Circuit:{circuitName:string;Location:{country:string}}; Results?:Result[]; SprintResults?:Result[] };
type ResponseData = { MRData:{ RaceTable:{ Races:Race[] } } };

export async function GET(_request: Request, {params}:{params:Promise<{id:string;year:string}>}) {
  const {id,year}=await params;
  if(!/^[a-z0-9_]+$/.test(id)||!/^20\d{2}$/.test(year)) return NextResponse.json({error:"Parâmetros inválidos"},{status:400});
  try {
    const [races,sprints]=await Promise.all([
      ergastJson<ResponseData>(`${year}/drivers/${id}/results.json?limit=100`).catch(()=>null),
      ergastJson<ResponseData>(`${year}/drivers/${id}/sprint.json?limit=100`).catch(()=>null),
    ]);
    const constructorIds=[...new Set(races?.MRData?.RaceTable?.Races?.flatMap(r=>r.Results?.[0]?.Constructor.constructorId??[])??[])];
    const constructorResults=await Promise.all(constructorIds.map(async constructorId=>{
      const [gp,sprint]=await Promise.all([
        ergastJson<ResponseData>(`${year}/constructors/${constructorId}/results.json?limit=100`).catch(()=>null),
        ergastJson<ResponseData>(`${year}/constructors/${constructorId}/sprint.json?limit=100`).catch(()=>null),
      ]);
      return {constructorId,gp:gp?.MRData?.RaceTable?.Races??[],sprint:sprint?.MRData?.RaceTable?.Races??[]};
    }));
    const result=(data:ResponseData|null,key:"Results"|"SprintResults")=>data?.MRData?.RaceTable?.Races?.flatMap((race)=>{
      const record=race[key]?.[0];
      if(!record) return [];
      const constructor=constructorResults.find(team=>team.constructorId===record.Constructor.constructorId);
      const teammates=(key==="Results"?constructor?.gp:constructor?.sprint)?.find(event=>event.round===race.round)?.[key]?.filter(x=>x.Driver.driverId!==id).map(x=>`${x.Driver.givenName} ${x.Driver.familyName}`)??[];
      return [{round:race.round,name:race.raceName,date:race.date,circuit:race.Circuit.circuitName,country:race.Circuit.Location.country,...record,teammates,fastestLapRank1:record.FastestLap?.rank==="1"}];
    })??[];
    return NextResponse.json({year,driverId:id,grandPrix:result(races,"Results"),sprints:result(sprints,"SprintResults"),source:"Jolpica/Ergast API"},{headers:{"Cache-Control":"public, max-age=3600, stale-while-revalidate=86400"}});
  } catch(error) {
    console.error(`[API/driver/${id}/season/${year}]`,error);
    return NextResponse.json({error:"Resultados indisponíveis"},{status:502});
  }
}
