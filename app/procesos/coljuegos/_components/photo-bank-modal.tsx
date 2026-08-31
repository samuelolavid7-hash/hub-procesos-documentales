"use client";

import { PhotoThumbnail, photoTypeLabels } from "@/app/procesos/coljuegos/_components/photo-thumbnail";
import { Icon } from "@/components/shared/icons";
import { Modal } from "@/components/shared/modal";
import { getPhotoUsageCount } from "@/lib/coljuegos/business-rules";
import type {
  AssignablePhotoType,
  BatchPhoto,
  MachineAssignment,
} from "@/lib/coljuegos/types";

interface PhotoBankModalProps {
  isOpen: boolean;
  machineSerial: string;
  type: AssignablePhotoType;
  photos: BatchPhoto[];
  assignments: MachineAssignment[];
  selectedPhotoId?: string;
  onSelect: (photoId: string) => void;
  onClose: () => void;
}

export function PhotoBankModal({
  isOpen,
  machineSerial,
  type,
  photos,
  assignments,
  selectedPhotoId,
  onSelect,
  onClose,
}: PhotoBankModalProps) {
  const availablePhotos = photos.filter((photo) => photo.type === type);

  return (
    <Modal
      isOpen={isOpen}
      title={`Banco de fotos: ${photoTypeLabels[type]}`}
      description={`Selecciona una foto para ${machineSerial}. Se muestran todas las disponibles en el lote.`}
      onClose={onClose}
      size="xl"
    >
      <div className="border-b border-slate-200 bg-blue-50 px-6 py-3">
        <p className="flex items-center gap-2 text-xs font-medium text-blue-800">
          <Icon name="info" className="h-4 w-4 shrink-0" />
          Reutilizar una foto es válido para frontal y laterales del mismo modelo. Revisa el contador antes de elegir.
        </p>
      </div>

      <div className="max-h-[62vh] overflow-y-auto p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availablePhotos.map((photo) => {
            const usageCount = getPhotoUsageCount(photo.id, assignments);
            const isSelected = selectedPhotoId === photo.id;

            return (
              <button
                key={photo.id}
                type="button"
                aria-pressed={isSelected}
                className={`rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${isSelected ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/15" : "border-slate-200 bg-white hover:border-teal-400 hover:shadow-md"}`}
                onClick={() => onSelect(photo.id)}
              >
                <PhotoThumbnail type={type} photo={photo} />
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{photo.fileName}</p>
                    <p className={`mt-1 text-[11px] font-semibold ${usageCount === 0 ? "text-emerald-700" : "text-blue-700"}`}>
                      {usageCount === 0 ? "Sin usar" : `Usada en ${usageCount} máquina${usageCount === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${photo.quality === "correcta" ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                    {photo.quality === "correcta" ? "Correcta" : "Borrosa"}
                  </span>
                </div>
                <span className={`mt-3 flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-bold ${isSelected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700"}`}>
                  <Icon name={isSelected ? "check" : "image"} className="h-4 w-4" />
                  {isSelected ? "Asignada actualmente" : "Usar esta foto"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
