import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { changePassword } from "@/app/actions";

export const metadata = {
  title: "Cambiar contraseña temporal | PDP",
};

const ERRORS: Record<string, string> = {
  actual_incorrecta: "La contraseña temporal ingresada es incorrecta.",
  longitud_minima: "La nueva contraseña debe tener al menos 6 caracteres.",
  coincidencia: "La confirmación no coincide con la nueva contraseña.",
  campos_requeridos: "Debes completar todos los campos.",
  misma_clave: "La nueva contraseña debe ser distinta de la clave temporal.",
};

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-[#0c0c11] px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#ad4251]/40 focus:border-[#ad4251]";

/**
 * Pantalla obligatoria de primer ingreso.
 * Vive fuera del grupo (app) para que el layout principal pueda redirigir
 * aquí sin entrar en un ciclo de redirecciones.
 */
export default async function CambiarContrasenaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const { error } = await searchParams;

  const user = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { mustChangePassword: true },
  });
  // Si ya no tiene clave temporal pendiente, no hay nada que hacer aquí
  if (!user?.mustChangePassword) redirect("/dashboard");

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-[#121217] p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="space-y-1.5">
          <span className="inline-block rounded-full border border-red-900/60 bg-red-950/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e07a88]">
            Primer ingreso
          </span>
          <h1 className="text-xl font-bold tracking-tight">Define tu contraseña personal</h1>
          <p className="text-sm text-zinc-400">
            Hola {session.user.name}. Tu cuenta usa una contraseña temporal asignada por Recursos Humanos.
            Por seguridad, debes reemplazarla antes de continuar.
          </p>
        </div>

        {error && ERRORS[error] && (
          <div
            role="alert"
            className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2.5 text-xs font-semibold text-[#f0a3ad]"
          >
            {ERRORS[error]}
          </div>
        )}

        <form action={changePassword} className="space-y-4">
          <input type="hidden" name="origen" value="forzado" />

          <div>
            <label htmlFor="currentPassword" className="block text-xs font-semibold text-zinc-300 mb-1">
              Contraseña temporal
            </label>
            <input
              id="currentPassword"
              type="password"
              name="currentPassword"
              required
              autoComplete="current-password"
              placeholder="La que te proporcionó RH"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-xs font-semibold text-zinc-300 mb-1">
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-zinc-300 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Repite la nueva contraseña"
              className={inputClass}
            />
          </div>

          <button
            id="submit-new-password"
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-[#8c2534] to-[#ad4251] hover:from-[#9d2c3c] hover:to-[#be4b5b] border border-red-700/60 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_14px_rgba(173,66,81,0.25)] transition cursor-pointer"
          >
            Guardar y continuar
          </button>
        </form>

        <form action={handleSignOut} className="text-center">
          <button
            id="signout-forced-change"
            type="submit"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
