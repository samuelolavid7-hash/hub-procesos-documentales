import type { Metadata } from "next";
import { LectorTestPanel } from "@/app/procesos/coljuegos/prueba-lector/lector-test-panel";

export const metadata: Metadata = {
  title: "Prueba del lector de placas",
};

export default function PlateReaderTestPage() {
  return <LectorTestPanel />;
}
