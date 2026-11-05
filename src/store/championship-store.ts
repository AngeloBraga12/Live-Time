import { create } from "zustand";
import type { ChampionshipData } from "@/types/championship";

type ChampionshipState = {
  data: ChampionshipData | null;
  loading: boolean;
  error: string | null;
  selectedSeason: number;
  cache: Record<number, { data: ChampionshipData; at: number }>;
  previous: ChampionshipData | null;
  fetchChampionship: (season?: number) => Promise<void>;
};

export const useChampionshipStore = create<ChampionshipState>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  selectedSeason: 2026,
  cache: {},
  previous: null,
  fetchChampionship: async (season = 2026) => {
    const existing = get().cache[season];
    const now = Date.now();
    if (existing && now - existing.at < 30 * 60 * 1000) {
      set({ data: existing.data, selectedSeason: season, error: null, loading: false });
      return;
    }

    set({ loading: true, error: null, selectedSeason: season });
    try {
      const res = await fetch(`/api/standings?season=${season}`);
      if (!res.ok) throw new Error(`Falha ao obter classificação (${res.status})`);
      const data = (await res.json()) as ChampionshipData;
      set((state) => ({
        previous: state.data,
        data,
        loading: false,
        cache: { ...state.cache, [season]: { data, at: Date.now() } },
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Erro ao carregar campeonato", loading: false });
    }
  },
}));
