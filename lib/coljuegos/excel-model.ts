import type { LocalBatchPhoto } from "./types";

export const cabinets = ["Crystal Dual_27", "Crystal_Curve", "Crystal_Dual", "Crystal_Slant", "Peak Dual 27", "Peak Slant 49", "Peak Slant 32", "Peak Curve", "Sierra 27", "RISE55", "RISE32"] as const;
export type Cabinet = typeof cabinets[number];
export type Condition = "nuevo" | "usado" | "";
export type StandardView = "frontal" | "lateralIzquierda" | "lateralDerecha";
export const standardViews: StandardView[] = ["frontal", "lateralIzquierda", "lateralDerecha"];
export interface ExcelRecord {
  id: string;
  sheet: string;
  row: number;
  serial: string;
  reference: string;
  cabinet: Cabinet | "";
  condition: Condition;
  observation: string;
  /** Anotación manual de discrepancias detectadas al revisar la placa. */
  reviewNote?: string;
  plate?: LocalBatchPhoto;
  issues: string[];
  reviewed: boolean;
  excluded: boolean;
  defaultExclusionReason?: string;
}
export type Standards = Record<string, Partial<Record<StandardView, LocalBatchPhoto>>>;
export interface CabinetAlias { cabinet: Cabinet; condition: Condition }
export type Aliases = Record<string, CabinetAlias>;
export const configurationKey = (cabinet: string, condition: Condition) => `${cabinet}|${condition}`;

const cabinetKey = (value: string) => value.toUpperCase().replace(/[\s_-]/g, "");
// Equivalencia validada con el usuario al revisar el libro real.
const knownReferences: Record<string, Cabinet> = { CRYSDUAL2727: "Crystal Dual_27" };

/** Normaliza separadores y el sufijo conocido _U; no usa coincidencias aproximadas. */
export function resolveCabinet(reference: string, aliases: Aliases): CabinetAlias | undefined {
  const used = /_U$/i.test(reference.trim());
  if (Object.hasOwn(aliases, reference)) return { ...aliases[reference], condition: aliases[reference].condition || (used ? "usado" : "") };
  const base = used ? reference.trim().slice(0, -2) : reference.trim();
  const key = cabinetKey(base);
  const matches = cabinets.filter((name) => cabinetKey(name) === key);
  const cabinet = matches.length === 1 ? matches[0] : knownReferences[key];
  return cabinet ? { cabinet, condition: used ? "usado" : "" } : undefined;
}

/** La nitidez no se deduce de la imagen: se utiliza la observación explícita del Excel. */
export function blurryObservation(observation: string): boolean {
  const normalized = observation.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (/\b(no|sin)\s+(esta\s+|es\s+)?(borros[ao]s?|desenfoque|desenfocad[ao]s?)\b/.test(normalized)) return false;
  return /\b(borros[ao]s?|desenfocad[ao]s?|ilegible|blurry|blurred)\b/.test(normalized);
}

export function lotNameFromExcel(fileName: string): string {
  return fileName.replace(/\.xlsx$/i, "");
}

export function recordProblems(record: ExcelRecord, records: ExcelRecord[], standards: Standards): string[] {
  if (record.excluded) return [];
  const problems: string[] = [];
  if (!record.serial.trim()) problems.push("Falta serial");
  if (/[<>:"/\\|?*\u0000-\u001f]/.test(record.serial) || record.serial !== record.serial.trim()) problems.push("Corrige espacios extremos o caracteres no válidos para el nombre del PDF");
  if (records.some((other) => !other.excluded && other.id !== record.id && other.serial.trim().toUpperCase() === record.serial.trim().toUpperCase())) problems.push("Serial duplicado: corrige o excluye la fila correspondiente");
  if (!record.cabinet) problems.push("Asigna un gabinete");
  if (!record.condition) problems.push("Asigna nuevo o usado");
  if (!record.plate) problems.push("Falta fotografía de placa");
  if (record.plate && records.some((other) => !other.excluded && other.id !== record.id && other.plate?.id === record.plate?.id)) problems.push("La misma placa está asociada a varios seriales");
  const standard = standards[configurationKey(record.cabinet, record.condition)];
  const viewNames = { frontal: "frontal", lateralIzquierda: "lateral izquierda", lateralDerecha: "lateral derecha" };
  for (const view of standardViews) if (!standard?.[view]) problems.push(`Falta foto estándar: ${viewNames[view]}`);
  if (!record.reviewed && (record.issues.length || record.reviewNote?.trim() || (record.observation.trim() && record.observation.trim().toUpperCase() !== "OK"))) problems.push("Revisa la observación y la asociación de la placa; luego confirma la revisión");
  return problems;
}
