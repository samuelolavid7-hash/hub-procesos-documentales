import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { resizeImageToJpeg } from "@/lib/coljuegos/file-ingestion";
import { groupFieldLabels } from "@/lib/coljuegos/grouping";
import type {
  CampoFotoGrupo,
  GrupoFotografico,
  LocalBatchPhoto,
  LocalOrderDraft,
} from "@/lib/coljuegos/types";

const a4Width = 595.28;
const a4Height = 841.89;
const maximumImageSide = 2000;
const jpegQuality = 0.9;
const pageFields: CampoFotoGrupo[] = ["placa", "frontal", "lateralIzquierda", "lateralDerecha"];

interface GenerateMachinePdfOptions {
  group: GrupoFotografico;
  order: LocalOrderDraft;
  photos: LocalBatchPhoto[];
}

/** Genera las cuatro páginas de una máquina sin subir imágenes a un servidor. */
export async function generateMachinePdf({ group, order, photos }: GenerateMachinePdfOptions): Promise<Uint8Array> {
  if (!group.serialAsignado) throw new Error("El grupo no tiene un serial asignado.");

  const photoById = new Map(photos.map((photo) => [photo.id, photo]));
  const document = await PDFDocument.create();
  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);

  document.setTitle(`Expediente ${group.serialAsignado}`);
  const hasKnownOrder = order.mode === "with-order" && Boolean(order.number);
  document.setSubject(hasKnownOrder
    ? `SO ${order.number} · ${order.modelCode || "Modelo no indicado"}`
    : order.modelCode || "Modelo no indicado");
  document.setCreator("Hub de Procesos Documentales");

  for (let pageIndex = 0; pageIndex < pageFields.length; pageIndex += 1) {
    const field = pageFields[pageIndex];
    const photoId = group.fotos[field];
    const photo = photoId ? photoById.get(photoId) : undefined;
    if (!photo) throw new Error(`Falta la foto de ${groupFieldLabels[field].toLowerCase()}.`);

    // Se redimensiona una imagen por vez para limitar el uso de memoria en lotes grandes.
    const optimized = await resizeImageToJpeg(
      photo.file,
      photo.orientation ?? 1,
      maximumImageSide,
      jpegQuality,
    );
    const embeddedImage = await document.embedJpg(await optimized.blob.arrayBuffer());
    const page = document.addPage([a4Width, a4Height]);

    drawHeader(page, boldFont, regularFont, order, group.serialAsignado, groupFieldLabels[field]);

    const imageBounds = { x: 40, y: 78, width: a4Width - 80, height: a4Height - 205 };
    const fitted = embeddedImage.scaleToFit(imageBounds.width, imageBounds.height);
    page.drawImage(embeddedImage, {
      x: imageBounds.x + (imageBounds.width - fitted.width) / 2,
      y: imageBounds.y + (imageBounds.height - fitted.height) / 2,
      width: fitted.width,
      height: fitted.height,
    });

    page.drawLine({
      start: { x: 40, y: 58 },
      end: { x: a4Width - 40, y: 58 },
      thickness: 0.7,
      color: rgb(0.8, 0.83, 0.87),
    });
    const footer = `Página ${pageIndex + 1} de 4`;
    page.drawText(footer, {
      x: (a4Width - regularFont.widthOfTextAtSize(footer, 9)) / 2,
      y: 39,
      size: 9,
      font: regularFont,
      color: rgb(0.35, 0.4, 0.47),
    });
  }

  return document.save();
}

function drawHeader(
  page: ReturnType<PDFDocument["addPage"]>,
  boldFont: PDFFont,
  regularFont: PDFFont,
  order: LocalOrderDraft,
  serial: string,
  viewLabel: string,
) {
  const dark = rgb(0.06, 0.1, 0.16);
  const muted = rgb(0.35, 0.4, 0.47);
  const hasKnownOrder = order.mode === "with-order" && Boolean(order.number);
  page.drawText(toPdfText(`Expediente fotográfico · ${viewLabel}`), { x: 40, y: 795, size: 16, font: boldFont, color: dark });
  if (hasKnownOrder) {
    page.drawText(toPdfText(`SO ${order.number}`), { x: 40, y: 773, size: 10, font: regularFont, color: muted });
  }
  page.drawText(toPdfText(`Modelo: ${order.modelCode || "No indicado"}`), { x: hasKnownOrder ? 190 : 40, y: 773, size: 10, font: regularFont, color: muted });
  page.drawText(toPdfText(`Serial: ${serial}`), { x: 365, y: 773, size: 10, font: boldFont, color: dark });
  page.drawLine({ start: { x: 40, y: 755 }, end: { x: a4Width - 40, y: 755 }, thickness: 1, color: rgb(0.05, 0.47, 0.43) });
}

function toPdfText(value: string): string {
  return value.replace(/[^ -~ -ÿ]/g, "-");
}

export function createDownloadBlob(bytes: Uint8Array, type: string): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function safeFileName(value: string): string {
  return value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-") || "sin-serial";
}
