"use client";

import { useState, useTransition } from "react";
import { generateRecommendation } from "@/app/actions";

interface Props {
  applicationId: number;
  isRegenerate?: boolean;
  className?: string;
}

export default function GenerateRecommendationButton({
  applicationId,
  isRegenerate = false,
  className,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleAction = async (formData: FormData) => {
    setStatusMessage("Consultando IA (GLM)... Analizando brechas y estructurando actividades.");
    startTransition(async () => {
      try {
        await generateRecommendation(formData);
      } catch (err: any) {
        // NEXT_REDIRECT is thrown by redirect(), which is normal in Next.js Server Actions
        if (err?.message?.includes("NEXT_REDIRECT")) {
          return;
        }
        console.error("Error al generar recomendación:", err);
        setStatusMessage("Ocurrió un error. Intenta de nuevo.");
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={handleAction}>
        <input type="hidden" name="applicationId" value={applicationId} />
        <button
          type="submit"
          disabled={isPending}
          className={
            className ||
            (isRegenerate
              ? "rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              : "rounded-xl bg-gradient-to-r from-[#8c2534] via-[#9e2b3c] to-[#b13547] hover:from-[#9d2c3c] hover:to-[#be4b5b] border border-red-700/60 px-4 py-2.5 text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2")
          }
        >
          {isPending ? (
            <>
              <svg
                className="h-3.5 w-3.5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Generando con IA...</span>
            </>
          ) : (
            <>
              <span>
                {isRegenerate
                  ? "Regenerar recomendación"
                  : "Generar recomendación con IA"}
              </span>
            </>
          )}
        </button>
      </form>

      {isPending && (
        <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-[#161219] px-3 py-1.5 text-[11px] text-zinc-300 shadow-sm animate-pulse">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
          <span>
            {statusMessage ||
              "Procesando con IA (GLM)... La página se actualizará automáticamente."}
          </span>
        </div>
      )}
    </div>
  );
}
