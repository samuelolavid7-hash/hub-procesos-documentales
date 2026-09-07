"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { LoadBatchStep } from "@/app/procesos/coljuegos/_steps/cargar-lote";
import { PlateReadingStep } from "@/app/procesos/coljuegos/_steps/lectura-placas";
import { AssistedGroupingStep } from "@/app/procesos/coljuegos/_steps/agrupacion-asistida";
import { ValidationDownloadStep } from "@/app/procesos/coljuegos/_steps/validacion-descarga";
import { ProcessHeader } from "@/components/shared/process-header";
import { Stepper } from "@/components/shared/stepper";
import { useToast } from "@/components/shared/toast";
import {
  initialIngestionState,
  ingestionReducer,
} from "@/app/procesos/coljuegos/ingestion-reducer";
import {
  ingestLocalFiles,
  parseShellOrderFolderName,
  revokePhotoThumbnails,
} from "@/lib/coljuegos/file-ingestion";
import type {
  AssignablePhotoType,
  BatchPhoto,
  MachineAssignment,
  PlateReading,
  LocalOrderDraft,
  ShellOrder,
  SimulatedBatchUpload,
} from "@/lib/coljuegos/types";
import { coljuegosFlowSteps } from "@/lib/mock/coljuegos";

interface ColjuegosFlowProps {
  shellOrder: ShellOrder;
  simulatedBatch: SimulatedBatchUpload;
  plateReadings: PlateReading[];
  photos: BatchPhoto[];
  initialAssignments: MachineAssignment[];
}

const assignmentFieldByType: Record<AssignablePhotoType, "frontPhotoId" | "leftPhotoId" | "rightPhotoId"> = {
  frontal: "frontPhotoId",
  "lateral-izquierda": "leftPhotoId",
  "lateral-derecha": "rightPhotoId",
};

