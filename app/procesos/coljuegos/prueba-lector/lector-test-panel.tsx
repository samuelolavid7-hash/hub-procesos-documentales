"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { ProgressBar } from "@/components/shared/progress-bar";
import { normalizeSerials } from "@/lib/coljuegos/file-ingestion";
import type {
  NivelConfianza,
  ResultadoLecturaPlaca,
} from "@/lib/lectores/contrato";
import { LectorSimulado } from "@/lib/lectores/lector-simulado";

interface TestResult extends ResultadoLecturaPlaca {
  fileName: string;
  index: number;
}

const defaultSerials = Array.from(
  { length: 20 },
  (_, index) => `MX${String(30807 + index).padStart(7, "0")}`,
).join("\n");

const confidenceStyles: Record<NivelConfianza, { bar: string; width: string }> = {
  alta: { bar: "bg-emerald-500", width: "94%" },
  media: { bar: "bg-amber-500", width: "65%" },
  baja: { bar: "bg-rose-500", width: "28%" },
};

export function LectorTestPanel() {
  const reader = useMemo(() => new LectorSimulado(), []);
  const [serialsText, setSerialsText] = useState(defaultSerials);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const expectedSerials = normalizeSerials(serialsText);
  const summary = summarizeResults(results);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(event.target.files ?? []));
    setResults([]);
    setProcessed(0);
    setTotal(0);
  }

  async function runReader(files: File[]) {
    if (files.length === 0 || expectedSerials.length === 0) return;

    setIsRunning(true);
    setResults([]);
    setProcessed(0);
    setTotal(files.length);

    const nextResults: TestResult[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const reading = await reader.leer(file, {
        indiceEnLote: index,
        serialesEsperados: expectedSerials,
      });
      nextResults.push({ ...reading, fileName: file.name, index });
      setResults([...nextResults]);
      setProcessed(index + 1);
    }

    setIsRunning(false);
  }

  function runControlledBatch() {
    const files = Array.from(
      { length: 20 },
      (_, index) => new File([], `PLACA_DEMO_${String(index + 1).padStart(2, "0")}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.UTC(2025, 0, index + 1),
      }),
    );
    setSelectedFiles(files);
    void runReader(files);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Herramienta de validación</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Prueba aislada del lector de placas</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Esta pantalla comprueba el simulador antes de conectarlo al flujo Coljuegos. Ninguna foto se transmite ni se almacena.
          </p>
        </div>
        <Link className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50" href="/procesos/coljuegos">
          Volver a Coljuegos
        </Link>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <strong>Modo demostración:</strong> los resultados son determinísticos y simulan errores deliberadamente. Repetir el mismo lote produce exactamente las mismas lecturas.
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Preparar la prueba</h2>
          <label className="mt-5 block text-xs font-semibold text-slate-700">
            Seriales esperados de la SO
            <textarea
              className="mt-1.5 min-h-48 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              disabled={isRunning}
              onChange={(event) => setSerialsText(event.target.value)}
              value={serialsText}
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">{expectedSerials.length} seriales únicos detectados</p>

          <label className="mt-5 block text-xs font-semibold text-slate-700">
            Fotos candidatas
            <input
              accept=".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic"
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:font-semibold file:text-white"
              disabled={isRunning}
              multiple
              onChange={handleFiles}
              type="file"
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">{selectedFiles.length} archivos seleccionados</p>

          <div className="mt-5 grid gap-3">
            <Button disabled={isRunning || selectedFiles.length === 0 || expectedSerials.length === 0} onClick={() => void runReader(selectedFiles)}>
              <Icon name="sparkles" className="h-4 w-4" />
              Analizar fotos seleccionadas
            </Button>
            <Button disabled={isRunning || expectedSerials.length === 0} onClick={runControlledBatch} variant="secondary">
              Ejecutar 20 casos controlados
            </Button>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ejecución</h2>
                <p className="mt-1 text-sm text-slate-500">Cada lectura tarda entre 300 y 800 ms.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isRunning ? "bg-blue-100 text-blue-700" : results.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {isRunning ? "Analizando" : results.length > 0 ? "Completada" : "Pendiente"}
              </span>
            </div>
            <div className="mt-5">
              <ProgressBar label={`${processed} de ${total} imágenes procesadas`} max={total} value={processed} />
            </div>
          </div>

          {results.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <SummaryCard label="Lectura alta" value={summary.high} tone="emerald" />
                <SummaryCard label="Revisión sugerida" value={summary.medium} tone="amber" />
                <SummaryCard label="Lectura imposible" value={summary.low} tone="rose" />
                <SummaryCard label="No era placa" value={summary.notPlate} tone="slate" />
              </div>
              <div className="space-y-3">
                {results.map((result) => <ResultCard key={`${result.index}-${result.fileName}`} result={result} />)}
              </div>
            </>
          ) : (
            <div className="grid min-h-72 place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <div><Icon name="document" className="mx-auto h-10 w-10 text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-700">Aún no hay resultados</p><p className="mt-1 text-xs text-slate-500">Usa el lote controlado para ver los cuatro tipos de respuesta.</p></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: TestResult }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs text-slate-400">Foto {result.index + 1}</p><h3 className="mt-0.5 font-mono text-sm font-bold text-slate-900">{result.fileName}</h3></div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${result.esPlaca ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}>{result.esPlaca ? "Placa detectada" : "No es placa"}</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReadingDatum label="Serial" value={result.serial ?? "No identificado"} confidence={result.confianzaSerial} />
        <ReadingDatum label="Fecha de fabricación" value={result.fechaFabricacion ?? "No identificada"} confidence={result.confianzaFecha} />
      </div>
      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{result.observaciones}</p>
    </article>
  );
}

function ReadingDatum({ label, value, confidence }: { label: string; value: string; confidence: NivelConfianza }) {
  const style = confidenceStyles[confidence];
  return (
    <div>
      <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="text-[10px] font-bold uppercase text-slate-500">Confianza {confidence}</p></div>
      <p className="mt-1 font-mono text-sm font-bold text-slate-900">{value}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${style.bar}`} style={{ width: style.width }} /></div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "rose" | "slate" }) {
  const tones = { emerald: "bg-emerald-50 text-emerald-800", amber: "bg-amber-50 text-amber-800", rose: "bg-rose-50 text-rose-800", slate: "bg-slate-100 text-slate-700" };
  return <article className={`rounded-xl p-4 ${tones[tone]}`}><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs font-semibold">{label}</p></article>;
}

function summarizeResults(results: TestResult[]) {
  return results.reduce(
    (summary, result) => {
      if (!result.esPlaca) summary.notPlate += 1;
      else if (result.confianzaSerial === "alta") summary.high += 1;
      else if (result.confianzaSerial === "media") summary.medium += 1;
      else summary.low += 1;
      return summary;
    },
    { high: 0, medium: 0, low: 0, notPlate: 0 },
  );
}
