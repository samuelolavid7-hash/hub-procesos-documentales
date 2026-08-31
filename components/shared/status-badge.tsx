type Status =
  | "Activo"
  | "En construcción"
  | "Pendiente"
  | "Cargado"
  | "Borrador"
  | "En revisión"
  | "Listo"
  | "Observado"
  | "Coincide con la SO"
  | "Fecha ilegible"
  | "No está en la SO"
  | "Sin foto de placa"
  | "Sin evidencia"
  | "Completo"
  | "Revisar";

const styles: Record<Status, string> = {
  Activo: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "En construcción": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Pendiente: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Cargado: "bg-teal-50 text-teal-700 ring-teal-600/20",
  Borrador: "bg-slate-100 text-slate-700 ring-slate-500/20",
  "En revisión": "bg-blue-50 text-blue-700 ring-blue-600/20",
  Listo: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Observado: "bg-rose-50 text-rose-700 ring-rose-600/20",
  "Coincide con la SO": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Fecha ilegible": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "No está en la SO": "bg-rose-50 text-rose-700 ring-rose-600/20",
  "Sin foto de placa": "bg-slate-100 text-slate-700 ring-slate-500/20",
  "Sin evidencia": "bg-rose-50 text-rose-700 ring-rose-600/20",
  Completo: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Revisar: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
