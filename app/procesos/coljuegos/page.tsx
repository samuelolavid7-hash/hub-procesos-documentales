import type { Metadata } from "next";
import { ColjuegosFlow } from "@/app/procesos/coljuegos/coljuegos-flow";

export const metadata: Metadata = {
  title: "Expedientes Coljuegos",
};

export default function ColjuegosPage() {
  return <ColjuegosFlow />;
}
