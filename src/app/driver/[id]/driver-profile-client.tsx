"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DriverHistory } from "@/types/profile";
import { findDriver, sources } from "@/data/encyclopedia";

type EventResult = {round:string;name:string;date:string;circuit:string;country:string;number:string;position:string;positionText:string;grid:string;points:string;status:string;Constructor:{name:string};teammates:string[];fastestLapRank1:boolean};
type SeasonData = {grandPrix:EventResult[];sprints:EventResult[];source:string};

function metric(label:string,value:string|number) { return <div className="career-metric" key={label}><span>{label}</span><strong>{value}</strong></div>; }
function resultName(position:string,positionText:string) { return Number(position)>0 ? `${position}º` : positionText; }

export function DriverProfilePageClient({ id }: { id: string }) {
  const entry=findDriver(id);
  const [history,setHistory]=useState<DriverHistory|null>(null);
  const [season,setSeason]=useState<SeasonData|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let cancelled=false;
    Promise.all([
      fetch(`/api/driver/${encodeURIComponent(id)}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`/api/driver/${encodeURIComponent(id)}/season/2026`).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([h,s])=>{if(!cancelled){setHistory(h);setSeason(s);setLoading(false);}});
    return()=>{cancelled=true;};
  },[id]);
  if(!entry&&!history) return <div className="container"><p>Piloto não encontrado.</p><Link href="/drivers">Voltar ao índice</Link></div>;
  const name=entry?.name??`${history?.profile.givenName} ${history?.profile.familyName}`;
  const dob=history?.profile.dateOfBirth;
  const ageAtCutoff=dob?(()=>{const born=new Date(`${dob}T12:00:00`);let age=2026-born.getFullYear();if(new Date("2026-11-05T12:00:00")<new Date(2026,born.getMonth(),born.getDate(),12)) age--;return age;})():null;
  const seasonStats=history?.seasons.find(s=>s.season==="2026");
  const races=season?.grandPrix??[];
  const starts=races.filter(r=>Number(r.grid)>0).length;
  const dnfs=races.filter(r=>!/^Finished|\+/.test(r.status)).length;
  const sprintPoints=(season?.sprints??[]).reduce((sum,result)=>sum+Number(result.points||0),0);
  const sprintWins=(season?.sprints??[]).filter(result=>result.position==="1").length;
  return <div className="container calendar">
    <p className="eyebrow"><Link href="/drivers">Enciclopédia de pilotos</Link> · Verificação em 5 nov. 2026</p>
    <header className="page-header"><div><h1 className="page-title">{name}</h1><p className="driver-lede">{entry?.nationality??history?.profile.nationality} · {entry?.team??"Histórico de Fórmula 1"}{entry&&` · Nº ${entry.number}`}</p>{entry?.note&&<p>{entry.note}</p>}</div></header>
    <section className="encyclopedia-section"><h2 className="section-title">Identificação</h2><div className="identity-grid">
      <div className="identity-card"><span>Equipe em 2026</span><strong>{entry?.team??"Não informado"}</strong></div>
      <div className="identity-card"><span>Número de carro</span><strong>{entry?.number??history?.profile.permanentNumber??"Não divulgado"}</strong></div>
      <div className="identity-card"><span>Nascimento / idade no corte</span><strong>{dob?`${new Date(`${dob}T12:00:00`).toLocaleDateString("pt-BR")} · ${ageAtCutoff} anos`:"Sem dado confiável"}</strong></div>
      <div className="identity-card"><span>Equipe em 2027</span><strong>{entry?.status2027==="confirmed"?entry.team2027:"Não confirmado oficialmente"}</strong></div>
    </div><p className="data-gap">Cidade natal, altura, peso, idiomas, fotografia licenciada, trajetória completa no kart e categorias de base, engenheiros e apelidos: não divulgados nesta base ou sem fonte primária validada. Não estimamos esses campos.</p></section>
    <section className="encyclopedia-section"><h2 className="section-title">Carreira na Fórmula 1</h2>
      {loading?<p>Carregando estatísticas históricas…</p>:history?<><div className="career-metrics">
        {metric("Temporadas",history.totals.seasons)}{metric("GPs com resultado",history.totals.races)}{metric("Vitórias",history.totals.wins)}{metric("Pódios",history.totals.podiums)}{metric("Poles",history.totals.poles)}{metric("Voltas mais rápidas",history.totals.fastestLaps)}{metric("Pontos",history.totals.points)}{metric("Títulos mundiais",history.totals.worldChampionships)}
      </div><p>Estreia: {history.totals.firstRace?`${history.totals.firstRace.season} — ${history.totals.firstRace.raceName}`:"sem registro"}. Melhor marca disponível: {history.totals.firstWin?`vitória no ${history.totals.firstWin.raceName} de ${history.totals.firstWin.season}`:"sem vitória registrada"}. Resultados históricos não incluem GPs sem largada/resultados classificados na fonte.</p>
      <div className="table-wrap"><table className="encyclopedia-table"><thead><tr><th>Temporada</th><th>Equipe(s)</th><th>GPs</th><th>Vitórias</th><th>Pódios</th><th>Poles</th><th>Voltas rápidas</th><th>Pontos</th><th>Pos.</th></tr></thead><tbody>{history.seasons.map(s=><tr key={s.season}><th>{s.season}</th><td>{s.team}</td><td>{s.races}</td><td>{s.wins}</td><td>{s.podiums}</td><td>{s.poles}</td><td>{s.fastestLaps}</td><td>{s.points}</td><td>{s.position??"—"}</td></tr>)}</tbody></table></div></>:<p>Histórico indisponível no momento.</p>}
    </section>
    {entry&&<section className="encyclopedia-section"><h2 className="section-title">Temporada 2026</h2><p>Equipe: <strong>{entry.team}</strong> · companheiro(s): conforme escalações de cada etapa · classificação e pontos até o GP do México concluído em 1º de novembro. Os pontos abaixo são de GPs; Sprint é apresentada separadamente.</p>
      {seasonStats&&<div className="career-metrics">{metric("Pontos GP",seasonStats.points)}{metric("Vitórias",seasonStats.wins)}{metric("Pódios",seasonStats.podiums)}{metric("Poles",seasonStats.poles)}{metric("Voltas rápidas",seasonStats.fastestLaps)}{metric("Posição campeonato",seasonStats.position??"—")}{metric("GPs com resultado",races.length)}{metric("Largadas registradas",starts)}{metric("Abandonos",dnfs)}{metric("Pontos Sprint",sprintPoints)}{metric("Vitórias Sprint",sprintWins)}</div>}
      <h3 className="section-title">Resultados de Grandes Prêmios</h3><div className="table-wrap"><table className="encyclopedia-table"><thead><tr><th>Etapa</th><th>Data</th><th>Equipe</th><th>Companheiro(s)</th><th>Grid</th><th>Resultado</th><th>Pontos GP</th><th>Status</th></tr></thead><tbody>{races.map(r=><tr key={r.round}><th>{r.round}. {r.name}</th><td>{new Date(`${r.date}T12:00:00`).toLocaleDateString("pt-BR")}</td><td>{r.Constructor?.name??entry.team}</td><td>{r.teammates.join(", ")||"—"}</td><td>{r.grid}</td><td>{resultName(r.position,r.positionText)}</td><td>{r.points}</td><td>{r.status}{r.fastestLapRank1?" · volta mais rápida":""}</td></tr>)}</tbody></table>{races.length===0&&<p className="data-gap">Resultados detalhados indisponíveis.</p>}</div>
      <h3 className="section-title">Sprints</h3><div className="table-wrap"><table className="encyclopedia-table"><thead><tr><th>Etapa</th><th>Data</th><th>Companheiro(s)</th><th>Grid Sprint</th><th>Resultado Sprint</th><th>Pontos Sprint</th><th>Status</th></tr></thead><tbody>{(season?.sprints??[]).map(r=><tr key={r.round}><th>{r.round}. {r.name}</th><td>{new Date(`${r.date}T12:00:00`).toLocaleDateString("pt-BR")}</td><td>{r.teammates.join(", ")||"—"}</td><td>{r.grid}</td><td>{resultName(r.position,r.positionText)}</td><td>{r.points}</td><td>{r.status}</td></tr>)}</tbody></table>{!season?.sprints.length&&<p className="data-gap">Dados das Sprints indisponíveis.</p>}</div>
    </section>}
    <section className="encyclopedia-section"><h2 className="section-title">Situação para 2027</h2>{entry?.status2027==="confirmed"?<p><strong>Confirmado:</strong> {entry.team2027}. {entry.contract??"Anúncio oficial registrado."}{entry.announcementDate?` Anúncio: ${new Date(`${entry.announcementDate}T12:00:00`).toLocaleDateString("pt-BR")}.`:""}{entry.id==="rafael-camara"?" Estreante confirmado para 2027; Haas anunciou também sua estreia no GP de São Paulo de 2026, depois da data de corte de 5 de novembro. Portanto, ele não integra a lista de pilotos que já haviam participado de GP em 2026 na data de referência.":""}</p>:<p><strong>Não confirmado oficialmente até 5 nov. 2026.</strong> Não convertemos especulações em vaga confirmada. A vaga de Racing Bulls seguia em avaliação pública; os demais status podem mudar.</p>}</section>
    <section className="encyclopedia-section"><h2 className="section-title">Biografia, análise e legado</h2><p>Este perfil prioriza fatos estatísticos verificáveis. Biografia familiar, percurso detalhado por categorias de base, estilo de pilotagem, comparação com companheiros, chefes e engenheiros não estão preenchidos sem fontes individualizadas de qualidade; são lacunas editoriais a complementar. Nenhuma avaliação subjetiva é tratada como fato.</p><p>Histórico esportivo fora da Fórmula 1: não consolidado nesta edição.</p></section>
    <section className="encyclopedia-section"><h2 className="section-title">Fontes</h2><ul><li><a href="https://www.fia.com/events/fia-formula-one-world-championship/season-2026/2026-classifications" target="_blank" rel="noreferrer">Classificações da FIA 2026</a></li><li><a href="https://www.formula1.com/en/results/2026/races" target="_blank" rel="noreferrer">Resultados oficiais de GPs da Fórmula 1</a></li><li><a href="https://api.jolpi.ca/ergast/f1/" target="_blank" rel="noreferrer">API Jolpica/Ergast — resultados e históricos, fonte secundária</a></li>{entry?.statusSource&&<li><a href={entry.statusSource} target="_blank" rel="noreferrer">Comunicado oficial da confirmação 2027</a></li>}{sources.slice(3,8).map(s=><li key={s.label}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul></section>
  </div>;
}
