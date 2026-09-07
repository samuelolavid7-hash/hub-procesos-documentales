"use client";

import { FolderPicker } from "@/app/procesos/coljuegos/_components/folder-picker";
import { RealPhotoThumbnail } from "@/app/procesos/coljuegos/_components/real-photo-thumbnail";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { normalizeSerials } from "@/lib/coljuegos/file-ingestion";
import type { BatchMode, IngestionProgress, LocalBatch, LocalOrderDraft, ShellOrder, SimulatedBatchUpload } from "@/lib/coljuegos/types";

interface LoadBatchStepProps {
  shellOrder: ShellOrder;
  simulatedBatch: SimulatedBatchUpload;
  mode: BatchMode;
  demoLoaded: boolean;
  localBatch: LocalBatch | null;
  orderDraft: LocalOrderDraft;
  progress: IngestionProgress;
  onFilesSelected: (files: File[], folderName: string) => void;
  onOrderDraftChange: (field: EditableOrderField, value: string) => void;
  onLoadDemo: () => void;
  onProcessDemo: () => void;
}

export function LoadBatchStep({ shellOrder, simulatedBatch, mode, demoLoaded, localBatch, orderDraft, progress, onFilesSelected, onOrderDraftChange, onLoadDemo, onProcessDemo }: LoadBatchStepProps) {
  const isProcessing = progress.status === "running";
  const realBatchLoaded = mode === "real" && localBatch !== null;
  const normalizedSerials = normalizeSerials(orderDraft.expectedSerialsText);
  const expectedMachineCount = Number(orderDraft.machineCount);
  const serialCountMismatch = realBatchLoaded && expectedMachineCount > 0 && normalizedSerials.length !== expectedMachineCount;

  return (
    <section aria-labelledby="load-batch-title" className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 1 de 4</p>
        <h2 id="load-batch-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Cargar lote fotográfico</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Selecciona la carpeta completa. Las miniaturas y los metadatos se generan en tu navegador; las fotos originales no salen de tu equipo.</p>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {mode === "demo" ? (
          <DemoOrderCard shellOrder={shellOrder} />
        ) : (
          <RealOrderCard draft={orderDraft} disabled={isProcessing} serialCount={normalizedSerials.length} serialCountMismatch={serialCountMismatch} onChange={onOrderDraftChange} />
        )}

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Fotografías del lote</h3>
              <p className="mt-1 text-sm text-slate-500">Se ignoran automáticamente los archivos que no sean imágenes admitidas.</p>
            </div>
            <StatusBadge status={realBatchLoaded || demoLoaded ? "Cargado" : "Pendiente"} />
          </div>

          <div className="mt-6">
            {isProcessing ? (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-6">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-teal-700 shadow-sm"><Icon name="image" className="h-6 w-6" /></span>
                <h4 className="mt-4 text-base font-bold text-slate-900">Preparando miniaturas</h4>
                <p className="mt-1 truncate text-sm text-slate-600">{progress.currentFile ?? "Revisando la carpeta…"}</p>
                <div className="mt-5"><ProgressBar value={progress.processed} max={progress.total} label={`${progress.processed} de ${progress.total} fotos procesadas`} /></div>
              </div>
            ) : (
              <FolderPicker disabled={isProcessing} onFilesSelected={onFilesSelected} />
            )}
          </div>

          {mode === "none" ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>¿Quieres recorrer primero el flujo conocido?</span>
              <button className="font-bold text-teal-700 underline-offset-2 hover:underline" onClick={onLoadDemo}>Usar lote de demostración</button>
            </div>
          ) : null}

          {mode === "demo" && demoLoaded ? <DemoBatchSummary batch={simulatedBatch} onReload={onLoadDemo} /> : null}
          {realBatchLoaded ? <RealBatchSummary batch={localBatch} /> : null}

          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${realBatchLoaded || demoLoaded ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"}`}><Icon name={realBatchLoaded || demoLoaded ? "check" : "clock"} className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-bold text-slate-900">{realBatchLoaded ? "Ingesta real completada" : demoLoaded ? "Lote de demostración listo" : "Carga pendiente"}</p>
                <p className="mt-0.5 text-xs text-slate-500">{realBatchLoaded ? "La clasificación se habilitará en el siguiente bloque de desarrollo." : demoLoaded ? "Puedes continuar por las pantallas simuladas existentes." : "Selecciona una carpeta para comenzar."}</p>
              </div>
            </div>
            <Button disabled={!demoLoaded || mode !== "demo"} onClick={onProcessDemo}>Procesar lote<Icon name="arrow-right" className="h-4 w-4" /></Button>
          </div>
        </article>
      </div>

      {realBatchLoaded && localBatch.photos.length > 0 ? (
        <section aria-labelledby="photo-preview-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h3 id="photo-preview-title" className="text-lg font-bold text-slate-900">Vista previa del lote</h3><p className="mt-1 text-sm text-slate-500">Ordenada por la fecha de captura disponible.</p></div>
            <span className="text-sm font-bold text-slate-600">{localBatch.photos.length} fotos</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{localBatch.photos.map((photo) => <RealPhotoThumbnail key={photo.id} photo={photo} />)}</div>
        </section>
      ) : null}
    </section>
  );
}

type EditableOrderField = "number" | "machineCount" | "modelCode" | "expectedSerialsText";

