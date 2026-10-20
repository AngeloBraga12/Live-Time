import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { SiteHeader } from "@/components/ui/site-header";
import { SiteFooter } from "@/components/ui/site-footer";
import "./globals.css";

// Archivo variável com eixo de largura: normal para texto, expandida (wdth 125) para títulos.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], display: "swap", variable: "--font-archivo" });

export const metadata: Metadata = {
  title: { default: "Apex Timing · F1 ao vivo", template: "%s · Apex Timing" },
  description: "Cronometragem da Fórmula 1 em tempo real: classificação, setores, pneus, direção de prova e calendário.",
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#15151e" }, { color: "#15151e" }],
};

const themeScript = `try{var s=localStorage.getItem("apex-theme");document.documentElement.dataset.theme=s==="dark"||s==="light"?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){document.documentElement.dataset.theme="light"}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className={archivo.variable} suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
    <body>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <SiteHeader />
      <main id="conteudo" className="page">{children}</main>
      <SiteFooter />
    </body>
  </html>;
}
