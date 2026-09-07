import { parse } from "exifr";
import type {
  DetectedShellOrder,
  IngestionProgress,
  LocalBatch,
  LocalBatchPhoto,
  LocalPhotoExtension,
  PhotoProcessingError,
} from "@/lib/coljuegos/types";

const acceptedExtensions = new Set<LocalPhotoExtension>([
  "jpg",
  "jpeg",
  "png",
  "heic",
]);

const thumbnailMaximumSide = 400;
const ingestionBatchSize = 10;

interface ExifMetadata {
  DateTimeOriginal?: Date | string;
  Orientation?: number;
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  orientationAlreadyApplied: boolean;
  close: () => void;
}

export interface IngestLocalFilesOptions {
  files: File[];
  folderName: string;
  onProgress: (progress: IngestionProgress) => void;
}

export function getAcceptedExtension(fileName: string): LocalPhotoExtension | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && acceptedExtensions.has(extension as LocalPhotoExtension)
    ? extension as LocalPhotoExtension
    : null;
}

export function parseShellOrderFolderName(folderName: string): DetectedShellOrder | null {
  const normalizedName = folderName.trim().replace(/\s+/g, " ");
  const match = normalizedName.match(/^SO\s+(\d+)\s+(\d+)\s+(.+)$/i);
  if (!match) return null;

  return {
    folderName: normalizedName,
    number: match[1],
    machineCount: Number(match[2]),
    modelCode: match[3].trim().toUpperCase(),
  };
}

