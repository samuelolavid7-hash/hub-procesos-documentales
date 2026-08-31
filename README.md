# Hub de Procesos Documentales

Plataforma interna para ejecutar procesos documentales regulatorios de forma guiada y consistente.

## Estado de la Fase 1

- **Expedientes Coljuegos:** flujo completo con carga, lectura de placas, agrupación asistida, validación y descargas simuladas.
- **Declaraciones Juradas:** módulo visible, pendiente de definición funcional.
- **GLI Argentina:** módulo visible, pendiente de definición funcional.

Los datos actuales son simulados. No se guardan cambios al cerrar o recargar la aplicación.

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
      _steps/                Pasos independientes del flujo
      coljuegos-flow.tsx     Estado interactivo del proceso
    declaraciones-juradas/   Módulo placeholder
    gli-argentina/            Módulo placeholder
components/
  shared/                     Componentes reutilizables entre procesos
lib/
  coljuegos/                  Tipos y contratos de integración futura
  mock/                       Datos simulados separados de la interfaz
```

El catálogo de módulos está en `lib/mock/processes.ts`. Para agregar un proceso nuevo, se registra allí y se crea una carpeta propia dentro de `app/procesos/`.
