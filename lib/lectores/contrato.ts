export type NivelConfianza = "alta" | "media" | "baja";

export interface ContextoLecturaPlaca {
  indiceEnLote: number;
  serialesEsperados: readonly string[];
}

export interface ResultadoLecturaPlaca {
  esPlaca: boolean;
  serial: string | null;
  fechaFabricacion: string | null;
  confianzaSerial: NivelConfianza;
  confianzaFecha: NivelConfianza;
  observaciones: string;
}

/**
 * Contrato único que utilizarán la demostración y el futuro proveedor real.
 * La interfaz no conoce detalles de OpenAI ni de la pantalla que la consume.
 */
export interface LectorDePlaca {
  leer(
    imagen: File,
    contexto: ContextoLecturaPlaca,
  ): Promise<ResultadoLecturaPlaca>;
}
