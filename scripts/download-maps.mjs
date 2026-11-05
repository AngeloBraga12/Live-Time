import fs from "fs";
import path from "path";

// Cada ID de pista do calendário mapeado para a versão exata do traçado
// oficial disponível no repositório f1db/f1-circuits-svg (licença CC-BY-4.0).
const MAPPING = {
  "australia": "circuits/detailed/white-outline/melbourne-2.svg",
  "china": "circuits/detailed/white-outline/shanghai-1.svg",
  "japan": "circuits/detailed/white-outline/suzuka-2.svg",
  "miami": "circuits/detailed/white-outline/miami-1.svg",
  "canada": "circuits/detailed/white-outline/montreal-6.svg",
  "monaco": "circuits/detailed/white-outline/monaco-6.svg",
  "spain": "circuits/detailed/white-outline/catalunya-6.svg",
  "austria": "circuits/detailed/white-outline/spielberg-3.svg",
  "uk": "circuits/detailed/white-outline/silverstone-8.svg",
  "belgium": "circuits/detailed/white-outline/spa-francorchamps-4.svg",
  "hungary": "circuits/detailed/white-outline/hungaroring-3.svg",
  "netherlands": "circuits/detailed/white-outline/zandvoort-5.svg",
  "italy": "circuits/detailed/white-outline/monza-7.svg",
  "madrid": "circuits/detailed/white-outline/madring-1.svg",
  "azerbaijan": "circuits/detailed/white-outline/baku-1.svg",
  "malaysia": "circuits/minimal/white-outline/sepang-1.svg",
  "singapore": "circuits/detailed/white-outline/marina-bay-4.svg",
  "usa-austin": "circuits/detailed/white-outline/austin-1.svg",
  "mexico": "circuits/detailed/white-outline/mexico-city-3.svg",
  "brazil": "circuits/detailed/white-outline/interlagos-2.svg",
  "usa-vegas": "circuits/detailed/white-outline/las-vegas-1.svg",
  "qatar": "circuits/detailed/white-outline/lusail-1.svg",
  "uae": "circuits/detailed/white-outline/yas-marina-2.svg",
  "bahrain": "circuits/detailed/white-outline/bahrain-1.svg",
  "saudi-arabia": "circuits/detailed/white-outline/jeddah-1.svg",
  "portugal": "circuits/minimal/white-outline/portimao-1.svg",
  "turkiye": "circuits/minimal/white-outline/istanbul-1.svg",
};

const BASE = "https://raw.githubusercontent.com/f1db/f1-circuits-svg/main";
const TARGET_DIR = path.resolve(process.cwd(), "public/maps");

fs.mkdirSync(TARGET_DIR, { recursive: true });

async function downloadAll() {
  const entries = Object.entries(MAPPING);
  console.log(`Baixando ${entries.length} mapas de circuitos reais em public/maps/...`);
  let ok = 0;
  for (const [id, remotePath] of entries) {
    const url = `${BASE}/${remotePath}`;
    const destination = path.join(TARGET_DIR, `${id}.svg`);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let text = await response.text();
      if (!text.includes("<svg") || !text.includes("</svg>")) {
        throw new Error("Arquivo retornado não é SVG válido.");
      }
      // O repositório publica os traçados com traço preto (para fundo claro).
      // O Live-Time é carbono escuro, então assentamos a cor no próprio arquivo:
      // <img> não herda currentColor da página.
      text = text
        .replace(/stroke:#000/gi, "stroke:#f5f5f5")
        .replace(/fill:#000/gi, "fill:#f5f5f5");
      if (!/viewBox=/i.test(text)) {
        const width = /width="([\d.]+)"/i.exec(text)?.[1];
        const height = /height="([\d.]+)"/i.exec(text)?.[1];
        if (width && height) {
          text = text.replace(/<svg\b([^>]*)>/i, `<svg$1 viewBox="0 0 ${width} ${height}">`);
        }
      }
      fs.writeFileSync(destination, text, "utf8");
      ok += 1;
      console.log(`  [OK] ${id} (${text.length} bytes) <- ${remotePath}`);
    } catch (error) {
      console.error(`  [ERRO] ${id}:`, error);
    }
  }
  console.log(`Concluído: ${ok}/${entries.length} mapas salvos.`);
}

downloadAll();
