import { Icon } from "@/components/shared/icons";
import { ProcessHeader } from "@/components/shared/process-header";
import { Stepper } from "@/components/shared/stepper";

interface ModulePlaceholderProps {
  title: string;
  country: string;
  description: string;
}

export function ModulePlaceholder({ title, country, description }: ModulePlaceholderProps) {
  return (
    <div className="space-y-8">
      <ProcessHeader
        eyebrow={country}
        title={title}
        description={description}
        status="En construcción"
      />

      <Step d="Este módulo conservará la misma experiencia de pasos cuando se defina su flujo." />

      <section className="grid min-h-[380px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="max-w-lg">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <Icon name="sparkles" className="h-8 w-8" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Próximamente</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">El proceso está por definirse</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Esta área ya forma parte de la plataforma. Cuando el equipo confirme los requisitos, aquí aparecerán sus pasos, validaciones y documentos.
          </p>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
            <div className="flex gap-3">
              <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <p className="text-sm leading-6 text-slate-600">
                No necesitas realizar ninguna acción en este módulo por ahora.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({ d }: { d: string }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Flujo del proceso</p>
      <div className="opacity-60">
        <Stepper steps={["Definición", "Documentación", "Validación", "Resultado"]} currentStep={1} />
      </div>
      <p className="mt-3 text-xs text-slate-500">{d}</p>
    </div>
  );
}
