"use client";

import { useEffect, useState } from "react";
import type { ConstructorProfile } from "@/types/profile";

export function ConstructorProfilePageClient({ id }: { id: string }) {
  const [profile, setProfile] = useState<ConstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const mod = await import("@/lib/f1/profiles");
        const data = await mod.fetchConstructorProfile(id);
        if (!cancelled) setProfile(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="container"><p>Carregando equipe...</p></div>;
  if (!profile) return <div className="container"><p>Equipe não encontrada</p></div>;

  return (
    <div className="container calendar">
      <header className="page-header">
        <div>
          <p className="eyebrow">Perfil da Equipe</p>
          <h1 className="page-title">{profile.name}</h1>
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>{profile.nationality}</p>
        </div>
      </header>
    </div>
  );
}
