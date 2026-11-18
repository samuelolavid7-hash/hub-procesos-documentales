// Datos sintéticos de prueba; no contienen fotos ni seriales del usuario.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const JSZip = require("jszip");
const Module = require("node:module");
const modulePath = path.resolve("lib/coljuegos/excel-model.ts");
const compiled = ts.transpileModule(fs.readFileSync(modulePath, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const modelModule = new Module(modulePath, module);
modelModule._compile(compiled, modulePath);
const { recordProblems, resolveCabinet, blurryObservation, lotNameFromExcel } = modelModule.exports;
const record = { id: "a", serial: "00123", reference: "Peak Curve", cabinet: "Peak Curve", condition: "usado", plate: { id: "plate-a" }, issues: [], observation: "OK", excluded: false, reviewed: false };
const standards = { "Peak Curve|usado": { frontal: {}, lateralIzquierda: {}, lateralDerecha: {} } };
assert.deepEqual(recordProblems(record, [record], standards), []);
assert(recordProblems({ ...record, condition: "nuevo" }, [record], standards).some((x) => x.includes("estándar")));
assert(recordProblems(record, [record, { ...record, id: "b" }], standards).some((x) => x.includes("duplicado")));
assert.deepEqual(recordProblems(record, [record, { ...record, id: "b", excluded: true }], standards), []);
assert(recordProblems({ ...record, observation: "Falta placa" }, [record], standards).some((x) => x.includes("Revisa")));
assert(recordProblems({ ...record, plate: undefined, reviewed: true }, [record], standards).includes("Falta fotografía de placa"));
assert.equal(resolveCabinet("PC-U", {}), undefined);
assert.equal(resolveCabinet("PC-U", { "PC-U": { cabinet: "Peak Curve", condition: "usado" } }).cabinet, "Peak Curve");
assert.deepEqual(resolveCabinet("CRYSTALDUAL_27_U", {}), { cabinet: "Crystal Dual_27", condition: "usado" });
assert.deepEqual(resolveCabinet("CRYSDUAL_27_27_U", {}), { cabinet: "Crystal Dual_27", condition: "usado" });
assert.equal(resolveCabinet("crystal_dual_27_u", {}).cabinet, "Crystal Dual_27");
assert.equal(resolveCabinet("CRYSTALDUAL_27_U", {CRYSTALDUAL_27_U:{cabinet:"Crystal Dual_27",condition:""}}).condition, "usado");
assert.equal(resolveCabinet("CRYSTAL", {}), undefined);
for (const observation of ["Foto borrosa", "Placa desenfocada", "Ilegible"]) assert.equal(blurryObservation(observation), true);
for (const observation of ["OK", "Falta placa", "No está borrosa", "Sin desenfoque"]) assert.equal(blurryObservation(observation), false);
assert.equal(lotNameFromExcel("OPP318503 Slot Tech - Trade Sales (35).xlsx"), "OPP318503 Slot Tech - Trade Sales (35)");
console.log("21 comprobaciones de validación correctas");

async function fixture() {
  const zip = new JSZip();
  const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
  const inline = (ref, value) => `<c r="${ref}" t="inlineStr"><is><t>${value}</t></is></c>`;
  zip.file("xl/workbook.xml", `<workbook ${ns} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Otra hoja" r:id="rId2"/><sheet name="Maquinas" r:id="rId1"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>');
  zip.file("xl/worksheets/sheet2.xml", `<worksheet ${ns}><sheetData><row r="1">${inline("A1", "Otra estructura")}</row></sheetData></worksheet>`);
  const header = ["Gabinete", "Seriales", "Condition", "Obs", "Photo"].map((value, index) => inline(`${String.fromCharCode(65 + index)}3`, value)).join("");
  const row = (index, serial, vm, obs = "OK") => `<row r="${index}">${inline(`A${index}`, "Peak Curve")}${serial}${inline(`C${index}`, "Used")}${inline(`D${index}`, obs)}${vm ? `<c r="E${index}" t="e" vm="${vm}"><v>#VALUE!</v></c>` : ""}</row>`;
  zip.file("xl/worksheets/sheet1.xml", `<worksheet ${ns}><sheetData><row r="3">${header}</row>${row(4, '<c r="B4" s="1"><v>123</v></c>', 2)}${row(5, inline("B5", "000456"), 1)}${row(6, inline("B6", "000789"), 0, "Falta placa")}${row(7, inline("B7", "000456"), 3)}${row(8, inline("B8", "000999"), 0, "Foto borrosa")}</sheetData></worksheet>`);
  zip.file("xl/styles.xml", `<styleSheet ${ns}><numFmts><numFmt numFmtId="164" formatCode="000000"/></numFmts><cellXfs><xf numFmtId="0"/><xf numFmtId="164"/></cellXfs></styleSheet>`);
  zip.file("xl/metadata.xml", `<metadata ${ns}><metadataTypes><metadataType name="XLRICHVALUE"/></metadataTypes><futureMetadata name="XLRICHVALUE"><bk><rvb i="1"/></bk><bk><rvb i="0"/></bk><bk><rvb i="2"/></bk></futureMetadata><valueMetadata><bk><rc t="1" v="0"/></bk><bk><rc t="1" v="1"/></bk><bk><rc t="1" v="2"/></bk></valueMetadata></metadata>`);
  zip.file("xl/richData/rdrichvalue.xml", '<rvData><rv s="0"><v>5</v><v>1</v></rv><rv s="0"><v>5</v><v>0</v></rv><rv s="0"><v>5</v><v>2</v></rv></rvData>');
  zip.file("xl/richData/rdrichvaluestructure.xml", '<rvStructures><s t="_localImage"><k n="CalcOrigin"/><k n="_rvRel:LocalImageIdentifier"/></s></rvStructures>');
  zip.file("xl/richData/richValueRel.xml", '<richValueRels xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><rel r:id="rIdB"/><rel r:id="rIdA"/><rel r:id="rIdC"/></richValueRels>');
  zip.file("xl/richData/_rels/richValueRel.xml.rels", '<Relationships><Relationship Id="rIdA" Target="../media/placa-00123.png"/><Relationship Id="rIdB" Target="../media/placa-000456.png"/><Relationship Id="rIdC" Target="../media/placa-duplicado.png"/></Relationships>');
  // PNG válido de un píxel. La prueba verifica vínculos, no el contenido visual.
  function chunk(type, data) {
    const content = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (const byte of content) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, content, checksum]);
  }
  const pngHeader = Buffer.alloc(13); pngHeader.writeUInt32BE(1, 0); pngHeader.writeUInt32BE(1, 4); pngHeader[8] = 8; pngHeader[9] = 2;
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", pngHeader), chunk("IDAT", require("node:zlib").deflateSync(Buffer.from([0,80,140,180]))), chunk("IEND", Buffer.alloc(0))]);
  for (const name of ["placa-000456.png", "placa-duplicado.png", "placa-00123.png"]) zip.file(`xl/media/${name}`, png);
  fs.mkdirSync("tmp/excel-test", { recursive: true });
  fs.writeFileSync("tmp/excel-test/metadata-fixture.xlsx", await zip.generateAsync({ type: "nodebuffer" }));
  fs.writeFileSync("tmp/excel-test/vista.png", png);
  console.log("Fixture: fila 4 → 000123 / placa-00123.png; fila 5 → 000456 / placa-000456.png; fila 6 sin placa; fila 7 duplicada");
}
fixture().catch((error) => { console.error(error); process.exitCode = 1; });
