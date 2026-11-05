import { Metadata } from "next";
import { ConstructorProfilePageClient } from "./constructor-profile-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Equipe ${id} · Apex Timing` };
}

export default async function ConstructorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConstructorProfilePageClient id={id} />;
}
