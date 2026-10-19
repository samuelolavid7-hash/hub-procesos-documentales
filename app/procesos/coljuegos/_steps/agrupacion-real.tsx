"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { Modal } from "@/components/shared/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  countPhotoUses,
  getAssignedSerials,
  groupFieldLabels,
  isGroupComplete,
} from "@/lib/coljuegos/grouping";
import type {
  CampoFotoGrupo,
  GrupoFotografico,
  LocalBatchPhoto,
} from "@/lib/coljuegos/types";

interface GroupingStepProps {
  allowManualSerials: boolean;
  groups: GrupoFotografico[];
  photos: LocalBatchPhoto[];
  expectedSerials: string[];
  ungroupedPhotoIds: string[];
  onAssignPhoto: (groupId: string, field: CampoFotoGrupo, photoId: string) => void;
  onAssignSerial: (groupId: string, serial: string | null) => void;
  onConfirmGroup: (groupId: string) => void;
  onReopenGroup: (groupId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface PhotoSelectorState {
  groupId: string;
  field: CampoFotoGrupo;
}

type PhotoSort = "chronological" | "name";

const groupFields: CampoFotoGrupo[] = [
  "placa",
  "frontal",
  "lateralIzquierda",
  "lateralDerecha",
];

export function RealGroupingStep({
  allowManualSerials,
  groups,
  photos,
  expectedSerials,
  ungroupedPhotoIds,
  onAssignPhoto,
  onAssignSerial,
  onConfirmGroup,
  onReopenGroup,
  onBack,
  onContinue,
}: GroupingStepProps) {
  const [selector, setSelector] = useState<PhotoSelectorState | null>(null);
  const [photoSearch, setPhotoSearch] = useState("");
  const [photoSort, setPhotoSort] = useState<PhotoSort>("chronological");
  const photoById = useMemo(() => new Map(photos.map((photo) => [photo.id, photo])), [photos]);
  const assignedSerials = getAssignedSerials(groups);
  const missingSerials = expectedSerials.filter((serial) => !assignedSerials.includes(serial));
  const confirmedGroups = groups.filter((group) => group.confirmado && isGroupComplete(group));
  const selectedGroup = selector ? groups.find((group) => group.id === selector.groupId) : undefined;
  const candidates = useMemo(() => {
    if (!selector) return [];
    const normalizedSearch = photoSearch.trim().toLocaleLowerCase("es");
    return photos
      .filter((photo) => (
        photo.processingStatus !== "error"
        && (!normalizedSearch || photo.fileName.toLocaleLowerCase("es").includes(normalizedSearch))
      ))
      .sort((left, right) => (
        photoSort === "name"
          ? left.fileName.localeCompare(right.fileName, "es", { numeric: true })
          : left.capturedAt.localeCompare(right.capturedAt)
      ));
  }, [photoSearch, photoSort, photos, selector]);

  function selectPhoto(photoId: string) {
    if (!selector) return;
    onAssignPhoto(selector.groupId, selector.field, photoId);
    setSelector(null);
  }

  function openPhotoSelector(groupId: string, field: CampoFotoGrupo) {
    const group = groups.find((candidate) => candidate.id === groupId);
    if (group?.confirmado) return;
    setPhotoSearch("");
    setSelector({ groupId, field });
  }

  return (
    <section aria-labelledby="grouping-title" className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Paso 3 de 4</p>
          <h2 id="grouping-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Agrupación y asignación de seriales
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Revisa los grupos propuestos por fecha. Puedes reutilizar vistas frontales y laterales entre máquinas; las placas permanecen exclusivas de cada grupo.
          </p>
        </div>
        <Button onClick={onBack} variant="secondary">Volver a las fotos</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Grupos propuestos" value={groups.length} />
        <SummaryCard label="Grupos confirmados" value={confirmedGroups.length} tone="success" />
        <SummaryCard label="Seriales sin grupo" value={missingSerials.length} tone={missingSerials.length ? "warning" : "success"} />
      </div>

      {groups.length ? (
        <div className="space-y-5">
          {groups.map((group) => {
            const serialsAvailable = expectedSerials.filter((serial) => (
              serial === group.serialAsignado || !assignedSerials.includes(serial)
            ));
            const duplicateSerial = Boolean(group.serialAsignado && groups.some((candidate) => (
              candidate.id !== group.id
              && candidate.serialAsignado?.toUpperCase() === group.serialAsignado?.toUpperCase()
            )));
            const complete = isGroupComplete(group) && !duplicateSerial;

            return (
              <article key={group.id} className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${group.confirmado ? "border-emerald-300" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-950">Máquina propuesta {group.numeroGrupo}</h3>
                      <StatusBadge status={group.confirmado ? "Listo" : "Pendiente"} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {group.origen === "propuesto" ? "Agrupación cronológica original" : "Grupo corregido manualmente"}
                    </p>
                  </div>
                  <label className="min-w-64 text-sm font-bold text-slate-700">
                    {allowManualSerials ? "Serial de la máquina" : "Serial de la SO"}
                    {/* TODO: cuando haya presupuesto de IA, este desplegable manual se puede
                        autocompletar leyendo el serial de la foto de placa automáticamente */}
                    {allowManualSerials ? (
                      <>
                        <input
                          autoComplete="off"
                          className={`mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-sm font-semibold uppercase text-slate-900 outline-none focus:ring-2 ${duplicateSerial ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"}`}
                          disabled={group.confirmado}
                          list={`seriales-grupo-${group.id}`}
                          onChange={(event) => onAssignSerial(group.id, event.target.value.toUpperCase() || null)}
                          placeholder="Escribe el serial"
                          value={group.serialAsignado ?? ""}
                        />
                        <datalist id={`seriales-grupo-${group.id}`}>{serialsAvailable.map((serial) => <option key={serial} value={serial} />)}</datalist>
                        {duplicateSerial ? <span className="mt-1 block text-xs font-normal text-red-600">Este serial ya está asignado a otro grupo.</span> : null}
                      </>
                    ) : (
                      <select
                        className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        disabled={group.confirmado}
                        onChange={(event) => onAssignSerial(group.id, event.target.value || null)}
                        value={group.serialAsignado ?? ""}
                      >
                        <option value="">Seleccionar serial…</option>
                        {serialsAvailable.map((serial) => <option key={serial} value={serial}>{serial}</option>)}
                      </select>
                    )}
                  </label>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {groupFields.map((field) => {
                    const photoId = group.fotos[field];
                    const photo = photoId ? photoById.get(photoId) : undefined;
                    const uses = photoId ? countPhotoUses(groups, photoId) : 0;
                    return (
                      <PhotoSlot
                        key={field}
                        disabled={group.confirmado}
                        field={field}
                        photo={photo}
                        uses={uses}
                        onChange={() => openPhotoSelector(group.id, field)}
                      />
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-600">
                    {complete
                      ? group.confirmado
                        ? "Grupo confirmado y bloqueado. Pulsa Corregir grupo si necesitas modificarlo."
                        : "Las cuatro fotos y el serial están completos. Confirma el grupo."
                      : "Falta asignar el serial o alguna de las cuatro vistas."}
                  </p>
                  {group.confirmado ? (
                    <Button onClick={() => onReopenGroup(group.id)} variant="secondary">
                      <Icon name="lock" className="h-4 w-4" />
                      Corregir grupo
                    </Button>
                  ) : (
                    <Button disabled={!complete} onClick={() => onConfirmGroup(group.id)}>
                      <Icon name="check" className="h-4 w-4" />
                      Confirmar grupo
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Se necesitan al menos cuatro fotos legibles para proponer un grupo.
        </div>
      )}

      <ReviewLists
        hasExpectedSerials={expectedSerials.length > 0}
        missingSerials={missingSerials}
        ungroupedPhotos={ungroupedPhotoIds.flatMap((id) => photoById.get(id) ?? [])}
      />

      <footer className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {confirmedGroups.length
            ? `${confirmedGroups.length} ${confirmedGroups.length === 1 ? "máquina confirmada" : "máquinas confirmadas"} para exportar.`
            : "Confirma al menos un grupo completo para continuar."}
        </p>
        <Button disabled={confirmedGroups.length === 0} onClick={onContinue} size="lg">
          Continuar a exportación
          <Icon name="arrow-right" className="h-4 w-4" />
        </Button>
      </footer>

      <Modal
        description={selector ? `Selecciona otra foto para ${groupFieldLabels[selector.field].toLowerCase()}.` : undefined}
        isOpen={Boolean(selector)}
        onClose={() => setSelector(null)}
        size="xl"
        title="Cambiar foto"
      >
        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
          <div className="mb-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_13rem]">
            <label className="text-xs font-bold text-slate-700">
              Buscar por nombre
              <input
                autoComplete="off"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setPhotoSearch(event.target.value)}
                placeholder="Ejemplo: IMG_2048"
                value={photoSearch}
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Ordenar fotografías
              <select
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setPhotoSort(event.target.value as PhotoSort)}
                value={photoSort}
              >
                <option value="chronological">Fecha de captura</option>
                <option value="name">Nombre del archivo</option>
              </select>
            </label>
          </div>
          <p className="mb-4 text-xs leading-5 text-slate-600">
            Se muestran todas las fotos válidas. Las vistas frontales y laterales pueden reutilizarse en otras máquinas. Las placas son exclusivas y, si eliges una ya asignada, se intercambiarán entre ambas máquinas.
          </p>
          {candidates.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {candidates.map((photo) => {
                const useCount = countPhotoUses(groups, photo.id);
                const selected = selectedGroup?.fotos[selector!.field] === photo.id;
                const usedInAnotherFieldOfThisGroup = Boolean(selectedGroup && groupFields.some((field) => (
                  field !== selector!.field && selectedGroup.fotos[field] === photo.id
                )));
                const plateOwner = selector?.field === "placa" ? groups.find((group) => (
                  group.id !== selectedGroup?.id && group.fotos.placa === photo.id
                )) : undefined;
                const plateAssignedElsewhere = Boolean(plateOwner);
                const plateLockedInConfirmedGroup = Boolean(plateOwner?.confirmado);
                return (
                  <button
                    key={photo.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={usedInAnotherFieldOfThisGroup || plateLockedInConfirmedGroup}
                    onClick={() => selectPhoto(photo.id)}
                  >
                    <PhotoImage photo={photo} />
                    <div className="p-3">
                      <p className="truncate text-xs font-bold text-slate-800">{photo.fileName}</p>
                      <p className={`mt-1 text-[11px] ${useCount > 1 ? "font-bold text-amber-700" : "text-slate-500"}`}>
                        {selected
                          ? "Selección actual"
                          : usedInAnotherFieldOfThisGroup
                            ? "Ya usada en otra vista de esta máquina"
                            : plateLockedInConfirmedGroup
                              ? "Placa bloqueada en una máquina confirmada"
                            : plateAssignedElsewhere
                              ? "Placa de otra máquina · se intercambiará"
                              : useCount
                                ? `Usada en ${useCount} ${useCount === 1 ? "posición" : "posiciones"} · se puede reutilizar`
                                : "Foto disponible"}
                      </p>
                      {photo.suggestedType ? <p className="mt-1 text-[11px] text-slate-500">Posición original: {photo.suggestedType.replaceAll("-", " ")}</p> : null}
                      {selected ? <p className="mt-1 text-[11px] font-bold text-teal-700">Esta foto ya ocupa esta posición</p> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">No hay fotos candidatas para esta vista.</p>
          )}
        </div>
      </Modal>
    </section>
  );
}

function PhotoSlot({
  disabled,
  field,
  photo,
  uses,
  onChange,
}: {
  disabled: boolean;
  field: CampoFotoGrupo;
  photo?: LocalBatchPhoto;
  uses: number;
  onChange: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {photo ? <PhotoImage photo={photo} /> : (
        <div className="grid aspect-[4/3] place-items-center bg-slate-100 text-slate-400"><Icon name="image" className="h-8 w-8" /></div>
      )}
      <div className="p-3">
        <p className="text-xs font-bold text-slate-900">{groupFieldLabels[field]}</p>
        <p className="mt-1 truncate text-[11px] text-slate-500">{photo?.fileName ?? "Sin foto"}</p>
        {uses > 1 ? <p className="mt-1 text-[11px] font-bold text-amber-700">Reutilizada en {uses} grupos</p> : null}
        <Button className="mt-3 w-full" disabled={disabled} onClick={onChange} size="sm" variant="secondary">
          {disabled ? "Foto bloqueada" : "Cambiar foto"}
        </Button>
      </div>
    </section>
  );
}

function PhotoImage({ photo }: { photo: LocalBatchPhoto }) {
  return (
    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
      {photo.thumbnailUrl ? (
        // La fuente es un Blob local ya reducido; no requiere optimización remota.
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={photo.fileName} className="h-full w-full object-cover" src={photo.thumbnailUrl} />
      ) : <span className="grid h-full place-items-center text-slate-400"><Icon name="image" className="h-8 w-8" /></span>}
    </div>
  );
}

function SummaryCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" }) {
  const styles = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-900";
  return <div className={`rounded-xl border p-4 shadow-sm ${styles}`}><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs font-semibold">{label}</p></div>;
}

function ReviewLists({ hasExpectedSerials, missingSerials, ungroupedPhotos }: { hasExpectedSerials: boolean; missingSerials: string[]; ungroupedPhotos: LocalBatchPhoto[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Seriales conocidos sin grupo</h3>
        {missingSerials.length ? <div className="mt-3 flex flex-wrap gap-2">{missingSerials.map((serial) => <span key={serial} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{serial}</span>)}</div> : <p className="mt-2 text-xs text-emerald-700">{hasExpectedSerials ? "Todos los seriales conocidos fueron asignados." : "No hay una lista previa; escribe el serial en cada grupo."}</p>}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Fotos sin agrupar</h3>
        {ungroupedPhotos.length ? <ul className="mt-3 space-y-1 text-xs text-slate-600">{ungroupedPhotos.map((photo) => <li key={photo.id}>{photo.fileName}</li>)}</ul> : <p className="mt-2 text-xs text-emerald-700">No quedaron fotos sueltas.</p>}
      </section>
    </div>
  );
}
