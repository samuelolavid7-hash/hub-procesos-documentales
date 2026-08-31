import { Icon } from "@/components/shared/icons";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <ol aria-label="Progreso del proceso" className="grid gap-3 md:grid-cols-4">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <li key={step} className="relative">
            <div className={`flex min-h-20 items-center gap-3 rounded-xl border p-4 ${isCurrent ? "border-teal-600 bg-teal-50/70" : "border-slate-200 bg-white"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${isComplete ? "bg-teal-700 text-white" : isCurrent ? "bg-white text-teal-700 ring-2 ring-teal-600" : "bg-slate-100 text-slate-500"}`}>
                {isComplete ? <Icon name="check" className="h-4 w-4" /> : stepNumber}
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paso {stepNumber}</p>
                <p className={`mt-0.5 text-sm font-semibold ${isCurrent ? "text-teal-900" : "text-slate-700"}`}>{step}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
