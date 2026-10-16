// Sobe o site Next.js e a f1-livetiming-api como um único serviço.
//
//   node scripts/run-site.mjs dev    -> desenvolvimento
//   node scripts/run-site.mjs start  -> produção (requer `npm run build`)
//
// A API é uma dependência do projeto (node_modules/f1-livetiming-api). Este
// script a inicia, espera ela responder, reinicia se ela cair e também se ela
// ficar desconectada do feed da F1 por tempo demais. Nada precisa ser iniciado
// manualmente.
//
// Variáveis de ambiente (todas opcionais):
//   PORT                              porta pública do site (padrão 3000)
//   F1_LIVETIMING_API_URL             API externa. Se apontar para outro host, a API
//                                     local NÃO é iniciada
//   F1_LIVETIMING_API_PORT            porta interna da API local (padrão 3001)
//   F1_LIVETIMING_API_AUTOSTART       "false" para nunca iniciar a API local
//   F1_LIVETIMING_WATCHDOG_MINUTES    minutos desconectada antes de reiniciar a API
//                                     (padrão 5; 0 desativa)

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const mode = process.argv[2] === "start" ? "start" : "dev";
const extraNextArgs = process.argv.slice(3);
const sitePort = Number(process.env.PORT) || 3000;

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]"];
const configuredUrl = process.env.F1_LIVETIMING_API_URL?.trim();
const apiUrl = new URL(configuredUrl || `http://127.0.0.1:${process.env.F1_LIVETIMING_API_PORT || 3001}`);
const isLocalApi = LOCAL_HOSTS.includes(apiUrl.hostname);
const autoStartApi = process.env.F1_LIVETIMING_API_AUTOSTART !== "false" && isLocalApi;

if (autoStartApi) {
  if (!apiUrl.port) apiUrl.port = "3001";
  // A API nunca pode disputar a porta pública do site.
  if (Number(apiUrl.port) === sitePort) apiUrl.port = String(sitePort + 1);
}

const apiEntry = "node_modules/f1-livetiming-api/src/server.js";
const nextEntry = "node_modules/next/dist/bin/next";
const watchdogMinutes = Number(process.env.F1_LIVETIMING_WATCHDOG_MINUTES ?? 5);
const watchdogMs = Number.isFinite(watchdogMinutes) && watchdogMinutes > 0 ? watchdogMinutes * 60_000 : 0;

const log = (message) => console.log(`[site] ${message}`);
const warn = (message) => console.warn(`[site] ${message}`);

if (!existsSync(nextEntry)) {
  console.error("Next.js não está instalado. Execute `npm install` e tente novamente.");
  process.exit(1);
}
if (autoStartApi && !existsSync(apiEntry)) {
  console.error("f1-livetiming-api não está instalada. Execute `npm install` (ela é dependência do projeto).");
  process.exit(1);
}

let stopping = false;
let apiProcess = null;
let siteProcess = null;
let apiStartedAt = 0;
let restartDelayMs = 1_000;
let restartTimer = null;

async function readApiStatus(timeoutMs = 3_000) {
  try {
    const response = await fetch(new URL("/api/status", apiUrl), { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return { reachable: false, connected: false };
    const body = await response.json().catch(() => ({}));
    const connected = body?.isConnected === true || String(body?.status ?? "").toUpperCase() === "CONNECTED";
    return { reachable: true, connected };
  } catch {
    return { reachable: false, connected: false };
  }
}

function startApi() {
  if (stopping || apiProcess) return;
  apiStartedAt = Date.now();
  log(`Iniciando f1-livetiming-api em ${apiUrl.origin}...`);
  const child = spawn(process.execPath, [apiEntry], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: apiUrl.port },
    stdio: "inherit",
  });
  apiProcess = child;

  child.on("error", (error) => warn(`Falha ao executar a API: ${error.message}`));
  child.on("exit", (code, signal) => {
    if (apiProcess === child) apiProcess = null;
    if (stopping) return;
    // Execução estável por mais de 1 min zera o backoff.
    if (Date.now() - apiStartedAt > 60_000) restartDelayMs = 1_000;
    warn(`f1-livetiming-api encerrou (${signal ?? `código ${code ?? "?"}`}). Reiniciando em ${Math.round(restartDelayMs / 1000)}s...`);
    restartTimer = setTimeout(startApi, restartDelayMs);
    restartDelayMs = Math.min(restartDelayMs * 2, 30_000);
  });
}

function restartApi(reason) {
  const child = apiProcess;
  if (!child) return;
  warn(`Reiniciando f1-livetiming-api: ${reason}`);
  child.kill("SIGTERM");
  // Se o processo ignorar o SIGTERM (travado), força o encerramento.
  setTimeout(() => { if (apiProcess === child) child.kill("SIGKILL"); }, 5_000).unref();
}

function startWatchdog() {
  if (!watchdogMs) return;
  let disconnectedSince = null;
  let lastRestartAt = 0;
  setInterval(async () => {
    if (stopping || !apiProcess) return;
    const { connected } = await readApiStatus();
    if (connected) { disconnectedSince = null; return; }
    disconnectedSince ??= Date.now();
    const now = Date.now();
    if (now - disconnectedSince >= watchdogMs && now - lastRestartAt >= watchdogMs) {
      lastRestartAt = now;
      disconnectedSince = null;
      restartApi(`sem conexão com o feed da F1 há ${watchdogMinutes} min`);
    }
  }, 15_000).unref();
}

function shutdown(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  clearTimeout(restartTimer);
  siteProcess?.kill(signal);
  apiProcess?.kill(signal);
  // Garante a saída mesmo que algum filho não responda.
  setTimeout(() => process.exit(process.exitCode ?? 0), 10_000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

async function main() {
  if (autoStartApi) {
    if (await readApiStatus(900).then((s) => s.reachable)) {
      log(`API já está em execução em ${apiUrl.origin}; reutilizando.`);
    } else {
      startApi();
      // A API abre o HTTP logo de início, mesmo antes de conectar ao feed da F1.
      let ready = false;
      for (let attempt = 0; attempt < 50 && !stopping; attempt += 1) {
        if ((await readApiStatus(900)).reachable) { ready = true; break; }
        await delay(300);
      }
      if (!ready) warn("A API ainda não respondeu; o site sobe mesmo assim e o supervisor continua tentando.");
    }
    startWatchdog();
  } else {
    log(`Usando API externa em ${apiUrl.origin} (nenhuma API local será iniciada).`);
  }

  const nextArgs = mode === "start"
    ? ["start", "-p", String(sitePort), "-H", "0.0.0.0", ...extraNextArgs]
    : ["dev", ...extraNextArgs];

  log(`Iniciando o site Next.js (${mode}) na porta ${sitePort}...`);
  siteProcess = spawn(process.execPath, [nextEntry, ...nextArgs], {
    cwd: process.cwd(),
    // O site sempre enxerga a API pelo mesmo endereço que o supervisor usa.
    env: { ...process.env, F1_LIVETIMING_API_URL: apiUrl.origin },
    stdio: "inherit",
  });
  siteProcess.on("error", (error) => {
    console.error("Não foi possível iniciar o Next.js:", error.message);
    process.exitCode = 1;
    shutdown();
  });
  siteProcess.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
    shutdown();
  });
}

await main();
