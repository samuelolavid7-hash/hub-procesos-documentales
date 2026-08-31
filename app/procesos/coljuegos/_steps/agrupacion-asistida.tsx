"use client";

import { useState } from "react";
import { MachineCard } from "@/app/procesos/coljuegos/_components/machine-card";
import { PhotoBankModal } from "@/app/procesos/coljuegos/_components/photo-bank-modal";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import {
  evaluateMachineAssignment,
  getAssignedPhotoId,
} from "@/lib/coljuegos/business-rules";
import type {
  AssignablePhotoType,
  BatchPhoto,
  MachineAssignment,
  PlateReading,
  ShellOrder,
} from "@/lib/coljuegos/types";

type MachineFilter = "todas" | "completas" | "revisar";

interface SelectedSlot {
  serial: string;
  type: AssignablePhotoType;
}

interface AssistedGroupingStepProps {
  shellOrder: ShellOrder;
  readings: PlateReading[];
  photos: BatchPhoto[];
  assignments: MachineAssignment[];
  onBack: () => void;
  onContinue: () => void;
  onAssignPhoto: (serial: string, type: AssignablePhotoType, photoId: string) => void;
}

export function AssistedGroupingStep({
  shellOrder,
  readings,
  photos,
  assignments,
  onBack,
  onContinue,
  onAssignPhoto,
}: AssistedGroupingStepProps) {
  const [filter, setFilter] = useState<MachineFilter>("todas");
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  const assignmentsWithReview = assignments.map((assignment) => {
    const plateReading = readings.find((reading) => reading.expectedSerial === assignment.serial);
    return {
      assignment,
      plateReading,
      review: evaluateMachineAssignment(assignment, photos, plateReading),
    };
  });

  const completeCount = assignmentsWithReview.filter(({ review }) => review.status === "completo").length;
  const reviewCount = assignments.length - completeCount;
  const visibleAssignments = assignmentsWithReview.filter(({ review }) => {
    if (filter === "completas") return review.status === "completo";
    if (filter === "revisar") return review.status === "revisar";
    return true;
  });

  const selectedAssignment = selectedSlot
    ? assignments.find((assignment) => assignment.serial === selectedSlot.serial)
    : undefined;
  const selectedPhotoId = selectedAssignment && selectedSlot
    ? getAssignedPhotoId(selectedAssignment, selectedSlot.type)
    : undefined;

  return (
    <section aria-labelledby="grouping-title" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 3 de 4</p>
          <h2 id="grouping-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Agrupación asistida</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Revisa las cuatro fotografías de cada máquina y corrige las sugerencias utilizando el banco completo del lote.
          </p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
          Volver a lectura de placas
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_2fr]">
        <SummaryPanel label="Máquinas completas" value={completeCount} detail="Sin incidencias" tone="emerald" />
        <SummaryPanel label="Por revisar" value={reviewCount} detail="Con motivos concretos" tone="amber" />
        <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
          <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Regla de reutilización</p>
            <p className="mt-1 text-sm leading-6 text-blue-800">La placa identifica una máquina y no se cambia. Frontal y laterales sí pueden compartirse entre máquinas PeakCurve 49.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Máquinas de la SO {shellOrder.number}</p>
          <p className="mt-0.5 text-xs text-slate-500">Mostrando {visibleAssignments.length} de {assignments.length}</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar máquinas">
          <FilterButton active={filter === "todas"} onClick={() => setFilter("todas")}>Todas ({assignments.length})</FilterButton>
          <FilterButton active={filter === "completas"} onClick={() => setFilter("completas")}>Completas ({completeCount})</FilterButton>
          <FilterButton active={filter === "revisar"} onClick={() => setFilter("revisar")}>Revisar ({reviewCount})</FilterButton>
        </div>
      </div>

      <div className="grid items-start gap-5 2xl:grid-cols-2">
        {visibleAssignments.map(({ assignment, plateReading }) => (
          <MachineCard
            key={assignment.serial}
            assignment={assignment}
            allAssignments={assignments}
            photos={photos}
            plateReading={plateReading}
            modelName={shellOrder.modelName}
            shellOrderNumber={shellOrder.number}
            onChangePhoto={(type) => setSelectedSlot({ serial: assignment.serial, type })}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">{completeCount} expedientes pueden pasar a validación</p>
          <p className="mt-1 text-xs text-slate-500">Las {reviewCount} máquinas con incidencias permanecerán identificadas.</p>
        </div>
        <Button onClick={onContinue}>
          Continuar a validación
          <Icon name="arrow-right" className="h-4 w-4" />
        </Button>
      </div>

      {selectedSlot ? (
        <PhotoBankModal
          isOpen
          machineSerial={selectedSlot.serial}
          type={selectedSlot.type}
          photos={photos}
          assignments={assignments}
          selectedPhotoId={selectedPhotoId}
          onSelect={(photoId) => {
            onAssignPhoto(selectedSlot.serial, selectedSlot.type, photoId);
            setSelectedSlot(null);
          }}
          onClose={() => setSelectedSlot(null)}
        />
      ) : null}
    </section>
  );
}

function SummaryPanel({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "emerald" | "amber" }) {
  const styles = tone === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <article className={`rounded-xl border p-4 ${styles}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-75">{label}</p>
      <div className="mt-1 flex items-end gap-2">
        <p className="text-3xl font-bold">{value}</p>
        <p className="pb-1 text-xs opacity-75">{detail}</p>
      </div>
    </article>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`h-9 rounded-lg px-3 text-xs font-bold transition ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
