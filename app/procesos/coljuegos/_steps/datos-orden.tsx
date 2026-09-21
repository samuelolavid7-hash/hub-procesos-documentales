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

export function OrderDataStep({
  draft,
  onFolderNameChange,
  onChange,
  onContinue,
}: OrderDataStepProps) {
  const serials = normalizeSerials(draft.expectedSerialsText);
  const machineCount = Number(draft.machineCount);
  const hasMismatch = machineCount > 0 && serials.length !== machineCount;
  const canContinue = Boolean(
    draft.folderName.trim()
    && draft.number.trim()
    && machineCount > 0
    && draft.modelCode.trim()
    && serials.length > 0,
  );

  return (
    <section aria-labelledby="order-data-title" className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 1 de 4</p>
        <h2 id="order-data-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Datos de la orden de servicio
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Identifica la SO y pega la lista de seriales que deben quedar incluidos en el lote.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(280px,5fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label className="block text-sm font-bold text-slate-800">
            Nombre de la carpeta o SO
            <input
              autoComplete="off"
              className={inputStyles}
              onChange={(event) => onFolderNameChange(event.target.value)}
              placeholder="SO 1534156 20 PC49"
              value={draft.folderName}
            />
          </label>

          <OrderDetectionMessage draft={draft} />

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field
              label="Número de SO"
              onChange={(value) => onChange({ number: value })}
              placeholder="1534156"
              value={draft.number}
            />
            <Field
              label="Cantidad de máquinas"
              min="1"
              onChange={(value) => onChange({ machineCount: value })}
              placeholder="20"
              type="number"
              value={draft.machineCount}
            />
            <Field
              label="Código de modelo"
              onChange={(value) => onChange({ modelCode: value.toUpperCase() })}
              placeholder="PC49"
              value={draft.modelCode}
            />
          </div>

          <label className="mt-5 block text-sm font-bold text-slate-800">
            Seriales esperados
            <textarea
              className="mt-2 min-h-56 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              onChange={(event) => onChange({ expectedSerialsText: event.target.value })}
              placeholder="Pega un serial por línea o sepáralos con espacios o comas"
              value={draft.expectedSerialsText}
            />
          </label>
        </article>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Resumen</p>
            <dl className="mt-4 space-y-4">
              <SummaryDatum label="SO" value={draft.number || "Pendiente"} />
              <SummaryDatum label="Modelo" value={draft.modelCode || "Pendiente"} />
              <SummaryDatum label="Máquinas declaradas" value={machineCount > 0 ? String(machineCount) : "Pendiente"} />
              <SummaryDatum label="Seriales únicos" value={String(serials.length)} />
            </dl>
          </article>

          <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-5 ${hasMismatch ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
            <Icon name={hasMismatch ? "warning" : "check"} className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              {hasMismatch
                ? `Hay ${serials.length} ${serials.length === 1 ? "serial" : "seriales"} para ${machineCount} máquinas. Puedes continuar, pero conviene revisar la lista.`
                : serials.length > 0
                  ? "La cantidad de seriales coincide con la orden."
                  : "Pega los seriales para completar este paso."}
            </p>
          </div>

          <Button className="w-full" disabled={!canContinue} onClick={onContinue} size="lg">
            Continuar a cargar fotos
            <Icon name="arrow-right" className="h-4 w-4" />
          </Button>
        </aside>
      </div>
    </section>
  );
}

const inputStyles = "mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600";

function OrderDetectionMessage({ draft }: { draft: LocalOrderDraft }) {
  if (!draft.folderName.trim()) {
    return <p className="mt-3 text-xs text-slate-500">Formato esperado: SO &lt;número&gt; &lt;cantidad&gt; &lt;modelo&gt;.</p>;
  }

  return (
    <div className={`mt-3 rounded-lg p-3 text-xs ${draft.dataSource === "folder-name" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
      {draft.dataSource === "folder-name"
        ? "Número, cantidad y modelo detectados automáticamente. Puedes corregirlos."
        : "El nombre no sigue el patrón esperado. Completa los tres campos manualmente."}
    </div>
  );
}

function Field({ label, value, onChange, ...inputProps }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; placeholder?: string }) {
  return (
    <label className="text-xs font-semibold text-slate-700">
      {label}
      <input {...inputProps} className={inputStyles} onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function SummaryDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}
