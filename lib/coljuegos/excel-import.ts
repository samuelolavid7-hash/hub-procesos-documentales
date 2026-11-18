import JSZip from "jszip";
import { blurryObservation, resolveCabinet, type Aliases, type ExcelRecord } from "./excel-model";
import type { LocalBatchPhoto } from "./types";

const descendants = (node: Document | Element, name: string): Element[] => Array.from(node.getElementsByTagNameNS("*", name));
const children = (node: Element | undefined, name: string): Element[] => node ? Array.from(node.children).filter((child) => child.localName === name) : [];
const attribute = (node: Element, name: string) => Array.from(node.attributes).find((attr) => attr.localName === name)?.value ?? "";
const text = (node: Element | undefined) => node?.textContent ?? "";
const indexValue = (value: string | null | undefined): number => value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : -1;
function parseXml(value: string): Document {
  const document = new DOMParser().parseFromString(value, "application/xml");
  if (descendants(document, "parsererror").length) throw new Error("El Excel contiene un XML que no puede leerse.");
  return document;
}
function resolvePath(base: string, target: string): string {
  const parts: string[] = [];
  for (const part of (target.startsWith("/") ? target.slice(1) : `${base.slice(0, base.lastIndexOf("/") + 1)}${target}`).split("/")) {
    if (part === "..") parts.pop(); else if (part && part !== ".") parts.push(part);
  }
  return parts.join("/");
}
const relPath = (path: string) => `${path.slice(0, path.lastIndexOf("/") + 1)}_rels/${path.slice(path.lastIndexOf("/") + 1)}.rels`;

