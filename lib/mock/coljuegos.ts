import type {
  BatchPhoto,
  MachineAssignment,
  PlateReading,
  ShellOrder,
  SimulatedBatchUpload,
} from "@/lib/coljuegos/types";

const firstSerialNumber = 30807;

export const mockShellOrder: ShellOrder = {
  number: "1534156",
  folderName: "SO 1534156 20 PC49",
  modelCode: "PC49",
  modelName: "PeakCurve 49",
  machineCount: 20,
  expectedSerials: Array.from(
    { length: 20 },
    (_, index) => `MX${String(firstSerialNumber + index).padStart(7, "0")}`,
  ),
};

export const mockBatchUpload: SimulatedBatchUpload = {
  fileCount: 79,
  totalSize: "486 MB",
  imageFormats: ["JPG", "PNG"],
  sourceLabel: "Carpeta simulada de SharePoint",
};

export const coljuegosFlowSteps = [
  "Cargar lote",
  "Lectura de placas",
  "Agrupación asistida",
  "Validación y descarga",
];

const readableDates = [
  "12/01/2024",
  "18/01/2024",
  "25/01/2024",
  "02/02/2024",
  "09/02/2024",
];

/**
 * Interpretación acordada: 18 seriales de la SO reconocidos (17 completos y
 * 1 con fecha ilegible), 2 sin placa y 1 placa adicional fuera de la SO.
 */
export const mockPlateReadings: PlateReading[] = [
  ...mockShellOrder.expectedSerials.slice(0, 17).map((serial, index) => ({
    photoId: `plate-${index + 1}`,
    expectedSerial: serial,
    detectedSerial: serial,
    manufactureDate: readableDates[index % readableDates.length],
    status: "coincide-so" as const,
  })),
  {
    photoId: "plate-18",
    expectedSerial: mockShellOrder.expectedSerials[17],
    detectedSerial: mockShellOrder.expectedSerials[17],
    status: "fecha-ilegible",
  },
  ...mockShellOrder.expectedSerials.slice(18).map((serial) => ({
    expectedSerial: serial,
    status: "sin-evidencia" as const,
  })),
  {
    photoId: "plate-extra-01",
    detectedSerial: "MX0098742",
    manufactureDate: "07/11/2023",
    status: "fuera-so",
  },
];

const platePhotos: BatchPhoto[] = mockPlateReadings
  .filter((reading) => reading.photoId)
  .map((reading) => ({
    id: reading.photoId!,
    fileName: `IMG_PLACA_${reading.detectedSerial ?? "EXTRA"}.jpg`,
    type: "placa",
    previewUrl: "",
    quality: "correcta",
    detectedSerial: reading.detectedSerial,
    manufactureDate: reading.manufactureDate,
  }));

function createPhotoBank(
  type: "frontal" | "lateral-izquierda" | "lateral-derecha",
  count: number,
): BatchPhoto[] {
  const prefixByType = {
    frontal: "FRONTAL",
    "lateral-izquierda": "LATERAL_IZQ",
    "lateral-derecha": "LATERAL_DER",
  };

  return Array.from({ length: count }, (_, index) => {
    const photoNumber = index + 1;
    const isBlurry = type === "frontal" && photoNumber === 5;

    return {
      id: `${type}-${String(photoNumber).padStart(2, "0")}${isBlurry ? "-borrosa" : ""}`,
      fileName: `IMG_${prefixByType[type]}_${String(photoNumber).padStart(3, "0")}.jpg`,
      type,
      previewUrl: "",
      quality: isBlurry ? "borrosa" : "correcta",
    };
  });
}

export const mockPhotoBank: BatchPhoto[] = [
  ...platePhotos,
  ...createPhotoBank("frontal", 6),
  ...createPhotoBank("lateral-izquierda", 5),
  ...createPhotoBank("lateral-derecha", 5),
];

export const mockMachineAssignments: MachineAssignment[] =
  mockShellOrder.expectedSerials.map((serial, index) => ({
    serial,
    platePhotoId: index < 18 ? `plate-${index + 1}` : undefined,
    frontPhotoId:
      index === 8
        ? "frontal-05-borrosa"
        : `frontal-${String((index % 4) + 1).padStart(2, "0")}`,
    leftPhotoId: `lateral-izquierda-${String((index % 4) + 1).padStart(2, "0")}`,
    // Caso demostrativo: MX0030812 inicia sin lateral derecha, aunque existe
    // una foto no usada en el banco para corregirlo manualmente.
    rightPhotoId:
      index === 5
        ? undefined
        : `lateral-derecha-${String((index % 4) + 1).padStart(2, "0")}`,
  }));
