"use client";

import { useState } from "react";
import { LoadBatchStep } from "@/app/procesos/coljuegos/_steps/cargar-lote";
import { PlateReadingStep } from "@/app/procesos/coljuegos/_steps/lectura-placas";
import { AssistedGroupingStep } from "@/app/procesos/coljuegos/_steps/agrupacion-asistida";
import { ValidationDownloadStep } from "@/app/procesos/coljuegos/_steps/validacion-descarga";
import { ProcessHeader } from "@/components/shared/process-header";
import { Stepper } from "@/components/shared/stepper";
import { useToast } from "@/components/shared/toast";
import type {
  AssignablePhotoType,
  BatchPhoto,
  MachineAssignment,
  PlateReading,
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
  const [batchLoaded, setBatchLoaded] = useState(false);
  const [assignments, setAssignments] = useState(initialAssignments);
  const { showToast } = useToast();

  function handleLoadBatch() {
    // TODO: integración real — reemplazar esta simulación por la carga desde SharePoint.
    setBatchLoaded(true);
    setAssignments(initialAssignments);
    showToast({
      title: "Lote cargado",
      description: `${simulatedBatch.fileCount} fotografías simuladas están listas para procesar.`,
      tone: "success",
    });
  }

  function handleProcessBatch() {
    if (!batchLoaded) return;

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
          batchLoaded={batchLoaded}
          onLoadBatch={handleLoadBatch}
          onProcessBatch={handleProcessBatch}
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
