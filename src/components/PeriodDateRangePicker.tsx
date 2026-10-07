"use client";

import { useState, useRef, useEffect, useMemo } from "react";

type PeriodDateRangePickerProps = {
  name?: string;
  initialStart?: string;
  initialEnd?: string;
};

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function formatDateToDMY(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function computePeriodLabel(start: string, end: string): string {
  if (!start || !end) return "Seleccionar período";
  const startY = start.split("-")[0];
  const endY = end.split("-")[0];

  // Si coinciden en el mismo año, verificar si es un preset estándar
  if (startY === endY) {
    const y = startY;
    if (start === `${y}-01-01` && end === `${y}-12-31`) {
      return `${y} - Anual (${formatDateToDMY(start)} al ${formatDateToDMY(end)})`;
    }
    if (start === `${y}-01-01` && end === `${y}-03-31`) {
      return `${y} - Q1 (${formatDateToDMY(start)} al ${formatDateToDMY(end)})`;
    }
    if (start === `${y}-04-01` && end === `${y}-06-30`) {
      return `${y} - Q2 (${formatDateToDMY(start)} al ${formatDateToDMY(end)})`;
    }
    if (start === `${y}-07-01` && end === `${y}-09-30`) {
      return `${y} - Q3 (${formatDateToDMY(start)} al ${formatDateToDMY(end)})`;
    }
    if (start === `${y}-10-01` && end === `${y}-12-31`) {
      return `${y} - Q4 (${formatDateToDMY(start)} al ${formatDateToDMY(end)})`;
    }
    if (start === `${y}-01-01` && end === `${y}-06-30`) {
      return `${y} - S1 (${formatDateToDMY(start)} al ${formatDateToDMY(end)})`;
    }
    if (start === `${y}-07-01` && end === `${y}-12-31`) {
      return `${y} - S2 (${formatDateToDMY(start)} al ${formatDateToDMY(end)})`;
    }
  }

  return `${formatDateToDMY(start)} al ${formatDateToDMY(end)}`;
}

export default function PeriodDateRangePicker({
  name = "targetPeriod",
  initialStart = "2026-01-01",
  initialEnd = "2026-12-31",
}: PeriodDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [selectingStep, setSelectingStep] = useState<"start" | "end">("start");
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Inicializar vista del calendario en el mes/año de inicio
  const initialYear = Number(initialStart.split("-")[0]) || 2026;
  const initialMonth = (Number(initialStart.split("-")[1]) || 1) - 1;
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Texto que se enviará en el FormData del servidor
  const periodValue = useMemo(() => {
    return computePeriodLabel(startDate, endDate);
  }, [startDate, endDate]);

  // Días del mes actual
  const calendarDays = useMemo(() => {
    // Primer día del mes (0 = domingo, 1 = lunes, ..., 6 = sábado)
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    // Ajustar para que lunes sea 0 y domingo sea 6
    const startOffset = (firstDayIndex + 6) % 7;
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
    }> = [];

    // Rellenos días del mes anterior
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({ dateStr, dayNum, isCurrentMonth: false });
    }

    // Días del mes en curso
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: i, isCurrentMonth: true });
    }

    // Rellenos del siguiente mes para completar grilla de múltiplos de 7 (hasta 35 o 42)
    const remainder = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: i, isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (selectingStep === "start") {
      setStartDate(dateStr);
      // Si la fecha de fin anterior era menor a la nueva de inicio, sincronizar
      if (endDate && dateStr > endDate) {
        setEndDate(dateStr);
      }
      setSelectingStep("end");
    } else {
      // Paso de selección de fin
      if (dateStr < startDate) {
        // Si hizo clic en una fecha anterior a la de inicio, invertir orden
        setEndDate(startDate);
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
      setSelectingStep("start");
    }
  };

  const applyPreset = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setSelectingStep("start");
    const [y, m] = start.split("-");
    setViewYear(Number(y));
    setViewMonth(Number(m) - 1);
  };

  // Cálculo de días en el período
  const daysDiff = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }, [startDate, endDate]);

  const currentYear = viewYear;

  return (
    <div className="relative" ref={containerRef}>
      {/* Campo invisible que envía el valor al form action */}
      <input type="hidden" name={name} value={periodValue} />

      {/* Botón / Tarjeta activadora */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition cursor-pointer select-none ${
          open
            ? "border-[#ad4251] bg-[#1a1722] text-white ring-2 ring-[#ad4251]/25"
            : "border-zinc-800 bg-[#161622] text-zinc-100 hover:border-zinc-700 hover:bg-[#191928]"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/80 text-xs">
            📅
          </span>
          <div className="flex flex-col text-left truncate">
            <span className="font-semibold text-zinc-100 truncate text-xs">
              {periodValue}
            </span>
            <span className="text-[10px] text-zinc-400">
              {daysDiff} días de duración · Clic para abrir calendario
            </span>
          </div>
        </div>

        <span className="text-[11px] font-bold text-red-400 pl-2 shrink-0">
          {open ? "▲ Ocultar" : "▼ Elegir"}
        </span>
      </div>

      {/* Ventana flotante / Popover del calendario */}
      {open && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-[380px] top-full mt-2 z-50 rounded-2xl border border-zinc-800 bg-[#14141d] p-4 shadow-2xl space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Encabezado con selector de fechas directas */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div>
              <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <span>📆</span>
                <span>Seleccionar Fechas del Período</span>
              </h4>
              <p className="text-[10px] text-zinc-400">
                {selectingStep === "start"
                  ? "1. Haz clic en el día de inicio"
                  : "2. Haz clic en el día de fin"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Atajos Rápidos (Presets) */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Atajos Rápidos ({currentYear}):
            </span>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => applyPreset(`${currentYear}-01-01`, `${currentYear}-03-31`)}
                className="rounded-lg border border-zinc-800 bg-[#181824] px-2 py-1 text-[11px] font-medium text-zinc-300 hover:border-red-800/60 hover:text-white hover:bg-red-950/30 transition cursor-pointer"
              >
                Q1 (Ene-Mar)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(`${currentYear}-04-01`, `${currentYear}-06-30`)}
                className="rounded-lg border border-zinc-800 bg-[#181824] px-2 py-1 text-[11px] font-medium text-zinc-300 hover:border-red-800/60 hover:text-white hover:bg-red-950/30 transition cursor-pointer"
              >
                Q2 (Abr-Jun)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(`${currentYear}-07-01`, `${currentYear}-09-30`)}
                className="rounded-lg border border-zinc-800 bg-[#181824] px-2 py-1 text-[11px] font-medium text-zinc-300 hover:border-red-800/60 hover:text-white hover:bg-red-950/30 transition cursor-pointer"
              >
                Q3 (Jul-Sep)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(`${currentYear}-10-01`, `${currentYear}-12-31`)}
                className="rounded-lg border border-zinc-800 bg-[#181824] px-2 py-1 text-[11px] font-medium text-zinc-300 hover:border-red-800/60 hover:text-white hover:bg-red-950/30 transition cursor-pointer"
              >
                Q4 (Oct-Dic)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 mt-1">
              <button
                type="button"
                onClick={() => applyPreset(`${currentYear}-01-01`, `${currentYear}-06-30`)}
                className="rounded-lg border border-zinc-800 bg-[#181824] px-2 py-1 text-[10px] font-medium text-zinc-300 hover:border-red-800/60 hover:text-white hover:bg-red-950/30 transition cursor-pointer"
              >
                Semestre 1 (Ene-Jun)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(`${currentYear}-07-01`, `${currentYear}-12-31`)}
                className="rounded-lg border border-zinc-800 bg-[#181824] px-2 py-1 text-[10px] font-medium text-zinc-300 hover:border-red-800/60 hover:text-white hover:bg-red-950/30 transition cursor-pointer"
              >
                Semestre 2 (Jul-Dic)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(`${currentYear}-01-01`, `${currentYear}-12-31`)}
                className="rounded-lg border border-red-900/60 bg-red-950/40 px-2 py-1 text-[10px] font-bold text-rose-200 hover:bg-red-900/50 hover:text-white transition cursor-pointer"
              >
                Anual {currentYear}
              </button>
            </div>
          </div>

          {/* Selectores Numéricos Directos Inicio / Fin */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800/80 bg-[#101018] p-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Fecha de Inicio:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (endDate && val > endDate) setEndDate(val);
                  if (val) {
                    const [y, m] = val.split("-");
                    setViewYear(Number(y));
                    setViewMonth(Number(m) - 1);
                  }
                }}
                className="w-full rounded-lg border border-zinc-700/80 bg-[#161622] px-2 py-1 text-xs text-zinc-100 focus:border-[#ad4251] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Fecha de Fin:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setEndDate(val);
                  if (startDate && val < startDate) setStartDate(val);
                }}
                className="w-full rounded-lg border border-zinc-700/80 bg-[#161622] px-2 py-1 text-xs text-zinc-100 focus:border-[#ad4251] focus:outline-none"
              />
            </div>
          </div>

          {/* Navegación del Calendario Visual */}
          <div className="space-y-2 pt-1 border-t border-zinc-800/60">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-lg border border-zinc-800 bg-[#161622] hover:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
                title="Mes anterior"
              >
                ◀
              </button>

              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100">
                <span>{MONTH_NAMES[viewMonth]}</span>
                <span className="text-red-400">{viewYear}</span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-lg border border-zinc-800 bg-[#161622] hover:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
                title="Mes siguiente"
              >
                ▶
              </button>
            </div>

            {/* Cabecera de días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 uppercase">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="py-0.5">
                  {wd}
                </div>
              ))}
            </div>

            {/* Cuadrícula de días */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.map((d, idx) => {
                const isStart = d.dateStr === startDate;
                const isEnd = d.dateStr === endDate;
                const isInRange =
                  startDate && endDate && d.dateStr > startDate && d.dateStr < endDate;

                // Preview si estamos seleccionando fin y pasamos cursor
                const isHoverRange =
                  selectingStep === "end" &&
                  hoverDate &&
                  hoverDate > startDate &&
                  d.dateStr >= startDate &&
                  d.dateStr <= hoverDate;

                return (
                  <button
                    key={`${d.dateStr}-${idx}`}
                    type="button"
                    onClick={() => handleDayClick(d.dateStr)}
                    onMouseEnter={() => setHoverDate(d.dateStr)}
                    onMouseLeave={() => setHoverDate(null)}
                    className={`h-7 w-full flex items-center justify-center rounded-md text-[11px] font-medium transition cursor-pointer ${
                      isStart || isEnd
                        ? "bg-gradient-to-r from-[#8c2534] to-[#ad4251] text-white font-bold shadow-xs scale-105"
                        : isInRange || isHoverRange
                          ? "bg-red-950/40 text-rose-200 border border-red-900/30"
                          : d.isCurrentMonth
                            ? "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                            : "text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400"
                    }`}
                  >
                    {d.dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pie del componente */}
          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/80 text-xs">
            <div className="text-[10px] text-zinc-400">
              <span className="font-semibold text-zinc-200">
                {daysDiff} días seleccionados
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-gradient-to-r from-[#8c2534] to-[#ad4251] hover:from-[#9d2c3c] hover:to-[#be4b5b] border border-red-700/60 px-3.5 py-1 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            >
              ✓ Aplicar Período
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
