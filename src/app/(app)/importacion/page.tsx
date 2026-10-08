import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { importEmployeesCsv, importCompetenciesCsv } from "@/app/actions";

export default async function ImportacionPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; created?: string; skipped?: string }>;
}) {
  const session = await requireSession();
  const puedeImportar = ["ADMIN", "RH"].includes(session.user.role);

  if (!puedeImportar) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <h2 className="text-base font-semibold">Acceso Restringido</h2>
        <p className="mt-1 text-xs">
          El módulo de importación masiva de datos está reservado exclusivamente para Recursos Humanos y Administradores.
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const { ok, error, created, skipped } = await searchParams;

  const [totalEmployees, totalDepartments, totalPositions, totalCompetencies] = await Promise.all([
    db.employee.count(),
    db.department.count(),
    db.position.count(),
    db.competency.count(),
  ]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Importación Masiva de Datos
            </h1>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white">
              RF-027 / OE-18
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Carga ágil de nómina, estructura organizacional y catálogo de competencias mediante archivos CSV estandarizados.
          </p>
        </div>
      </div>

      {/* Alertas de resultado */}
      {ok === "empleados" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 space-y-1">
          <p className="font-bold text-sm">✓ Importación de personal finalizada con éxito</p>
          <p>
            Se crearon y activaron <strong>{created ?? 0} colaboradores</strong> con sus respectivas cuentas de usuario.
            {Number(skipped) > 0 && ` (${skipped} filas omitidas por correo duplicado o datos incompletos).`}
          </p>
        </div>
      )}

      {ok === "competencias" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 space-y-1">
          <p className="font-bold text-sm">✓ Importación de competencias finalizada con éxito</p>
          <p>
            Se agregaron <strong>{created ?? 0} nuevas competencias</strong> al catálogo corporativo.
            {Number(skipped) > 0 && ` (${skipped} omitidas por existir previamente).`}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <p className="font-bold text-sm">No se pudo completar la importación</p>
          <p className="mt-1">
            {error === "archivo_vacio" && "Debes seleccionar un archivo CSV válido y no vacío."}
            {error === "sin_datos" && "El archivo contiene cabeceras pero no incluye filas de datos a procesar."}
            {error === "cabeceras_invalidas" &&
              "Las cabeceras del archivo no coinciden con el formato requerido. Por favor descarga la plantilla oficial."}
          </p>
        </div>
      )}

      {/* Métricas actuales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Empleados</span>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{totalEmployees}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Departamentos</span>
          <p className="mt-1 text-2xl font-bold text-blue-600">{totalDepartments}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Puestos</span>
          <p className="mt-1 text-2xl font-bold text-purple-600">{totalPositions}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Competencias</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{totalCompetencies}</p>
        </div>
      </div>

      {/* Tarjetas de Carga */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tarjeta 1: Empleados */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Personal y Estructura Organizacional</h2>
                  <p className="text-xs text-zinc-500">Carga masiva de colaboradores, áreas y puestos</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50 p-3.5 text-xs text-zinc-600 border border-zinc-100 space-y-2">
              <p className="font-semibold text-zinc-800">Formato y Columnas Requeridas:</p>
              <div className="flex flex-wrap gap-1 font-mono text-[11px] text-zinc-700">
                <span className="bg-white border rounded px-1.5 py-0.5 font-bold">nombre*</span>
                <span className="bg-white border rounded px-1.5 py-0.5">apellidos</span>
                <span className="bg-white border rounded px-1.5 py-0.5 font-bold">email*</span>
                <span className="bg-white border rounded px-1.5 py-0.5">departamento</span>
                <span className="bg-white border rounded px-1.5 py-0.5">puesto</span>
                <span className="bg-white border rounded px-1.5 py-0.5">rol</span>
                <span className="bg-white border rounded px-1.5 py-0.5">supervisor_email</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                * Genera automáticamente las credenciales de acceso iniciales (contraseña por defecto:{" "}
                <code className="bg-white px-1 rounded text-zinc-700 font-mono">Demo1234!</code>).
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700">Paso 1: Obtener Plantilla</span>
              <a
                href="/api/templates/empleados"
                download="plantilla_empleados.csv"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-2xs"
              >
                <span>Descargar CSV Ejemplo</span>
              </a>
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-700 block mb-1.5">
                Paso 2: Subir Archivo Diligenciado
              </span>
              <form action={importEmployeesCsv} className="space-y-3">
                <input
                  type="file"
                  name="file"
                  accept=".csv,text/csv"
                  required
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 file:cursor-pointer cursor-pointer border border-zinc-200 rounded-xl p-2 bg-zinc-50/50"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer text-center"
                >
                  Procesar e Importar Personal
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Competencias */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Catálogo de Competencias</h2>
                  <p className="text-xs text-zinc-500">Carga masiva de habilidades técnicas y blandas</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50 p-3.5 text-xs text-zinc-600 border border-zinc-100 space-y-2">
              <p className="font-semibold text-zinc-800">Formato y Columnas Requeridas:</p>
              <div className="flex flex-wrap gap-1 font-mono text-[11px] text-zinc-700">
                <span className="bg-white border rounded px-1.5 py-0.5 font-bold">nombre*</span>
                <span className="bg-white border rounded px-1.5 py-0.5">descripcion</span>
                <span className="bg-white border rounded px-1.5 py-0.5 font-bold">tipo*</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                * El tipo debe ser <code className="bg-white px-1 rounded text-zinc-700 font-mono">TECNICA</code> o{" "}
                <code className="bg-white px-1 rounded text-zinc-700 font-mono">BLANDA</code>. Se inicializan en estado
                Activo listas para asignación y evaluación.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700">Paso 1: Obtener Plantilla</span>
              <a
                href="/api/templates/competencias"
                download="plantilla_competencias.csv"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-2xs"
              >
                <span>Descargar CSV Ejemplo</span>
              </a>
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-700 block mb-1.5">
                Paso 2: Subir Archivo Diligenciado
              </span>
              <form action={importCompetenciesCsv} className="space-y-3">
                <input
                  type="file"
                  name="file"
                  accept=".csv,text/csv"
                  required
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 file:cursor-pointer cursor-pointer border border-zinc-200 rounded-xl p-2 bg-zinc-50/50"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer text-center"
                >
                  Procesar e Importar Competencias
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
