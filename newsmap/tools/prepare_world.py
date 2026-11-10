"""Prepare local world outlines and D3 geographic projection libraries (no build)."""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson'

def get(url):
    return urlopen(url, timeout=30).read()

def rounded(value):
    return [rounded(v) for v in value] if isinstance(value,list) else round(value,3)

def main():
    features=[]
    for f in json.loads(get(SOURCE))['features']:
        p=f['properties']
        code=p['ISO_A2_EH']
        if code=='-99':
            code={'SOL':'SO','KOS':'XK','CYN':'CY','SAH':'EH'}.get(p['ADM0_A3'],p['ADM0_A3'])
        if any(x['id']==code for x in features):
            continue
        features.append({'type':'Feature','id':code,'properties':{'name':p['NAME_KO'] or p['NAME'],'english':p['NAME'],'center':[round(p['LABEL_X'],3),round(p['LABEL_Y'],3)]},'geometry':{'type':f['geometry']['type'],'coordinates':rounded(f['geometry']['coordinates'])}})
    names={'CN':'중국','TW':'대만','KP':'북한','KR':'대한민국','TR':'튀르키예','SA':'사우디아라비아'}
    for f in features:
        f['properties']['name']=names.get(f['id'],f['properties']['name'])
    countries={f['id']:f['properties'] for f in features}
    countries.update({'SG':{'name':'싱가포르','english':'Singapore','center':[103.82,1.35]},'BH':{'name':'바레인','english':'Bahrain','center':[50.55,26.07]},'MT':{'name':'몰타','english':'Malta','center':[14.4,35.9]}})
    collection={'type':'FeatureCollection','features':features,'countries':countries}
    (ROOT/'data/world-geography.js').write_text('window.NEWSMAP_WORLD_GEOGRAPHY='+json.dumps(collection,ensure_ascii=False,separators=(',',':'))+';\n')
    (ROOT/'data/world-countries.json').write_text(json.dumps(countries,ensure_ascii=False,separators=(',',':'))+'\n')
    for name,version in [('d3-array','3.2.4'),('d3-geo','3.1.1')]:
        source=get(f'https://cdn.jsdelivr.net/npm/{name}@{version}/dist/{name}.min.js')
        (ROOT/'vendor'/f'{name}.min.js').write_bytes(source)
        (ROOT/'vendor'/f'LICENSE-{name}.txt').write_bytes(get(f'https://cdn.jsdelivr.net/npm/{name}@{version}/LICENSE'))
        print(name,version,len(source),hashlib.sha256(source).hexdigest())
    print('countries',len(features),'geography bytes',(ROOT/'data/world-geography.js').stat().st_size)

if __name__=='__main__':
    main()
