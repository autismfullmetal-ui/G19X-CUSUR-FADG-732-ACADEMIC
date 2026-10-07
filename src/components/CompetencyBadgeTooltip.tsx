"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface CompetencyBadgeTooltipProps {
  name: string;
  level: number;
  type: string; // TECNICA | BLANDA
  description?: string | null;
  className?: string;
}

interface LevelDetails {
  levelTitle: string;
  badgeTag: string;
  explanation: string;
}

function getCompetencyLevelMeaning(name: string, type: string, level: number): LevelDetails {
  const normName = (name || "").toLowerCase().trim();
  const isTechnical = (type || "").toUpperCase() === "TECNICA";
  const safeLevel = Math.max(1, Math.min(5, level || 1));

  // Evaluaciones específicas para tecnologías y habilidades populares
  if (normName.includes("python")) {
    switch (safeLevel) {
      case 1:
        return {
          levelTitle: "Nivel 1 — Principiante en Python",
          badgeTag: "Básico",
          explanation: "Conoce la sintaxis básica, variables, condicionales y bucles. Requiere asistencia para estructurar scripts y funciones.",
        };
      case 2:
        return {
          levelTitle: "Nivel 2 — Intermedio / Práctico en Python",
          badgeTag: "Práctico",
          explanation: "Desarrolla scripts autónomos, manipula datos con librerías comunes (Pandas/Requests) y consume APIs REST de forma estructurada.",
        };
      case 3:
        return {
          levelTitle: "Nivel 3 — Avanzado / Autónomo en Python",
          badgeTag: "Autónomo",
          explanation: "Estructura aplicaciones modulares, maneja concurrencia/asincronía, crea pruebas unitarias y resuelve bugs complejos sin supervisión.",
        };
      case 4:
        return {
          levelTitle: "Nivel 4 — Experto / Referente en Python",
          badgeTag: "Experto",
          explanation: "Diseña arquitecturas robustas y APIs de alto rendimiento (FastAPI/Django), optimiza el perfilado de memoria y mentorea al equipo.",
        };
      case 5:
        return {
          levelTitle: "Nivel 5 — Maestro / Estratégico en Python",
          badgeTag: "Maestro",
          explanation: "Define lineamientos y arquitecturas corporativas, desarrolla librerías internas avanzadas y es referente institucional de la tecnología.",
        };
    }
  }

  if (normName.includes("sql") || normName.includes("base de datos") || normName.includes("datos")) {
    switch (safeLevel) {
      case 1:
        return {
          levelTitle: "Nivel 1 — Principiante en Datos/SQL",
          badgeTag: "Básico",
          explanation: "Realiza consultas SELECT elementales con filtros básicos; requiere apoyo para relacionar tablas o usar agregaciones.",
        };
      case 2:
        return {
          levelTitle: "Nivel 2 — Intermedio en Datos/SQL",
          badgeTag: "Práctico",
          explanation: "Escribe consultas con múltiples JOINs, GROUP BY y subconsultas; manipula datos con seguridad en entornos de trabajo.",
        };
      case 3:
        return {
          levelTitle: "Nivel 3 — Avanzado en Datos/SQL",
          badgeTag: "Autónomo",
          explanation: "Diseña modelos relacionales, optimiza consultas lentas mediante índices y programa procedimientos almacenados o vistas complejas.",
        };
      case 4:
        return {
          levelTitle: "Nivel 4 — Experto en Datos/SQL",
          badgeTag: "Experto",
          explanation: "Afinamiento avanzado de motores (tuning de execution plans), particionamiento, replicación y alta disponibilidad de bases de datos.",
        };
      case 5:
        return {
          levelTitle: "Nivel 5 — Arquitecto Estratégico de Datos",
          badgeTag: "Maestro",
          explanation: "Define la gobernanza global de datos corporativos, arquitecturas Data Warehouse/Lakehouse y estándares empresariales.",
        };
    }
  }

  if (normName.includes("liderazgo")) {
    switch (safeLevel) {
      case 1:
        return {
          levelTitle: "Nivel 1 — Liderazgo Personal",
          badgeTag: "Inicial",
          explanation: "Autogestión responsable de objetivos personales y disposición para colaborar bajo supervisión de un líder.",
        };
      case 2:
        return {
          levelTitle: "Nivel 2 — Coordinación de Grupo",
          badgeTag: "Práctico",
          explanation: "Coordina tareas específicas de trabajo en equipo, apoya activamente a sus compañeros y mantiene un clima positivo.",
        };
      case 3:
        return {
          levelTitle: "Nivel 3 — Líder Operativo / Proyectos",
          badgeTag: "Autónomo",
          explanation: "Dirige proyectos o equipos funcionales, delega con claridad, fomenta la proactividad y da retroalimentación oportuna.",
        };
      case 4:
        return {
          levelTitle: "Nivel 4 — Líder Desarrollador de Talento",
          badgeTag: "Experto",
          explanation: "Inspira compromiso, forma a futuros líderes, gestiona dinámicas complejas y promueve una cultura de resiliencia y resultados.",
        };
      case 5:
        return {
          levelTitle: "Nivel 5 — Liderazgo Estratégico y Transformacional",
          badgeTag: "Estratégico",
          explanation: "Define la visión y rumbo de la organización, moviliza a múltiples áreas ante cambios estratégicos y modela la cultura corporativa.",
        };
    }
  }

  if (normName.includes("comunicación") || normName.includes("comunicacion")) {
    switch (safeLevel) {
      case 1:
        return {
          levelTitle: "Nivel 1 — Comunicación Básica",
          badgeTag: "Básico",
          explanation: "Transmite información cotidiana de forma respetuosa; requiere apoyo para estructurar ideas ante audiencias o tensión.",
        };
      case 2:
        return {
          levelTitle: "Nivel 2 — Comunicación Clara y Asertiva",
          badgeTag: "Práctico",
          explanation: "Expresa requerimientos y avances con claridad oral y escrita; practica la escucha activa con compañeros y superiores.",
        };
      case 3:
        return {
          levelTitle: "Nivel 3 — Facilitador de Diálogo",
          badgeTag: "Autónomo",
          explanation: "Comunica ideas complejas a diferentes públicos, media desacuerdos constructivamente y sintetiza acuerdos con precisión.",
        };
      case 4:
        return {
          levelTitle: "Nivel 4 — Influencia y Negociación",
          badgeTag: "Experto",
          explanation: "Persuade y alinea posturas entre áreas divergentes, presenta con impacto ante directivos y maneja conversaciones difíciles con empatía.",
        };
      case 5:
        return {
          levelTitle: "Nivel 5 — Comunicación Ejecutiva Institucional",
          badgeTag: "Estratégico",
          explanation: "Portavoz oficial y orador inspirador; diseña la narrativa corporativa y proyecta confianza ante grupos de interés clave.",
        };
    }
  }

  // Matriz genérica por Tipo (Técnica vs Blanda)
  if (isTechnical) {
    switch (safeLevel) {
      case 1:
        return {
          levelTitle: `Nivel 1 — Principiante en ${name}`,
          badgeTag: "Básico",
          explanation: `Posee nociones fundamentales de ${name}. Requiere acompañamiento y documentación constante para ejecutar tareas rutinarias.`,
        };
      case 2:
        return {
          levelTitle: `Nivel 2 — Intermedio en ${name}`,
          badgeTag: "Práctico",
          explanation: `Aplica conocimientos prácticos de ${name} con autonomía moderada. Resuelve requerimientos estándar según las mejores prácticas.`,
        };
      case 3:
        return {
          levelTitle: `Nivel 3 — Avanzado en ${name}`,
          badgeTag: "Autónomo",
          explanation: `Dominio sólido y autónomo de ${name}. Resuelve incidencias complejas, diseña soluciones fiables y optimiza procesos técnicos.`,
        };
      case 4:
        return {
          levelTitle: `Nivel 4 — Experto / Referente en ${name}`,
          badgeTag: "Experto",
          explanation: `Referente técnico interno en ${name}. Diseña soluciones escalables, audita calidad y mentorea activamente a otros colaboradores.`,
        };
      case 5:
        return {
          levelTitle: `Nivel 5 — Maestro / Estratégico en ${name}`,
          badgeTag: "Maestro",
          explanation: `Máxima autoridad en ${name}. Define estándares corporativos, impulsa innovación técnica y transforma las capacidades del área.`,
        };
    }
  } else {
    // Competencia Blanda genérica
    switch (safeLevel) {
      case 1:
        return {
          levelTitle: `Nivel 1 — Comprensión Inicial en ${name}`,
          badgeTag: "Básico",
          explanation: `Demuestra los principios elementales de ${name} en situaciones cotidianas bajo orientación o supervisión directa.`,
        };
      case 2:
        return {
          levelTitle: `Nivel 2 — Aplicación Práctica en ${name}`,
          badgeTag: "Práctico",
          explanation: `Aplica ${name} de manera consistente en su equipo de trabajo, manteniendo adecuada adaptabilidad y colaboración.`,
        };
      case 3:
        return {
          levelTitle: `Nivel 3 — Dominio Autónomo en ${name}`,
          badgeTag: "Autónomo",
          explanation: `Facilita la dinámica colaborativa con iniciativa, resuelve tensiones de forma constructiva e impulsa metas compartidas.`,
        };
      case 4:
        return {
          levelTitle: `Nivel 4 — Referente de Influencia en ${name}`,
          badgeTag: "Experto",
          explanation: `Inspira y mentorea a otros en ${name}, genera sinergias multidisciplinarias y resuelve situaciones interpersonales críticas.`,
        };
      case 5:
        return {
          levelTitle: `Nivel 5 — Referente Cultural y Estratégico en ${name}`,
          badgeTag: "Estratégico",
          explanation: `Modela la identidad y cultura organizacional, lidera con visión estratégica transformadora y crea un entorno de alto desempeño.`,
        };
    }
  }

  return {
    levelTitle: `Nivel ${safeLevel} en ${name}`,
    badgeTag: `Nivel ${safeLevel}`,
    explanation: `Desempeño y dominio demostrado en la competencia ${name}.`,
  };
}

