import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Declaraciones Juradas",
};

export default function AffidavitsPage() {
  return (
    <ModulePlaceholder
      country="LATAM"
      title="Declaraciones Juradas"
      description="Módulo reservado para centralizar la preparación y revisión de declaraciones juradas."
    />
  );
}
