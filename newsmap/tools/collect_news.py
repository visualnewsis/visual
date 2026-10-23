"""Create a static NEWSIS snapshot. Does not alter shared workflows.

Usage: python newsmap/tools/collect_news.py
Conservative name matching: no dateline-only locations, no downward inference,
ambiguous names remain unassigned. All matches carry a source excerpt for review.
"""
import argparse
import hashlib
import html
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import timedelta
from urllib.parse import urlparse
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
FEEDS = ['sokbo', 'society', 'met', 'whol', 'economy', 'culture', 'industry', 'health']
RETENTION_DAYS = 30
MAX_ARTICLES = 10000
MAX_ENRICH = 24

def clean(text):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', text or ''))).strip()

def request(url):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname not in {'www.newsis.com', 'nwww.newsis.com', 'visual.newsis.com'}:
        raise ValueError('Only approved NEWSIS HTTPS sources are supported')
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'VISUAL-NEWSIS-HereNews/1.0', 'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(req, timeout=18) as response:
                final = urlparse(response.url)
                if final.scheme != 'https' or final.hostname not in {'www.newsis.com', 'nwww.newsis.com', 'visual.newsis.com'}:
                    raise ValueError('Unexpected source redirect')
                return response.read(8_000_001)
        except Exception:
            if attempt:
                raise
            time.sleep(1)


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
    # Biographical background is not the location of today's news.
    sentences = re.split(r'(?<=[.!?])\s+|(?<=다)\.\s*', text)
    text = ' '.join(sentence for sentence in sentences if not re.search(r'과거|출신|수품|주임신부|거쳐|역임했|태어났|보유했었', sentence))
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

def parse_time(value):
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Timezone is required')
    return result.astimezone(timezone.utc)


def decode_snapshot(source):
    text = source.decode('utf-8-sig') if isinstance(source, bytes) else source
    prefix = 'window.NEWSMAP_ARTICLES='
    if not text.strip().startswith(prefix):
        raise ValueError('Not a news snapshot')
    payload = json.loads(text.strip()[len(prefix):].rstrip(';'))
    if payload.get('schemaVersion') != 1 or not isinstance(payload.get('articles'), list):
        raise ValueError('Unsupported snapshot')
    parse_time(payload['collectedAt'])
    return payload


def parse_feed(source, feed, now):
    doc = ET.fromstring(source)
    if doc.tag not in {'rss', 'feed'}:
        raise ValueError('RSS endpoint returned a non-feed document')
    records, rejected = {}, 0
    for item in doc.findall('.//item'):
        try:
            match = re.search(r'NISX\d+_\d+', clean(item.findtext('link')))
            title = clean(item.findtext('title'))
            published = parsedate_to_datetime(item.findtext('pubDate')).astimezone(timezone.utc)
            if not match or not title or not now-timedelta(days=RETENTION_DAYS) <= published <= now:
                continue
            description = item.findtext('description') or ''
            image = re.search(r'<img[^>]+src=[\"\x27]([^\"\x27]+)', description)
            records[match[0]] = {'id':match[0], 'title':title, 'url':'https://www.newsis.com/view/'+match[0],
                'publishedAt':published.isoformat(), 'text':clean(description),
                'image':html.unescape(image[1]) if image else '', 'feed':feed}
        except (TypeError, ValueError, AttributeError, OverflowError):
            rejected += 1
    return records, rejected


