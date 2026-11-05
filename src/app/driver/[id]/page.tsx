import { Metadata } from "next";
import { DriverProfilePageClient } from "./driver-profile-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Piloto ${id} · Apex Timing` };
}

export default async function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DriverProfilePageClient id={id} />;
}
