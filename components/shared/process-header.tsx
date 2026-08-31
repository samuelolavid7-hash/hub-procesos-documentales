import type { ReactNode } from "react";
import { StatusBadge } from "@/components/shared/status-badge";

interface ProcessHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  status?: "Activo" | "En construcción";
  actions?: ReactNode;
}

export function ProcessHeader({ eyebrow, title, description, status, actions }: ProcessHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="mb-2 flex items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
          {status ? <StatusBadge status={status} /> : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
