import type { Metadata } from "next";
import { ExcelWorkflow } from "@/app/procesos/coljuegos/_components/excel-workflow";

export const metadata: Metadata = {
  title: "Expedientes Coljuegos",
};

export default function ColjuegosPage() {
  return <ExcelWorkflow />;
}
