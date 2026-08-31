"use client";

import { useState, type DragEvent } from "react";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ShellOrder, SimulatedBatchUpload } from "@/lib/coljuegos/types";

interface LoadBatchStepProps {
  shellOrder: ShellOrder;
  simulatedBatch: SimulatedBatchUpload;
  batchLoaded: boolean;
  onLoadBatch: () => void;
  onProcessBatch: () => void;
}

export function LoadBatchStep({
  shellOrder,
  simulatedBatch,
  batchLoaded,
  onLoadBatch,
  onProcessBatch,
}: LoadBatchStepProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    onLoadBatch();
  }

  return (
    <section aria-labelledby="load-batch-title" className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 1 de 4</p>
        <h2 id="load-batch-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Cargar lote fotográfico</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Verifica los datos de la Shell Order y carga la carpeta que contiene todas las fotografías del lote.
        </p>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Shell Order</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">SO {shellOrder.number}</h3>
            </div>
            <StatusBadge status="Activo" />
          </div>

          <dl className="grid gap-px bg-slate-200 sm:grid-cols-2">
            <OrderDatum label="Nombre de carpeta" value={shellOrder.folderName} />
            <OrderDatum label="Modelo" value={shellOrder.modelName} detail={shellOrder.modelCode} />
            <OrderDatum label="Máquinas esperadas" value={`${shellOrder.machineCount} máquinas`} />
            <OrderDatum label="Fotos requeridas" value={`${shellOrder.machineCount * 4} fotografías`} detail="4 por máquina" />
          </dl>

          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-900">Seriales esperados</h4>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{shellOrder.expectedSerials.length}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">La lectura de placas se comparará contra esta lista.</p>
            <ol className="mt-4 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              {shellOrder.expectedSerials.map((serial, index) => (
                <li key={serial} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-slate-400 ring-1 ring-slate-200">{index + 1}</span>
                  <span className="truncate font-mono text-xs font-semibold text-slate-700">{serial}</span>
                </li>
              ))}
            </ol>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Fotografías del lote</h3>
              <p className="mt-1 text-sm text-slate-500">Todas las fotos pueden venir mezcladas y con nombres no descriptivos.</p>
            </div>
            <StatusBadge status={batchLoaded ? "Cargado" : "Pendiente"} />
          </div>

          <div
            aria-label="Zona de carga del lote fotográfico"
            className={`mt-6 grid min-h-72 place-items-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${isDragging ? "border-teal-600 bg-teal-50" : batchLoaded ? "border-teal-300 bg-teal-50/50" : "border-slate-300 bg-slate-50"}`}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            {batchLoaded ? (
              <div aria-live="polite" className="max-w-md">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-100 text-teal-700">
                  <Icon name="check" className="h-8 w-8" />
                </span>
                <h4 className="mt-5 text-lg font-bold text-slate-900">Lote cargado correctamente</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{simulatedBatch.fileCount} archivos · {simulatedBatch.totalSize} · {simulatedBatch.imageFormats.join(" y ")}</p>
                <p className="mt-1 text-xs text-slate-500">{simulatedBatch.sourceLabel}</p>
                <Button className="mt-5" size="sm" variant="secondary" onClick={onLoadBatch}>
                  Volver a simular carga
                </Button>
              </div>
            ) : (
              <div className="max-w-md">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-teal-700 shadow-sm ring-1 ring-slate-200">
                  <Icon name="upload" className="h-8 w-8" />
                </span>
                <h4 className="mt-5 text-lg font-bold text-slate-900">Arrastra aquí la carpeta del lote</h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">En este prototipo, el botón carga automáticamente los archivos simulados de la SO.</p>
                <Button className="mt-5" onClick={onLoadBatch}>
                  <Icon name="image" className="h-4 w-4" />
                  Simular carga del lote
                </Button>
                <p className="mt-3 text-xs text-slate-400">Conexión real a SharePoint pendiente</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${batchLoaded ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"}`}>
                <Icon name={batchLoaded ? "check" : "clock"} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{batchLoaded ? "Listo para procesar" : "Carga pendiente"}</p>
                <p className="mt-0.5 text-xs text-slate-500">{batchLoaded ? "El siguiente paso identificará las placas." : "El botón se habilitará al cargar el lote."}</p>
              </div>
            </div>
            <Button disabled={!batchLoaded} onClick={onProcessBatch}>
              Procesar lote
              <Icon name="arrow-right" className="h-4 w-4" />
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}

function OrderDatum({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="bg-white px-5 py-4 sm:px-6">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-slate-900">{value}</dd>
      {detail ? <dd className="mt-0.5 text-xs text-slate-400">{detail}</dd> : null}
    </div>
  );
}
