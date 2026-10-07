"use client";

import { useState } from "react";

export default function LoginFormCard({
  error,
  action,
}: {
  error?: string;
  action: (formData: FormData) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="w-full max-w-sm sm:max-w-[400px] rounded-3xl border border-white/20 bg-black/40 p-8 sm:p-10 shadow-2xl shadow-black/80 backdrop-blur-2xl ring-1 ring-white/10 transition-all">
      {/* Encabezado */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
          Welcome
        </h1>
        <p className="mt-1.5 text-xs font-medium uppercase tracking-widest text-white/60">
          Plataforma PDP
        </p>
      </div>

      {/* Formulario de acceso */}
      <form
        action={action}
        onSubmit={() => setIsSubmitting(true)}
        className="mt-7 space-y-4"
      >
        {/* Campo Email */}
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="glass-input w-full rounded-full border border-white/20 px-5 py-3.5 text-sm font-medium text-white placeholder-white/50 outline-none transition-all focus:border-white/50 focus:ring-2 focus:ring-white/20"
          />
        </div>

        {/* Campo Password */}
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="glass-input w-full rounded-full border border-white/20 pl-5 pr-12 py-3.5 text-sm font-medium text-white placeholder-white/50 outline-none transition-all focus:border-white/50 focus:ring-2 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mensaje de error si falla la autenticación */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-center text-xs font-medium text-red-200 backdrop-blur-md">
            Credenciales no válidas. Por favor intenta de nuevo.
          </div>
        )}

        {/* Botón LOGIN con estilo del screenshot (vino/borgoña redondeado) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-to-r from-[#7a1c3d] via-[#8f224a] to-[#5c132c] py-3.5 text-xs sm:text-sm font-bold tracking-widest text-white uppercase shadow-lg shadow-[#7a1c3d]/40 transition-all hover:from-[#92254b] hover:to-[#6f1937] hover:shadow-[#8f224a]/50 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
        >
          {isSubmitting ? "Accediendo..." : "LOGIN"}
        </button>
      </form>
    </div>
  );
}
