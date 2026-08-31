import { PhotoSlot } from "@/app/procesos/coljuegos/_components/photo-slot";
import { Icon } from "@/components/shared/icons";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  evaluateMachineAssignment,
  getAssignedPhotoId,
  getPhotoUsageCount,
  reviewReasonLabels,
} from "@/lib/coljuegos/business-rules";
import type {
  AssignablePhotoType,
  BatchPhoto,
  MachineAssignment,
  PlateReading,
} from "@/lib/coljuegos/types";

interface MachineCardProps {
  assignment: MachineAssignment;
  allAssignments: MachineAssignment[];
  photos: BatchPhoto[];
  plateReading?: PlateReading;
  modelName: string;
  shellOrderNumber: string;
  onChangePhoto: (type: AssignablePhotoType) => void;
}

export function MachineCard({
  assignment,
  allAssignments,
  photos,
  plateReading,
  modelName,
  shellOrderNumber,
  onChangePhoto,
}: MachineCardProps) {
  const review = evaluateMachineAssignment(assignment, photos, plateReading);
  const platePhoto = photos.find((photo) => photo.id === assignment.platePhotoId);

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${review.status === "completo" ? "border-slate-200" : "border-amber-300"}`}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Máquina</p>
          <h3 className="mt-1 font-mono text-base font-bold text-slate-950">{assignment.serial}</h3>
          <p className="mt-1 text-xs text-slate-500">{modelName} · SO {shellOrderNumber}</p>
        </div>
        <StatusBadge status={review.status === "completo" ? "Completo" : "Revisar"} />
      </header>

      <div className="grid grid-cols-2 gap-3 p-4">
        <PhotoSlot
          label="1. Placa"
          type="placa"
          photo={platePhoto}
          usageCount={platePhoto ? getPhotoUsageCount(platePhoto.id, allAssignments) : 0}
          serial={plateReading?.detectedSerial ?? assignment.serial}
          manufactureDate={plateReading?.manufactureDate}
          locked
        />

        {(["frontal", "lateral-izquierda", "lateral-derecha"] as const).map((type, index) => {
          const photoId = getAssignedPhotoId(assignment, type);
          const photo = photos.find((candidate) => candidate.id === photoId);
          const labels = ["2. Frontal", "3. Lateral izquierda", "4. Lateral derecha"];

          return (
            <PhotoSlot
              key={type}
              label={labels[index]}
              type={type}
              photo={photo}
              usageCount={photo ? getPhotoUsageCount(photo.id, allAssignments) : 0}
              onChange={() => onChangePhoto(type)}
            />
          );
        })}
      </div>

      <footer className={`border-t px-5 py-3 ${review.status === "completo" ? "border-emerald-100 bg-emerald-50/60" : "border-amber-200 bg-amber-50"}`}>
        {review.status === "completo" ? (
          <p className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <Icon name="check" className="h-4 w-4" />
            Las cuatro fotografías están listas
          </p>
        ) : (
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Icon name="warning" className="h-4 w-4" />
              Motivos de revisión
            </p>
            <ul className="mt-2 space-y-1 pl-6 text-xs text-amber-800">
              {review.reasons.map((reason) => <li key={reason} className="list-disc">{reviewReasonLabels[reason]}</li>)}
            </ul>
          </div>
        )}
      </footer>
    </article>
  );
}
