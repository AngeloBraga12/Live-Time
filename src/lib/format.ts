import type { SessionInfo, TireCompound, TrackFlag } from "@/types/live-timing";
import type { GrandPrixEvent } from "@/data/f1-calendar";

/** 96.282 → "1:36.282"; 28.7 → "28.700". */
export function lapTime(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return seconds.toFixed(3);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds - minutes * 60).toFixed(3).padStart(6, "0")}`;
}

export function sectorTime(seconds: number | null) {
  return seconds == null || !Number.isFinite(seconds) ? "—" : seconds.toFixed(3);
}

const SESSION_NAMES: [RegExp, string][] = [
  [/^sprint (qualifying|shootout)$/i, "Classificação Sprint"],
  [/^sprint$/i, "Sprint"],
  [/^qualifying$/i, "Classificação"],
  [/^race$/i, "Corrida"],
  [/^practice (\d)$/i, "Treino Livre $1"],
  [/^day (\d)$/i, "Teste · Dia $1"],
];

/** Nome da sessão em português ("Practice 2" → "Treino Livre 2"). */
export function sessionLabel(name: string) {
  for (const [pattern, label] of SESSION_NAMES) if (pattern.test(name)) return name.replace(pattern, label);
  return name || "Sessão";
}

export function isRaceSession(name: string) {
  return /^(race|sprint)$/i.test(name.trim());
}

export function isSessionOver(session: Pick<SessionInfo, "status">) {
  return session.status === "finished" || session.status === "chequered";
}

export function isSessionRunning(session: Pick<SessionInfo, "status">) {
  return ["green", "safety-car", "virtual-safety-car", "red-flag"].includes(session.status);
}

export type TrackState = "clear" | "yellow" | "sc" | "vsc" | "red" | "chequered" | "idle";

/** Estado da pista para a faixa colorida abaixo do cabeçalho. */
export function trackState(session: Pick<SessionInfo, "status" | "trackFlag">): { state: TrackState; label: string } {
  if (isSessionOver(session)) return { state: "chequered", label: "Bandeira quadriculada" };
  if (session.status === "red-flag") return { state: "red", label: "Bandeira vermelha" };
  if (session.status === "safety-car") return { state: "sc", label: "Safety car" };
  if (session.status === "virtual-safety-car") return { state: "vsc", label: "Virtual safety car" };
  const flag: TrackFlag = session.trackFlag;
  if (flag === "yellow" || flag === "double-yellow") return { state: "yellow", label: "Bandeira amarela" };
  if (flag === "red") return { state: "red", label: "Bandeira vermelha" };
  if (session.status === "green" || flag === "green") return { state: "clear", label: "Pista livre" };
  return { state: "idle", label: "Sessão não iniciada" };
}

export const COMPOUND_LETTER: Record<TireCompound, string> = { UNKNOWN: "?", SOFT: "S", MEDIUM: "M", HARD: "H", INTERMEDIATE: "I", WET: "W" };
export const COMPOUND_NAME: Record<TireCompound, string> = { UNKNOWN: "Desconhecido", SOFT: "Macio", MEDIUM: "Médio", HARD: "Duro", INTERMEDIATE: "Intermediário", WET: "Chuva" };

const SHORT_DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });

function shortDate(iso: string) {
  return SHORT_DATE.format(new Date(`${iso}T12:00:00Z`)).replace(" de ", " ").replace(".", "");
}

/** "23 – 25 out" ou "30 out – 01 nov". */
export function weekendRange(event: Pick<GrandPrixEvent, "startDate" | "endDate">) {
  const [startDay, startMonth] = shortDate(event.startDate).split(" ");
  const [endDay, endMonth] = shortDate(event.endDate).split(" ");
  return startMonth === endMonth ? `${startDay} – ${endDay} ${endMonth}` : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

/** Dias corridos (UTC) entre hoje e a data indicada. */
export function daysUntil(isoDate: string, today: string) {
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export function clockTime(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const COUNTRY_PT: Record<string, string> = {
  Australia: "Austrália", Austria: "Áustria", Azerbaijan: "Azerbaijão", Bahrain: "Bahrein", Belgium: "Bélgica",
  Brazil: "Brasil", Canada: "Canadá", China: "China", Hungary: "Hungria", Italy: "Itália", Japan: "Japão",
  Malaysia: "Malásia", Mexico: "México", Monaco: "Mônaco", Netherlands: "Holanda", Portugal: "Portugal",
  Qatar: "Catar", "Saudi Arabia": "Arábia Saudita", Singapore: "Singapura", Spain: "Espanha", Türkiye: "Turquia",
  "United Arab Emirates": "Emirados Árabes", "United Kingdom": "Reino Unido", "United States": "Estados Unidos",
};

/** Nome do país em português, mantendo o original se não houver tradução. */
export function countryName(country: string) {
  return COUNTRY_PT[country] ?? country;
}
