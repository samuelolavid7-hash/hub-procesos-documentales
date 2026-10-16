import { generateMachinePdf, safeFileName } from "@/lib/coljuegos/pdf-generator";
import { isGroupComplete } from "@/lib/coljuegos/grouping";
import type { GrupoFotografico, LocalBatchPhoto, LocalOrderDraft } from "@/lib/coljuegos/types";

export interface ExportProgress {
  completed: number;
  total: number;
  currentSerial?: string;
  phase: "pdf" | "zip";
}

export interface ExportFailure {
  serial: string;
  message: string;
}

export interface ExportPackageResult {
  blob: Blob;
  exportedSerials: string[];
  failures: ExportFailure[];
}

interface GeneratePackageOptions {
  groups: GrupoFotografico[];
  order: LocalOrderDraft;
  photos: LocalBatchPhoto[];
  onProgress: (progress: ExportProgress) => void;
}

export async function generateExportPackage({ groups, order, photos, onProgress }: GeneratePackageOptions): Promise<ExportPackageResult> {
  const { default: JSZip } = await import("jszip");
  const eligibleGroups = groups.filter((group) => group.confirmado && isGroupComplete(group));
  const zip = new JSZip();
  const exportedSerials: string[] = [];
  const failures: ExportFailure[] = [];

  for (let index = 0; index < eligibleGroups.length; index += 1) {
    const group = eligibleGroups[index];
    const serial = group.serialAsignado ?? `grupo-${group.numeroGrupo}`;
    onProgress({ completed: index, total: eligibleGroups.length, currentSerial: serial, phase: "pdf" });

    try {
      const pdf = await generateMachinePdf({ group, order, photos });
      zip.file(`${safeFileName(serial)}.pdf`, pdf);
      exportedSerials.push(serial);
    } catch (error) {
      failures.push({
        serial,
        message: error instanceof Error ? error.message : "No se pudo generar el PDF.",
      });
    }
  }

  onProgress({ completed: eligibleGroups.length, total: eligibleGroups.length, phase: "zip" });
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return { blob, exportedSerials, failures };
}
