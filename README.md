# Hub de Procesos Documentales

Plataforma interna para ejecutar procesos documentales regulatorios de forma guiada y consistente.

## Estado actual

- **Expedientes Coljuegos:** flujo completo con carga, lectura de placas, agrupación asistida, validación y descargas simuladas.
- **Ingesta real (Fase 2, bloque A):** selección o arrastre de carpetas, lectura local de JPG/JPEG/PNG/HEIC, metadatos EXIF y miniaturas de hasta 400 px.
- **Declaraciones Juradas:** módulo visible, pendiente de definición funcional.
- **GLI Argentina:** módulo visible, pendiente de definición funcional.

Las fotos reales se procesan solo en el navegador y no se guardan ni se envían a un servidor. La lectura de placas y los pasos posteriores continúan en modo demostración.

## Requisitos para ejecutar el proyecto

- Node.js 24.
- pnpm 11.

Si estos programas no están instalados, solicita ayuda antes de continuar.

## Comandos principales

```bash
pnpm install
pnpm dev
```

Después, abre `http://localhost:3000` en el navegador.

Para validar el proyecto:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Estructura

```text
app/
  procesos/
    coljuegos/
      _components/           Componentes exclusivos del módulo Coljuegos
      _steps/                Pasos independientes del flujo
      coljuegos-flow.tsx     Estado interactivo del proceso
    declaraciones-juradas/   Módulo placeholder
    gli-argentina/            Módulo placeholder
components/
  shared/                     Componentes reutilizables entre procesos
lib/
  coljuegos/                  Tipos, reglas e ingesta local de fotografías
  mock/                       Datos simulados separados de la interfaz
```

El catálogo de módulos está en `lib/mock/processes.ts`. Para agregar un proceso nuevo, se registra allí y se crea una carpeta propia dentro de `app/procesos/`.
