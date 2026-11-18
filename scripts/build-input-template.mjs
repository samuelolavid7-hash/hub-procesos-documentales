import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// Se ejecuta con las bibliotecas del runtime de documentos de Codex, no con dependencias de la web.
const bundledModules = process.argv[2];
if (!bundledModules || !path.isAbsolute(bundledModules)) throw new Error('Indica como argumento la ruta absoluta de node_modules del runtime de documentos.');
const bundledRequire = createRequire(path.join(bundledModules, '..', 'template-builder.cjs'));
const { Workbook, SpreadsheetFile } = await import(pathToFileURL(bundledRequire.resolve('@oai/artifact-tool')).href);

const workbook = Workbook.create();
const input = workbook.worksheets.add('Plantilla');
const guide = workbook.worksheets.add('Guia');
const cabinets = ['Crystal Dual_27', 'Crystal_Curve', 'Crystal_Dual', 'Crystal_Slant', 'Peak Dual 27', 'Peak Slant 49', 'Peak Slant 32', 'Peak Curve', 'Sierra 27', 'RISE55', 'RISE32'];

input.showGridLines = false;
guide.showGridLines = false;
input.getRange('A1:E101').format.font = {name:'Arial',size:11,color:'#172033'};
input.getRange('A1:E1').values = [['Gabinete','Seriales','Condition','Obs','Photo']];
input.getRange('A1:E1').format = {fill:'#164E63',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:28};
input.getRange('A2:E101').format.rowHeight = 65;
input.getRange('A2:D101').format.fill = '#FFFBEA';
input.getRange('B2:B101').setNumberFormat('@');
input.getRange('A1:A101').format.columnWidth = 28;
input.getRange('B1:B101').format.columnWidth = 22;
input.getRange('C1:C101').format.columnWidth = 18;
input.getRange('D1:D101').format.columnWidth = 28;
input.getRange('E1:E101').format.columnWidth = 24;
input.getRange('C2:C101').dataValidation = {rule:{type:'list',values:['nuevo','usado']}};
input.getRange('D2:D101').dataValidation = {rule:{type:'list',values:['OK','Falta placa','Foto borrosa','Desenfocada','Ilegible']}};
input.freezePanes.freezeRows(1);
input.tabColor = '#164E63';

guide.getRange('A1:C29').format.font = {name:'Arial',size:11,color:'#172033'};
guide.getRange('A1').values = [['Plantilla de entrada · Expedientes Coljuegos']];
guide.getRange('A1').format.font = {name:'Arial',size:15,bold:true,color:'#164E63'};
guide.getRange('A3:B3').values = [['Campo','Cómo completar']];
guide.getRange('A4:B10').values = [
 ['Gabinete','Usa un nombre del catálogo. El sufijo _U indica usado; por ejemplo CRYSTALDUAL_27_U.'],
 ['Seriales','Una máquina por fila. La columna es texto para conservar ceros iniciales.'],
 ['Condition','nuevo o usado. Puede quedar vacío cuando el gabinete termina en _U.'],
 ['Obs','OK, Falta placa, Foto borrosa, Desenfocada o Ilegible. Puedes escribir otras observaciones.'],
 ['Photo','En Excel: Insertar > Imágenes > Colocar en celda. Inserta la placa en la misma fila del serial.'],
 ['Nombre del lote','Guarda el archivo con el nombre deseado para el lote. El ZIP usará ese nombre.'],
 ['Revisión','Borrosa, desenfocada e ilegible se excluyen por defecto. El HUB permite corregir y volver a incluir.'],
];
guide.getRange('A12:C12').values = [['Gabinete','Referencia para usado','Condición del ejemplo']];
guide.getRange('A13:C23').values = cabinets.map(name=>[name,`${name}_U`,'usado']);
guide.getRange('A25:B28').values = [
 ['Comenzar','Completa Plantilla desde la fila 2. Hay 100 filas preparadas; puedes agregar más.'],
 ['Filas vacías','Déjalas vacías: no se generarán registros. No pegues ejemplos de la guía en el lote.'],
 ['Imágenes','Evita dibujos flotantes: si no hay vínculo de imagen en celda, el HUB pedirá asociar la placa.'],
 ['Fotografías estándar','Las vistas frontal y laterales se configuran en el HUB por gabinete y condición.'],
];
guide.getRange('A1:A28').format.columnWidth = 28;
guide.getRange('B1:B28').format.columnWidth = 102;
guide.getRange('C1:C28').format.columnWidth = 26;
guide.getRange('A3:C28').format.rowHeight = 25;
for(const address of ['A3:B3','A12:C12']) guide.getRange(address).format = {fill:'#164E63',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'}};
guide.getRange('A13:C23').format.rowHeight = 23;
workbook.recalculate();
console.log((await workbook.inspect({kind:'region',sheetId:'Plantilla',range:'A1:E4',maxChars:1500,tableMaxRows:4})).ndjson);
const out = 'outputs/plantilla-coljuegos';
await fs.mkdir(out,{recursive:true});
for (const [sheetName,range] of [['Plantilla','A1:E5'],['Guia','A1:C28']]) {
 const preview = await workbook.render({sheetName,range,scale:1,format:'png'});
 await fs.writeFile(`${out}/${sheetName}.png`,new Uint8Array(await preview.arrayBuffer()));
}
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${out}/Plantilla-expedientes-Coljuegos.xlsx`);
await fs.mkdir('public/plantillas',{recursive:true});
await fs.copyFile(`${out}/Plantilla-expedientes-Coljuegos.xlsx`,'public/plantillas/Plantilla-expedientes-Coljuegos.xlsx');
console.log('Plantilla exportada y copiada a la descarga del HUB');
