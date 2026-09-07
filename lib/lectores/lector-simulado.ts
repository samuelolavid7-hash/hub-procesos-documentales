import type {
  ContextoLecturaPlaca,
  LectorDePlaca,
  NivelConfianza,
  ResultadoLecturaPlaca,
} from "@/lib/lectores/contrato";

const TOTAL_CASOS = 20;
const CASOS_EXITOSOS = 16;
const CASOS_CONFIANZA_MEDIA = 2;

/**
 * Simula una IA imperfecta sin inspeccionar ni transmitir el contenido de la
 * foto. La posición se permuta para repartir los casos especiales a lo largo
 * del lote en vez de concentrarlos al final.
 */
export class LectorSimulado implements LectorDePlaca {
  async leer(
    imagen: File,
    contexto: ContextoLecturaPlaca,
  ): Promise<ResultadoLecturaPlaca> {
    const semilla = crearSemilla(imagen.name, contexto.indiceEnLote);
    const latencia = 300 + (semilla % 501);
    await esperar(latencia);

    const serialEsperado = obtenerSerialEsperado(contexto);
    if (!serialEsperado) {
      return {
        esPlaca: true,
        serial: null,
        fechaFabricacion: null,
        confianzaSerial: "baja",
        confianzaFecha: "baja",
        observaciones: "No hay seriales de la SO disponibles para realizar el cruce.",
      };
    }

    const tipoDeCaso = obtenerTipoDeCaso(contexto.indiceEnLote);
    const fechaFabricacion = crearFechaFabricacion(semilla);

    if (tipoDeCaso < CASOS_EXITOSOS) {
      return crearResultado(
        true,
        serialEsperado,
        fechaFabricacion,
        "alta",
        "alta",
        "Placa legible; serial y fecha identificados con claridad.",
      );
    }

    if (tipoDeCaso < CASOS_EXITOSOS + CASOS_CONFIANZA_MEDIA) {
      return crearResultado(
        true,
        variarUnCaracter(serialEsperado, semilla),
        fechaFabricacion,
        "media",
        "media",
        "Lectura probable; un carácter del serial requiere confirmación manual.",
      );
    }

    if (tipoDeCaso === 18) {
      return crearResultado(
        true,
        null,
        null,
        "baja",
        "baja",
        "Reflejo en la placa impide una lectura confiable.",
      );
    }

    return crearResultado(
      false,
      null,
      null,
      "baja",
      "baja",
      "La imagen candidata no parece contener una placa de identificación.",
    );
  }
}

function obtenerTipoDeCaso(indiceEnLote: number): number {
  const indiceSeguro = Math.max(0, Math.trunc(indiceEnLote));
  return ((indiceSeguro * 7) + 3) % TOTAL_CASOS;
}

function obtenerSerialEsperado(contexto: ContextoLecturaPlaca): string | null {
  if (contexto.serialesEsperados.length === 0) return null;
  const indice = Math.max(0, Math.trunc(contexto.indiceEnLote));
  return contexto.serialesEsperados[indice % contexto.serialesEsperados.length] ?? null;
}

function crearResultado(
  esPlaca: boolean,
  serial: string | null,
  fechaFabricacion: string | null,
  confianzaSerial: NivelConfianza,
  confianzaFecha: NivelConfianza,
  observaciones: string,
): ResultadoLecturaPlaca {
  return {
    esPlaca,
    serial,
    fechaFabricacion,
    confianzaSerial,
    confianzaFecha,
    observaciones,
  };
}

function crearSemilla(nombreArchivo: string, indiceEnLote: number): number {
  const texto = `${nombreArchivo.toLowerCase()}-${indiceEnLote}`;
  let hash = 2166136261;

  for (let index = 0; index < texto.length; index += 1) {
    hash ^= texto.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function crearFechaFabricacion(semilla: number): string {
  const day = (semilla % 28) + 1;
  const month = (Math.floor(semilla / 28) % 12) + 1;
  const year = 2022 + (Math.floor(semilla / 336) % 4);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function variarUnCaracter(serial: string, semilla: number): string {
  if (serial.length === 0) return serial;

  const position = semilla % serial.length;
  const original = serial[position];
  const replacement = reemplazarCaracter(original);
  return `${serial.slice(0, position)}${replacement}${serial.slice(position + 1)}`;
}

function reemplazarCaracter(character: string): string {
  if (/\d/.test(character)) return String((Number(character) + 1) % 10);
  if (/[A-Z]/i.test(character)) {
    const upper = character.toUpperCase();
    return upper === "Z" ? "A" : String.fromCharCode(upper.charCodeAt(0) + 1);
  }
  return "X";
}

function esperar(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
