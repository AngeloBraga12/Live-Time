import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const mode = process.argv[2] === "start" ? "start" : "dev";
const nextArgs = process.argv.slice(3);
const apiUrl = new URL(process.env.F1_LIVETIMING_API_URL || "http://127.0.0.1:3001");
const isLocalApi = ["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname);
const autoStartApi = process.env.F1_LIVETIMING_API_AUTOSTART !== "false" && isLocalApi;
const apiEntries = [
  "node_modules/f1-livetiming-api/src/server.js",
  ".runtime/f1-api/node_modules/f1-livetiming-api/src/server.js",
];
const resolveApiEntry = () => apiEntries.find(existsSync);
const nextEntry = "node_modules/next/dist/bin/next";

if (!existsSync(nextEntry)) {
  console.error("Next.js nao esta instalado. Execute npm install e tente novamente.");
  process.exit(1);
}

let apiProcess;
let siteProcess;
let stopping = false;

function stopChildren(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  if (siteProcess && !siteProcess.killed) siteProcess.kill(signal);
  if (apiProcess && !apiProcess.killed) apiProcess.kill(signal);
}

process.on("SIGINT", () => stopChildren("SIGINT"));
process.on("SIGTERM", () => stopChildren("SIGTERM"));

async function apiIsAlreadyRunning() {
  try {
    const response = await fetch(new URL("/api/status", apiUrl), { signal: AbortSignal.timeout(900) });
    return response.ok;
  } catch {
    return false;
  }
}

if (autoStartApi && !(await apiIsAlreadyRunning())) {
  let apiEntry = resolveApiEntry();
  if (!apiEntry) {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) {
      console.error("Inicie pelo npm para que o site instale f1-livetiming-api automaticamente.");
      process.exit(1);
    }
    console.log("Preparando f1-livetiming-api (primeira inicializacao)...");
    const install = spawnSync(process.execPath, [npmCli, "install", "--prefix", ".runtime/f1-api", "--allow-remote=all", "--no-audit", "--no-fund", "https://github.com/julesr0y/f1-livetiming-api/archive/refs/heads/main.tar.gz"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
    if (install.status !== 0) {
      console.error("Nao foi possivel preparar f1-livetiming-api. Confira a conexao com a internet e tente iniciar novamente.");
      process.exit(install.status ?? 1);
    }
    apiEntry = resolveApiEntry();
  }
  if (!apiEntry) {
    console.error("A instalacao terminou, mas f1-livetiming-api/src/server.js nao foi encontrada.");
    process.exit(1);
  }

  console.log(`Iniciando f1-livetiming-api em ${apiUrl.origin}...`);
  apiProcess = spawn(process.execPath, [apiEntry], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: apiUrl.port || "3001" },
    stdio: "inherit",
  });

  // A API abre o HTTP imediatamente, mesmo enquanto tenta conectar ao feed da F1.
  let apiReady = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (apiProcess.exitCode !== null) {
      console.error("f1-livetiming-api encerrou durante a inicializacao.");
      process.exit(apiProcess.exitCode || 1);
    }
    if (await apiIsAlreadyRunning()) {
      apiReady = true;
      break;
    }
    await delay(300);
  }
  if (!apiReady) {
    console.error(`f1-livetiming-api nao respondeu em ${apiUrl.origin}.`);
    stopChildren();
    process.exit(1);
  }
}

console.log(`Iniciando o site Next.js (${mode})...`);
siteProcess = spawn(process.execPath, [nextEntry, mode, ...nextArgs], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

siteProcess.on("error", (error) => {
  console.error("Nao foi possivel iniciar o Next.js:", error.message);
  stopChildren();
  process.exitCode = 1;
});

siteProcess.on("exit", (code, signal) => {
  stopChildren();
  process.exitCode = code ?? (signal ? 1 : 0);
});

apiProcess?.on("exit", (code) => {
  if (!stopping && code !== 0) {
    console.error(`f1-livetiming-api encerrou (codigo ${code ?? "desconhecido"}).`);
  }
});
