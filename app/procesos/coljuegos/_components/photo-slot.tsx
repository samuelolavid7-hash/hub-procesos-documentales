import { PhotoThumbnail } from "@/app/procesos/coljuegos/_components/photo-thumbnail";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import type { BatchPhoto, PhotoType } from "@/lib/coljuegos/types";

interface PhotoSlotProps {
  label: string;
  type: PhotoType;
  photo?: BatchPhoto;
  usageCount: number;
  serial?: string;
  manufactureDate?: string;
  locked?: boolean;
  onChange?: () => void;
}

export function PhotoSlot({
  label,
  type,
  photo,
  usageCount,
  serial,
  manufactureDate,
  locked = false,
  onChange,
}: PhotoSlotProps) {
  return (
    <article className={`rounded-xl border p-3 ${photo ? "border-slate-200 bg-white" : "border-amber-300 bg-amber-50/40"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-slate-800">{label}</h4>
        {locked ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
            <Icon name="lock" className="h-3 w-3" />
            Única
          </span>
        ) : null}
      </div>

      <PhotoThumbnail type={type} photo={photo} serial={serial} manufactureDate={manufactureDate} />

      <div className="mt-2 min-h-10">
        <p className="truncate text-[11px] font-semibold text-slate-700">{photo?.fileName ?? "Sin archivo asignado"}</p>
        {locked ? (
          <p className="mt-0.5 text-[10px] text-slate-400">No intercambiable entre máquinas</p>
        ) : photo ? (
          <p className={`mt-0.5 text-[10px] font-medium ${usageCount > 1 ? "text-blue-700" : "text-slate-400"}`}>
            {usageCount > 1 ? `Compartida con ${usageCount - 1} máquina${usageCount - 1 === 1 ? "" : "s"} más` : "Uso exclusivo"}
          </p>
        ) : (
          <p className="mt-0.5 text-[10px] font-medium text-amber-700">Requiere una asignación</p>
        )}
      </div>

      {!locked && onChange ? (
        <Button className="mt-2 w-full" size="sm" variant="secondary" onClick={onChange}>
          <Icon name="image" className="h-3.5 w-3.5" />
          {photo ? "Cambiar foto" : "Elegir foto"}
        </Button>
      ) : null}
    </article>
  );
}
