from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parents[1]
class Check(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids=set()
        self.refs=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if 'id' in d:
            assert d['id'] not in self.ids,'Duplicate ID '+d['id']
            self.ids.add(d['id'])
        if tag in ['script','link','img']:
            url=d.get('src') or d.get('href','')
            if url and not url.startswith(('https:','http:','data:','#')):
                self.refs.append(url)
source=(ROOT/'index.html').read_text(encoding='utf-8')
check=Check()
check.feed(source)
for ref in check.refs:assert (ROOT/ref.split('?')[0]).is_file(),ref
for match in re.finditer(r'https://[^\s"<>]+',source):
    url=match[0]
    assert all(ord(c)<128 for c in url),url
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',source,re.S):json.loads(block)
assert (ROOT/'assets/share.png').is_file()
print('PASS: HTML parsing, unique IDs, local assets, ASCII URLs, share image and JSON-LD.')
