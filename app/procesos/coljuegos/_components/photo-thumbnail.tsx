import { Icon } from "@/components/shared/icons";
import type { BatchPhoto, PhotoType } from "@/lib/coljuegos/types";

interface PhotoThumbnailProps {
  type: PhotoType;
  photo?: BatchPhoto;
  serial?: string;
  manufactureDate?: string;
}

const visualStyles: Record<PhotoType, string> = {
  placa: "from-slate-800 to-slate-950 text-white",
  frontal: "from-cyan-700 to-teal-950 text-white",
  "lateral-izquierda": "from-indigo-600 to-slate-900 text-white",
  "lateral-derecha": "from-violet-600 to-slate-900 text-white",
};

const typeLabels: Record<PhotoType, string> = {
  placa: "Placa",
  frontal: "Frontal",
  "lateral-izquierda": "Lateral izquierda",
  "lateral-derecha": "Lateral derecha",
};

export function PhotoThumbnail({ type, photo, serial, manufactureDate }: PhotoThumbnailProps) {
  if (!photo) {
    return (
      <div className="grid aspect-[16/10] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400" role="img" aria-label={`${typeLabels[type]} sin asignar`}>
        <div className="text-center">
          <Icon name="image" className="mx-auto h-7 w-7" />
          <p className="mt-2 text-xs font-semibold">Sin fotografía</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${visualStyles[type]}`}
      role="img"
      aria-label={`Vista simulada: ${typeLabels[type]}, archivo ${photo.fileName}`}
    >
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_25%,white_25%,white_27%,transparent_27%,transparent_75%,white_75%,white_77%,transparent_77%)] [background-size:24px_24px]" />

      {type === "placa" ? (
        <div className="relative w-4/5 rounded-md border border-white/40 bg-slate-100 p-2 text-slate-900 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1 text-[8px] font-bold uppercase tracking-wider">
            <span>IGT</span>
            <span>PeakCurve 49</span>
          </div>
          <p className="mt-1 truncate font-mono text-[10px] font-bold">{serial ?? "Serial no leído"}</p>
          <p className="mt-0.5 text-[8px] text-slate-600">Fabricación: {manufactureDate ?? "Ilegible"}</p>
        </div>
      ) : (
        <div className="relative text-center">
          <div className="mx-auto grid h-14 w-10 place-items-center rounded-t-xl border-2 border-white/70 bg-white/15 shadow-lg">
            <div className="h-6 w-6 rounded bg-cyan-200/50 ring-1 ring-white/60" />
          </div>
          <div className="mx-auto h-3 w-14 rounded-sm border border-white/50 bg-white/20" />
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">{typeLabels[type]}</p>
        </div>
      )}

      {photo.quality === "borrosa" ? (
        <span className="absolute right-2 top-2 rounded-md bg-amber-300 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-950">Borrosa</span>
      ) : null}
    </div>
  );
}

export { typeLabels as photoTypeLabels };
