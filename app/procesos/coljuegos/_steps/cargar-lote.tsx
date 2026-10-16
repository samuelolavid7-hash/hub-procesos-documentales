"use client";

import { FolderPicker } from "@/app/procesos/coljuegos/_components/folder-picker";
import { RealPhotoThumbnail } from "@/app/procesos/coljuegos/_components/real-photo-thumbnail";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import type {
  IngestionProgress,
  LocalBatch,
  LocalOrderDraft,
} from "@/lib/coljuegos/types";

interface LoadBatchStepProps {
  orderDraft: LocalOrderDraft;
  batch: LocalBatch | null;
  progress: IngestionProgress;
  onBack: () => void;
  onFilesSelected: (files: File[], folderName: string) => void;
  onContinue: () => void;
}

export function LoadBatchStep({
  orderDraft,
  batch,
  progress,
  onBack,
  onFilesSelected,
  onContinue,
}: LoadBatchStepProps) {
  const isProcessing = progress.status === "running";
  const hasPhotos = Boolean(batch && batch.photos.length > 0);

  return (
    <section aria-labelledby="load-batch-title" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 2 de 4</p>
          <h2 id="load-batch-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Cargar lote fotográfico
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Selecciona la carpeta completa. Las miniaturas se generan localmente y las fotos originales permanecen en tu equipo.
          </p>
        </div>
        <Button disabled={isProcessing} onClick={onBack} variant="secondary">
          Volver a datos del lote
        </Button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,4fr)_minmax(0,8fr)]">
        <OrderSummary draft={orderDraft} />

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Carpeta de fotografías</h3>
              <p className="mt-1 text-sm text-slate-500">Formatos admitidos: JPG, JPEG, PNG, HEIC y HEIF.</p>
            </div>
            <StatusBadge status={hasPhotos ? "Cargado" : "Pendiente"} />
          </div>

          <div className="mt-6">
            {isProcessing ? (
              <ProcessingPanel progress={progress} />
            ) : (
              <FolderPicker onFilesSelected={onFilesSelected} />
            )}
          </div>

          {batch ? <BatchSummary batch={batch} /> : null}

          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${hasPhotos ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"}`}>
                <Icon name={hasPhotos ? "check" : "clock"} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{hasPhotos ? "Lote listo para agrupar" : "Carga pendiente"}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {hasPhotos ? "El siguiente paso ordenará las fotos por fecha y propondrá grupos de cuatro." : "Selecciona una carpeta para continuar."}
                </p>
              </div>
            </div>
            <Button disabled={!hasPhotos || isProcessing} onClick={onContinue}>
              Continuar a agrupación
              <Icon name="arrow-right" className="h-4 w-4" />
            </Button>
          </div>
        </article>
      </div>

      {batch && batch.photos.length > 0 ? (
        <section aria-labelledby="photo-preview-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 id="photo-preview-title" className="text-lg font-bold text-slate-900">Vista previa cronológica</h3>
              <p className="mt-1 text-sm text-slate-500">
                Las fechas aproximadas utilizan la modificación del archivo porque no se encontró DateTimeOriginal en EXIF.
              </p>
            </div>
            <span className="text-sm font-bold text-slate-600">{batch.photos.length} fotos</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {batch.photos.map((photo) => <RealPhotoThumbnail key={photo.id} photo={photo} />)}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function OrderSummary({ draft }: { draft: LocalOrderDraft }) {
  const hasKnownOrder = draft.mode === "with-order";
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Lote activo</p>
      <h3 className="mt-1 text-xl font-bold text-slate-900">{hasKnownOrder ? `SO ${draft.number}` : "Máquinas usadas · sin SO"}</h3>
      <dl className="mt-5 space-y-4">
        <SummaryDatum label="Carpeta" value={draft.folderName || "Se definirá al cargar"} />
        <SummaryDatum label="Modelo" value={draft.modelCode || "No indicado"} />
        <SummaryDatum label="Máquinas" value={draft.machineCount || "Se calculará con las fotos"} />
      </dl>
      {hasKnownOrder ? (
        <div className="mt-5 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800">
          Si la carpeta seleccionada tiene un nombre válido diferente, actualizaremos automáticamente estos datos sin borrar los seriales pegados.
        </div>
      ) : null}
    </aside>
  );
}

function ProcessingPanel({ progress }: { progress: IngestionProgress }) {
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-6">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-teal-700 shadow-sm">
        <Icon name="image" className="h-6 w-6" />
      </span>
      <h4 className="mt-4 text-base font-bold text-slate-900">Preparando miniaturas</h4>
      <p className="mt-1 truncate text-sm text-slate-600">{progress.currentFile ?? "Revisando la carpeta…"}</p>
      <div className="mt-5">
        <ProgressBar
          label={`${progress.processed} de ${progress.total} fotos procesadas`}
          max={progress.total}
          value={progress.processed}
        />
      </div>
    </div>
  );
}

function BatchSummary({ batch }: { batch: LocalBatch }) {
  const hasPhotos = batch.photos.length > 0;
  return (
    <div className="mt-4 space-y-3">
      <div className={`rounded-xl border p-4 ${hasPhotos ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <p className={`text-sm font-bold ${hasPhotos ? "text-emerald-900" : "text-amber-900"}`}>
          {hasPhotos ? `${batch.photos.length} fotografías cargadas` : "No se encontraron fotografías compatibles"}
        </p>
        <p className={`mt-1 text-xs ${hasPhotos ? "text-emerald-800" : "text-amber-800"}`}>
          {batch.ignoredFileCount > 0
            ? `${batch.ignoredFileCount} ${batch.ignoredFileCount === 1 ? "archivo no compatible se ignoró" : "archivos no compatibles se ignoraron"} automáticamente.`
            : "Todos los archivos encontrados eran compatibles."}
        </p>
      </div>

      {batch.errors.length > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold text-red-900">Fotos que no se pudieron leer</p>
          <ul className="mt-2 space-y-1 text-xs text-red-800">
            {batch.errors.map((error) => (
              <li key={`${error.fileName}-${error.message}`}><strong>{error.fileName}:</strong> {error.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {batch.heicConvertedCount > 0 ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold text-blue-900">
            {batch.heicConvertedCount} {batch.heicConvertedCount === 1 ? "foto HEIC/HEIF convertida" : "fotos HEIC/HEIF convertidas"}
          </p>
          <p className="mt-1 text-xs text-blue-800">La conversión a JPEG se realizó localmente y los originales no salieron de este equipo.</p>
        </div>
      ) : null}
    </div>
  );
}

function SummaryDatum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}
