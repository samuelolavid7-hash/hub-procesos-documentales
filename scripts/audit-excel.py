"""Auditoría independiente del XLSX real y de sus vínculos de imagen."""
import json
import posixpath
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image, ImageOps, ImageDraw

source = Path(sys.argv[1])
out = Path('tmp/excel-test/real')
out.mkdir(parents=True, exist_ok=True)
def local(node): return node.tag.split('}')[-1]
def nodes(node, name): return [item for item in node.iter() if local(item) == name]
def children(node, name): return [item for item in node if local(item) == name]
def attr(node, name): return next((value for key, value in node.attrib.items() if key.split('}')[-1] == name), '')
with zipfile.ZipFile(source) as z:
    def xml(path): return ET.fromstring(z.read(path)) if path in z.namelist() else None
    def rels(path):
        root = xml(posixpath.join(posixpath.dirname(path), '_rels', posixpath.basename(path) + '.rels'))
        return {item.get('Id'): posixpath.normpath(posixpath.join(posixpath.dirname(path), item.get('Target', ''))) for item in root} if root is not None else {}
    shared = xml('xl/sharedStrings.xml')
    strings = [''.join(item.itertext()) for item in shared] if shared is not None else []
    def value(cell):
        if cell.get('t') == 's': return strings[int(nodes(cell, 'v')[0].text)]
        if cell.get('t') == 'inlineStr': return ''.join(item.text or '' for item in nodes(cell, 't'))
        return next((item.text or '' for item in nodes(cell, 'v')), '')
    book = xml('xl/workbook.xml')
    bookrels = rels('xl/workbook.xml')
    summary = {'source': source.name, 'sheets': [], 'richParts': {}}
    for path in z.namelist():
        if path.startswith('xl/richData/') and path.endswith('.xml') and '/_rels/' not in path:
            root = xml(path)
            summary['richParts'][path] = {'root': local(root), 'sample': ET.tostring(root, encoding='unicode')[:2200]}
    metadata = xml('xl/metadata.xml')
    summary['metadataSample'] = ET.tostring(metadata, encoding='unicode')[:2400] if metadata is not None else None
    rich = {info['root']: (path, xml(path)) for path, info in summary['richParts'].items()}
    image_maps = {}
    if metadata is not None and all(name in rich for name in ['rvData', 'rvStructures', 'richValueRels']):
        types = nodes(metadata, 'metadataTypes')[0]
        blocks = nodes(metadata, 'valueMetadata')[0]
        future = next(item for item in nodes(metadata, 'futureMetadata') if item.get('name') == 'XLRICHVALUE')
        values = rich['rvData'][1]
        structures = rich['rvStructures'][1]
        relations = rich['richValueRels'][1]
        relation_targets = rels(rich['richValueRels'][0])
        for index, block in enumerate(blocks, 1):
            refs = [item for item in block if types[int(item.get('t'))-1].get('name') == 'XLRICHVALUE']
            if len(refs) != 1: continue
            binding = nodes(future[int(refs[0].get('v'))], 'rvb')[0]
            rv = values[int(binding.get('i'))]
            structure = structures[int(rv.get('s'))]
            if structure.get('t') != '_localImage': continue
            key = next(i for i, item in enumerate(structure) if item.get('n') == '_rvRel:LocalImageIdentifier')
            image_maps[index] = relation_targets[attr(relations[int(rv[key].text)], 'id')]
    image_rows = []
    for sheet in nodes(book, 'sheet'):
        path = bookrels[attr(sheet, 'id')]
        root = xml(path)
        rows = []
        for row in nodes(root, 'row'):
            cells = [{'cell': cell.get('r'), 'value': value(cell), 'type': cell.get('t'), 'style': cell.get('s'), 'vm': cell.get('vm'), 'image': image_maps.get(int(cell.get('vm', '0')))} for cell in row]
            if any(cell['value'] or cell['vm'] for cell in cells): rows.append({'row': row.get('r'), 'cells': cells})
            for cell in cells:
                if cell['image']:
                    filename = out / f"{sheet.get('name')}-{cell['cell']}-{posixpath.basename(cell['image'])}"
                    filename.write_bytes(z.read(cell['image']))
                    serial = next((item['value'] for item in cells if item['cell'].startswith('C')), '')
                    image_rows.append((filename, serial, cell['cell']))
        summary['sheets'].append({'name': sheet.get('name'), 'path': path, 'rows': rows, 'merges': [item.get('ref') for item in nodes(root, 'mergeCell')]})
    summary['imageCount'] = len(image_rows)
    (out/'audit.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf8')
    for start in range(0, len(image_rows), 9):
        selected = image_rows[start:start+9]
        contact = Image.new('RGB', (1500, 1050), 'white')
        draw = ImageDraw.Draw(contact)
        for i, (filename, serial, cell) in enumerate(selected):
            image = ImageOps.exif_transpose(Image.open(filename)).convert('RGB')
            image.thumbnail((490, 305))
            x, y = (i % 3)*500, (i // 3)*350
            contact.paste(image, (x, y+25))
            draw.text((x+5,y+5), f'{cell} | serial fila: {serial}', fill='black')
        contact.save(out/f'placas-{start//9+1}.png')
    print(json.dumps(summary, ensure_ascii=False))
