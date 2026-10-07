"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export const DEFAULT_BACKGROUNDS = [
  "/backgrounds/bg1.jpg",
  "/backgrounds/bg2.jpg",
  "/backgrounds/bg3.jpg",
];

export default function LoginBackgroundSlideshow({
  children,
  backgrounds = DEFAULT_BACKGROUNDS,
}: {
  children: React.ReactNode;
  backgrounds?: string[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (backgrounds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgrounds.length);
    }, 8000); // Cambia cada 8 segundos
    return () => clearInterval(interval);
  }, [backgrounds.length]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 font-sans">
      {/* Contenedor de capas de imágenes de fondo con transición suave */}
      <div className="absolute inset-0 z-0">
        {backgrounds.map((bg, idx) => (
          <div
            key={bg}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
            } transition-transform duration-[8000ms]`}
          >
            {/* Imagen optimizada de fondo */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bg})` }}
            />
          </div>
        ))}

        {/* Capa de viñeta y gradiente para contraste del formulario en el lado izquierdo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/30 backdrop-brightness-[0.9]" />
        {/* Gradiente vertical sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>

      {/* Contenido principal alineado a la izquierda */}
      <main className="relative z-10 flex min-h-screen w-full items-center justify-start px-4 sm:px-10 md:px-16 lg:px-24 py-12">
        {children}
      </main>

      {/* Controles de fondos interactivos en la esquina inferior derecha */}
      {backgrounds.length > 1 && (
        <div className="absolute bottom-5 right-6 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-md">
          <span className="text-[11px] font-medium text-white/70">
            Fondo {currentIndex + 1}/{backgrounds.length}
          </span>
          <div className="flex items-center gap-1.5">
            {backgrounds.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Cambiar a fondo ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? "w-5 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
