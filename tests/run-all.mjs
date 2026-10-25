#!/usr/bin/env node
/**
 * Orquestador de pruebas E2E — Fase 3 de tests/PLAN-CONVERSION.md
 *
 * - Detecta si el servidor esta corriendo en :3000; si no, lo levanta y lo apaga al final
 * - Ejecuta TODAS las pruebas en orden de dependencia (continua aunque haya fallos)
 * - Veredicto final por codigo de salida (0 = todo paso, 1 = hubo fallos)
 * - Re-ejecuta el seed al final para dejar los datos demo limpios
 *
 * Uso: npm test
 */
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "http://localhost:3000";

// Orden de dependencia (ver PLAN-CONVERSION.md):
// calc no requiere servidor; apply crea la postulacion que consumen plan y rec;
// el resto es independiente. verify-glm-recommendation.ts queda EXCLUIDO (script manual con IA real).
const TESTS = [
  "calc-test.mjs",
  "apply-test.mjs",
  "login-test.mjs",
  "rec-test.mjs",
  "plan-test.mjs",
  "opportunity-dates-test.mjs",
  "opportunity-objective-link-test.mjs",
  "deliverables-and-evaluation-test.mjs",
  "objetivos-desempeno-test.mjs",
  "forced-password-change-test.mjs",
  "perfil-password-test.mjs",
  "importacion-csv-test.mjs",
  "auditoria-test.mjs",
  "theme-and-sidebar-test.mjs",
  "planes-ui-test.mjs",
  "empleados-filters-test.mjs",
  "empleado-form-competency-test.mjs",
  "competency-tooltip-test.mjs",
];

async function serverUp() {
  try {
    const res = await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function startServer() {
  console.log("> No hay servidor en :3000. Levantando servidor de desarrollo...");
  const child = spawn("npm", ["run", "dev"], {
    cwd: ROOT,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await serverUp()) {
      console.log("> Servidor listo.");
      return child;
    }
    if (child.exitCode !== null) {
      throw new Error("El servidor se detuvo inesperadamente durante el arranque.");
    }
    await wait(1000);
  }
  killTree(child);
  throw new Error("Timeout: el servidor no respondio en 120 segundos.");
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { shell: true });
  } else {
    child.kill("SIGTERM");
  }
}

function runTest(file) {
  console.log(`\n---------- > ${file} ----------`);
  // Node 24 ejecuta TypeScript de forma nativa (type stripping); no se requiere tsx
  const r = spawnSync(process.execPath, [path.join("tests", file)], {
    cwd: ROOT,
    stdio: "inherit",
  });
  const ok = r.status === 0;
  console.log(ok ? `[PASO] ${file}` : `[FALLO] ${file} (exit ${r.status ?? "?"})`);
  return { file, ok };
}

function runSeed(label) {
  console.log(`\n> ${label}: ejecutando seed (node prisma/seed.ts)...`);
  const r = spawnSync(process.execPath, [path.join("prisma", "seed.ts")], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (r.status !== 0) console.error("! El seed reporto problemas (exit " + r.status + ")");
}

// ---------- Programa principal ----------
let serverChild = null;
const results = [];
let failed = false;

try {
  if (await serverUp()) {
    console.log("> Servidor ya corriendo en :3000 (se reutiliza y no se apaga).");
  } else {
    serverChild = await startServer();
  }

  for (const file of TESTS) {
    const r = runTest(file);
    results.push(r);
    if (!r.ok) failed = true;
  }
} catch (err) {
  console.error("\n[ERROR DEL RUNNER]", err.message);
  failed = true;
} finally {
  killTree(serverChild);
  runSeed("Restaurando datos demo");
}

console.log("\n============ VEREDICTO ============");
for (const r of results) console.log(`${r.ok ? "PASO " : "FALLO"}  ${r.file}`);
const passed = results.filter((r) => r.ok).length;
console.log(`\nResultado: ${passed}/${TESTS.length} pruebas pasaron.`);
console.log(failed ? "VEREDICTO: FALLO (exit 1)" : "VEREDICTO: EXITO (exit 0)");
process.exit(failed ? 1 : 0);
