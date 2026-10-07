import fs from "fs";

function testEmpleadoFormCompetencySelection() {
  console.log("--- TEST DE SELECCIÓN ESPECÍFICA DE COMPETENCIAS EN EMPLEADOFORM ---");

  const formCode = fs.readFileSync("src/components/EmpleadoForm.tsx", "utf-8");

  // 1. Verificar que se eliminó el auto-select de la primera competencia (firstUnused que ponía Comunicación)
  const hasFirstUnusedAutoSelect = formCode.includes("const firstUnused = competencies.find");
  console.log(`✓ Eliminado auto-select forzado de la primera competencia (firstUnused): ${!hasFirstUnusedAutoSelect}`);

  // 2. Verificar que existe selector específico de competencia a agregar
  const hasCompToAdd = formCode.includes("compToAdd") && formCode.includes("handleAddSelected");
  console.log(`✓ Selector específico de competencia a agregar presente: ${hasCompToAdd}`);

  // 3. Verificar que existen chips rápidos de selección directa
  const hasDirectChips = formCode.includes("handleAddDirect") && formCode.includes("availableCompetencies");
  console.log(`✓ Chips rápidos de selección directa por competencia: ${hasDirectChips}`);

  // 4. Verificar que las filas manuales inician vacías sin forzar Comunicación
  const hasBlankRowInit = formCode.includes('competencyId: ""');
  console.log(`✓ Fila manual inicia vacía sin forzar ninguna competencia por defecto: ${hasBlankRowInit}`);

  // 5. Verificar opciones deshabilitadas para evitar duplicados
  const hasDisabledDuplicate = formCode.includes("disabled={isAlreadyAdded}") || formCode.includes("disabled={isSelectedOther}");
  console.log(`✓ Prevención de duplicados con opciones deshabilitadas: ${hasDisabledDuplicate}`);

  if (!hasFirstUnusedAutoSelect && hasCompToAdd && hasDirectChips && hasBlankRowInit) {
    console.log("\n🎉 ¡EL FORMULARIO AHORA PERMITE AGREGAR EXACTAMENTE LA COMPETENCIA SELECCIONADA!");
  } else {
    console.error("❌ Falló alguna verificación en el formulario.");
    process.exit(1);
  }
}

testEmpleadoFormCompetencySelection();
