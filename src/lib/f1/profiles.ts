import type { DriverProfile, ConstructorProfile } from "@/types/profile";
import { ergastJson } from "./ergast";

type ErgastDriverResponse = { MRData: { DriverTable: { Drivers: Array<{ driverId: string; givenName: string; familyName: string; permanentNumber?: string; nationality: string; dateOfBirth?: string; url: string }> } } };
type ErgastConstructorResponse = { MRData: { ConstructorTable: { Constructors: Array<{ constructorId: string; name: string; nationality: string; url: string }> } } };

export async function fetchDriverProfile(driverId: string): Promise<DriverProfile | null> {
  const json = await ergastJson<ErgastDriverResponse>(`drivers/${encodeURIComponent(driverId)}.json?limit=1`, 24 * 60 * 60).catch(() => null);
  const d = json?.MRData?.DriverTable?.Drivers?.[0];
  if (!d) return null;
  return {
    driverId: d.driverId,
    givenName: d.givenName,
    familyName: d.familyName,
    permanentNumber: d.permanentNumber ?? null,
    nationality: d.nationality,
    dateOfBirth: d.dateOfBirth ?? null,
    url: d.url,
  };
}

export async function fetchConstructorProfile(constructorId: string): Promise<ConstructorProfile | null> {
  const json = await ergastJson<ErgastConstructorResponse>(`constructors/${encodeURIComponent(constructorId)}.json?limit=1`, 24 * 60 * 60).catch(() => null);
  const c = json?.MRData?.ConstructorTable?.Constructors?.[0];
  if (!c) return null;
  return {
    constructorId: c.constructorId,
    name: c.name,
    nationality: c.nationality,
    url: c.url,
  };
}
