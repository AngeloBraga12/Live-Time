import { useEffect } from "react";
import { useChampionshipStore } from "@/store/championship-store";

export function useChampionship(season?: number) {
  const { data, loading, error, fetchChampionship } = useChampionshipStore();

  useEffect(() => {
    fetchChampionship(season);
  }, [season]);

  return { data, loading, error };
}
