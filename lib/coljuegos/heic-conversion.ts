/**
 * Convierte HEIC/HEIF a un JPEG de trabajo dentro del navegador.
 * El decodificador se importa solo cuando aparece este formato para no aumentar
 * el tiempo de carga de los lotes que ya vienen en JPG o PNG.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const { heicTo } = await import("heic-to/csp");
  const jpegBlob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.94,
  });
  const jpegName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([jpegBlob], jpegName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
