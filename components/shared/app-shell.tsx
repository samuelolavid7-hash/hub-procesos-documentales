import type { ReactNode } from "react";
import { Icon } from "@/components/shared/icons";
import { ProcessNavigation } from "@/components/shared/process-navigation";
import { ToastProvider } from "@/components/shared/toast";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="hidden min-h-screen flex-col bg-slate-950 px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
          <div className="flex items-center gap-3 px-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-400 text-slate-950 shadow-lg shadow-teal-950/20">
              <Icon name="archive" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-wide text-white">HUB DOCUMENTAL</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Procesos regulatorios</p>
            </div>
          </div>

          <div className="my-6 h-px bg-white/8" />
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Procesos</p>
          <ProcessNavigation />

          <div className="mt-auto rounded-xl border border-white/8 bg-white/[0.04] p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">AM</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">Ana Martínez</p>
                <p className="truncate text-xs text-slate-500">Administración regulatoria</p>
              </div>
              <Icon name="chevron-down" className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-teal-400">
                <Icon name="archive" className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-slate-950">HUB DOCUMENTAL</span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
              <Icon name="folder" className="h-4 w-4" />
              <span>Procesos documentales</span>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Buscar" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <Icon name="search" className="h-[18px] w-[18px]" />
              </button>
              <button aria-label="Notificaciones" className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <Icon name="bell" className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              <span className="ml-1 hidden h-8 w-px bg-slate-200 sm:block" />
              <div className="ml-1 hidden items-center gap-2 sm:flex lg:hidden">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">AM</span>
              </div>
            </div>
          </header>

          <div className="border-b border-slate-200 bg-slate-950 px-3 py-3 lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <ProcessNavigation compact />
            </div>
          </div>

          <div role="status" className="flex items-center justify-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-center text-xs font-medium text-blue-800">
            <Icon name="info" className="h-4 w-4 shrink-0" />
            <span>Las fotos reales se procesan únicamente en este navegador. La lectura de placas continúa en modo demostración y los cambios no se guardan.</span>
          </div>

          <main className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
