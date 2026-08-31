"use client";

import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { calculatePlateReadingSummary } from "@/lib/coljuegos/business-rules";
import type {
  PlateReading,
  PlateStatus,
  ShellOrder,
} from "@/lib/coljuegos/types";

interface PlateReadingStepProps {
  shellOrder: ShellOrder;
  readings: PlateReading[];
  onBack: () => void;
  onContinue: () => void;
}

const statusLabels: Record<PlateStatus, Parameters<typeof StatusBadge>[0]["status"]> = {
  "coincide-so": "Coincide con la SO",
  "fecha-ilegible": "Fecha ilegible",
  "fuera-so": "No está en la SO",
  "sin-evidencia": "Sin foto de placa",
};

export function PlateReadingStep({
  shellOrder,
  readings,
  onBack,
  onContinue,
}: PlateReadingStepProps) {
  const summary = calculatePlateReadingSummary(shellOrder, readings);

  return (
    <section aria-labelledby="plate-reading-title" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 2 de 4</p>
          <h2 id="plate-reading-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Lectura de placas</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Compara los seriales y fechas detectados en las placas con los activos esperados de la SO {shellOrder.number}.
          </p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
          Volver a cargar lote
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Esperados" value={summary.expected} detail="Seriales definidos en la SO" icon="folder" tone="slate" />
        <StatCard label="Detectados y leídos" value={summary.detectedAndRead} detail="Seriales de la SO reconocidos" icon="check" tone="teal" />
        <StatCard label="Fecha ilegible" value={summary.unreadableDate} detail="Requiere revisión manual" icon="clock" tone="amber" />
        <StatCard label="No reconocidos" value={summary.unrecognizedSerials} detail="Seriales fuera de la SO" icon="warning" tone="rose" />
        <StatCard label="Sin evidencia" value={summary.withoutEvidence} detail="Sin fotografía de placa" icon="image" tone="slate" />
      </div>

      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
        <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">Cómo leer estos resultados</p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            Los 20 esperados pertenecen a la SO. La tabla también muestra una placa adicional con un serial extraño para que pueda separarse del lote.
          </p>
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Resultado de la lectura</h3>
            <p className="mt-0.5 text-sm text-slate-500">{readings.length} filas: 20 esperadas y 1 detección adicional.</p>
          </div>
          <span className="text-xs font-medium text-slate-400">Datos simulados</span>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Serial</th>
                <th className="px-6 py-3">Fecha de fabricación</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readings.map((reading, index) => (
                <PlateReadingRow key={`${reading.expectedSerial ?? reading.detectedSerial}-${index}`} reading={reading} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {readings.map((reading, index) => (
            <PlateReadingMobileRow key={`${reading.expectedSerial ?? reading.detectedSerial}-${index}`} reading={reading} />
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-bold text-slate-900">{summary.unreadableDate + summary.unrecognizedSerials + summary.withoutEvidence} incidencias requieren atención</p>
            <p className="mt-0.5 text-xs text-slate-500">Podrás resolver asignaciones y faltantes en la agrupación asistida.</p>
          </div>
          <Button onClick={onContinue}>
            Continuar a agrupación
            <Icon name="arrow-right" className="h-4 w-4" />
          </Button>
        </div>
      </article>
    </section>
  );
}

function PlateReadingRow({ reading }: { reading: PlateReading }) {
  const serial = reading.detectedSerial ?? reading.expectedSerial ?? "Sin serial";

  return (
    <tr className={reading.status === "coincide-so" ? "" : "bg-amber-50/25"}>
      <td className="px-6 py-3.5">
        <p className="font-mono text-sm font-bold text-slate-900">{serial}</p>
        <p className="mt-0.5 text-xs text-slate-400">{getSerialDetail(reading)}</p>
      </td>
      <td className="px-6 py-3.5 text-sm font-medium text-slate-700">{getDateLabel(reading)}</td>
      <td className="px-6 py-3.5"><StatusBadge status={statusLabels[reading.status]} /></td>
      <td className="px-6 py-3.5 text-sm text-slate-500">{getResultLabel(reading.status)}</td>
    </tr>
  );
}

function PlateReadingMobileRow({ reading }: { reading: PlateReading }) {
  const serial = reading.detectedSerial ?? reading.expectedSerial ?? "Sin serial";

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold text-slate-900">{serial}</p>
          <p className="mt-1 text-xs text-slate-400">{getSerialDetail(reading)}</p>
        </div>
        <StatusBadge status={statusLabels[reading.status]} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha</dt>
          <dd className="mt-1 text-xs font-semibold text-slate-700">{getDateLabel(reading)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resultado</dt>
          <dd className="mt-1 text-xs text-slate-600">{getResultLabel(reading.status)}</dd>
        </div>
      </dl>
    </div>
  );
}

function getSerialDetail(reading: PlateReading) {
  if (reading.status === "fuera-so") return "Detectado en una placa adicional";
  if (reading.status === "sin-evidencia") return "Serial esperado por la SO";
  return "Serial detectado y esperado";
}

function getDateLabel(reading: PlateReading) {
  if (reading.status === "fecha-ilegible") return "No se pudo leer";
  if (reading.status === "sin-evidencia") return "Sin fotografía";
  return reading.manufactureDate ?? "Sin dato";
}

function getResultLabel(status: PlateStatus) {
  const labels: Record<PlateStatus, string> = {
    "coincide-so": "Sin observaciones",
    "fecha-ilegible": "Revisar la placa original",
    "fuera-so": "Separar del lote",
    "sin-evidencia": "Solicitar fotografía",
  };

  return labels[status];
}
