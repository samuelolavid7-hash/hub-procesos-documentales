export type ProcessStatus = "active" | "construction";

export interface ProcessDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  href: string;
  country: string;
  countryCode: string;
  status: ProcessStatus;
}
