# AGENTS.md

## Contexto del proyecto

Este repositorio contiene una plataforma interna para gestionar procesos documentales regulatorios de una empresa de máquinas de casino en LATAM.

Los usuarios principales son miembros del personal administrativo sin perfil técnico. Toda la interfaz y los textos visibles para el usuario deben estar en español y usar un lenguaje claro.

## Stack tecnológico

- Next.js con App Router.
- TypeScript.
- Tailwind CSS.
- Sin base de datos por ahora.

## Estructura y convenciones

- Ubicar los componentes compartidos en `components/shared/`. Deben ser reutilizables por todos los módulos.
- Implementar cada proceso documental de forma independiente en `app/procesos/<nombre>/`.
- Mantener los datos simulados en `lib/mock/`, separados de la lógica de interfaz.
- Marcar los puntos destinados a integraciones futuras con el comentario `// TODO: integración real`.

## Reglas de trabajo

- No instalar dependencias nuevas sin explicar previamente para qué sirven.
- Priorizar código legible y explícito sobre soluciones ingeniosas difíciles de mantener.
- Comentar la lógica de negocio cuando sea necesario para explicar reglas o decisiones del dominio.
- Avisar antes de refactorizar código existente.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