function RealOrderCard({ draft, disabled, serialCount, serialCountMismatch, onChange }: { draft: LocalOrderDraft; disabled: boolean; serialCount: number; serialCountMismatch: boolean; onChange: (field: EditableOrderField, value: string) => void }) {
  const inputStyles = "mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100";
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Shell Order</p><h3 className="mt-1 text-lg font-bold text-slate-900">Datos del lote real</h3>{draft.folderName ? <p className="mt-1 break-words text-xs text-slate-500">Carpeta: {draft.folderName}</p> : null}</div>
      <div className="space-y-4 px-5 py-5 sm:px-6">
        {!draft.folderName ? <p className="rounded-lg bg-blue-50 p-3 text-sm leading-5 text-blue-800">Al seleccionar una carpeta intentaremos completar estos datos desde un nombre como <strong>SO 1534156 20 PC49</strong>.</p> : draft.dataSource === "folder-name" ? <p className="rounded-lg bg-emerald-50 p-3 text-sm leading-5 text-emerald-800">Datos básicos detectados desde el nombre de la carpeta. Puedes corregirlos.</p> : <p className="rounded-lg bg-amber-50 p-3 text-sm leading-5 text-amber-800">No reconocimos el formato del nombre. Completa los datos manualmente.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Número de SO<input className={inputStyles} disabled={disabled} value={draft.number} onChange={(event) => onChange("number", event.target.value)} placeholder="1534156" /></label>
          <label className="text-xs font-semibold text-slate-700">Cantidad de máquinas<input className={inputStyles} disabled={disabled} min="1" type="number" value={draft.machineCount} onChange={(event) => onChange("machineCount", event.target.value)} placeholder="20" /></label>
        </div>
        <label className="block text-xs font-semibold text-slate-700">Código de modelo<input className={inputStyles} disabled={disabled} value={draft.modelCode} onChange={(event) => onChange("modelCode", event.target.value.toUpperCase())} placeholder="PC49" /></label>
        <label className="block text-xs font-semibold text-slate-700">Seriales esperados<textarea className="mt-1.5 min-h-32 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100" disabled={disabled} value={draft.expectedSerialsText} onChange={(event) => onChange("expectedSerialsText", event.target.value)} placeholder="Pega los seriales separados por líneas, espacios o comas" /></label>
        <div className={`flex items-start gap-2 rounded-lg p-3 text-xs ${serialCountMismatch ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-600"}`}><Icon name={serialCountMismatch ? "warning" : "info"} className="mt-0.5 h-4 w-4 shrink-0" /><p>{serialCount} seriales únicos detectados.{serialCountMismatch ? ` La cantidad no coincide con las ${draft.machineCount} máquinas indicadas.` : " Se eliminan duplicados y se normalizan a mayúsculas."}</p></div>
      </div>
    </article>
  );
}

function DemoOrderCard({ shellOrder }: { shellOrder: ShellOrder }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Shell Order · demostración</p><h3 className="mt-1 text-lg font-bold text-slate-900">SO {shellOrder.number}</h3></div><StatusBadge status="Activo" /></div>
      <dl className="grid gap-px bg-slate-200 sm:grid-cols-2"><OrderDatum label="Nombre de carpeta" value={shellOrder.folderName} /><OrderDatum label="Modelo" value={shellOrder.modelName} detail={shellOrder.modelCode} /><OrderDatum label="Máquinas esperadas" value={`${shellOrder.machineCount} máquinas`} /><OrderDatum label="Fotos requeridas" value={`${shellOrder.machineCount * 4} fotografías`} detail="4 por máquina" /></dl>
      <div className="px-5 py-5 sm:px-6"><div className="flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-slate-900">Seriales esperados</h4><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{shellOrder.expectedSerials.length}</span></div><ol className="mt-4 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">{shellOrder.expectedSerials.map((serial, index) => <li key={serial} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-slate-400 ring-1 ring-slate-200">{index + 1}</span><span className="truncate font-mono text-xs font-semibold text-slate-700">{serial}</span></li>)}</ol></div>
    </article>
  );
}

function DemoBatchSummary({ batch, onReload }: { batch: SimulatedBatchUpload; onReload: () => void }) {
  return <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-center"><p className="text-sm font-bold text-slate-900">Lote de demostración cargado</p><p className="mt-1 text-xs text-slate-600">{batch.fileCount} archivos · {batch.totalSize} · {batch.imageFormats.join(" y ")}</p><Button className="mt-3" size="sm" variant="secondary" onClick={onReload}>Reiniciar demostración</Button></div>;
}

function RealBatchSummary({ batch }: { batch: LocalBatch }) {
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-900">{batch.photos.length} fotos admitidas y preparadas</p><p className="mt-1 text-xs text-emerald-800">{batch.ignoredFileCount > 0 ? `${batch.ignoredFileCount} archivos no compatibles fueron ignorados. ` : ""}{batch.errors.length > 0 ? `${batch.errors.length} fotos requieren revisión.` : "No se detectaron errores de lectura."}</p></div>
      {batch.hasHeic ? <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" /><p>El lote contiene HEIC. Estos archivos se conservan, pero algunos navegadores no pueden mostrar su miniatura. Para la futura generación del PDF conviene convertir una copia a JPG o PNG.</p></div> : null}
      {batch.errors.length > 0 ? <div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-xs font-bold text-red-900">Archivos con error</p><ul className="mt-2 space-y-1 text-xs text-red-800">{batch.errors.map((error) => <li key={error.fileName}><strong>{error.fileName}:</strong> {error.message}</li>)}</ul></div> : null}
    </div>
  );
}

function OrderDatum({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="bg-white px-5 py-4 sm:px-6"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 text-sm font-bold text-slate-900">{value}</dd>{detail ? <dd className="mt-0.5 text-xs text-slate-400">{detail}</dd> : null}</div>;
}
