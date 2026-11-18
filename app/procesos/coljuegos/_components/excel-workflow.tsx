"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/button";
import { importExcel } from "@/lib/coljuegos/excel-import";
import { cabinets, configurationKey, lotNameFromExcel, recordProblems, standardViews, type Aliases, type Cabinet, type Condition, type ExcelRecord, type Standards } from "@/lib/coljuegos/excel-model";
import { readConfiguration, saveConfiguration } from "@/lib/coljuegos/excel-storage";
import { ingestLocalFiles } from "@/lib/coljuegos/file-ingestion";
import { generateExportPackage } from "@/lib/coljuegos/zip-generator";
import { downloadBlob, safeFileName } from "@/lib/coljuegos/pdf-generator";
import { groupFieldLabels } from "@/lib/coljuegos/grouping";
import type { GrupoFotografico, LocalBatchPhoto } from "@/lib/coljuegos/types";

const inputStyle = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100";
export function ExcelWorkflow() {
  const [records, setRecords] = useState<ExcelRecord[]>([]);
  const [sourceFileName, setSourceFileName] = useState("");
  const [standards, setStandards] = useState<Standards>({});
  const [aliases, setAliases] = useState<Aliases>({});
  const [cabinet, setCabinet] = useState<Cabinet>("Peak Curve");
  const [condition, setCondition] = useState<Condition>("usado");
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [onlyAttention, setOnlyAttention] = useState(false);
  const ownedUrls = useRef(new Set<string>());
  const operation = useRef(false);
  const key = configurationKey(cabinet, condition);
  const included = records.filter((record) => !record.excluded);
  const ready = included.filter((record) => recordProblems(record, records, standards).length === 0);
  const pending = included.length - ready.length;
  const pendingRecords = included.filter((record) => recordProblems(record, records, standards).length > 0);
  const lotName = lotNameFromExcel(sourceFileName);

  function openPending(record: ExcelRecord) {
    setOnlyAttention(false);
    // Espera a que React muestre todas las filas antes de enfocar el expediente.
    requestAnimationFrame(() => {
      const element = document.getElementById(`registro-${record.id}`);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
      element?.focus({ preventScroll: true });
    });
  }

  useEffect(() => {
    let cancelled = false;
    const urls = ownedUrls.current;
    readConfiguration().then((configuration) => {
      for (const views of Object.values(configuration.standards)) for (const photo of Object.values(views)) if (photo?.thumbnailUrl) {
        if (cancelled) URL.revokeObjectURL(photo.thumbnailUrl); else urls.add(photo.thumbnailUrl);
      }
      if (!cancelled) { setStandards(configuration.standards); setAliases(configuration.aliases); setLoaded(true); }
    }).catch(() => { if (!cancelled) { setMessage("No se pudo recuperar el catálogo local. Puedes configurarlo para esta sesión."); setLoaded(true); } });
    return () => { cancelled = true; for (const url of urls) URL.revokeObjectURL(url); urls.clear(); };
  }, []);

  function remember(photo: LocalBatchPhoto) { if (photo.thumbnailUrl) ownedUrls.current.add(photo.thumbnailUrl); return photo; }
  function updateRecord(id: string, patch: Partial<ExcelRecord>) {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...patch, reviewed: patch.reviewed ?? false } : record));
  }
  async function run(task: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true; setBusy(true); setMessage("");
    try { await task(); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo completar la operación."); }
    finally { operation.current = false; setBusy(false); }
  }
  async function loadPhoto(file: File): Promise<LocalBatchPhoto> {
    const batch = await ingestLocalFiles({ files: [file], folderName: "Excel", onProgress: () => {} });
    const photo = batch.photos.find((candidate) => candidate.processingStatus !== "error");
    if (!photo) throw new Error(batch.errors[0]?.message ?? "No se pudo leer la imagen.");
    return remember({ ...photo, id: crypto.randomUUID() });
  }
  async function persist(nextStandards: Standards, nextAliases: Aliases) {
    await saveConfiguration({ standards: nextStandards, aliases: nextAliases });
    setMessage("Configuración guardada en este navegador. Puedes actualizar las fotos cuando lo necesites.");
  }
  async function exportLot() {
    if (!included.length || pending) throw new Error("Revisa o excluye todos los registros pendientes antes de generar el lote.");
    const groups: GrupoFotografico[] = ready.map((record, index) => {
      const views = standards[configurationKey(record.cabinet, record.condition)];
      return { id: record.id, numeroGrupo: index + 1, serialAsignado: record.serial, confirmado: true, origen: "corregido-manualmente", codigoModelo: record.cabinet, fotos: { placa: record.plate!.id, frontal: views.frontal!.id, lateralIzquierda: views.lateralIzquierda!.id, lateralDerecha: views.lateralDerecha!.id } };
    });
    const photos = Array.from(new Map([...ready.flatMap((record) => record.plate ? [record.plate] : []), ...Object.values(standards).flatMap((views) => Object.values(views).filter((photo): photo is LocalBatchPhoto => Boolean(photo)))].map((photo) => [photo.id, photo])).values());
    const result = await generateExportPackage({ groups, photos, order: { mode: "without-order", number: "", folderName: lotName, machineCount: String(groups.length), modelCode: "", expectedSerialsText: "", dataSource: "manual" }, onProgress: (progress) => setMessage(progress.phase === "zip" ? "Preparando ZIP…" : `Generando ${progress.completed + 1} de ${progress.total}: ${progress.currentSerial}`) });
    if (result.failures.length) {
      setMessage(`No se descargó un lote incompleto. Fallaron: ${result.failures.map((failure) => `${failure.serial}: ${failure.message}`).join("; ")}. Corrige los archivos y vuelve a generar.`);
      return;
    }
    if (result.exportedSerials.length !== included.length) throw new Error("La cantidad de PDF no coincide con los seriales incluidos.");
    downloadBlob(result.blob, `${safeFileName(lotName)}.zip`);
    setMessage(`ZIP generado con ${result.exportedSerials.length} PDF individuales, cuatro páginas por serial.`);
  }

  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold">Expedientes desde Excel</h1><p className="mt-2 text-sm text-slate-600">Cada fila incluida genera un expediente: placa propia y tres vistas del gabinete y condición. Todo se procesa en tu navegador.</p></header>
    {sourceFileName && <p className="rounded-lg bg-teal-50 p-3 text-sm"><strong>Lote: {lotName}</strong><span className="block text-xs text-slate-600">Archivo original: {sourceFileName}</span></p>}
    <a className="inline-block text-sm font-semibold text-teal-700 underline" href="/plantillas/Plantilla-expedientes-Coljuegos.xlsx" download>Descargar plantilla Excel de entrada</a>
    <fieldset disabled={busy || !loaded} className="space-y-6 disabled:opacity-75">
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-3 text-lg font-bold">1. Importar Excel del lote</h2><p className="mb-3 text-sm text-slate-600">Comienza cargando el Excel. Los gabinetes, las condiciones y las placas se asignarán a cada registro con los datos disponibles en el archivo.</p><label className="block">Libro con columnas Gabinete y Seriales<input className="mt-2 block w-full text-sm" type="file" accept=".xlsx" onChange={(event) => { const file = event.target.files?.[0]; if (file) void run(async () => { const result = await importExcel(file, aliases); for (const record of result.records) if (record.plate) remember(record.plate); setRecords(result.records); setSourceFileName(file.name); setWarnings(result.warnings); setMessage(`${result.records.length} filas importadas de ${result.sheets.join(", ")}. Revisa las observaciones antes de generar.`); }); event.target.value = ""; }} /></label>
        <p className="mt-2 text-xs text-slate-500">Imágenes en celda de Excel mediante metadatos enriquecidos. Una celda #VALUE! puede contener una imagen válida. Si no se resuelve su vínculo, quedará pendiente para asignación manual.</p>
        {Array.from(new Set(records.map((record) => record.reference))).filter(Boolean).map((reference) => <div key={reference} className="mt-3 grid items-center gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]"><span className="text-sm">Referencia original: <strong>{reference}</strong></span><select aria-label={`Equivalencia de ${reference}`} className={inputStyle} value={aliases[reference]?.cabinet ?? ""} onChange={(event) => { if (!event.target.value) return; const mapped = { cabinet: event.target.value as Cabinet, condition: "" as Condition }; setAliases((current) => ({ ...current, [reference]: mapped })); }}><option value="">Elegir equivalencia explícita</option>{cabinets.map((name) => <option key={name}>{name}</option>)}</select><Button variant="secondary" disabled={!aliases[reference]} onClick={() => void run(async () => { const mapped = aliases[reference]; setRecords((current) => current.map((record) => record.reference === reference ? { ...record, cabinet: mapped.cabinet, reviewed: false } : record)); await persist(standards, aliases); })}>Aplicar a filas y guardar</Button></div>)}
        {warnings.map((warning) => <p key={warning} className="mt-2 text-sm text-amber-800">{warning}</p>)}
      </section>
      <details className="rounded-xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-lg font-bold">2. Fotografías estándar por gabinete</summary>
        <p className="my-3 text-sm text-slate-600">Abre esta sección si necesitas agregar o actualizar las vistas. Las fotos ya guardadas se aplican automáticamente según el gabinete y la condición de cada registro.</p>
        <div className="grid gap-3 sm:grid-cols-2"><label>Gabinete<select className={inputStyle} value={cabinet} onChange={(event) => setCabinet(event.target.value as Cabinet)}>{cabinets.map((name) => <option key={name}>{name}</option>)}</select></label><label>Condición<select className={inputStyle} value={condition} onChange={(event) => setCondition(event.target.value as Condition)}><option value="usado">Usado</option><option value="nuevo">Nuevo</option></select></label></div>
        <p className="my-3 text-sm text-slate-600">Nuevo y usado tienen configuraciones independientes. Carga la vista frontal, lateral izquierda y lateral derecha en su posición correspondiente. Comprueba las vistas antes de guardar.</p>
        <div className="grid gap-4 sm:grid-cols-3">{standardViews.map((view) => <label key={`${key}:${view}`} className="space-y-2 rounded-lg border p-3"><span className="font-semibold">{groupFieldLabels[view]}</span><Thumbnail photo={standards[key]?.[view]} /><input className="w-full text-xs" type="file" accept="image/jpeg,image/png,.heic,.heif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void run(async () => { const photo = await loadPhoto(file); setStandards((current) => ({ ...current, [key]: { ...current[key], [view]: photo } })); }); }} /></label>)}</div>
        <Button className="mt-4" onClick={() => void run(() => persist(standards, aliases))}>Confirmar vistas y guardar catálogo</Button>
        <p className="mt-2 text-xs text-slate-500">Se guarda en este navegador y equipo; no se comparte automáticamente con otros usuarios.</p>
      </details>
      <section className="space-y-3"><h2 className="text-lg font-bold">3. Revisar registros</h2><p>{ready.length} listos · {pending} necesitan atención · {records.length - included.length} excluidos · {ready.length} PDF previstos</p><label className="flex gap-2 text-sm"><input type="checkbox" checked={onlyAttention} onChange={(event) => setOnlyAttention(event.target.checked)} />Mostrar solo registros pendientes</label>
        {pendingRecords.length > 0 && <aside className="rounded-xl border border-amber-300 bg-amber-50 p-4"><h3 className="font-bold text-amber-950">Pendientes por serial</h3><p className="mt-1 text-sm text-amber-900">Pulsa un registro para ir directamente a corregirlo.</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{pendingRecords.map((record) => <li key={record.id}><button className="w-full rounded-lg border border-amber-200 bg-white p-3 text-left text-xs focus-visible:outline-2 focus-visible:outline-teal-600" onClick={() => openPending(record)}><strong className="block text-sm">{record.serial || "Sin serial"} · {record.sheet}, fila {record.row}</strong>{recordProblems(record, records, standards).join(" · ")}</button></li>)}</ul></aside>}
        {records.filter((record) => !onlyAttention || (!record.excluded && recordProblems(record, records, standards).length > 0)).map((record) => {
          const problems = recordProblems(record, records, standards);
          return <article key={record.id} id={`registro-${record.id}`} tabIndex={-1} className={`grid scroll-mt-6 gap-4 rounded-xl border bg-white p-4 focus:outline-2 focus:outline-teal-600 md:grid-cols-[10rem_1fr] ${record.excluded ? "opacity-60" : problems.length ? "border-amber-300" : "border-emerald-300"}`}>
            <div><Thumbnail photo={record.plate} /><label className="mt-2 block text-xs">Cambiar placa<input className="mt-1 w-full" type="file" accept="image/jpeg,image/png,.heic,.heif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void run(async () => updateRecord(record.id, { plate: await loadPhoto(file) })); }} /></label></div>
            <div className="space-y-3"><p className="text-xs text-slate-500">{record.sheet} · fila {record.row} · referencia: {record.reference || "Sin gabinete"}</p><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Serial<input className={inputStyle} value={record.serial} onChange={(event) => updateRecord(record.id, { serial: event.target.value })} /></label><label className="text-sm">Gabinete<select className={inputStyle} value={record.cabinet} onChange={(event) => updateRecord(record.id, { cabinet: event.target.value as Cabinet })}><option value="">Revisar gabinete</option>{cabinets.map((name) => <option key={name}>{name}</option>)}</select></label><label className="text-sm">Condición<select className={inputStyle} value={record.condition} onChange={(event) => updateRecord(record.id, { condition: event.target.value as Condition })}><option value="">Revisar condición</option><option value="nuevo">Nuevo</option><option value="usado">Usado</option></select></label></div>
              <p className="text-sm">Observación del Excel: <strong>{record.observation || "Sin observación"}</strong></p>
              {record.defaultExclusionReason && <p className="text-sm font-semibold text-amber-800">{record.defaultExclusionReason}. Puedes volver a incluirlo después de corregir la foto y revisar el registro.</p>}
              <label className="block text-sm">Nota de revisión<input className={inputStyle} placeholder="Anota una diferencia entre la placa y el serial u otra duda" value={record.reviewNote ?? ""} onChange={(event) => updateRecord(record.id, { reviewNote: event.target.value })} /></label>
              {record.issues.map((issue) => <p key={issue} className="text-xs text-amber-800">{issue}</p>)}
              <div className="grid grid-cols-3 gap-2">{standardViews.map((view) => <div key={view}><p className="text-xs">{groupFieldLabels[view]}</p><Thumbnail photo={standards[configurationKey(record.cabinet, record.condition)]?.[view]} /></div>)}</div>
              <p className="font-semibold">{record.excluded ? "Excluido" : problems.some((problem) => /duplicado|caracteres/.test(problem)) ? "Con error" : problems.length ? "Pendiente de revisión" : "Listo"}</p>
              {problems.length > 0 && <ul className="list-disc pl-5 text-xs text-amber-900">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>}
              <div className="flex flex-wrap gap-4 text-sm"><label className="flex gap-2"><input type="checkbox" checked={record.reviewed} onChange={(event) => updateRecord(record.id, { reviewed: event.target.checked })} />Revisé la placa, el serial y las observaciones</label><label className="flex gap-2"><input type="checkbox" checked={record.excluded} onChange={(event) => updateRecord(record.id, { excluded: event.target.checked })} />Excluir registro del lote</label></div>
            </div>
          </article>;
        })}
      </section>
      <section className="rounded-xl border bg-white p-5"><h2 className="mb-2 text-lg font-bold">4. Generar lote</h2><p className="mb-3 text-sm">Se crearán {ready.length} PDF, uno por serial incluido y validado. Corrige o excluye los {pending} registros pendientes para habilitar la descarga.</p><Button disabled={!ready.length || pending > 0} onClick={() => void run(exportLot)}>Generar {ready.length} PDF y descargar ZIP</Button></section>
    </fieldset>
    <p role="status" aria-live="polite" className="sticky bottom-3 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-950">{busy ? "Procesando… " : ""}{message || (!loaded ? "Recuperando catálogo…" : "Carga el Excel y configura las vistas para comenzar.")}</p>
  </div>;
}

function Thumbnail({ photo }: { photo?: LocalBatchPhoto }) {
  return <div className="mt-1 flex h-32 items-center justify-center rounded-lg bg-slate-100">{photo?.thumbnailUrl
    // Son fotos locales; object-contain permite revisar la imagen completa.
    // eslint-disable-next-line @next/next/no-img-element
    ? <a className="h-full w-full" href={photo.thumbnailUrl} target="_blank" rel="noreferrer" aria-label={`Ampliar ${photo.fileName}`}><img alt={photo.fileName} src={photo.thumbnailUrl} className="h-full w-full object-contain" /></a>
    : <span className="p-2 text-center text-xs text-slate-500">Sin fotografía</span>}</div>;
}