export function CompetencyBadgeTooltip({
  name,
  level,
  type,
  description,
  className,
}: CompetencyBadgeTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number; placement: "top" | "bottom" }>({
    left: 0,
    top: 0,
    placement: "top",
  });
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipHeight = 160; // estimado máximo
    const spaceAbove = rect.top;
    const prefersBottom = spaceAbove < tooltipHeight;

    const centerX = rect.left + rect.width / 2;
    // Clamping para evitar salirse de los bordes izquierdo/derecho
    const safeLeft = Math.max(160, Math.min(window.innerWidth - 160, centerX));

    setCoords({
      left: safeLeft,
      top: prefersBottom ? rect.bottom + 8 : rect.top - 8,
      placement: prefersBottom ? "bottom" : "top",
    });
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const isTechnical = (type || "").toUpperCase() === "TECNICA";
  const details = getCompetencyLevelMeaning(name, type, level);

  // Renderizado de estrellas (1 a 5)
  const stars = Array.from({ length: 5 }, (_, i) => i < level);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          // Prevenir cualquier navegación y permitir toggle en dispositivos táctiles
          e.preventDefault();
          updatePosition();
          setIsOpen((prev) => !prev);
        }}
        className={`group relative inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium cursor-help transition-all select-none ${
          className ||
          "bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 hover:border-red-500/80 hover:bg-zinc-800 shadow-2xs"
        }`}
      >
        <span className="truncate max-w-[130px] font-semibold">{name}</span>
        <span className="rounded bg-red-950/90 text-red-200 border border-red-800/60 px-1 py-0.2 text-[10px] font-extrabold tracking-tight">
          Nv.{level}
        </span>
      </span>

      {/* Popover / Tooltip informativo renderizado mediante Portal en body (sin cortes por overflow) */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              transform: coords.placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            }}
            className="pointer-events-none z-[9999] w-72 sm:w-80 rounded-xl border border-zinc-700/90 bg-[#121217] p-3.5 shadow-2xl backdrop-blur-md transition-all duration-150 animate-in fade-in zoom-in-95"
          >
            {/* Cabecera del Tooltip */}
            <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-zinc-100 truncate">{name}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                      isTechnical
                        ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/60"
                        : "bg-purple-950/80 text-purple-300 border border-purple-800/60"
                    }`}
                  >
                    {isTechnical ? "Técnica" : "Habilidad Blanda"}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-red-400 mt-0.5">
                  {details.levelTitle}
                </p>
              </div>

              {/* Indicador visual de estrellas de nivel */}
              <div className="flex flex-col items-end shrink-0">
                <div className="flex text-amber-400 text-xs">
                  {stars.map((filled, idx) => (
                    <span key={idx} className={filled ? "opacity-100" : "text-zinc-600 opacity-40"}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5 font-bold">
                  {level} de 5
                </span>
              </div>
            </div>

            {/* Cuerpo del Tooltip: Explicación de lo que significa ese nivel */}
            <div className="pt-2.5 space-y-2">
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                  ¿Qué significa este nivel?
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed mt-0.5 font-normal">
                  {details.explanation}
                </p>
              </div>

              {/* Descripción de catálogo si existe */}
              {description && (
                <div className="rounded-lg bg-zinc-900/80 p-2 border border-zinc-800/60 text-[11px] text-zinc-400 leading-normal">
                  <span className="font-semibold text-zinc-300">Enfoque: </span>
                  {description}
                </div>
              )}
            </div>

            {/* Pie sutil del tooltip */}
            <div className="mt-2.5 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
              <span>Leyenda de desempeño</span>
              <span className="text-zinc-400 font-medium">Plataforma PDP</span>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
