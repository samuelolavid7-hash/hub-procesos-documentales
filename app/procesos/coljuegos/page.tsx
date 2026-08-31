import type { Metadata } from "next";
import { ColjuegosFlow } from "@/app/procesos/coljuegos/coljuegos-flow";
import {
  mockBatchUpload,
  mockMachineAssignments,
  mockPhotoBank,
  mockPlateReadings,
  mockShellOrder,
} from "@/lib/mock/coljuegos";

export const metadata: Metadata = {
  title: "Expedientes Coljuegos",
};

export default function ColjuegosPage() {
  return (
    <ColjuegosFlow
      shellOrder={mockShellOrder}
      simulatedBatch={mockBatchUpload}
      plateReadings={mockPlateReadings}
      photos={mockPhotoBank}
      initialAssignments={mockMachineAssignments}
    />
  );
}
