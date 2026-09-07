export type PhotoType =
  | "placa"
  | "frontal"
  | "lateral-izquierda"
  | "lateral-derecha";

export type AssignablePhotoType = Exclude<PhotoType, "placa">;

export type PhotoQuality = "correcta" | "borrosa";

export type LocalPhotoExtension = "jpg" | "jpeg" | "png" | "heic";

export type PhotoTimestampSource = "exif" | "file";

export type LocalPhotoProcessingStatus = "ready" | "warning" | "error";

export type BatchMode = "none" | "demo" | "real";

export type PlateStatus =
  | "coincide-so"
  | "fecha-ilegible"
  | "fuera-so"
  | "sin-evidencia";

export type MachineStatus = "completo" | "revisar" | "sin-evidencia";

export type ReviewReason =
  | "falta-placa"
  | "falta-frontal"
  | "falta-lateral-izquierda"
  | "falta-lateral-derecha"
  | "frontal-borrosa"
  | "lateral-izquierda-borrosa"
  | "lateral-derecha-borrosa"
  | "fecha-ilegible"
  | "serial-no-reconocido";

export interface MachineReview {
  status: "completo" | "revisar";
  reasons: ReviewReason[];
}

/**
 * SO significa Shell Order. Es la orden que define el modelo, la cantidad
 * y los seriales que deben aparecer en el expediente regulatorio.
 */
export interface ShellOrder {
  number: string;
  folderName: string;
  modelCode: string;
  modelName: string;
  machineCount: number;
  expectedSerials: string[];
}

export interface BatchPhoto {
  id: string;
  fileName: string;
  type: PhotoType;
  previewUrl: string;
  quality: PhotoQuality;
  detectedSerial?: string;
  manufactureDate?: string;
}

/**
 * Una foto real conserva el File original sin leer todos sus bytes. La UI usa
 * únicamente thumbnailUrl, que apunta a una miniatura comprimida de 400 px.
 */
export interface LocalBatchPhoto {
  source: "local";
  id: string;
  file: File;
  fileName: string;
  relativePath: string;
  extension: LocalPhotoExtension;
  sizeBytes: number;
  lastModified: number;
  capturedAt: string;
  timestampSource: PhotoTimestampSource;
  orientation?: number;
  originalWidth?: number;
  originalHeight?: number;
  thumbnailUrl: string | null;
  processingStatus: LocalPhotoProcessingStatus;
  warning?: string;
  error?: string;
}

export interface IngestionProgress {
  status: "idle" | "running" | "completed" | "completed-with-errors";
  processed: number;
  total: number;
  currentFile?: string;
  errorCount: number;
}

export interface PhotoProcessingError {
  fileName: string;
  message: string;
}

export interface DetectedShellOrder {
  folderName: string;
  number: string;
  machineCount: number;
  modelCode: string;
}

export interface LocalOrderDraft {
  folderName: string;
  number: string;
  machineCount: string;
  modelCode: string;
  expectedSerialsText: string;
  dataSource: "folder-name" | "manual";
}

export interface LocalBatch {
  folderName: string;
  photos: LocalBatchPhoto[];
  errors: PhotoProcessingError[];
  hasHeic: boolean;
  ignoredFileCount: number;
}

export interface PlateReading {
  photoId?: string;
  /** Serial que la SO exige; no existe para una placa extraña. */
  expectedSerial?: string;
  /** Serial leído en la placa; no existe cuando falta la evidencia. */
  detectedSerial?: string;
  manufactureDate?: string;
  status: PlateStatus;
}

export interface PlateReadingSummary {
  expected: number;
  detectedAndRead: number;
  unreadableDate: number;
  unrecognizedSerials: number;
  withoutEvidence: number;
}

export interface ValidationSummary {
  complete: number;
  review: number;
  withoutEvidence: number;
  unrecognized: number;
}

export interface MachineAssignment {
  serial: string;
  platePhotoId?: string;
  frontPhotoId?: string;
  leftPhotoId?: string;
  rightPhotoId?: string;
}

export interface ColjuegosFlowState {
  currentStep: 1 | 2 | 3 | 4;
  shellOrder: ShellOrder;
  batchLoaded: boolean;
  photos: BatchPhoto[];
  plateReadings: PlateReading[];
  assignments: MachineAssignment[];
}

export interface SimulatedBatchUpload {
  fileCount: number;
  totalSize: string;
  imageFormats: string[];
  sourceLabel: string;
}
