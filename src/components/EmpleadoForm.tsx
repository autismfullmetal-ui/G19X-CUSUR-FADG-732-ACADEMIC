"use client";

import { useState } from "react";
import { createEmployee } from "@/app/actions";

type Opt = { id: number; name: string };
type Pos = { id: number; title: string };
type Sup = { id: number; firstName: string; lastName: string };

export default function EmpleadoForm({
  departments,
  positions,
  supervisors,
}: {
  departments: Opt[];
  positions: Pos[];
  supervisors: Sup[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
      >
        + Nuevo empleado
      </button>
    );
  }

  return (
    <form
      action={createEmployee}
      className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
    >
      <input name="firstName" placeholder="Nombre" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <input name="lastName" placeholder="Apellidos" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <input name="email" type="email" placeholder="correo@empresa.com" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <select name="departmentId" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
        <option value="">Departamento…</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <select name="positionId" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
        <option value="">Puesto…</option>
        {positions.map((p) => (
          <option key={p.id} value={p.id}>{p.title}</option>
        ))}
      </select>
      <select name="supervisorId" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
        <option value="">Sin supervisor</option>
        {supervisors.map((s) => (
          <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
        ))}
      </select>
      <p className="text-xs text-zinc-400 sm:col-span-2">
        Se creará acceso con la contraseña Demo1234! y rol Empleado.
      </p>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
          Guardar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}
