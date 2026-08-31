"use client";

import { PhotoThumbnail, photoTypeLabels } from "@/app/procesos/coljuegos/_components/photo-thumbnail";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { Modal } from "@/components/shared/modal";
import type { BatchPhoto, MachineAssignment, PhotoType, PlateReading } from "@/lib/coljuegos/types";

interface PdfPreviewModalProps {
  assignment: MachineAssignment | null;
  photos: BatchPhoto[];
  plateReading?: PlateReading;
  shellOrderNumber: string;
  modelName: string;
  onClose: () => void;
}

const pages: Array<{
  type: PhotoType;
  field: keyof Pick<MachineAssignment, "platePhotoId" | "frontPhotoId" | "leftPhotoId" | "rightPhotoId">;
}> = [
  { type: "placa", field: "platePhotoId" },
  { type: "frontal", field: "frontPhotoId" },
  { type: "lateral-izquierda", field: "leftPhotoId" },
  { type: "lateral-derecha", field: "rightPhotoId" },
];

export function PdfPreviewModal({
  assignment,
  photos,
  plateReading,
  shellOrderNumber,
  modelName,
  onClose,
}: PdfPreviewModalProps) {
  return (
    <Modal
      isOpen={Boolean(assignment)}
      title={`Vista previa PDF — ${assignment?.serial ?? ""}`}
      description="Simulación del expediente en el orden requerido por Coljuegos."
      onClose={onClose}
      size="xl"
    >
      {assignment ? (
        <div className="max-h-[calc(92vh-105px)] overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div className="mb-4 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-6">
              Esta vista no genera todavía un archivo real. Permite revisar las cuatro páginas antes de la futura integración documental.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {pages.map(({ type, field }, index) => {
              const photo = photos.find((candidate) => candidate.id === assignment[field]);
              return (
                <article key={type} className="mx-auto flex aspect-[210/297] w-full max-w-sm flex-col bg-white p-5 shadow-md ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Expediente Coljuegos</p>
                      <p className="mt-1 text-sm font-bold text-slate-950">{photoTypeLabels[type]}</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-400">Página {index + 1} de 4</p>
                  </div>

                  <div className="mt-5">
                    <PhotoThumbnail
                      type={type}
                      photo={photo}
                      serial={plateReading?.detectedSerial}
                      manufactureDate={plateReading?.manufactureDate}
                    />
                  </div>

                  <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
                    <dt className="font-semibold text-slate-500">Serial</dt>
                    <dd className="font-mono font-bold text-slate-900">{assignment.serial}</dd>
                    <dt className="font-semibold text-slate-500">Modelo</dt>
                    <dd className="text-slate-700">{modelName}</dd>
                    <dt className="font-semibold text-slate-500">SO</dt>
                    <dd className="text-slate-700">{shellOrderNumber}</dd>
                    <dt className="font-semibold text-slate-500">Archivo</dt>
                    <dd className="truncate text-slate-700">{photo?.fileName}</dd>
                  </dl>
                  <p className="mt-auto border-t border-slate-200 pt-3 text-[10px] text-slate-400">Documento interno · Vista previa simulada</p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={onClose}>Cerrar vista previa</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
