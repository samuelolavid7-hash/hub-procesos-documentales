import type { ProcessDefinition } from "@/lib/types";

// Este catálogo es la única fuente de navegación de procesos.
// Agregar un proceso futuro no requiere modificar los módulos existentes.
export const processes: ProcessDefinition[] = [
  {
    id: "coljuegos",
    name: "Expedientes fotográficos Coljuegos",
    shortName: "Expedientes Coljuegos",
    description: "Preparación y control de expedientes fotográficos para Colombia.",
    href: "/procesos/coljuegos",
    country: "Colombia",
    countryCode: "CO",
    status: "active",
  },
  {
    id: "declaraciones-juradas",
    name: "Declaraciones Juradas",
    shortName: "Declaraciones Juradas",
    description: "Flujo documental pendiente de definición funcional.",
    href: "/procesos/declaraciones-juradas",
    country: "LATAM",
    countryCode: "LA",
    status: "construction",
  },
  {
    id: "gli-argentina",
    name: "GLI Argentina",
    shortName: "GLI Argentina",
    description: "Gestión de documentación técnica y regulatoria para Argentina.",
    href: "/procesos/gli-argentina",
    country: "Argentina",
    countryCode: "AR",
    status: "construction",
  },
];
