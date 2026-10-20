import type { Metadata } from "next";
import { LiveTiming } from "@/components/live/live-timing";

export const metadata: Metadata = { title: { absolute: "Apex Timing · F1 ao vivo" } };

export default function HomePage() {
  return <LiveTiming />;
}
