"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { LoadBatchStep } from "@/app/procesos/coljuegos/_steps/cargar-lote";
import { OrderDataStep } from "@/app/procesos/coljuegos/_steps/datos-orden";
import { RealExportStep } from "@/app/procesos/coljuegos/_steps/exportacion-real";
import { RealGroupingStep } from "@/app/procesos/coljuegos/_steps/agrupacion-real";
import {
  initialIngestionState,
  ingestionReducer,
} from "@/app/procesos/coljuegos/ingestion-reducer";
import { ProcessHeader } from "@/components/shared/process-header";
import { Stepper } from "@/components/shared/stepper";
import { useToast } from "@/components/shared/toast";
import {
  ingestLocalFiles,
  normalizeSerials,
  parseShellOrderFolderName,
  revokePhotoThumbnails,
} from "@/lib/coljuegos/file-ingestion";
import { createGroupingProposal } from "@/lib/coljuegos/grouping";
import type { CampoFotoGrupo, GrupoFotografico, LocalOrderDraft } from "@/lib/coljuegos/types";

const flowSteps = [
  "Datos del lote",
  "Cargar fotos",
  "Agrupación y seriales",
  "Exportar",
];

export function ColjuegosFlow() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [ingestion, dispatchIngestion] = useReducer(ingestionReducer, initialIngestionState);
  const [groups, setGroups] = useState<GrupoFotografico[]>([]);
  const [ungroupedPhotoIds, setUngroupedPhotoIds] = useState<string[]>([]);
  const isMounted = useRef(true);
  const { showToast } = useToast();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const photos = ingestion.localBatch?.photos ?? [];
    return () => revokePhotoThumbnails(photos);
  }, [ingestion.localBatch]);

  function handleFolderNameChange(value: string) {
    if (ingestion.orderDraft.mode === "without-order") {
      dispatchIngestion({ type: "UPDATE_ORDER", patch: { folderName: value } });
      return;
    }
    const detectedOrder = parseShellOrderFolderName(value);
    dispatchIngestion({
      type: "UPDATE_ORDER",
      patch: detectedOrder
        ? {
          folderName: value,
          number: detectedOrder.number,
          machineCount: String(detectedOrder.machineCount),
          modelCode: detectedOrder.modelCode,
          dataSource: "folder-name",
        }
        : {
          folderName: value,
          dataSource: "manual",
        },
    });
  }

  async function handleFilesSelected(files: File[], folderName: string) {
    const detectedOrder = ingestion.orderDraft.mode === "with-order"
      ? parseShellOrderFolderName(folderName)
      : null;
    const orderDraft: LocalOrderDraft = {
      ...ingestion.orderDraft,
      folderName,
      number: detectedOrder?.number ?? ingestion.orderDraft.number,
      machineCount: detectedOrder
        ? String(detectedOrder.machineCount)
        : ingestion.orderDraft.machineCount,
      modelCode: detectedOrder?.modelCode ?? ingestion.orderDraft.modelCode,
      dataSource: detectedOrder ? "folder-name" : "manual",
    };

    dispatchIngestion({ type: "START_REAL_BATCH", orderDraft });
    setGroups([]);
    setUngroupedPhotoIds([]);

    try {
      const batch = await ingestLocalFiles({
        files,
        folderName,
        onProgress: (progress) => {
          if (isMounted.current) {
            dispatchIngestion({ type: "UPDATE_PROGRESS", progress });
          }
        },
      });

      if (!isMounted.current) {
        revokePhotoThumbnails(batch.photos);
        return;
      }

      dispatchIngestion({ type: "COMPLETE_REAL_BATCH", batch });
      showToast({
        title: batch.photos.length > 0 ? "Carpeta procesada" : "No encontramos fotos compatibles",
        description: batch.photos.length > 0
          ? `${batch.photos.length} fotos quedaron listas y ordenadas cronológicamente.`
          : "Usa archivos JPG, JPEG o PNG.",
        tone: batch.photos.length > 0 ? "success" : "info",
      });
    } catch {
      if (!isMounted.current) return;
      dispatchIngestion({
        type: "UPDATE_PROGRESS",
        progress: {
          status: "completed-with-errors",
          processed: 0,
          total: 0,
          errorCount: 1,
        },
      });
      showToast({
        title: "No pudimos procesar la carpeta",
        description: "Vuelve a seleccionarla. Ninguna foto fue enviada fuera del navegador.",
        tone: "info",
      });
    }
  }

  function prepareGrouping() {
    if (!ingestion.localBatch) return;
    if (groups.length > 0) {
      setCurrentStep(3);
      return;
    }
    const proposal = createGroupingProposal(ingestion.localBatch.photos);
    setGroups(proposal.groups);
    setUngroupedPhotoIds(proposal.ungroupedPhotoIds);
    setCurrentStep(3);
  }

  function assignSerial(groupId: string, serial: string | null) {
    setGroups((currentGroups) => currentGroups.map((group) => (
      group.id === groupId ? { ...group, serialAsignado: serial, confirmado: false } : group
    )));
  }

  function assignPhoto(groupId: string, field: CampoFotoGrupo, photoId: string) {
    setGroups((currentGroups) => {
      const targetGroup = currentGroups.find((group) => group.id === groupId);
      const previousPhotoId = targetGroup?.fotos[field] ?? null;
      if (!targetGroup || previousPhotoId === photoId) return currentGroups;

      // Una foto representa una evidencia física y solo debe ocupar una posición.
      // Si ya está asignada, intercambiamos ambas fotos para permitir reordenar el
      // lote sin crear duplicados ni dejar incompleto el otro expediente.
      const occupiedSlot = currentGroups.flatMap((group) => (
        (Object.keys(group.fotos) as CampoFotoGrupo[]).map((candidateField) => ({
          groupId: group.id,
          field: candidateField,
          photoId: group.fotos[candidateField],
        }))
      )).find((slot) => slot.photoId === photoId);

      return currentGroups.map((group) => {
        let nextPhotos = group.fotos;
        let changed = false;

        if (group.id === groupId) {
          nextPhotos = { ...nextPhotos, [field]: photoId };
          changed = true;
        }
        if (occupiedSlot && group.id === occupiedSlot.groupId) {
          nextPhotos = { ...nextPhotos, [occupiedSlot.field]: previousPhotoId };
          changed = true;
        }

        return changed
          ? { ...group, fotos: nextPhotos, confirmado: false, origen: "corregido-manualmente" }
          : group;
      });
    });
  }

  function confirmGroup(groupId: string) {
    setGroups((currentGroups) => currentGroups.map((group) => (
      group.id === groupId ? { ...group, confirmado: true } : group
    )));
  }

  const expectedSerials = normalizeSerials(ingestion.orderDraft.expectedSerialsText);
  const photos = ingestion.localBatch?.photos ?? [];

  return (
    <div className="space-y-8">
      <ProcessHeader
        description="Organiza las fotografías del lote y prepara un expediente regulatorio por cada máquina."
        eyebrow="Colombia · Coljuegos"
        status="Activo"
        title="Expedientes fotográficos"
      />

      <Stepper currentStep={currentStep} steps={flowSteps} />

      {currentStep === 1 ? (
        <OrderDataStep
          draft={ingestion.orderDraft}
          onChange={(patch) => dispatchIngestion({ type: "UPDATE_ORDER", patch })}
          onContinue={() => setCurrentStep(2)}
          onFolderNameChange={handleFolderNameChange}
        />
      ) : currentStep === 2 ? (
        <LoadBatchStep
          batch={ingestion.localBatch}
          onBack={() => setCurrentStep(1)}
          onContinue={prepareGrouping}
          onFilesSelected={(files, folderName) => void handleFilesSelected(files, folderName)}
          orderDraft={ingestion.orderDraft}
          progress={ingestion.progress}
        />
      ) : currentStep === 3 ? (
        <RealGroupingStep
          allowManualSerials={ingestion.orderDraft.mode === "without-order"}
          expectedSerials={expectedSerials}
          groups={groups}
          onAssignPhoto={assignPhoto}
          onAssignSerial={assignSerial}
          onBack={() => setCurrentStep(2)}
          onConfirmGroup={confirmGroup}
          onContinue={() => setCurrentStep(4)}
          photos={photos}
          ungroupedPhotoIds={ungroupedPhotoIds}
        />
      ) : (
        <RealExportStep
          groups={groups}
          onBack={() => setCurrentStep(3)}
          order={ingestion.orderDraft}
          photos={photos}
        />
      )}
    </div>
  );
}