export function ColjuegosFlow({
  shellOrder,
  simulatedBatch,
  plateReadings,
  photos,
  initialAssignments,
}: ColjuegosFlowProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [ingestion, dispatchIngestion] = useReducer(ingestionReducer, initialIngestionState);
  const [assignments, setAssignments] = useState(initialAssignments);
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

  function handleLoadDemo() {
    dispatchIngestion({ type: "LOAD_DEMO" });
    setAssignments(initialAssignments);
    showToast({
      title: "Lote cargado",
      description: `${simulatedBatch.fileCount} fotografías simuladas están listas para procesar.`,
      tone: "success",
    });
  }

  async function handleFilesSelected(files: File[], folderName: string) {
    const detectedOrder = parseShellOrderFolderName(folderName);
    const orderDraft: LocalOrderDraft = detectedOrder
      ? {
        folderName: detectedOrder.folderName,
        number: detectedOrder.number,
        machineCount: String(detectedOrder.machineCount),
        modelCode: detectedOrder.modelCode,
        expectedSerialsText: "",
        dataSource: "folder-name",
      }
      : {
        folderName,
        number: "",
        machineCount: "",
        modelCode: "",
        expectedSerialsText: "",
        dataSource: "manual",
      };

    dispatchIngestion({ type: "START_REAL_BATCH", orderDraft });

    try {
      const batch = await ingestLocalFiles({
        files,
        folderName,
        onProgress: (progress) => {
          if (isMounted.current) dispatchIngestion({ type: "UPDATE_PROGRESS", progress });
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
          ? `${batch.photos.length} fotos quedaron listas para revisar en el navegador.`
          : "Usa archivos JPG, JPEG, PNG o HEIC.",
        tone: batch.photos.length > 0 ? "success" : "info",
      });
    } catch {
      if (!isMounted.current) return;
      dispatchIngestion({
        type: "UPDATE_PROGRESS",
        progress: { status: "completed-with-errors", processed: 0, total: 0, errorCount: 1 },
      });
      showToast({
        title: "No pudimos procesar la carpeta",
        description: "Vuelve a seleccionarla. Las demás funciones siguen disponibles.",
        tone: "info",
      });
    }
  }

  function handleProcessBatch() {
    if (!ingestion.demoLoaded || ingestion.mode !== "demo") return;

    // TODO: integración real — enviar las imágenes al servicio de lectura y clasificación.
    setCurrentStep(2);
    showToast({
      title: "Procesamiento simulado completo",
      description: "El lote está listo para la lectura de placas.",
      tone: "success",
    });
  }

  function handlePrepareGrouping() {
    setCurrentStep(3);
    showToast({
      title: "Lectura revisada",
      description: "Los resultados están listos para la agrupación asistida.",
      tone: "success",
    });
  }

  function handleAssignPhoto(
    serial: string,
    type: AssignablePhotoType,
    photoId: string,
  ) {
    const field = assignmentFieldByType[type];
    setAssignments((current) => current.map((assignment) =>
      assignment.serial === serial
        ? { ...assignment, [field]: photoId }
        : assignment,
    ));
    const photo = photos.find((candidate) => candidate.id === photoId);
    showToast({
      title: "Foto reasignada",
      description: `${photo?.fileName ?? "La fotografía"} se asignó a ${serial}.`,
      tone: "success",
    });
  }

  function handlePrepareValidation() {
    setCurrentStep(4);
    showToast({
      title: "Validación preparada",
      description: "La clasificación final y las exclusiones están listas para revisar.",
      tone: "success",
    });
  }

  function handleDownloadReport() {
    // TODO: integración real — generar y descargar el reporte de incidencias.
    showToast({
      title: "Reporte simulado preparado",
      description: "El reporte incluiría todas las incidencias y exclusiones de la SO.",
      tone: "success",
    });
  }

  function handleDownloadZip(completeCount: number) {
    // TODO: integración real — generar los PDF y comprimirlos en un archivo ZIP.
    showToast({
      title: "Paquete ZIP simulado preparado",
      description: `${completeCount} expedientes completos serían incluidos en la descarga.`,
      tone: "success",
    });
  }

  return (
    <div className="space-y-8">
      <ProcessHeader
        eyebrow="Colombia · Coljuegos"
        title="Expedientes fotográficos"
        description="Organiza las fotografías del lote y prepara un expediente regulatorio por cada máquina."
        status="Activo"
      />

      <Stepper steps={coljuegosFlowSteps} currentStep={currentStep} />

      {currentStep === 1 ? (
        <LoadBatchStep
          shellOrder={shellOrder}
          simulatedBatch={simulatedBatch}
          mode={ingestion.mode}
          demoLoaded={ingestion.demoLoaded}
          localBatch={ingestion.localBatch}
          orderDraft={ingestion.orderDraft}
          progress={ingestion.progress}
          onFilesSelected={(files, folderName) => void handleFilesSelected(files, folderName)}
          onOrderDraftChange={(field, value) => dispatchIngestion({ type: "UPDATE_ORDER", field, value })}
          onLoadDemo={handleLoadDemo}
          onProcessDemo={handleProcessBatch}
        />
      ) : currentStep === 2 ? (
        <PlateReadingStep
          shellOrder={shellOrder}
          readings={plateReadings}
          onBack={() => setCurrentStep(1)}
          onContinue={handlePrepareGrouping}
        />
      ) : currentStep === 3 ? (
        <AssistedGroupingStep
          shellOrder={shellOrder}
          readings={plateReadings}
          photos={photos}
          assignments={assignments}
          onBack={() => setCurrentStep(2)}
          onContinue={handlePrepareValidation}
          onAssignPhoto={handleAssignPhoto}
        />
      ) : (
        <ValidationDownloadStep
          shellOrder={shellOrder}
          readings={plateReadings}
          photos={photos}
          assignments={assignments}
          onBack={() => setCurrentStep(3)}
          onDownloadReport={handleDownloadReport}
          onDownloadZip={handleDownloadZip}
        />
      )}
    </div>
  );
}