export async function importExcel(file: File, aliases: Aliases = {}): Promise<{ records: ExcelRecord[]; sheets: string[]; warnings: string[] }> {
  if (file.size > 100 * 1024 * 1024) throw new Error("El Excel supera 100 MB. Divide el libro en lotes más pequeños.");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  let expandedBytes = 0;
  async function xml(path: string): Promise<Document | undefined> {
    const entry = zip.file(path);
    if (!entry) return undefined;
    const source = await entry.async("string");
    expandedBytes += source.length * 2;
    if (expandedBytes > 150 * 1024 * 1024) throw new Error("El contenido del libro es demasiado grande; divide el lote.");
    return parseXml(source);
  }
  async function relationships(path: string): Promise<Map<string, string>> {
    const doc = await xml(relPath(path));
    const entries = doc ? descendants(doc, "Relationship") : [];
    return new Map(entries.filter((rel) => rel.getAttribute("TargetMode") !== "External" && rel.getAttribute("Target") && entries.filter((other) => other.getAttribute("Id") === rel.getAttribute("Id")).length === 1).map((rel) => [rel.getAttribute("Id")!, resolvePath(path, rel.getAttribute("Target")!)]));
  }
  const book = await xml("xl/workbook.xml");
  if (!book) throw new Error("Selecciona un libro .xlsx válido. El formato .xls antiguo no es compatible.");
  const bookRels = await relationships("xl/workbook.xml");
  const shared = await xml("xl/sharedStrings.xml");
  const strings = shared ? descendants(shared, "si").map((si) => descendants(si, "t").map((t) => text(t)).join("")) : [];
  const styles = await xml("xl/styles.xml");
  const formats = new Map(styles ? descendants(styles, "numFmt").map((fmt) => [fmt.getAttribute("numFmtId"), fmt.getAttribute("formatCode") ?? ""]) : []);
  const cellFormats = styles ? children(descendants(styles, "cellXfs")[0], "xf") : [];
  function cellValue(cell: Element | undefined): { value: string; issue?: string } {
    if (!cell) return { value: "" };
    const raw = text(children(cell, "v")[0]);
    const type = cell.getAttribute("t");
    if (type === "s") return { value: strings[Number(raw)] ?? "" };
    if (type === "inlineStr") return { value: descendants(cell, "t").map((t) => text(t)).join("") };
    if (type === "e") return { value: "", issue: `Celda ${cell.getAttribute("r")}: ${raw}` };
    if (type === "str") return { value: raw };
    // Nunca convertimos el identificador a Number: preservamos sus dígitos.
    const format = formats.get(cellFormats[Number(cell.getAttribute("s") ?? 0)]?.getAttribute("numFmtId")) ?? "General";
    if (/^0+$/.test(format) && /^\d+$/.test(raw) && raw.length <= 15) return { value: raw.padStart(format.length, "0") };
    const issue = raw && (!/^\d+$/.test(raw) || raw.length > 15 || (format !== "General" && format !== "@" && format !== "0")) ? `Revisar representación de ${cell.getAttribute("r")}: valor ${raw}, formato ${format}` : undefined;
    return { value: raw, issue };
  }
  const metadata = await xml("xl/metadata.xml");
  const metadataTypes = metadata ? children(descendants(metadata, "metadataTypes")[0], "metadataType") : [];
  const valueMetadata = metadata ? children(descendants(metadata, "valueMetadata")[0], "bk") : [];
  const futureMetadata = metadata ? descendants(metadata, "futureMetadata").find((node) => node.getAttribute("name") === "XLRICHVALUE") : undefined;
  const futureBlocks = children(futureMetadata, "bk");
  // La clave de la estructura determina el índice; nunca se usa el orden de archivos como orden de filas.
  // Especificación: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/aac1e2a6-7072-4e66-b1de-f20b8bf63318
  const richPaths = Object.keys(zip.files).filter((path) => /^xl\/richData\/[^/]+\.xml$/i.test(path));
  const richDocs = await Promise.all(richPaths.map(async (path) => ({ path, doc: await xml(path) })));
  const richValues = richDocs.find(({ doc }) => doc?.documentElement.localName === "rvData")?.doc;
  const richStructures = richDocs.find(({ doc }) => doc?.documentElement.localName === "rvStructures")?.doc;
  const richRelationships = richDocs.find(({ doc }) => doc?.documentElement.localName === "richValueRels");
  const mediaRels = richRelationships ? await relationships(richRelationships.path) : new Map<string, string>();
  function richImage(cell: Element): string | undefined {
    const index = indexValue(cell.getAttribute("vm")) - 1;
    if (index < 0 || !valueMetadata[index] || !richValues || !richStructures || !richRelationships?.doc) return undefined;
    const richRefs = children(valueMetadata[index], "rc").filter((rc) => metadataTypes[indexValue(rc.getAttribute("t")) - 1]?.getAttribute("name") === "XLRICHVALUE");
    if (richRefs.length !== 1) return undefined;
    const future = futureBlocks[indexValue(richRefs[0].getAttribute("v"))];
    const binding = future ? descendants(future, "rvb")[0] : undefined;
    if (!binding) return undefined;
    const value = children(richValues.documentElement, "rv")[indexValue(binding.getAttribute("i"))];
    if (!value) return undefined;
    const structure = children(richStructures.documentElement, "s")[indexValue(value.getAttribute("s"))];
    if (structure?.getAttribute("t") !== "_localImage") return undefined;
    const keyIndex = children(structure, "k").findIndex((key) => key.getAttribute("n") === "_rvRel:LocalImageIdentifier");
    if (keyIndex < 0) return undefined;
    const imageIndex = indexValue(text(children(value, "v")[keyIndex]));
    const rel = children(richRelationships.doc.documentElement, "rel")[imageIndex];
    return rel ? mediaRels.get(attribute(rel, "id")) : undefined;
  }
  const images = new Map<string, LocalBatchPhoto>();
  async function image(path: string): Promise<LocalBatchPhoto | undefined> {
    if (images.has(path)) return images.get(path);
    const entry = zip.file(path);
    if (!entry || !/\.(png|jpe?g)$/i.test(path)) return undefined;
    const bytes = await entry.async("uint8array");
    expandedBytes += bytes.length;
    if (expandedBytes > 150 * 1024 * 1024) throw new Error("Las imágenes superan el tamaño admitido; divide el lote.");
    const copy = new Uint8Array(bytes.length); copy.set(bytes);
    const name = path.split("/").pop()!;
    const photoFile = new File([copy.buffer], name, { type: /png$/i.test(name) ? "image/png" : "image/jpeg" });
    try { const bitmap = await createImageBitmap(photoFile); bitmap.close(); } catch { return undefined; }
    const photo: LocalBatchPhoto = { source: "local", id: `excel:${path}`, file: photoFile, fileName: name, relativePath: path, extension: /png$/i.test(name) ? "png" : "jpg", sizeBytes: bytes.length, lastModified: 0, capturedAt: "", timestampSource: "file", thumbnailUrl: URL.createObjectURL(photoFile), processingStatus: "ready" };
    images.set(path, photo); return photo;
  }
  const records: ExcelRecord[] = [], sheets: string[] = [], warnings: string[] = [];
  try {
    for (const sheet of descendants(book, "sheet")) {
      const sheetPath = bookRels.get(attribute(sheet, "id"));
      if (!sheetPath) continue;
      const doc = await xml(sheetPath);
      if (!doc) continue;
      const sheetName = sheet.getAttribute("name") ?? sheetPath;
      const rows = descendants(doc, "row");
      const headers = rows.map((row) => ({ row, cells: children(row, "c") })).filter(({ cells }) => cells.some((cell) => /^serial(es)?$/i.test(cellValue(cell).value.trim())) && cells.some((cell) => /^gabinete$/i.test(cellValue(cell).value.trim())));
      if (headers.length !== 1) { warnings.push(`${sheetName}: ${headers.length ? "varias tablas posibles; separa la tabla en una hoja" : "sin encabezados Gabinete/Seriales; hoja omitida"}.`); continue; }
      sheets.push(sheetName);
      const header = headers[0];
      const column = (name: RegExp) => header.cells.find((cell) => name.test(cellValue(cell).value.trim()))?.getAttribute("r")?.replace(/\d/g, "");
      const columns = { serial: column(/^serial(es)?$/i), cabinet: column(/^gabinete$/i), condition: column(/^(condition|condici[oó]n)$/i), observation: column(/^(obs|observaci[oó]n)$/i), photo: column(/^(photo|foto|placa)$/i) };
      for (const row of rows.filter((row) => Number(row.getAttribute("r")) > Number(header.row.getAttribute("r")))) {
        const rowNumber = Number(row.getAttribute("r"));
        const cells = children(row, "c");
        const getCell = (col: string | undefined) => cells.find((cell) => cell.getAttribute("r") === `${col}${rowNumber}`);
        const serial = cellValue(getCell(columns.serial));
        const reference = cellValue(getCell(columns.cabinet)).value;
        const observation = cellValue(getCell(columns.observation)).value;
        const photoCell = getCell(columns.photo);
        if (!serial.value && !serial.issue && !reference && !observation && !photoCell?.getAttribute("vm")) continue;
        const issues: string[] = serial.issue ? [serial.issue] : [];
        if (cells.some((cell) => children(cell, "f").length)) issues.push("La fila contiene fórmulas: verifica los valores guardados");
        const binding = photoCell ? richImage(photoCell) : undefined;
        const plate = binding ? await image(binding) : undefined;
        if (!plate) issues.push("No se pudo resolver una imagen en celda de forma inequívoca; asigna la placa manualmente");
        if (descendants(doc, "mergeCell").some((merge) => { const match = /^(\D+)(\d+):(\D+)(\d+)$/.exec(merge.getAttribute("ref") ?? ""); return match && rowNumber >= Number(match[2]) && rowNumber <= Number(match[4]); })) issues.push("Fila con celdas combinadas: verifica la asociación; no se propagan valores automáticamente");
        const mapped = resolveCabinet(reference, aliases);
        const conditionText = cellValue(getCell(columns.condition)).value.trim().toLowerCase();
        const explicitCondition = /^(usad[ao]|used)$/.test(conditionText) ? "usado" : /^(nuev[ao]|new)$/.test(conditionText) ? "nuevo" : "";
        if (explicitCondition && mapped?.condition && explicitCondition !== mapped.condition) issues.push("La condición de la columna contradice el sufijo o la equivalencia del gabinete: confirma cuál es correcta");
        const condition = explicitCondition || mapped?.condition || "";
        const excluded = blurryObservation(observation);
        records.push({ id: `${sheetName}:${rowNumber}`, sheet: sheetName, row: rowNumber, serial: serial.value, reference, cabinet: mapped?.cabinet ?? "", condition, observation, plate, issues, reviewed: false, excluded, defaultExclusionReason: excluded ? "Excluido por defecto: la observación indica foto borrosa, desenfocada o ilegible" : undefined });
      }
    }
    if (!records.length) throw new Error(`No se encontraron registros. ${warnings.join(" ")}`);
    return { records, sheets, warnings };
  } catch (error) {
    for (const photo of images.values()) if (photo.thumbnailUrl) URL.revokeObjectURL(photo.thumbnailUrl);
    throw error;
  }
}
