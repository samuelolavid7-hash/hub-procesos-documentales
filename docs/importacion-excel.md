# Expedientes desde Excel

Entrada principal: `/procesos/coljuegos`. Coljuegos abre directamente la importación Excel. La dirección anterior `/procesos/coljuegos/excel` redirige a esa entrada. Las opciones de SO conocida y lote sin SO quedan fuera de la interfaz; su implementación anterior se conserva sin rutas de entrada para poder recuperarla más adelante.

1. Importa un `.xlsx` con `Gabinete` y `Seriales`. Se detectan los encabezados por hoja. La vista previa identifica hoja y fila originales. `Condition`, `Obs` y `Photo` son opcionales; su ausencia produce revisión cuando falta información requerida. El gabinete se reconoce normalizando espacios, guiones y guiones bajos del nombre del catálogo; el sufijo `_U` indica usado. Se mantiene la equivalencia validada `CRYSDUAL_27_27_U` → `Crystal Dual_27`. Las referencias desconocidas no se aproximan. Gabinete y condición siempre son editables; una contradicción con la columna Condition queda señalada.
2. Las vistas guardadas se aplican automáticamente. Si falta alguna, abre «Fotografías estándar por gabinete» y configura las tres vistas para la combinación requerida. Nuevo y usado son independientes. Guarda después de verificar izquierda y derecha. Las imágenes y equivalencias se conservan en IndexedDB de ese navegador; no se sincronizan entre equipos.
3. Revisa o establece equivalencias explícitas; corrige gabinete, condición, serial o placa y excluye filas cuando corresponda. La observación original permanece visible. Una observación distinta de `OK` o un vínculo dudoso requiere marcar la revisión, además de resolver los campos faltantes.
4. La descarga se habilita cuando todos los registros incluidos están listos. Cada registro genera un PDF de cuatro páginas: placa, frontal, izquierda y derecha. Se usa el generador y ZIP existentes, con el gabinete de cada fila como modelo. Si falla una generación, se informa el serial y no se entrega un ZIP incompleto como lote terminado.

El nombre del lote y del ZIP es el nombre del archivo Excel sin `.xlsx`. La sección «Pendientes por serial» muestra cada serial, hoja, fila y los motivos, con acceso directo al registro. `Obs` con «Borrosa», «Desenfocada» o «Ilegible» excluye el registro por defecto, conserva el motivo y permite volver a incluirlo después de corregir la evidencia y revisar. Esto no mide automáticamente la nitidez de las imágenes. «Falta placa» queda pendiente, no se excluye por suposición.

## Plantilla de entrada

El enlace de descarga del HUB entrega `public/plantillas/Plantilla-expedientes-Coljuegos.xlsx`. Contiene una hoja Plantilla con los cinco encabezados y 100 filas vacías preparadas, seriales con formato de texto, listas de condición y observación; y una hoja Guia con instrucciones y los 11 gabinetes. No contiene fotos ni seriales reales o de ejemplo que puedan importarse por accidente. Las placas se insertan en Excel mediante «Colocar en celda», en la misma fila del serial.

## Extracción de imágenes

`lib/coljuegos/excel-import.ts` abre el contenedor ZIP localmente y sigue:

`celda/@vm (base 1) → valueMetadata/bk → rc del tipo XLRICHVALUE → futureMetadata/bk → rvb/@i → rv → estructura _localImage → clave _rvRel:LocalImageIdentifier → richValueRel → relaciones → xl/media`.

El índice de imagen se localiza por la clave de la estructura, no por una posición supuesta. Los nombres de las partes richData se descubren por su raíz XML. Los índices inválidos, vínculos externos, relaciones duplicadas o imágenes ilegibles no se asignan por aproximación.

Referencia: [Microsoft MS-XLSX, Local Image Type](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/aac1e2a6-7072-4e66-b1de-f20b8bf63318).

Los seriales de texto conservan sus caracteres. Para seriales numéricos con formato simple `000000` se restaura el relleno. Formatos numéricos complejos, notación científica y más de 15 dígitos se señalan para revisión; Excel puede haber perdido precisión antes de importar y el sistema no puede recuperar dígitos inexistentes.

## Límites y alternativa manual

- Soporta imágenes locales en celda enlazadas mediante Rich Data y archivos PNG/JPEG. Los dibujos flotantes, imágenes remotas `IMAGE()` y variantes sin un vínculo inequívoco quedan pendientes para cargar manualmente una placa por fila. Nunca se asocian por el orden de los archivos.
- Las celdas combinadas se señalan; no se replica automáticamente su contenido en filas vacías. Varias tablas con encabezados válidos en una misma hoja requieren separarlas antes de importar.
- Catálogo persistente local; el lote de revisión vive en memoria. Recargar obliga a importar nuevamente el Excel. No hay procesamiento después de cerrar la pestaña.
- El límite del archivo es 100 MB; el contenido expandido leído tiene un límite de 150 MB.
- Sin OCR ni API externa. La asociación estructural no prueba que el texto físico de una placa coincida con el serial: el usuario puede ampliar las miniaturas para comprobarlo.

## Verificación

`node scripts/test-excel.cjs` ejecuta ocho controles de reglas y crea un libro sintético en `tmp/excel-test/` para prueba en navegador. El libro mezcla los índices y el orden de imágenes, incluye otra hoja con otra estructura, formato `000000`, serial de texto con ceros iniciales, un duplicado y una fila sin placa con observación `Falta placa`.

En navegador se verificaron tres asociaciones exactas, la conservación de `000123` y `000456`, el bloqueo por falta de vistas y duplicados, la exclusión de filas y la descarga de dos PDFs al dejar dos seriales válidos. El catálogo recupera sus tres imágenes después de recargar.

Validación con el libro real OPP318503: se identificó Sheet1 como tabla principal (35 filas usadas), se omitieron Sheet2 y Sheet3 y se recuperaron sus 29 imágenes en celda. Se comprobaron visualmente las asociaciones y se detectó una discrepancia entre un serial de fila y el texto de su placa; seis filas señalan ausencia de placa. No hay seriales duplicados en la columna del libro. Las equivalencias de las dos referencias Crystal Dual se confirmaron con el usuario y se probaron en el navegador. Se incorporó una nota editable para registrar discrepancias visuales, que exige revisión antes de generar.

El usuario confirmó el orden frontal/izquierda/derecha de las fotos de Peak Curve, pero esas fotos no corresponden a este lote Crystal Dual. Posteriormente aportó las tres vistas de Crystal Dual usado y confirmó izquierda y derecha. Se guardaron en el catálogo local y se generó un ZIP de prueba excluyendo temporalmente seis filas sin placa y una discrepancia detectada visualmente: 28 PDF, 112 páginas. `scripts/verify-real-export.py` comprobó los seriales, cuatro páginas por documento, modelo, orden de vistas y coincidencia de las tres imágenes estándar en todo el lote. Se revisaron visualmente las cuatro páginas del primer y último expediente. Los siete pendientes se restablecieron en la pantalla después de la prueba; el archivo original no se modificó.

Los originales, las placas extraídas, la copia local de las vistas y el detalle de la auditoría permanecen fuera del código fuente, en la carpeta local ignorada `tmp/excel-test/real/`. Las fotos guardadas en localhost no se sincronizan con Vercel: al desplegar, el catálogo debe configurarse en ese origen y navegador.
