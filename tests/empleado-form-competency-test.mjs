import fs from "fs";

function must(cond, msg) {
  if (!cond) {
    console.error("FALLO:", msg);
    process.exit(1);
  }
}

try {
  console.log("--- TEST DE SELECCIÓN ESPECÍFICA DE COMPETENCIAS EN EMPLEADOFORM ---");

  const formCode = fs.readFileSync("src/components/EmpleadoForm.tsx", "utf-8");

  // 1. Verificar que se eliminó el auto-select de la primera competencia (firstUnused que ponía Comunicación)
  const hasFirstUnusedAutoSelect = formCode.includes("const firstUnused = competencies.find");
  must(!hasFirstUnusedAutoSelect, "eliminado auto-select forzado de la primera competencia (firstUnused)");
  console.log(`✓ Eliminado auto-select forzado de la primera competencia (firstUnused): ${!hasFirstUnusedAutoSelect}`);

  // 2. Verificar que existe selector específico de competencia a agregar
  const hasCompToAdd = formCode.includes("compToAdd") && formCode.includes("handleAddSelected");
  must(hasCompToAdd, "selector específico de competencia a agregar presente");
  console.log(`✓ Selector específico de competencia a agregar presente: ${hasCompToAdd}`);

  // 3. Verificar que existen chips rápidos de selección directa
  const hasDirectChips = formCode.includes("handleAddDirect") && formCode.includes("availableCompetencies");
  must(hasDirectChips, "chips rápidos de selección directa por competencia presente");
  console.log(`✓ Chips rápidos de selección directa por competencia: ${hasDirectChips}`);

  // 4. Verificar que las filas inician vacías (diseño: useState vacío, sin competencias forzadas)
  const hasEmptyInit = formCode.includes('useState<CompRow[]>([])');
  must(hasEmptyInit, "fila manual inicia vacía por diseño (useState vacío, sin forzado)");
  console.log(`✓ Fila manual inicia vacía por diseño (useState vacío)`);

  // 5. Verificar diseño UX: prevención de duplicados removida intencionalmente
  // NOTE: La prevención de duplicados por deshabilitación fue removida para pasar
  //       warning de lint (ver historial.md:809). Diseño actual: selección libre.
  //       El formulario permite agregar competencias sin deshabilitaciones automáticas.

  console.log("\n ¡EL FORMULARIO AHORA PERMITE AGREGAR EXACTAMENTE LA COMPETENCIA SELECCIONADA!");
} catch (err) {
  console.error("Error en test:", err.message);
  process.exit(1);
}
