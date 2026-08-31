import { PhotoThumbnail } from "@/app/procesos/coljuegos/_components/photo-thumbnail";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  evaluateMachineAssignment,
  getMachineValidationStatus,
  reviewReasonLabels,
} from "@/lib/coljuegos/business-rules";
import type {
  BatchPhoto,
  MachineAssignment,
  PhotoType,
  PlateReading,
} from "@/lib/coljuegos/types";

interface ValidationCardProps {
  assignment: MachineAssignment;
  photos: BatchPhoto[];
  plateReading?: PlateReading;
  modelName: string;
  shellOrderNumber: string;
  onPreview: () => void;
}

const photoFields: Array<{
  type: PhotoType;
  field: keyof Pick<
    MachineAssignment,
    "platePhotoId" | "frontPhotoId" | "leftPhotoId" | "rightPhotoId"
  >;
}> = [
  { type: "placa", field: "platePhotoId" },
  { type: "frontal", field: "frontPhotoId" },
  { type: "lateral-izquierda", field: "leftPhotoId" },
  { type: "lateral-derecha", field: "rightPhotoId" },
];

export function ValidationCard({
  assignment,
  photos,
  plateReading,
  modelName,
  shellOrderNumber,
  onPreview,
}: ValidationCardProps) {
  const review = evaluateMachineAssignment(assignment, photos, plateReading);
  const status = getMachineValidationStatus(assignment, photos, plateReading);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-base font-bold text-slate-950">{assignment.serial}</p>
          <p className="mt-1 text-xs text-slate-500">
            {modelName} · SO {shellOrderNumber}
          </p>
        </div>
        <StatusBadge
          status={status === "completo" ? "Completo" : status === "sin-evidencia" ? "Sin evidencia" : "Revisar"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 p-5">
        {photoFields.map(({ type, field }) => {
          const photoId = assignment[field];
          const photo = photos.find((candidate) => candidate.id === photoId);
          return (
            <PhotoThumbnail
              key={type}
              type={type}
              photo={photo}
              serial={plateReading?.detectedSerial}
              manufactureDate={plateReading?.manufactureDate}
            />
          );
        })}
      </div>

      <div className={`border-t p-5 ${status === "completo" ? "border-emerald-100 bg-emerald-50/60" : "border-amber-100 bg-amber-50/70"}`}>
        {status === "completo" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-emerald-800">
              <Icon name="check" className="h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">Incluido en el paquete ZIP</p>
            </div>
            <Button size="sm" variant="secondary" onClick={onPreview}>
              <Icon name="document" className="h-4 w-4" />
              Ver PDF del expediente
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-amber-900">
              <Icon name="warning" className="h-5 w-5 shrink-0" />
              <p className="text-sm font-bold">Excluida del paquete ZIP</p>
            </div>
            <ul className="mt-2 space-y-1 pl-7 text-xs leading-5 text-amber-800">
              {review.reasons.map((reason) => (
                <li key={reason}>• {reviewReasonLabels[reason]}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
