import type {
  CampoFotoGrupo,
  GrupoFotografico,
  LocalBatchPhoto,
  PhotoType,
} from "@/lib/coljuegos/types";

const groupFields: CampoFotoGrupo[] = [
  "placa",
  "frontal",
  "lateralIzquierda",
  "lateralDerecha",
];

export const groupFieldLabels: Record<CampoFotoGrupo, string> = {
  placa: "Placa",
  frontal: "Vista frontal",
  lateralIzquierda: "Lateral izquierda",
  lateralDerecha: "Lateral derecha",
};

export const groupFieldTypes: Record<CampoFotoGrupo, PhotoType> = {
  placa: "placa",
  frontal: "frontal",
  lateralIzquierda: "lateral-izquierda",
  lateralDerecha: "lateral-derecha",
};

export interface GroupingProposal {
  groups: GrupoFotografico[];
  ungroupedPhotoIds: string[];
}

/**
 * La regla inicial del negocio es estrictamente cronológica: cada cuatro fotos
 * consecutivas forman una máquina en el orden placa, frontal, izquierda y derecha.
 */
export function createGroupingProposal(photos: LocalBatchPhoto[]): GroupingProposal {
  const readyPhotos = photos.filter((photo) => photo.processingStatus !== "error");
  const completePhotoCount = Math.floor(readyPhotos.length / 4) * 4;
  const groups: GrupoFotografico[] = [];

  for (let index = 0; index < completePhotoCount; index += 4) {
    groups.push({
      id: `grupo-${index / 4 + 1}`,
      numeroGrupo: index / 4 + 1,
      fotos: {
        placa: readyPhotos[index].id,
        frontal: readyPhotos[index + 1].id,
        lateralIzquierda: readyPhotos[index + 2].id,
        lateralDerecha: readyPhotos[index + 3].id,
      },
      serialAsignado: null,
      confirmado: false,
      origen: "propuesto",
    });
  }

  return {
    groups,
    ungroupedPhotoIds: readyPhotos.slice(completePhotoCount).map((photo) => photo.id),
  };
}

export function isGroupComplete(group: GrupoFotografico): boolean {
  return Boolean(
    group.serialAsignado
    && groupFields.every((field) => group.fotos[field]),
  );
}

export function countPhotoUses(groups: GrupoFotografico[], photoId: string): number {
  return groups.reduce((total, group) => (
    total + groupFields.filter((field) => group.fotos[field] === photoId).length
  ), 0);
}

export function getAssignedSerials(groups: GrupoFotografico[]): string[] {
  return groups.flatMap((group) => group.serialAsignado ? [group.serialAsignado] : []);
}