class ArticleLead(HTMLParser):
    """Read just the beginning of the official article body, never whole-page text."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.suppressed = 0
        self.parts = []
        self.chars = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'div':
            if self.depth:
                self.depth += 1
            elif attrs.get('id') == 'textBody':
                self.depth = 1
        if self.depth and tag in {'script', 'style', 'figure', 'table'}:
            self.suppressed += 1
    def handle_endtag(self, tag):
        if self.depth and tag in {'script', 'style', 'figure', 'table'} and self.suppressed:
            self.suppressed -= 1
        if tag == 'div' and self.depth:
            self.depth -= 1
    def handle_data(self, value):
        if self.depth and not self.suppressed and self.chars < 2400:
            self.parts.append(value[:2400-self.chars])
            self.chars += len(value)


def enrich(article):
    parser = ArticleLead()
    parser.feed(request(article['url']).decode('utf-8', errors='replace'))
    lead = clean(' '.join(parser.parts))
    if lead:
        return {**article, 'text':lead, 'locationSource':'article-lead'}
    return article


def merge_articles(previous, current, now):
    """Latest ID wins; keep old articles across feed rotations, not deleted stale files."""
    merged = {}
    for article in previous + current:
        try:
            timestamp = parse_time(article['publishedAt'])
            if now-timedelta(days=RETENTION_DAYS) <= timestamp <= now:
                merged[article['id']] = article
        except (KeyError, TypeError, ValueError):
            continue
    return sorted(merged.values(), key=lambda a:parse_time(a['publishedAt']), reverse=True)[:MAX_ARTICLES]


def build_article(raw, matchers, nodes):
    places, lead = locate(raw['title'], raw['text'], matchers)
    if not places:
        return None
    combined = raw['title']+' '+lead
    evidence = []
    for place in places:
        node = nodes[place]
        found = re.search(re.escape(node['name']), combined)
        evidence.append(combined[max(0,found.start()-18):found.end()+45] if found else lead[:90])
    return {key:raw.get(key, '') for key in ['id','title','url','publishedAt','image']} | {
        'places':places, 'category':category(raw['title']), 'evidence':evidence,
        'summary':lead[:105].rstrip('. ')+'…', 'locationSource':raw.get('locationSource','rss'),
        'locationMethod':'conservative-place-name-v2'}


def write_snapshot(path, payload):
    content = 'window.NEWSMAP_ARTICLES='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n'
    # Parse the bytes before an atomic same-directory replace.
    decode_snapshot(content)
    temporary = path.with_suffix('.js.tmp')
    try:
        temporary.write_text(content,encoding='utf-8')
        os.replace(temporary,path)
    finally:
        if temporary.exists():
            temporary.unlink()


def collect(previous, now, fetch=request, enrich_limit=MAX_ENRICH):
    node_list = load_nodes()
    nodes = {n['id']:n for n in node_list}
    matchers = compile_matchers(node_list)
    records, warnings, succeeded = {}, [], []
    def feed_job(feed):
        return feed, parse_feed(fetch('https://www.newsis.com/RSS/'+feed+'.xml'),feed,now)
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {pool.submit(feed_job,feed):feed for feed in FEEDS}
        for future in as_completed(jobs):
            feed = jobs[future]
            try:
                _, (items,rejected) = future.result()
                succeeded.append(feed)
                for key, article in items.items():
                    if key not in records or len(article['text']) > len(records[key]['text']):
                        records[key] = article
                if rejected:
                    warnings.append(feed+': invalid items '+str(rejected))
            except Exception as exc:
                warnings.append(feed+': '+str(exc)[:180])
    if len(succeeded)<3 or not {'society','met','sokbo'}.intersection(succeeded):
        raise RuntimeError('Insufficient live feeds; previous snapshot preserved. '+str(warnings))
    if len(records)<15:
        raise RuntimeError('Insufficient recent live articles; previous snapshot preserved.')
    old_by_id = {a['id']:a for a in previous.get('articles',[])}
    pending = []
    for article in records.values():
        old = old_by_id.get(article['id'])
        places, _ = locate(article['title'],article['text'],matchers)
        fingerprint = hashlib.sha256('|'.join(article.get(k,'') for k in ['title','text','image','publishedAt']).encode()).hexdigest()
        article['sourceFingerprint'] = fingerprint
        if old and old.get('sourceFingerprint') == fingerprint:
            continue
        if not places or all(nodes[p]['level']=='province' for p in places):
            pending.append(article)
    pending.sort(key=lambda a:parse_time(a['publishedAt']),reverse=True)
    enriched = 0
    with ThreadPoolExecutor(max_workers=3) as pool:
        jobs = {pool.submit(enrich,a):a['id'] for a in pending[:enrich_limit]}
        for future in as_completed(jobs):
            try:
                article = future.result()
                records[article['id']] = article
                enriched += int(article.get('locationSource')=='article-lead')
            except Exception as exc:
                warnings.append('lead '+jobs[future]+': '+str(exc)[:120])
    current, unassigned, rejected_ids = [], [], set()
    for raw in records.values():
        old = old_by_id.get(raw['id'])
        if old and old.get('sourceFingerprint')==raw['sourceFingerprint']:
            current.append(old)
            continue
        article = build_article(raw,matchers,nodes)
        if article:
            article['sourceFingerprint'] = raw['sourceFingerprint']
            current.append(article)
        else:
            rejected_ids.add(raw['id'])
            unassigned.append({'id':raw['id'],'title':raw['title']})
    # Recheck legacy records under the current matching rules, including biographies.
    retained = []
    for old in previous.get('articles',[]):
        if old['id'] in records or old['id'] in rejected_ids:
            continue
        if old.get('locationMethod')=='conservative-place-name-v2':
            retained.append(old)
        else:
            revised = build_article({**old,'text':old.get('summary','')},matchers,nodes)
            if revised:
                retained.append(revised)
    articles = merge_articles(retained,current,now)
    if len(current)<10 or len(articles)<15:
        raise RuntimeError('Too few located live articles; previous snapshot preserved.')
    payload = {'schemaVersion':1,'collectedAt':now.isoformat(timespec='seconds'),
        'source':'NEWSIS official RSS + limited official article leads','mode':'scheduled-snapshot',
        'retentionDays':RETENTION_DAYS,'articleLimit':MAX_ARTICLES,
        'articles':articles,'unassignedCount':len(unassigned),
        'collection':{'feedsSucceeded':sorted(succeeded),'feedWarnings':warnings,'enrichedCount':enriched}}
    # Collection metadata alone must not trigger a content deployment.
    changed = articles != previous.get('articles',[])
    return payload, changed, {'fetched':len(records),'mapped':len(current),'retained':len(articles),
        'unassigned':len(unassigned),'enriched':enriched,'warnings':warnings}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--previous-url',help='Read the last published snapshot before merging')
    parser.add_argument('--output',type=Path,default=ROOT/'data/articles.js')
    parser.add_argument('--enrich-limit',type=int,default=MAX_ENRICH)
    args = parser.parse_args()
    if not 0<=args.enrich_limit<=50:
        parser.error('enrich-limit must be between 0 and 50')
    previous = decode_snapshot((ROOT/'data/articles.js').read_bytes())
    if args.previous_url:
        try:
            previous = decode_snapshot(request(args.previous_url))
        except Exception as exc:
            # Never replace an unknown published history with a stale checkout.
            raise RuntimeError('Cannot load published history; publication stopped') from exc
    payload, changed, report = collect(previous,datetime.now(timezone.utc),enrich_limit=args.enrich_limit)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    write_snapshot(args.output,payload if changed else previous)
    print(json.dumps({'changed':changed,**report},ensure_ascii=False))
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'],'a',encoding='utf-8') as output:
            output.write('changed='+str(changed).lower()+'\n')


if __name__ == '__main__':
    main()
