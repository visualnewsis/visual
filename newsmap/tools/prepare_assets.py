"""Prepare local Leaflet and a simplified, searchable nationwide geography.

Boundary source: Statistics Korea SGIS, processed by vuski/admdongkor.
The source attribution is retained in data/geography.js and the page credits.
Run once; no build or Python runtime is required by the published page.
"""
import json
import math
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://raw.githubusercontent.com/vuski/admdongkor/master/ver20261001/HangJeongDong_ver20261001.geojson'

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'VISUAL-NEWSIS-Newsmap/0.1'}), timeout=90).read()

def simplify(points, tolerance=0.00045):
    if len(points) < 5:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]
    den = dx*dx+dy*dy
    best, index = 0, 0
    for i, p in enumerate(points[1:-1], 1):
        t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
        distance = (p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2
        if distance > best:
            best, index = distance, i
    if best > tolerance*tolerance:
        return simplify(points[:index+1], tolerance)[:-1]+simplify(points[index:], tolerance)
    return [a, b]

def ring(points):
    pts = simplify(points)
    if len(pts) < 4:
        pts = points
    return [[round(x, 5), round(y, 5)] for x, y, *_ in pts]

def polygons(geometry):
    return [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']

def weighted_center(poly):
    area_sum, x_sum, y_sum = 0, 0, 0
    for polygon in poly:
        r = polygon[0]
        twice, sx, sy = 0, 0, 0
        for a,b in zip(r,r[1:]):
            cross = a[0]*b[1]-b[0]*a[1]
            twice += cross
            sx += (a[0]+b[0])*cross
            sy += (a[1]+b[1])*cross
        if abs(twice)>1e-10:
            area = abs(twice)/2
            area_sum += area
            x_sum += sx/(3*twice)*area
            y_sum += sy/(3*twice)*area
    return area_sum, x_sum, y_sum

def main():
    vendor = ROOT/'vendor'
    vendor.mkdir(parents=True, exist_ok=True)
    for name in ['leaflet.js', 'leaflet.css', 'images/layers.png', 'images/layers-2x.png', 'images/marker-icon.png', 'images/marker-icon-2x.png', 'images/marker-shadow.png']:
        p = vendor/name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(get('https://unpkg.com/leaflet@1.9.4/dist/'+name))
    (vendor/'LICENSE-Leaflet.txt').write_bytes(get('https://raw.githubusercontent.com/Leaflet/Leaflet/v1.9.4/LICENSE'))
    raw = json.loads(get(SOURCE))
    print('Boundary sample:', raw['features'][0]['properties'])
    nodes = {}
    for feature in raw['features']:
        props = feature['properties']
        names = re.sub(r'([가-힣]+시)([가-힣]+구)(?=\s)', r'\1 \2', props['adm_nm']).split()
        # Preserve intermediate city levels, e.g. 경기도 / 수원시 / 팔달구 / 인계동.
        geometry = feature['geometry']
        poly = [[ring(r) for r in p] for p in polygons(geometry)]
        weighted = weighted_center(poly)
        points = [p for polygons_ in poly for r in polygons_ for p in r]
        bbox = [min(p[1] for p in points), min(p[0] for p in points), max(p[1] for p in points), max(p[0] for p in points)]
        for depth in range(1, len(names)+1):
            path = names[:depth]
            key = '/'.join(path)
            if key not in nodes:
                nodes[key] = {'id': key, 'name': names[depth-1], 'path': path, 'parent': '/'.join(path[:-1]), 'level': 'province' if depth == 1 else ('dong' if depth == len(names) else 'district'), 'bbox': bbox[:], 'children': []}
            node = nodes[key]
            node['_weighted'] = [a+b for a,b in zip(node.get('_weighted',[0,0,0]),weighted)]
            node['bbox'] = [min(node['bbox'][0], bbox[0]), min(node['bbox'][1], bbox[1]), max(node['bbox'][2], bbox[2]), max(node['bbox'][3], bbox[3])]
            if depth == len(names):
                node['geometry'] = {'type': 'MultiPolygon', 'coordinates': poly}
            if depth > 1 and key not in nodes['/'.join(path[:-1])]['children']:
                nodes['/'.join(path[:-1])]['children'].append(key)
    # A broad place name in an article must not be forced into a numbered administrative dong.
    for province, district, name, prefix in [('서울특별시','성동구','성수동','성수'), ('서울특별시','강남구','역삼동','역삼'), ('부산광역시','부산진구','전포동','전포'), ('제주특별자치도','제주시','애월읍','애월')]:
        parent = province+'/'+district
        key = parent+'/'+name
        if key in nodes or parent not in nodes:
            continue
        members = [n for n in nodes.values() if n['parent'] == parent and n['name'].startswith(prefix)]
        if not members:
            continue
        box = [min(n['bbox'][0] for n in members), min(n['bbox'][1] for n in members), max(n['bbox'][2] for n in members), max(n['bbox'][3] for n in members)]
        nodes[key] = {'id': key, 'name': name, 'path': [province,district,name], 'parent': parent, 'level': 'dong', 'kind': 'locality', 'bbox': box, 'children': [], 'geometry': {'type':'MultiPolygon','coordinates':[p for n in members for p in n['geometry']['coordinates']]}}
        nodes[parent]['children'].append(key)
    for node in nodes.values():
        b = node['bbox']
        weight = node.pop('_weighted',None)
        node['center'] = [round(weight[2]/weight[0],5),round(weight[1]/weight[0],5)] if weight and weight[0] else [round((b[0]+b[2])/2,5), round((b[1]+b[3])/2,5)]
    payload = {'version': '2026-10-01', 'source': SOURCE, 'credit': '통계청 SGIS · vuski/admdongkor (경계 단순화 가공)', 'nodes': list(nodes.values())}
    data = ROOT/'data'
    data.mkdir(exist_ok=True)
    (data/'geography.js').write_text('window.NEWSMAP_GEOGRAPHY='+json.dumps(payload, ensure_ascii=False, separators=(',',':'))+';\n', encoding='utf-8')
    print('Geography nodes:', len(nodes), 'size:', (data/'geography.js').stat().st_size)

if __name__ == '__main__':
    main()
