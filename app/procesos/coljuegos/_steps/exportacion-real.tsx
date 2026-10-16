"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { ProgressBar } from "@/components/shared/progress-bar";
import { useToast } from "@/components/shared/toast";
import { normalizeSerials } from "@/lib/coljuegos/file-ingestion";
import { isGroupComplete } from "@/lib/coljuegos/grouping";
import type { ExportFailure, ExportProgress } from "@/lib/coljuegos/zip-generator";
import type { GrupoFotografico, LocalBatchPhoto, LocalOrderDraft } from "@/lib/coljuegos/types";

interface ExportStepProps {
  groups: GrupoFotografico[];
  photos: LocalBatchPhoto[];
  order: LocalOrderDraft;
  onBack: () => void;
}

interface ExportSummary {
  exportedSerials: string[];
  failures: ExportFailure[];
}

export function RealExportStep({ groups, photos, order, onBack }: ExportStepProps) {
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [downloadingSerial, setDownloadingSerial] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExportSummary | null>(null);
  const { showToast } = useToast();
  const eligibleGroups = useMemo(
    () => groups.filter((group) => group.confirmado && isGroupComplete(group)),
    [groups],
  );
  const expectedSerials = normalizeSerials(order.expectedSerialsText);
  const eligibleSerials = eligibleGroups.flatMap((group) => group.serialAsignado ? [group.serialAsignado] : []);
  const missingSerials = expectedSerials.filter((serial) => !eligibleSerials.includes(serial));
  const hasExpectedSerials = expectedSerials.length > 0;
  const isExporting = progress !== null;

  async function downloadIndividualPdf(group: GrupoFotografico) {
    const serial = group.serialAsignado;
    if (!serial) return;
    setDownloadingSerial(serial);
    try {
      const {
        createDownloadBlob,
        downloadBlob,
        generateMachinePdf,
        safeFileName,
      } = await import("@/lib/coljuegos/pdf-generator");
      const pdf = await generateMachinePdf({ group, order, photos });
      downloadBlob(createDownloadBlob(pdf, "application/pdf"), `${safeFileName(serial)}.pdf`);
      showToast({ title: "PDF generado", description: `El expediente ${serial} está listo.`, tone: "success" });
    } catch (error) {
      showToast({
        title: "No pudimos generar el PDF",
        description: error instanceof Error ? error.message : "Revisa las fotos de este grupo.",
        tone: "info",
      });
    } finally {
      setDownloadingSerial(null);
    }
  }

  async function downloadPackage() {
    setSummary(null);
    try {
      const { generateExportPackage } = await import("@/lib/coljuegos/zip-generator");
      const { downloadBlob, safeFileName } = await import("@/lib/coljuegos/pdf-generator");
      const result = await generateExportPackage({
        groups,
        order,
        photos,
        onProgress: setProgress,
      });
      setSummary({ exportedSerials: result.exportedSerials, failures: result.failures });
      if (result.exportedSerials.length > 0) {
        const packageName = order.mode === "with-order" && order.number
          ? `folio_${safeFileName(order.number)}.zip`
          : `lote_${safeFileName(order.folderName || "maquinas-usadas")}.zip`;
        downloadBlob(result.blob, packageName);
      }
      showToast({
        title: result.failures.length ? "Exportación terminada con observaciones" : "Expedientes exportados",
        description: `${result.exportedSerials.length} PDF ${result.exportedSerials.length === 1 ? "generado" : "generados"}.`,
        tone: result.failures.length ? "info" : "success",
      });
    } catch {
      showToast({ title: "No pudimos crear el ZIP", description: "Intenta nuevamente. Tus fotos siguen disponibles en esta pantalla.", tone: "info" });
    } finally {
      setProgress(null);
    }
  }

  return (
    <section aria-labelledby="export-title" className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 4 de 4</p>
          <h2 id="export-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Generar y descargar expedientes</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Cada PDF contiene cuatro páginas A4. La preparación ocurre en este navegador y conserva la proporción y orientación de las fotos.
          </p>
        </div>
        <Button disabled={isExporting || Boolean(downloadingSerial)} onClick={onBack} variant="secondary">Volver a agrupación</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <ExportStat label="PDF listos para generar" value={eligibleGroups.length} />
        <ExportStat label="Seriales aún pendientes" value={missingSerials.length} warning={missingSerials.length > 0} />
        <ExportStat label="Páginas por expediente" value={4} />
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Expedientes confirmados</h3>
            <p className="mt-1 text-sm text-slate-500">Puedes descargar un PDF por separado o generar el paquete completo.</p>
          </div>
          <Button disabled={!eligibleGroups.length || isExporting || Boolean(downloadingSerial)} onClick={() => void downloadPackage()} size="lg">
            <Icon name="archive" className="h-5 w-5" />
            {isExporting ? "Generando paquete…" : "Descargar ZIP completo"}
          </Button>
        </div>

        {progress ? (
          <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <ProgressBar
              label={progress.phase === "zip" ? "Comprimiendo el paquete final…" : `Generando ${progress.currentSerial ?? "expediente"}…`}
              max={Math.max(progress.total, 1)}
              value={progress.completed}
            />
            <p className="mt-2 text-xs text-teal-800">Los PDFs se procesan uno por uno para cuidar la memoria del equipo.</p>
          </div>
        ) : null}

        <div className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {eligibleGroups.map((group) => (
            <div key={group.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700"><Icon name="document" className="h-5 w-5" /></span>
                <div><p className="text-sm font-bold text-slate-900">{group.serialAsignado}.pdf</p><p className="text-xs text-slate-500">4 páginas · {order.mode === "with-order" && order.number ? `SO ${order.number}` : "Lote sin SO"} · {order.modelCode || "Modelo no indicado"}</p></div>
              </div>
              <Button
                disabled={isExporting || Boolean(downloadingSerial)}
                onClick={() => void downloadIndividualPdf(group)}
                size="sm"
                variant="secondary"
              >
                {downloadingSerial === group.serialAsignado ? "Generando…" : "Descargar PDF"}
              </Button>
            </div>
          ))}
          {!eligibleGroups.length ? <p className="p-5 text-sm text-slate-500">No hay grupos confirmados para exportar.</p> : null}
        </div>
      </article>

      <ExportReview hasExpectedSerials={hasExpectedSerials} missingSerials={missingSerials} summary={summary} />
    </section>
  );
}

function ExportStat({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return <div className={`rounded-xl border p-4 shadow-sm ${warning ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-900"}`}><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs font-semibold">{label}</p></div>;
}

function ExportReview({ hasExpectedSerials, missingSerials, summary }: { hasExpectedSerials: boolean; missingSerials: string[]; summary: ExportSummary | null }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Seriales conocidos sin expediente</h3>
        {missingSerials.length ? <div className="mt-3 flex flex-wrap gap-2">{missingSerials.map((serial) => <span key={serial} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{serial}</span>)}</div> : <p className="mt-2 text-xs text-emerald-700">{hasExpectedSerials ? "Todos los seriales conocidos tienen expediente." : "Este lote no tiene una lista previa de seriales."}</p>}
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Resultado de la última exportación</h3>
        {!summary ? <p className="mt-2 text-xs text-slate-500">Todavía no se generó el paquete ZIP.</p> : (
          <div className="mt-3 space-y-2 text-xs">
            <p className="font-bold text-emerald-700">
              {summary.exportedSerials.length} {summary.exportedSerials.length === 1 ? "expediente exportado" : "expedientes exportados"} correctamente.
            </p>
            {summary.failures.map((failure) => <p key={failure.serial} className="rounded-md bg-red-50 p-2 text-red-700"><strong>{failure.serial}:</strong> {failure.message}</p>)}
          </div>
        )}
      </article>
    </div>
  );
}
