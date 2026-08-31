"use client";

import { useState } from "react";
import { PdfPreviewModal } from "@/app/procesos/coljuegos/_components/pdf-preview-modal";
import { ValidationCard } from "@/app/procesos/coljuegos/_components/validation-card";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { calculateValidationSummary } from "@/lib/coljuegos/business-rules";
import type { BatchPhoto, MachineAssignment, PlateReading, ShellOrder } from "@/lib/coljuegos/types";

interface ValidationDownloadStepProps {
  shellOrder: ShellOrder;
  readings: PlateReading[];
  photos: BatchPhoto[];
  assignments: MachineAssignment[];
  onBack: () => void;
  onDownloadReport: () => void;
  onDownloadZip: (completeCount: number) => void;
}

export function ValidationDownloadStep({
  shellOrder,
  readings,
  photos,
  assignments,
  onBack,
  onDownloadReport,
  onDownloadZip,
}: ValidationDownloadStepProps) {
  const [previewAssignment, setPreviewAssignment] = useState<MachineAssignment | null>(null);
  const summary = calculateValidationSummary(assignments, photos, readings);
  const unrecognizedReadings = readings.filter((reading) => reading.status === "fuera-so");
  const previewReading = previewAssignment
    ? readings.find((reading) => reading.expectedSerial === previewAssignment.serial)
    : undefined;

  return (
    <section aria-labelledby="validation-title" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 4 de 4</p>
          <h2 id="validation-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Validación y descarga</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Confirma qué expedientes están completos, revisa sus páginas y prepara las salidas simuladas del proceso.
          </p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
          Volver a agrupación
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Expedientes completos" value={summary.complete} detail="Incluidos en el ZIP" icon="check" tone="teal" />
        <StatCard label="Por revisar" value={summary.review} detail="Tienen placa y alguna incidencia" icon="warning" tone="amber" />
        <StatCard label="Sin evidencia de placa" value={summary.withoutEvidence} detail="Excluidos hasta completar evidencia" icon="image" tone="rose" />
        <StatCard label="Seriales no reconocidos" value={summary.unrecognized} detail="No pertenecen a la SO" icon="search" tone="slate" />
      </div>

      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
        <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">Criterio de inclusión</p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            El paquete ZIP solo contiene expedientes completos. Las máquinas por revisar, sin placa y las placas ajenas a la SO quedan registradas en el reporte de incidencias.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-950">Salidas de la SO {shellOrder.number}</p>
          <p className="mt-1 text-xs text-slate-500">En esta fase, ambos botones simulan la preparación de los archivos.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={onDownloadReport}>
            <Icon name="document" className="h-4 w-4" />
            Descargar reporte de incidencias
          </Button>
          <Button disabled={summary.complete === 0} onClick={() => onDownloadZip(summary.complete)}>
            <Icon name="archive" className="h-4 w-4" />
            Descargar ZIP ({summary.complete})
          </Button>
        </div>
      </div>

      {unrecognizedReadings.length > 0 ? (
        <aside className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <Icon name="warning" className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-rose-900">Placas fuera de la SO</p>
                <StatusBadge status="No está en la SO" />
              </div>
              <p className="mt-1 text-sm text-rose-800">
                {unrecognizedReadings.map((reading) => reading.detectedSerial).join(", ")} — excluida del paquete y registrada en incidencias.
              </p>
            </div>
          </div>
        </aside>
      ) : null}

      <div>
        <h3 className="text-lg font-bold text-slate-950">Resultado por máquina</h3>
        <p className="mt-1 text-sm text-slate-500">Las asignaciones son de solo lectura en este paso. Vuelve a la agrupación para corregirlas.</p>
      </div>

      <div className="grid items-start gap-5 2xl:grid-cols-2">
        {assignments.map((assignment) => (
          <ValidationCard
            key={assignment.serial}
            assignment={assignment}
            photos={photos}
            plateReading={readings.find((reading) => reading.expectedSerial === assignment.serial)}
            modelName={shellOrder.modelName}
            shellOrderNumber={shellOrder.number}
            onPreview={() => setPreviewAssignment(assignment)}
          />
        ))}
      </div>

      <PdfPreviewModal
        assignment={previewAssignment}
        photos={photos}
        plateReading={previewReading}
        shellOrderNumber={shellOrder.number}
        modelName={shellOrder.modelName}
        onClose={() => setPreviewAssignment(null)}
      />
    </section>
  );
}
