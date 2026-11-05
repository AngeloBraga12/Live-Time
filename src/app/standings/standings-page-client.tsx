"use client";

import { useState } from "react";
import { F1_SEASONS } from "@/data/f1-calendar";
import { useChampionshipStore } from "@/store/championship-store";
import { useChampionship } from "@/hooks/use-championship";
import { StandingsTables } from "@/components/standings/standings-tables";

export function StandingsPageClient() {
  const [season, setSeason] = useState<number>(2026);
  const { data, loading, error } = useChampionship(season);
  const previous = useChampionshipStore((s) => s.previous);

  return (
    <div className="container calendar">
      <header className="page-header">
        <div>
          <p className="eyebrow">Campeonato Mundial de Fórmula 1</p>
          <h1 className="page-title">Campeonato {season}</h1>
          {data && (
            <p style={{ color: "var(--ink-3)", fontSize: 13 }}>
              Fonte: {data.source} · Atualizado {new Date(data.lastUpdated).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
        <div className="segmented" role="group" aria-label="Temporada">
          {F1_SEASONS.map((year) => (
            <button
              key={year}
              type="button"
              aria-pressed={year === season}
              onClick={() => setSeason(year)}
            >
              {year}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="table-wrap" aria-busy="true" aria-label="Carregando classificação">
          <div className="skeleton-rows">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton skeleton-row" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p className="empty-title">Erro ao carregar classificação</p>
          <p>{error}</p>
        </div>
      ) : !data || data.drivers.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">Temporada {season} ainda não iniciada</p>
          <p>A classificação de pilotos e construtores será computada após a primeira corrida da temporada.</p>
        </div>
      ) : (
        <StandingsTables
          drivers={data.drivers}
          constructors={data.constructors}
          previous={previous ? { drivers: previous.drivers, constructors: previous.constructors } : null}
        />
      )}
    </div>
  );
}
