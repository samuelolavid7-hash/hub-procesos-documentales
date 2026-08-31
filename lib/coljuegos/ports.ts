import type { BatchPhoto, ColjuegosFlowState } from "@/lib/coljuegos/types";

/** Contrato que luego podrá implementar el conector real de SharePoint. */
export interface ColjuegosBatchSource {
  // TODO: integración real — leer la carpeta de la SO desde SharePoint.
  loadBatch(folderName: string): Promise<BatchPhoto[]>;
}

/** Contrato para la generación futura de documentos en el backend. */
export interface ColjuegosArtifactService {
  // TODO: integración real — generar el reporte de incidencias.
  generateReviewReport(state: ColjuegosFlowState): Promise<Blob>;

  // TODO: integración real — generar los PDF y comprimirlos en un ZIP.
  generateExpedientZip(state: ColjuegosFlowState): Promise<Blob>;
}
