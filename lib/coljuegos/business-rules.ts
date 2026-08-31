import type {
  AssignablePhotoType,
  BatchPhoto,
  MachineAssignment,
  MachineReview,
  PlateReading,
  PlateReadingSummary,
  ShellOrder,
  ValidationSummary,
} from "@/lib/coljuegos/types";

export const reviewReasonLabels: Record<MachineReview["reasons"][number], string> = {
  "falta-placa": "Falta la foto de placa",
  "falta-frontal": "Falta la foto frontal",
  "falta-lateral-izquierda": "Falta la lateral izquierda",
  "falta-lateral-derecha": "Falta la lateral derecha",
  "frontal-borrosa": "La foto frontal está borrosa",
  "lateral-izquierda-borrosa": "La lateral izquierda está borrosa",
  "lateral-derecha-borrosa": "La lateral derecha está borrosa",
  "fecha-ilegible": "La fecha de la placa es ilegible",
  "serial-no-reconocido": "El serial no pertenece a la SO",
};

/**
 * Calcula los indicadores a partir de las lecturas, evitando guardar conteos
 * duplicados que podrían quedar desactualizados al corregir una placa.
 */
export function calculatePlateReadingSummary(
  shellOrder: ShellOrder,
  readings: PlateReading[],
): PlateReadingSummary {
  return {
    expected: shellOrder.expectedSerials.length,
    detectedAndRead: readings.filter(
      (reading) =>
        reading.status === "coincide-so" || reading.status === "fecha-ilegible",
    ).length,
    unreadableDate: readings.filter(
      (reading) => reading.status === "fecha-ilegible",
    ).length,
    unrecognizedSerials: readings.filter(
      (reading) => reading.status === "fuera-so",
    ).length,
    withoutEvidence: readings.filter(
      (reading) => reading.status === "sin-evidencia",
    ).length,
  };
}

const photoFieldByType: Record<AssignablePhotoType, keyof MachineAssignment> = {
  frontal: "frontPhotoId",
  "lateral-izquierda": "leftPhotoId",
  "lateral-derecha": "rightPhotoId",
};

export function getAssignedPhotoId(
  assignment: MachineAssignment,
  type: AssignablePhotoType,
): string | undefined {
  const value = assignment[photoFieldByType[type]];
  return typeof value === "string" ? value : undefined;
}

export function evaluateMachineAssignment(
  assignment: MachineAssignment,
  photos: BatchPhoto[],
  plateReading?: PlateReading,
): MachineReview {
  const reasons: MachineReview["reasons"] = [];

  if (!assignment.platePhotoId) reasons.push("falta-placa");
  if (plateReading?.status === "fecha-ilegible") reasons.push("fecha-ilegible");

  const assignableChecks: Array<{
    type: AssignablePhotoType;
    missingReason: MachineReview["reasons"][number];
    blurryReason: MachineReview["reasons"][number];
  }> = [
    { type: "frontal", missingReason: "falta-frontal", blurryReason: "frontal-borrosa" },
    { type: "lateral-izquierda", missingReason: "falta-lateral-izquierda", blurryReason: "lateral-izquierda-borrosa" },
    { type: "lateral-derecha", missingReason: "falta-lateral-derecha", blurryReason: "lateral-derecha-borrosa" },
  ];

  for (const check of assignableChecks) {
    const photoId = getAssignedPhotoId(assignment, check.type);
    if (!photoId) {
      reasons.push(check.missingReason);
      continue;
    }

    const photo = photos.find((candidate) => candidate.id === photoId);
    if (photo?.quality === "borrosa") reasons.push(check.blurryReason);
  }

  return {
    status: reasons.length === 0 ? "completo" : "revisar",
    reasons,
  };
}

/**
 * En la validación final, una máquina sin placa se presenta como una categoría
 * propia. Aunque también requiere atención, no debe mezclarse con expedientes
 * que sí tienen placa y solo conservan otra observación.
 */
export function getMachineValidationStatus(
  assignment: MachineAssignment,
  photos: BatchPhoto[],
  plateReading?: PlateReading,
) {
  if (!assignment.platePhotoId) return "sin-evidencia" as const;
  return evaluateMachineAssignment(assignment, photos, plateReading).status;
}

export function calculateValidationSummary(
  assignments: MachineAssignment[],
  photos: BatchPhoto[],
  readings: PlateReading[],
): ValidationSummary {
  const statuses = assignments.map((assignment) => {
    const plateReading = readings.find(
      (reading) => reading.expectedSerial === assignment.serial,
    );
    return getMachineValidationStatus(assignment, photos, plateReading);
  });

  return {
    complete: statuses.filter((status) => status === "completo").length,
    review: statuses.filter((status) => status === "revisar").length,
    withoutEvidence: statuses.filter((status) => status === "sin-evidencia").length,
    unrecognized: readings.filter((reading) => reading.status === "fuera-so").length,
  };
}

export function getPhotoUsageCount(
  photoId: string,
  assignments: MachineAssignment[],
): number {
  return assignments.filter((assignment) =>
    [
      assignment.platePhotoId,
      assignment.frontPhotoId,
      assignment.leftPhotoId,
      assignment.rightPhotoId,
    ].includes(photoId),
  ).length;
}
