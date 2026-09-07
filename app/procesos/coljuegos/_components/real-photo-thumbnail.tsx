import { Icon } from "@/components/shared/icons";
import { formatFileSize } from "@/lib/coljuegos/file-ingestion";
import type { LocalBatchPhoto } from "@/lib/coljuegos/types";

export function RealPhotoThumbnail({ photo }: { photo: LocalBatchPhoto }) {
  const date = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(photo.capturedAt));

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-slate-100">
        {photo.thumbnailUrl ? (
          // Blob local generado en el navegador; next/image no optimiza este tipo de URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`Miniatura de ${photo.fileName}`}
            className="h-full w-full object-cover"
            src={photo.thumbnailUrl}
          />
        ) : (
          <div className="px-4 text-center text-slate-400">
            <Icon name={photo.error ? "warning" : "image"} className="mx-auto h-8 w-8" />
            <p className="mt-2 text-xs font-semibold">Vista previa no disponible</p>
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-md bg-slate-950/75 px-2 py-1 text-[10px] font-bold uppercase text-white">
          {photo.extension}
        </span>
      </div>
      <div className="space-y-2 p-3">
        <p className="truncate text-xs font-bold text-slate-800" title={photo.fileName}>{photo.fileName}</p>
        <div className="text-[11px] leading-4 text-slate-500">
          <p>{date}</p>
          <p>{photo.timestampSource === "exif" ? "Fecha original (EXIF)" : "Fecha del archivo · respaldo"}</p>
          <p>
            {photo.originalWidth && photo.originalHeight
              ? `${photo.originalWidth} × ${photo.originalHeight} px · `
              : ""}
            {formatFileSize(photo.sizeBytes)}
          </p>
        </div>
        {photo.warning ? (
          <p className="rounded-md bg-amber-50 px-2 py-1.5 text-[10px] leading-4 text-amber-800">{photo.warning}</p>
        ) : null}
        {photo.error ? (
          <p className="rounded-md bg-red-50 px-2 py-1.5 text-[10px] leading-4 text-red-700">{photo.error}</p>
        ) : null}
      </div>
    </article>
  );
}
