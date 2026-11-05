"use client";

import { useEffect, useState } from "react";
import type { DriverProfile } from "@/types/profile";

export function DriverProfilePageClient({ id }: { id: string }) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const mod = await import("@/lib/f1/profiles");
        const data = await mod.fetchDriverProfile(id);
        if (!cancelled) setProfile(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="container"><p>Carregando piloto...</p></div>;
  if (!profile) return <div className="container"><p>Piloto não encontrado</p></div>;

  return (
    <div className="container calendar">
      <header className="page-header">
        <div>
          <p className="eyebrow">Perfil do Piloto</p>
          <h1 className="page-title">{profile.givenName} {profile.familyName}</h1>
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>
            Nº {profile.permanentNumber ?? "—"} · {profile.nationality}
            {profile.dateOfBirth && ` · Nasc. ${new Date(profile.dateOfBirth).toLocaleDateString("pt-BR")}`}
          </p>
        </div>
      </header>
    </div>
  );
}
