import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Timing — F1 Live Timing",
  description: "F1 live timing, multiple video feeds and the official Formula One calendar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: `try { const saved = localStorage.getItem("apex-theme"); const theme = saved === "dark" || saved === "light" ? saved : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); document.documentElement.dataset.theme = theme; } catch { document.documentElement.dataset.theme = "light"; }` }} />
    </head>
    <body>{children}</body>
  </html>;
}
