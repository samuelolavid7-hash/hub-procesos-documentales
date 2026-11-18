const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const JSZip = require('jszip');

async function verify() {
  const zip = await JSZip.loadAsync(await fs.readFile('public/plantillas/Plantilla-expedientes-Coljuegos.xlsx'));
  const book = await zip.file('xl/workbook.xml').async('string');
  const sheet = (await zip.file('xl/worksheets/sheet1.xml').async('string')).replace(/(<\/?)[\w]+:/g, '$1');
  const styles = (await zip.file('xl/styles.xml').async('string')).replace(/(<\/?)[\w]+:/g, '$1');
  assert(book.includes('Plantilla') && book.includes('Guia'));
  const b2 = sheet.match(/<c\b[^>]*r="B2"[^>]*>/)?.[0];
  assert(b2, 'La celda B2 debe conservar su formato de texto');
  const styleIndex = Number(b2.match(/\bs="(\d+)"/)?.[1]);
  const cellXfs = styles.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1];
  const formats = [...cellXfs.matchAll(/<xf\b[^>]*>/g)].map(match => match[0]);
  const numberFormat = formats[styleIndex].match(/numFmtId="(\d+)"/)?.[1];
  const customFormats = [...styles.matchAll(/<numFmt\b[^>]*>/g)].map(match => match[0]);
  assert(numberFormat === '49' || customFormats.some(format => format.includes(`numFmtId="${numberFormat}"`) && format.includes('formatCode="@"')), 'La columna de seriales debe ser texto (@)');
  assert(sheet.includes('nuevo,usado') && sheet.includes('Foto borrosa'));
  assert(!sheet.includes('<f>'), 'La plantilla no necesita fórmulas');
  assert(!sheet.match(/<v>\d{6,}<\/v>/), 'La plantilla no debe contener seriales de ejemplo que se puedan importar por accidente');
  console.log('Plantilla verificada: dos hojas, seriales como texto, listas de condición/observación y sin registros ficticios.');
}
verify().catch(error => {console.error(error); process.exitCode = 1;});
