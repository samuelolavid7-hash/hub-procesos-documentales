"""Comprueba el ZIP de prueba contra el inventario extraído del Excel real."""
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image, ImageDraw

out = Path('tmp/excel-test/real')
audit = json.loads((out/'audit.json').read_text(encoding='utf8'))
pending_rows = {'17', '18', '19', '24', '27', '34', '35'}
expected = {}
for row in audit['sheets'][0]['rows'][1:]:
    if row['row'] in pending_rows: continue
    serial = next(cell['value'] for cell in row['cells'] if cell['cell'].startswith('C'))
    expected[serial] = next(cell['image'] for cell in row['cells'] if cell['image'])

standards = {}
total_pages = 0
with zipfile.ZipFile(sys.argv[1]) as package:
    names = package.namelist()
    assert set(names) == {f'{serial}.pdf' for serial in expected}, names
    assert len(names) == len(set(names)) == 28
    for name in names:
        serial = name[:-4]
        content = package.read(name)
        reader = PdfReader(io.BytesIO(content))
        assert len(reader.pages) == 4, name
        total_pages += 4
        for index, view in enumerate(['Placa', 'Vista frontal', 'Lateral izquierda', 'Lateral derecha']):
            page = reader.pages[index]
            text = page.extract_text()
            assert f'Serial: {serial}' in text and view in text and 'Modelo: Crystal Dual_27' in text, (name, index, text)
            assert 'Lote sin SO' not in text
            assert len(page.images) == 1, (name, index)
            digest = hashlib.sha256(page.images[0].data).hexdigest()
            if index:
                if index in standards: assert standards[index] == digest, (name, index)
                else: standards[index] = digest
        if name in [names[0], names[-1]]:
            document = pdfium.PdfDocument(content)
            contact = Image.new('RGB', (1200, 450), 'white')
            draw = ImageDraw.Draw(contact)
            for index in range(4):
                image = document[index].render(scale=0.5).to_pil().convert('RGB')
                image.thumbnail((295, 420))
                contact.paste(image, (300*index,25))
                draw.text((300*index+5,5),f'{serial} - pagina {index+1}',fill='black')
            contact.save(out/f'pdf-validado-{serial}.png')
    assert len(set(standards.values())) == 3
report = {'pdfs': len(expected), 'pages': total_pages, 'standard_images_consistent': True, 'excluded_rows_for_test': sorted(pending_rows,key=int), 'plate_associations': expected}
(out/'export-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(f'{len(expected)} PDF, {total_pages} paginas; seriales, modelo, orden de vistas y tres fotos estandar verificados.')
