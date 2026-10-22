"""Create a static NEWSIS snapshot. Does not alter shared workflows.

Usage: python newsmap/tools/collect_news.py
Conservative name matching: no dateline-only locations, no downward inference,
ambiguous names remain unassigned. All matches carry a source excerpt for review.
"""
import html
import json
import re
import urllib.request
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding='utf-8')
FEEDS = ['society', 'sokbo', 'culture', 'economy']
SEEDS = ['NISX20261016_0003829693','NISX20260917_0003794552','NISX20260629_0003687305','NISX20261021_0003835568','NISX20260514_0003629082']

def clean(text):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', text or ''))).strip()

def request(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'VISUAL-NEWSIS-Newsmap/0.1'})
    return urllib.request.urlopen(req, timeout=25).read()

class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == 'meta':
            self.meta[d.get('property', d.get('name',''))] = d.get('content','')

def load_nodes():
    text = (ROOT/'data/geography.js').read_text(encoding='utf-8')
    return json.loads(text.split('=',1)[1].rstrip(';\n'))['nodes']

def province_alias(name):
    aliases = {'서울특별시':['서울','서울시'], '부산광역시':['부산','부산시'], '대구광역시':['대구','대구시'], '인천광역시':['인천','인천시'], '대전광역시':['대전','대전시'], '울산광역시':['울산','울산시'], '세종특별자치시':['세종','세종시'], '강원특별자치도':['강원','강원도'], '경기도':['경기'], '충청북도':['충북'], '충청남도':['충남'], '전북특별자치도':['전북','전라북도'], '전남광주통합특별시':['전남광주','광주','광주시','전남','전라남도'], '경상북도':['경북'], '경상남도':['경남'], '제주특별자치도':['제주','제주도']}
    return [name]+aliases.get(name,[])

def compile_matchers(nodes):
    result = []
    for n in nodes:
        aliases = province_alias(n['name']) if n['level']=='province' else [n['name']]
        # 경기 means a sports match as well as Gyeonggi. A bare noun is insufficient.
        if n['level']=='province':
            aliases = [a for a in aliases if a not in ['경기','광주시']]
        pattern = r'(?<![가-힣])(?:'+'|'.join(re.escape(a) for a in aliases)+r')(?=$|[^가-힣]|에서|에|의|은|는|이|을|를|과|와|일대|서|내)'
        if n['id']=='경기도':
            pattern += r'|(?<![가-힣])경기(?=\s+[가-힣]{2,}(?:시|군|구))'
        result.append((n,re.compile(pattern)))
    return result

def locate(title, text, matchers):
    # 경기 광주 is Gwangju city in Gyeonggi, not the southern metropolitan area.
    title = re.sub(r'경기(?:도)?\s+광주(?:시)?', '경기도 광주시', title)
    text = re.sub(r'경기(?:도)?\s+광주(?:시)?', '경기도 광주시', text)
    # Remove reporter datelines, photo captions and wire-service credits.
    # RSS may begin with photo captions before the reporter's actual lead.
    leads = re.split(r'[가-힣·]+ 기자\s*=', text)
    if len(leads)>1:
        text = leads[-1]
    text = re.sub(r'\[[^\]]{0,180}\]', ' ', text)
    text = re.sub(r'\S+ 기자\s*=', ' ', text)
    lead = text[:420]
    title_hits = [(n, p.search(title)) for n,p in matchers if p.search(title)]
    body_hits = [(n, p.search(lead)) for n,p in matchers if p.search(lead)]
    hits = title_hits + body_hits
    province_ids = {n['id'] for n,_ in hits if n['level']=='province'}
    candidates = []
    district_hits = {n['id'] for n,_ in hits if n['level']=='district'}
    for node, match in hits:
        if node['level'] != 'province' and province_ids and node['path'][0] not in province_ids:
            continue
        if node['level']=='dong' and district_hits and not any(node['id'].startswith(d+'/') for d in district_hits):
            continue
        same_name = {n['id'] for n,_ in hits if n['name']==node['name'] and (not province_ids or n['path'][0] in province_ids)}
        if len(same_name) > 1:
            parents = {n['id'] for n,_ in hits if n['level'] != 'dong'}
            if not any(node['id'].startswith(p+'/') for p in parents if p != node['id'] and p.count('/') >= 1):
                continue
        candidates.append(node)
    ids = {n['id'] for n in candidates}
    # Match the title's subject before secondary locations mentioned in the body.
    title_ids = {n['id'] for n,_ in title_hits if n['id'] in ids and n['level'] != 'province'}
    if title_ids:
        ids = {i for i in ids if any(i==t or i.startswith(t+'/') or t.startswith(i+'/') for t in title_ids)}
    # A city/province mentioned as background must not become an extra map pin
    # when a more specific subject location was found elsewhere.
    specific = {n['id'] for n in candidates if n['id'] in ids and n['level']!='province'}
    title_provinces = {n['id'] for n,_ in title_hits if n['level']=='province'}
    if specific:
        ids = {i for i in ids if '/' in i or i in title_provinces or any(j.startswith(i+'/') for j in specific)}
    deepest = sorted(i for i in ids if not any(j.startswith(i+'/') for j in ids))
    return deepest[:5], lead

