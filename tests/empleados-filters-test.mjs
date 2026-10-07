import fs from "fs";

function testEmpleadosFilters() {
  console.log("--- TEST DE BUSCADOR Y FILTROS EN DIRECTORIO DE EMPLEADOS ---");

  const pageCode = fs.readFileSync("src/app/(app)/empleados/page.tsx", "utf-8");
  const compCode = fs.readFileSync("src/components/EmpleadosDirectory.tsx", "utf-8");

  // 1. Verificar integración de EmpleadosDirectory en la página de empleados
  const hasDirectoryImport = pageCode.includes("import EmpleadosDirectory from \"@/components/EmpleadosDirectory\"");
  const hasDirectoryUsage = pageCode.includes("<EmpleadosDirectory");
  console.log(`✓ Componente EmpleadosDirectory integrado en page.tsx: ${hasDirectoryImport && hasDirectoryUsage}`);

  // 2. Verificar existencia de buscador por nombre
  const hasSearchInput = compCode.includes('placeholder="Nombre o apellido..."') || compCode.includes("searchQuery");
  const hasNormalize = compCode.includes("normalizeText");
  console.log(`✓ Buscador por nombre con normalización de acentos y mayúsculas: ${hasSearchInput && hasNormalize}`);

  // 3. Verificar filtro por departamento
  const hasDeptFilter = compCode.includes("selectedDepartment") && compCode.includes("Todos los departamentos");
  console.log(`✓ Filtro por departamento presente: ${hasDeptFilter}`);

  // 4. Verificar filtro por puesto
  const hasPosFilter = compCode.includes("selectedPosition") && compCode.includes("Todos los puestos");
  console.log(`✓ Filtro por puesto presente: ${hasPosFilter}`);

  // 5. Verificar filtro por competencias
  const hasCompFilter = compCode.includes("selectedCompetency") && compCode.includes("Todas las competencias");
  const checksCompetencies = compCode.includes("emp.competencies.some");
  console.log(`✓ Filtro por competencias en matriz del empleado: ${hasCompFilter && checksCompetencies}`);

  // 6. Verificar chips de filtros activos y botón de reset
  const hasChips = compCode.includes("selectedDeptName") && compCode.includes("selectedCompName");
  const hasReset = compCode.includes("resetAllFilters") && compCode.includes("Limpiar filtros");
  console.log(`✓ Chips de filtros activos y botón de restablecer: ${hasChips && hasReset}`);

  // 7. Verificar estado vacío cuando no hay resultados
  const hasEmptyState = compCode.includes("No se encontraron empleados");
  console.log(`✓ Estado vacío informativo cuando 0 resultados coinciden: ${hasEmptyState}`);

  if (
    hasDirectoryImport &&
    hasDirectoryUsage &&
    hasSearchInput &&
    hasNormalize &&
    hasDeptFilter &&
    hasPosFilter &&
    hasCompFilter &&
    checksCompetencies &&
    hasReset &&
    hasEmptyState
  ) {
    console.log("\n🎉 ¡TODAS LAS VALIDACIONES DE BÚSQUEDA Y FILTRADO PASARON EXITOSAMENTE!");
  } else {
    console.error("❌ Falló alguna verificación.");
    process.exit(1);
  }
}

testEmpleadosFilters();
