import Link from "next/link";
import { additional2027, drivers2026, sources } from "@/data/encyclopedia";

export const metadata = { title: "Enciclopédia de pilotos · Apex Timing", description: "Pilotos que participaram da Fórmula 1 em 2026 e confirmações oficiais para 2027." };

function DriverCards({ entries }: { entries: typeof drivers2026 }) {
  return <div className="table-wrap"><div className="encyclopedia-grid">{entries.map((driver) => <Link className="encyclopedia-card" href={`/driver/${driver.id}`} key={driver.id}>
    <span className="eyebrow">{driver.team} · Nº {driver.number}</span><strong>{driver.name}</strong><span>{driver.nationality}{driver.note ? ` · ${driver.note}` : ""}</span>
    <small>{driver.status2027 === "confirmed" ? `2027 confirmado: ${driver.team2027}` : "2027: sem confirmação oficial"}</small>
  </Link>)}</div></div>;
}

export default function DriversPage() {
  const confirmed = [...drivers2026, ...additional2027].filter((d) => d.status2027 === "confirmed");
  const uncertain = drivers2026.filter((d) => d.status2027 === "undecided");
  const teams = [...new Set(drivers2026.map((d) => d.team))];
  const nationalities = [...new Set(drivers2026.map((d) => d.nationality))];
  return <div className="container calendar">
    <header className="page-header"><div><p className="eyebrow">Enciclopédia de automobilismo · Corte em 5 nov. 2026</p><h1 className="page-title">Pilotos da Fórmula 1</h1><p style={{color:"var(--ink-3)"}}>24 participantes em GPs de 2026 até o México; inclusos substitutos. O GP de São Paulo ainda não havia começado no corte.</p></div></header>
    <section className="encyclopedia-section"><h2 className="section-title">Participantes de 2026 <span className="count">{drivers2026.length}</span></h2><DriverCards entries={drivers2026}/></section>
    <section className="encyclopedia-section"><h2 className="section-title">Confirmados oficialmente para 2027 <span className="count">{confirmed.length}</span></h2><p>Inclui Rafael Câmara, confirmado para estrear em 2027 e ainda sem participação em GP de F1 até a data de corte. Contratos e anúncios são identificados na ficha individual.</p><DriverCards entries={confirmed}/></section>
    <section className="encyclopedia-section"><h2 className="section-title">Participantes de 2026 sem vaga confirmada para 2027 <span className="count">{uncertain.length}</span></h2><p>“Sem confirmação oficial” descreve o estado público verificado; não significa que o piloto esteja sem contrato ou que tenha perdido a vaga.</p><DriverCards entries={uncertain}/></section>
    <section className="encyclopedia-section"><h2 className="section-title">Índices</h2><p><strong>Por equipe:</strong> {teams.join(" · ")}</p><p><strong>Por nacionalidade:</strong> {nationalities.join(" · ")}</p><p><strong>Campeões mundiais entre os participantes:</strong> Kimi Antonelli, Fernando Alonso, Lewis Hamilton e Max Verstappen. <strong>Estreantes de 2026:</strong> Arvid Lindblad. Categorização a partir dos históricos de F1.</p></section>
    <section className="encyclopedia-section"><h2 className="section-title">Fontes e método</h2><p>Estatísticas históricas são carregadas por perfil a partir do espelho Ergast/Jolpica, conferidas com a classificação FIA quando possível. A ficha distingue largadas/resultados e indica quando dados biográficos ou de categorias de base não estão disponíveis. Fotos não são replicadas sem licença verificada.</p><ul>{sources.map((source) => <li key={source.label}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul><p>Verificação editorial: 5 de novembro de 2026. A dupla de Racing Bulls para 2027 permanecia sem decisão anunciada nessa data.</p></section>
  </div>;
}
