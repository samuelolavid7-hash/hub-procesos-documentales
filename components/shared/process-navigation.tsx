"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/shared/icons";
import { processes } from "@/lib/mock/processes";

export function ProcessNavigation({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Procesos documentales"
      className={compact ? "flex min-w-max gap-2" : "space-y-1.5"}
    >
      {processes.map((process) => {
        const isActive = pathname.startsWith(process.href);

        return (
          <Link
            key={process.id}
            href={process.href}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${compact ? "min-w-max" : ""} ${isActive ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/7 hover:text-white"}`}
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isActive ? "bg-teal-400 text-slate-950" : "bg-white/8 text-slate-300 group-hover:bg-white/12"}`}>
              <Icon name={process.id === "coljuegos" ? "image" : "document"} className="h-[18px] w-[18px]" />
            </span>
            <span className={compact ? "whitespace-nowrap" : "min-w-0 flex-1"}>
              <span className="block truncate text-sm font-semibold">{process.shortName}</span>
              <span className={`mt-0.5 text-[11px] ${compact ? "hidden sm:block" : "block"} ${isActive ? "text-teal-100" : "text-slate-500"}`}>
                {process.country}
              </span>
            </span>
            {process.status === "construction" ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" title="En construcción" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
