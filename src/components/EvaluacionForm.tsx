"use client";

import { useState } from "react";
import { createEvaluation } from "@/app/actions";

type Emp = { id: number; firstName: string; lastName: string; departmentId?: number | null };
type Comp = { id: number; name: string; type?: string };
type Obj = {
  id: number;
  title: string;
  category: string;
  targetValue: number;
  unit: string;
  weight: number;
  departmentId: number | null;
};

export default function EvaluacionForm({
  employees,
  competencies,
  objectives = [],
  initialEmployeeId,
  initialType = "INICIAL",
  initialOpen = false,
  returnTo,
}: {
  employees: Emp[];
  competencies: Comp[];
  objectives?: Obj[];
  initialEmployeeId?: number;
  initialType?: "INICIAL" | "POST_CAPACITACION";
  initialOpen?: boolean;
  returnTo?: string;
}) {
  const [open, setOpen] = useState(initialOpen || Boolean(initialEmployeeId));
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(initialEmployeeId ?? null);
  const [evaluationType, setEvaluationType] = useState<string>(initialType);
  const [activeTab, setActiveTab] = useState<"competencias" | "objetivos">("competencias");

  const selectedEmp = employees.find((e) => e.id === selectedEmpId);
  const applicableObjectives = objectives.filter(
    (o) => !o.departmentId || (selectedEmp?.departmentId && o.departmentId === selectedEmp.departmentId)
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5"
      >
        <span>+</span>
        <span>Nueva evaluación</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">Registrar Evaluación Integral</h2>
          <p className="text-xs text-zinc-500">
            Evalúa el dominio de competencias (RF-006) y el cumplimiento de objetivos de desempeño (RF-007).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-zinc-400 hover:text-zinc-600 text-xs px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer"
        >
          Cerrar ✕
        </button>
      </div>

      <form action={createEvaluation} className="space-y-4">
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Colaborador a Evaluar *
            </label>
            <select
              name="employeeId"
              required
              defaultValue={selectedEmpId ?? ""}
              onChange={(e) => setSelectedEmpId(Number(e.target.value) || null)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="">Selecciona colaborador…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Tipo de Evaluación
            </label>
            <select
              name="type"
              defaultValue={evaluationType}
              onChange={(e) => setEvaluationType(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="INICIAL">Evaluación Diagnóstica Inicial</option>
              <option value="POST_CAPACITACION">Re-evaluación Post-Capacitación</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Observaciones Globales (Opcional)
            </label>
            <input
              name="comment"
              placeholder="Comentario general de desempeño..."
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
        </div>

        {evaluationType === "POST_CAPACITACION" && (
          <div className="rounded-xl border border-red-900/60 bg-gradient-to-r from-red-950/40 via-[#181116] to-[#121118] px-4 py-3 text-xs text-rose-200">
            <div className="flex items-center gap-2 font-bold text-rose-100">
              <span>🎯</span>
              <span>Re-evaluación Post-Capacitación (Hito Final de Certificación)</span>
            </div>
            <p className="mt-1 text-zinc-300 leading-relaxed">
              Registra los niveles demostrados tras el plan formativo. Si el colaborador alcanza el nivel requerido en sus competencias con brecha, se marcarán como <strong>✓ Brecha Superada</strong> y la compatibilidad para el puesto ascenderá al <strong>100%</strong>.
            </p>
          </div>
        )}

        {/* Pestañas de Secciones */}
        <div className="flex border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("competencias")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition cursor-pointer ${
              activeTab === "competencias"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            ⭐ 1. Competencias (RF-006) ({competencies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("objetivos")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition cursor-pointer ${
              activeTab === "objetivos"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            🎯 2. Objetivos de Desempeño (RF-007) ({applicableObjectives.length})
          </button>
        </div>

        {/* Sección 1: Competencias */}
        {activeTab === "competencias" && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700">
                Matriz de Niveles de Dominio (Escala 1 al 5)
              </span>
              <span className="text-[11px] text-zinc-400">1: Básico · 3: Intermedio · 5: Experto</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {competencies.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs shadow-2xs"
                >
                  <span className="font-medium text-zinc-800 truncate" title={c.name}>
                    {c.name}
                  </span>
                  <select
                    name={`level_${c.id}`}
                    defaultValue="3"
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-800 bg-zinc-50 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        Nivel {n}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección 2: Objetivos Organizacionales */}
        {activeTab === "objetivos" && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700">
                Cumplimiento de Metas y Objetivos Organizacionales
              </span>
              <span className="text-[11px] text-zinc-400">
                Registra el avance cuantitativo y la calificación del colaborador
              </span>
            </div>

            {applicableObjectives.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">
                No hay objetivos organizacionales activos aplicables a este colaborador.
              </p>
            ) : (
              <div className="space-y-3">
                {applicableObjectives.map((obj) => (
                  <div
                    key={obj.id}
                    className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <span className="font-bold text-xs text-zinc-900">{obj.title}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                          <span>Categoría: {obj.category}</span>
                          <span>•</span>
                          <span>
                            Meta: {obj.targetValue} {obj.unit}
                          </span>
                          <span>•</span>
                          <span>Peso: {obj.weight}/5</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-medium text-zinc-600">Alcanzado:</label>
                          <input
                            type="number"
                            step="any"
                            name={`obj_val_${obj.id}`}
                            placeholder={String(obj.targetValue)}
                            className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-900 text-right focus:outline-none focus:ring-1 focus:ring-zinc-900"
                          />
                          <span className="text-xs text-zinc-500">{obj.unit}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-medium text-zinc-600">Calificación:</label>
                          <select
                            name={`obj_rating_${obj.id}`}
                            defaultValue="3"
                            className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-800 bg-zinc-50 focus:outline-none"
                          >
                            <option value="1">1 - Insuficiente</option>
                            <option value="2">2 - Regular / En desarrollo</option>
                            <option value="3">3 - Cumplido / Aceptable</option>
                            <option value="4">4 - Sobresaliente</option>
                            <option value="5">5 - Excepcional</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <input
                      name={`obj_feedback_${obj.id}`}
                      placeholder="Retroalimentación específica sobre el cumplimiento de este objetivo..."
                      className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-zinc-100">
          <p className="text-[11px] text-zinc-400">
            Al guardar, se consolidan las competencias (RF-006) y se actualizan los indicadores de metas (RF-007).
          </p>

          <div className="flex items-center gap-2 self-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
            >
              Guardar y Finalizar Evaluación
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
