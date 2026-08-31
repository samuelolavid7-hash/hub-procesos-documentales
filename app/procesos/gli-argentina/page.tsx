import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "GLI Argentina",
};

export default function GliArgentinaPage() {
  return (
    <ModulePlaceholder
      country="Argentina"
      title="GLI Argentina"
      description="Espacio preparado para el futuro flujo de documentación técnica y regulatoria de GLI Argentina."
    />
  );
}
