"use client";

import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { normalizeSerials } from "@/lib/coljuegos/file-ingestion";
import type { LocalOrderDraft } from "@/lib/coljuegos/types";

interface OrderDataStepProps {
  draft: LocalOrderDraft;
  onFolderNameChange: (value: string) => void;
  onChange: (patch: Partial<LocalOrderDraft>) => void;
  onContinue: () => void;
}

export function OrderDataStep({ draft, onFolderNameChange, onChange, onContinue }: OrderDataStepProps) {
  const serials = normalizeSerials(draft.expectedSerialsText);
  const machineCount = Number(draft.machineCount);
  const hasKnownOrder = draft.mode === "with-order";
  const hasMismatch = machineCount > 0 && serials.length > 0 && serials.length !== machineCount;
  const canContinue = hasKnownOrder
    ? Boolean(draft.folderName.trim() && draft.number.trim() && machineCount > 0 && draft.modelCode.trim() && serials.length > 0)
    : true;

  return (
    <section aria-labelledby="order-data-title" className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 1 de 4</p>
        <h2 id="order-data-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Datos del lote</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Puedes trabajar con una SO conocida o preparar expedientes de máquinas usadas sin indicar su orden de origen.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(280px,5fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <fieldset>
            <legend className="text-sm font-bold text-slate-800">¿Qué tipo de lote vas a procesar?</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ModeOption checked={hasKnownOrder} description="La SO define cantidad, modelo y seriales esperados." label="Tengo una SO conocida" onChange={() => onChange({ mode: "with-order" })} />
              <ModeOption checked={!hasKnownOrder} description="Para máquinas usadas que pueden venir de distintas SO." label="Lote sin SO" onChange={() => onChange({ mode: "without-order", number: "", folderName: "", dataSource: "manual" })} />
            </div>
          </fieldset>

          {hasKnownOrder ? (
            <KnownOrderFields draft={draft} onChange={onChange} onFolderNameChange={onFolderNameChange} />
          ) : (
            <UsedMachinesFields draft={draft} onChange={onChange} />
          )}
        </article>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Resumen</p>
            <dl className="mt-4 space-y-4">
              <SummaryDatum label="Tipo" value={hasKnownOrder ? "SO conocida" : "Lote sin SO"} />
              <SummaryDatum label="SO" value={hasKnownOrder ? draft.number || "Pendiente" : "No requerida"} />
              <SummaryDatum label="Modelo" value={draft.modelCode || (hasKnownOrder ? "Pendiente" : "No indicado")} />
              <SummaryDatum label="Máquinas" value={machineCount > 0 ? String(machineCount) : "Se calculará con las fotos"} />
              <SummaryDatum label="Seriales conocidos" value={serials.length ? String(serials.length) : "Se asignarán manualmente"} />
            </dl>
          </article>

          <ValidationMessage hasKnownOrder={hasKnownOrder} hasMismatch={hasMismatch} machineCount={machineCount} serialCount={serials.length} />

          <Button className="w-full" disabled={!canContinue} onClick={onContinue} size="lg">
            Continuar a cargar fotos
            <Icon name="arrow-right" className="h-4 w-4" />
          </Button>
        </aside>
      </div>
    </section>
  );
}

function KnownOrderFields({ draft, onChange, onFolderNameChange }: { draft: LocalOrderDraft; onChange: (patch: Partial<LocalOrderDraft>) => void; onFolderNameChange: (value: string) => void }) {
  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <label className="block text-sm font-bold text-slate-800">
        Nombre de la carpeta o SO
        <input autoComplete="off" className={inputStyles} onChange={(event) => onFolderNameChange(event.target.value)} placeholder="SO 1534156 20 PC49" value={draft.folderName} />
      </label>
      <OrderDetectionMessage draft={draft} />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Número de SO" onChange={(value) => onChange({ number: value })} placeholder="1534156" value={draft.number} />
        <Field label="Cantidad de máquinas" min="1" onChange={(value) => onChange({ machineCount: value })} placeholder="20" type="number" value={draft.machineCount} />
        <Field label="Código de modelo" onChange={(value) => onChange({ modelCode: value.toUpperCase() })} placeholder="PC49" value={draft.modelCode} />
      </div>
      <SerialField draft={draft} onChange={onChange} required />
    </div>
  );
}