def category(title):
    for name, tokens in [('사건·안전',['화재','사고','경찰','살해','정전','구속','범죄','안전','방화','지진']),('문화·생활',['축제','공연','전시','문화','음악','관광','박람회','페스티벌']),('교통·도시',['교통','지하철','재개발','도로','아파트','건설','정비','철도']),('경제',['투자','기업','주가','매출','경제','임대','시장','은행'])]:
        if any(t in title for t in tokens):
            return name
    return '사회·행정'

def main():
    nodes = load_nodes()
    matchers = compile_matchers(nodes)
    records = {}
    errors = []
    for feed in FEEDS:
        try:
            doc = ET.fromstring(request('https://www.newsis.com/RSS/'+feed+'.xml'))
            for item in doc.findall('.//item'):
                url = clean(item.findtext('link'))
                m = re.search(r'NISX\d+_\d+', url)
                if not m:
                    continue
                description = item.findtext('description') or ''
                image = re.search(r'<img[^>]+src=[\"\x27]([^\"\x27]+)', description)
                records.setdefault(m[0], {'id':m[0], 'title': clean(item.findtext('title')), 'url':'https://www.newsis.com/view/'+m[0], 'publishedAt':parsedate_to_datetime(item.findtext('pubDate')).isoformat(), 'text':clean(description), 'image':html.unescape(image[1]) if image else ''})
        except Exception as exc:
            errors.append(feed+': '+str(exc))
    for seed in SEEDS:
        if seed in records:
            continue
        try:
            source = request('https://www.newsis.com/view/'+seed).decode('utf-8')
            parser = Metadata()
            parser.feed(source)
            m = parser.meta
            date = re.search(r'"datePublished"\s*:\s*"([^"]+)"', source)
            records[seed] = {'id':seed, 'title':m['og:title'], 'url':'https://www.newsis.com/view/'+seed,'publishedAt':date[1], 'text':clean(m.get('og:description','')), 'image':m.get('og:image','')}
        except Exception as exc:
            errors.append(seed+': '+str(exc))
    articles, unassigned = [], []
    for article in records.values():
        ids, lead = locate(article['title'], article['text'], matchers)
        text = article.pop('text')
        if not ids:
            unassigned.append({'id':article['id'],'title':article['title']})
            continue
        evidence = []
        for i in ids:
            n = next(n for n in nodes if n['id']==i)
            found = re.search(re.escape(n['name']), article['title']+' '+lead)
            combined = article['title']+' '+lead
            evidence.append(combined[max(0,found.start()-18):found.end()+45] if found else lead[:90])
        article.update({'places':ids,'category':category(article['title']),'evidence':evidence, 'summary':lead[:105].rstrip('. ')+'…'})
        articles.append(article)
    articles.sort(key=lambda a:a['publishedAt'], reverse=True)
    if len(articles) < 15:
        raise RuntimeError('Too few matched articles; existing snapshot preserved. '+str(errors))
    payload = {'schemaVersion':1, 'collectedAt':datetime.now(timezone.utc).isoformat(timespec='seconds'), 'source':'NEWSIS official RSS + public article metadata', 'mode':'snapshot', 'articles':articles, 'unassignedCount':len(unassigned)}
    (ROOT/'data/articles.js').write_text('window.NEWSMAP_ARTICLES='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print('Collected',len(records),'mapped',len(articles),'unassigned',len(unassigned))
    print('Dong articles:', sum(any(i.count('/')>=2 for i in a['places']) for a in articles))
    for a in articles[:65]:
        print(a['publishedAt'], a['title'], ' | '.join(a['places']))
    if errors:
        print('Feed warnings:', errors)

if __name__ == '__main__':
    main()
