"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { LoadBatchStep } from "@/app/procesos/coljuegos/_steps/cargar-lote";
import { OrderDataStep } from "@/app/procesos/coljuegos/_steps/datos-orden";
import {
  initialIngestionState,
  ingestionReducer,
} from "@/app/procesos/coljuegos/ingestion-reducer";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";
import { ProcessHeader } from "@/components/shared/process-header";
import { Stepper } from "@/components/shared/stepper";
import { useToast } from "@/components/shared/toast";
import {
  ingestLocalFiles,
  parseShellOrderFolderName,
  revokePhotoThumbnails,
} from "@/lib/coljuegos/file-ingestion";
import type { LocalOrderDraft } from "@/lib/coljuegos/types";

const flowSteps = [
  "Datos de la SO",
  "Cargar fotos",
  "Agrupación y seriales",
  "Exportar",
];

export function ColjuegosFlow() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [ingestion, dispatchIngestion] = useReducer(ingestionReducer, initialIngestionState);
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
    const detectedOrder = parseShellOrderFolderName(folderName);
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
          onContinue={() => setCurrentStep(3)}
          onFilesSelected={(files, folderName) => void handleFilesSelected(files, folderName)}
          orderDraft={ingestion.orderDraft}
          progress={ingestion.progress}
        />
      ) : (
        <PendingNextBlock onBack={() => setCurrentStep(2)} />
      )}
    </div>
  );
}

function PendingNextBlock({ onBack }: { onBack: () => void }) {
  return (
    <section className="grid min-h-96 place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="max-w-lg">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <Icon name="check" className="h-8 w-8" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Bloque (a) completo</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">El lote está listo para agrupar</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          En el siguiente bloque construiremos los grupos cronológicos de cuatro fotos y la asignación manual de seriales. Tus pruebas actuales no activan ninguna lectura con IA.
        </p>
        <Button className="mt-6" onClick={onBack} variant="secondary">Volver a revisar las fotos</Button>
      </div>
    </section>
  );
}