function UsedMachinesFields({ draft, onChange }: { draft: LocalOrderDraft; onChange: (patch: Partial<LocalOrderDraft>) => void }) {
  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        No necesitas conocer las SO originales. La cantidad de máquinas se calculará por los grupos de fotos y podrás escribir cada serial durante la agrupación.
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Cantidad estimada (opcional)" min="1" onChange={(value) => onChange({ machineCount: value })} placeholder="Ej. 12" type="number" value={draft.machineCount} />
        <Field label="Código de modelo (opcional)" onChange={(value) => onChange({ modelCode: value.toUpperCase() })} placeholder="Ej. PC49" value={draft.modelCode} />
      </div>
      <SerialField draft={draft} onChange={onChange} />
    </div>
  );
}

function SerialField({ draft, onChange, required = false }: { draft: LocalOrderDraft; onChange: (patch: Partial<LocalOrderDraft>) => void; required?: boolean }) {
  return (
    <label className="mt-5 block text-sm font-bold text-slate-800">
      {required ? "Seriales esperados" : "Seriales conocidos (opcional)"}
      <textarea
        className="mt-2 min-h-48 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
        onChange={(event) => onChange({ expectedSerialsText: event.target.value })}
        placeholder={required ? "Pega un serial por línea o sepáralos con espacios o comas" : "Puedes dejarlos vacíos y escribirlos al confirmar cada máquina"}
        value={draft.expectedSerialsText}
      />
    </label>
  );
}

function ModeOption({ checked, description, label, onChange }: { checked: boolean; description: string; label: string; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${checked ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-slate-200 hover:border-slate-300"}`}>
      <input checked={checked} className="mt-1 h-4 w-4 accent-teal-700" name="order-mode" onChange={onChange} type="radio" />
      <span><span className="block text-sm font-bold text-slate-900">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span>
    </label>
  );
}

function ValidationMessage({ hasKnownOrder, hasMismatch, machineCount, serialCount }: { hasKnownOrder: boolean; hasMismatch: boolean; machineCount: number; serialCount: number }) {
  const tone = hasMismatch ? "border-amber-200 bg-amber-50 text-amber-900" : hasKnownOrder ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-blue-200 bg-blue-50 text-blue-900";
  let message = "Puedes continuar sin indicar una SO. Los seriales se asignarán manualmente después de cargar las fotos.";
  if (hasKnownOrder) {
    message = hasMismatch
      ? `Hay ${serialCount} ${serialCount === 1 ? "serial" : "seriales"} para ${machineCount} máquinas. Puedes continuar, pero conviene revisar la lista.`
      : serialCount > 0 ? "La cantidad de seriales coincide con la orden." : "Completa los datos y pega los seriales para continuar.";
  }
  return <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-5 ${tone}`}><Icon name={hasMismatch ? "warning" : hasKnownOrder ? "check" : "info"} className="mt-0.5 h-5 w-5 shrink-0" /><p>{message}</p></div>;
}

const inputStyles = "mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600";

function OrderDetectionMessage({ draft }: { draft: LocalOrderDraft }) {
  if (!draft.folderName.trim()) return <p className="mt-3 text-xs text-slate-500">Formato esperado: SO &lt;número&gt; &lt;cantidad&gt; &lt;modelo&gt;.</p>;
  return <div className={`mt-3 rounded-lg p-3 text-xs ${draft.dataSource === "folder-name" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{draft.dataSource === "folder-name" ? "Número, cantidad y modelo detectados automáticamente. Puedes corregirlos." : "El nombre no sigue el patrón esperado. Completa los tres campos manualmente."}</div>;
}

function Field({ label, value, onChange, ...inputProps }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; placeholder?: string }) {
  return <label className="text-xs font-semibold text-slate-700">{label}<input {...inputProps} className={inputStyles} onChange={(event) => onChange(event.target.value)} value={value} /></label>;
}

function SummaryDatum({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-sm text-slate-500">{label}</dt><dd className="text-right text-sm font-bold text-slate-900">{value}</dd></div>;
}
