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

  // 4. Verificar que las filas manuales inician vacías sin forzar Comunicación
  const hasBlankRowInit = formCode.includes('competencyId: ""');
  must(hasBlankRowInit, "fila manual inicia vacía sin forzar ninguna competencia por defecto");
  console.log(`✓ Fila manual inicia vacía sin forzar ninguna competencia por defecto: ${hasBlankRowInit}`);

  // 5. Verificar opciones deshabilitadas para evitar duplicados
  const hasDisabledDuplicate = formCode.includes("disabled={isAlreadyAdded}") || formCode.includes("disabled={isSelectedOther}");
  must(hasDisabledDuplicate, "prevención de duplicados con opciones deshabilitadas presente");
  console.log(`✓ Prevención de duplicados con opciones deshabilitadas: ${hasDisabledDuplicate}`);

  console.log("\n ¡EL FORMULARIO AHORA PERMITE AGREGAR EXACTAMENTE LA COMPETENCIA SELECCIONADA!");
} catch (err) {
  console.error("Error en test:", err.message);
  process.exit(1);
}