export function normalizeSerials(value: string): string[] {
  const serials = value
    .split(/[\s,;]+/)
    .map((serial) => serial.trim().toUpperCase())
    .filter(Boolean);

  return [...new Set(serials)];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function revokePhotoThumbnails(photos: LocalBatchPhoto[]) {
  for (const photo of photos) {
    if (photo.thumbnailUrl) URL.revokeObjectURL(photo.thumbnailUrl);
  }
}

/**
 * Procesa una foto a la vez y cede el control al navegador cada diez archivos.
 * Así evitamos decodificar simultáneamente cientos de imágenes de alta resolución.
 */
export async function ingestLocalFiles({
  files,
  folderName,
  onProgress,
}: IngestLocalFilesOptions): Promise<LocalBatch> {
  const supportedFiles = files.flatMap((file) => {
    const extension = getAcceptedExtension(file.name);
    return extension ? [{ file, extension }] : [];
  });
  const photos: LocalBatchPhoto[] = [];
  const errors: PhotoProcessingError[] = [];

  onProgress({
    status: "running",
    processed: 0,
    total: supportedFiles.length,
    errorCount: 0,
  });

  for (let index = 0; index < supportedFiles.length; index += 1) {
    const { file, extension } = supportedFiles[index];
    const photo = await processPhoto(file, extension, index);
    photos.push(photo);

    if (photo.error) {
      errors.push({ fileName: file.name, message: photo.error });
    }

    onProgress({
      status: "running",
      processed: index + 1,
      total: supportedFiles.length,
      currentFile: file.name,
      errorCount: errors.length,
    });

    if ((index + 1) % ingestionBatchSize === 0) {
      await yieldToBrowser();
    }
  }

  photos.sort((first, second) => first.capturedAt.localeCompare(second.capturedAt));
  onProgress({
    status: errors.length > 0 ? "completed-with-errors" : "completed",
    processed: supportedFiles.length,
    total: supportedFiles.length,
    errorCount: errors.length,
  });

  return {
    folderName,
    photos,
    errors,
    hasHeic: supportedFiles.some(({ extension }) => extension === "heic"),
    ignoredFileCount: files.length - supportedFiles.length,
  };
}

async function processPhoto(
  file: File,
  extension: LocalPhotoExtension,
  index: number,
): Promise<LocalBatchPhoto> {
  let metadata: ExifMetadata | undefined;
  try {
    metadata = await parse(file, ["DateTimeOriginal", "Orientation"]);
  } catch {
    // Una foto sin EXIF sigue siendo válida; usamos lastModified como respaldo.
  }

  const exifDate = normalizeExifDate(metadata?.DateTimeOriginal);
  const basePhoto: Omit<LocalBatchPhoto, "thumbnailUrl" | "processingStatus"> = {
    source: "local",
    id: createPhotoId(file, index),
    file,
    fileName: file.name,
    relativePath: file.webkitRelativePath || file.name,
    extension,
    sizeBytes: file.size,
    lastModified: file.lastModified,
    capturedAt: (exifDate ?? new Date(file.lastModified)).toISOString(),
    timestampSource: exifDate ? "exif" : "file",
    orientation: metadata?.Orientation,
  };

  if (extension === "heic") {
    return {
      ...basePhoto,
      thumbnailUrl: null,
      processingStatus: "warning",
      warning: "El navegador podría no previsualizar esta foto HEIC. Convierte una copia a JPG o PNG antes de generar el PDF.",
    };
  }

  try {
    const thumbnail = await createThumbnail(file, metadata?.Orientation ?? 1);
    return {
      ...basePhoto,
      originalWidth: thumbnail.originalWidth,
      originalHeight: thumbnail.originalHeight,
      thumbnailUrl: URL.createObjectURL(thumbnail.blob),
      processingStatus: exifDate ? "ready" : "warning",
      warning: exifDate
        ? undefined
        : "Fecha tomada de la modificación del archivo; no se encontró DateTimeOriginal en EXIF.",
    };
  } catch {
    return {
      ...basePhoto,
      thumbnailUrl: null,
      processingStatus: "error",
      error: "No se pudo leer la imagen o generar su miniatura.",
    };
  }
}

function normalizeExifDate(value: Date | string | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function createPhotoId(file: File, index: number): string {
  return `${file.webkitRelativePath || file.name}-${file.size}-${file.lastModified}-${index}`;
}

async function createThumbnail(
  file: File,
  orientation: number,
): Promise<{ blob: Blob; originalWidth: number; originalHeight: number }> {
  const decoded = await decodeImage(file);
  const appliedOrientation = decoded.orientationAlreadyApplied ? 1 : orientation;
  const swapsDimensions = appliedOrientation >= 5 && appliedOrientation <= 8;
  const orientedWidth = swapsDimensions ? decoded.height : decoded.width;
  const orientedHeight = swapsDimensions ? decoded.width : decoded.height;
  const scale = Math.min(1, thumbnailMaximumSide / Math.max(orientedWidth, orientedHeight));
  const drawWidth = Math.max(1, Math.round(decoded.width * scale));
  const drawHeight = Math.max(1, Math.round(decoded.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = swapsDimensions ? drawHeight : drawWidth;
  canvas.height = swapsDimensions ? drawWidth : drawHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    decoded.close();
    throw new Error("Canvas no disponible");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  applyExifOrientation(context, appliedOrientation, drawWidth, drawHeight);
  context.drawImage(decoded.source, 0, 0, drawWidth, drawHeight);
  decoded.close();

  const blob = await canvasToBlob(canvas);
  return { blob, originalWidth: decoded.width, originalHeight: decoded.height };
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file, { imageOrientation: "none" });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      orientationAlreadyApplied: false,
      close: () => bitmap.close(),
    };
  }

  const sourceUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Imagen inválida"));
      image.src = sourceUrl;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      orientationAlreadyApplied: true,
      close: () => URL.revokeObjectURL(sourceUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(sourceUrl);
    throw error;
  }
}

function applyExifOrientation(
  context: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number,
) {
  const transforms: Record<number, [number, number, number, number, number, number]> = {
    2: [-1, 0, 0, 1, width, 0],
    3: [-1, 0, 0, -1, width, height],
    4: [1, 0, 0, -1, 0, height],
    5: [0, 1, 1, 0, 0, 0],
    6: [0, 1, -1, 0, height, 0],
    7: [0, -1, -1, 0, height, width],
    8: [0, -1, 1, 0, 0, width],
  };
  const transform = transforms[orientation];
  if (transform) context.setTransform(...transform);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("No se pudo comprimir la miniatura")),
      "image/jpeg",
      0.82,
    );
  });
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
