"""Create a static NEWSIS snapshot. Does not alter shared workflows.

Usage: python newsmap/tools/collect_news.py
Conservative name matching: no dateline-only locations, no downward inference,
ambiguous names remain unassigned. All matches carry a source excerpt for review.
"""
import argparse
from functools import lru_cache
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
FEEDS = ['sokbo', 'politics', 'international', 'economy', 'bank', 'industry', 'society', 'health', 'met', 'country', 'sports', 'entertain', 'culture']
FEED_CATEGORIES = {'politics':'정치','international':'국제','economy':'경제','bank':'경제','industry':'산업','society':'사회','health':'IT·바이오','sports':'스포츠','entertain':'연예','culture':'문화'}
RETENTION_DAYS = 30
MAX_ARTICLES = 10000
MAX_ENRICH = 50
POLICY_VERSION = "domestic-local-v1"
LOCATION_METHOD = "conservative-v4-" + POLICY_VERSION
# District precision deliberately avoids guessing an administrative dong from a street address.
# Official sources: scourt.go.kr/rel/infomation/OfferOrgList.work and data.visitkorea.or.kr/linkedview/126827
FACILITIES = [('서울중앙지방법원|서울중앙지법|서울고등법원|서울고법','서울특별시/서초구','재판·기관 장소'),
              ('국회의사당|국회(?:에서|에선|에서는| 본청| 본관| 의원회관| 소통관)','서울특별시/영등포구','회의·발표 장소')]

def clean(text):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', text or ''))).strip()

def request(url, timeout=18, attempts=2):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname not in {'www.newsis.com', 'nwww.newsis.com', 'visual.newsis.com'}:
        raise ValueError('Only approved NEWSIS HTTPS sources are supported')
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'VISUAL-NEWSIS-HereNews/1.0', 'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(req, timeout=timeout) as response:
                final = urlparse(response.url)
                if final.scheme != 'https' or final.hostname not in {'www.newsis.com', 'nwww.newsis.com', 'visual.newsis.com'}:
                    raise ValueError('Unexpected source redirect')
                data = response.read(32_000_001)
                if len(data)>32_000_000:
                    raise ValueError('Source exceeds the 32MB safety limit')
                return data
        except Exception:
            if attempt == attempts-1:
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
        pattern = r'(?<![가-힣])(?:'+'|'.join(re.escape(a) for a in aliases)+r')(?=$|[^가-힣]|에서|에|의|은|는|이|가|을|를|과|와|일대|서|내)'
        if n['id']=='경기도':
            pattern += r'|(?<![가-힣])경기(?=\s+[가-힣]{2,}(?:시|군|구))'
        result.append((n,re.compile(pattern)))
    return result

def article_text(source):
    """Preserve paragraph boundaries so captions and secondary briefs can be isolated."""
    source = re.sub(r'<br\s*/?>|</p\s*>', '\n', html.unescape(source or ''), flags=re.I)
    return '\n'.join(clean(line) for line in source.splitlines() if clean(line))


HISTORY = re.compile(r'과거|출신|수품|주임신부|거쳐|거쳤|역임|태어|출생|보유했었|일제강점기|조선시대|(?:1[0-9]{3}|200[0-9]|201[0-9])년|지난해|작품의 배경|사진 속|그림 속|사료|역사적 자료|당시|100여?\s*년')
CAPTION = re.compile(r'사진\s*[=:＝]|사진\s*제공|재판매|DB\s*금지|[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}')
BODY_BYLINE = re.compile(r'(?:[가-힣·]+\s+){0,5}(?:수습기자|인턴기자|기자|공동취재단)\s*[=＝]')


def focus_lead(text):
    # Official HTML is parsed without photos; this also cleans legacy/RSS bylines.
    byline = BODY_BYLINE.search(text)
    if byline:
        text = text[byline.end():]
    text = re.split(r'◎\s*공감언론|\*?\s*재판매', text)[0]
    text = re.sub(r'[\[【][^\]】]{0,180}[\]】]', ' ', text)
    text = text.lstrip('◇ \n').split('◇',1)[0]
    text = '\n'.join(line for line in text.splitlines() if not CAPTION.search(line))
    units = re.split(r'\n+|(?<=[.!?])\s+|(?<=다)\.\s*', text[:2400])
    selected = []
    for unit in units:
        unit = clean(unit)
        if not unit or HISTORY.search(unit) or CAPTION.search(unit):
            continue
        selected.append(unit)
    return ' '.join(selected)[:600]


def relevant_hit(text, match):
    context=text[max(0,match.start()-35):match.end()+90]
    after=text[match.end():match.end()+40]
    # A product's brand origin or an institution name alone is not an event site.
    if re.search(r'^[^.!?\n]{0,22}(?:브랜드|출신|출생|교구장|대교구장)',after):
        if not re.search(r'에서|일대|현장|소재|위치한',context):
            return False
    return True


def locate(title, text, matchers, related=False):
    # 경기 광주 is Gwangju city in Gyeonggi, not the southern metropolitan area.
    title = re.sub(r'경기(?:도)?\s+광주(?:시)?', '경기도 광주시', title)
    text = re.sub(r'경기(?:도)?\s+광주(?:시)?', '경기도 광주시', text)
    lead = focus_lead(text)
    # A nationwide product launch is not an incident at the brand's origin.
    if '편의점' in title and '브랜드' in lead and re.search(r'출시|신제품',lead):
        return [],lead
    subject = '' if HISTORY.search(title) else title
    title_hits = [(n,m) for n,p in matchers if (m:=p.search(subject)) and relevant_hit(subject,m)]
    body_hits = [(n,m) for n,p in matchers if (m:=p.search(lead)) and relevant_hit(lead,m)]
    # Nationwide comparisons should not pick an arbitrary location from a ranking.
    body_provinces={n['id'] for n,_ in body_hits if n['level']=='province'}
    if not related and not title_hits and len(body_provinces)>=3 and re.search(r'전국|지역별|집계|통계',lead):
        return [],lead
    hits = title_hits + body_hits
    province_ids = {n['id'] for n,_ in hits if n['level']=='province'}
    candidates = []
    district_hits = {n['id'] for n,_ in hits if n['level']=='district'}
    for node, match in hits:
        # Unique 읍/면 names can also be ordinary Korean words (e.g. 내면).
        # Require a corroborating parent rather than treating uniqueness as proof.
        if node['level']=='dong' and not any(node['id'].startswith(parent+'/') for parent in province_ids|district_hits):
            continue
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
    if title_ids and not related:
        ids = {i for i in ids if any(i==t or i.startswith(t+'/') or t.startswith(i+'/') for t in title_ids)}
    # A city/province mentioned as background must not become an extra map pin
    # when a more specific subject location was found elsewhere.
    specific = {n['id'] for n in candidates if n['id'] in ids and n['level']!='province'}
    if specific and not related:
        ids = {i for i in ids if '/' in i or any(j.startswith(i+'/') for j in specific)}
    deepest = sorted(i for i in ids if not any(j.startswith(i+'/') for j in ids))
    return deepest[:5], lead

def related_locations(title, text, matchers, nodes):
    places, lead = locate(title, text, matchers, related=True)
    combined=title+' '+lead
    reasons={p:'기사 관련 지역' for p in places}
    for pattern, place, reason in FACILITIES:
        found=re.search(pattern,combined)
        if not found or place not in nodes:
            continue
        context=combined[max(0,found.start()-25):found.end()+100]
        if re.search(r'관할법원|출신|근무했|역임|지난해|과거',context):
            continue
        if not re.search(r'선고|판결|재판|심리|공판|심문|법정|개최|열[린렸리]|회의|발표|회견|국감|국정감사',context):
            continue
        # A confirmed finer location already covers its parent district.
        descendants=[p for p in places if p.startswith(place+'/')]
        if descendants:
            for p in descendants:reasons[p]=reason
        else:
            places.append(place);reasons[place]=reason+' · '+found[0]
    places=sorted(set(places))
    places=[p for p in places if not any(q.startswith(p+'/') for q in places)]
    return places,{p:reasons[p] for p in places}

def news_category(raw):
    feeds=raw.get('feeds') or [raw.get('feed','')]
    if 'international' in feeds:
        return '국제'
    # Prefer an actual subject feed over general breaking/local feeds.
    for feed in FEED_CATEGORIES:
        if feed in feeds:return FEED_CATEGORIES[feed]
    title=raw['title']
    for name,pattern in [('정치','대통령|국회|민주당|국민의힘|장관|외교'),('스포츠','야구|축구|배구|농구|올림픽|선수|리그'),('연예','배우|가수|아이돌|드라마')]:
        if re.search(pattern,title):return name
    return {'경제':'경제','문화·생활':'문화'}.get(category(title),'사회')

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
                'publishedAt':published.isoformat(), 'text':article_text(description),
                'image':html.unescape(image[1]) if image else '', 'feed':feed}
        except (TypeError, ValueError, AttributeError, OverflowError):
            rejected += 1
    return records, rejected


class ArticleLead(HTMLParser):
    """Read article prose while ignoring photo wrappers, even malformed closing divs."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_body=False
        self.photo_depth=0
        self.suppressed=0
        self.parts=[]
        self.chars=0
        self.stopped=False
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='div' and attrs.get('id')=='textBody':
            self.in_body=True
        if not self.in_body:
            return
        if tag=='footer':
            self.stopped=True
        if tag=='div':
            if self.photo_depth:
                self.photo_depth+=1
            elif 'article_photo' in attrs.get('class','').split():
                self.photo_depth=1
        if tag in {'script','style','figure','table'}:
            self.suppressed+=1
        if tag in {'br','p'} and not self.photo_depth and not self.suppressed:
            self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in {'script','style','figure','table'} and self.suppressed:
            self.suppressed-=1
        if tag=='div' and self.photo_depth:
            self.photo_depth-=1
    def handle_data(self,value):
        if '◎' in value and '뉴시스' in value:
            self.stopped=True
        if self.in_body and not self.stopped and not self.photo_depth and not self.suppressed and self.chars<2400:
            self.parts.append(value[:2400-self.chars])
            self.chars+=len(value)



def enrich(article):
    parser = ArticleLead()
    parser.feed(request(article['url'], timeout=6, attempts=1).decode('utf-8', errors='replace'))
    lead = article_text(''.join(parser.parts))
    if lead:
        return {**article, 'text':lead, 'locationSource':'article-lead','leadChecked':True}
    return {**article,'leadChecked':True}


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


# The presence of a Korean place is evidence of a mention, never eligibility by itself.
FOREIGN_PLACE = r'미국|중국|일본|러시아|우크라이나|이스라엘|이란|영국|프랑스|독일|대만|북한|베트남|인도|스페인|태국|브라질|아르헨티나|칠레|페루|멕시코|캐나다|호주|뉴질랜드|이탈리아|포르투갈|네덜란드|벨기에|스위스|오스트리아|스웨덴|노르웨이|핀란드|덴마크|폴란드|헝가리|체코|루마니아|세르비아|그리스|튀르키예|터키|시리아|이라크|사우디|아랍에미리트|카타르|쿠웨이트|레바논|요르단|이집트|모로코|튀니지|남아공|케냐|나이지리아|수단|에티오피아|소말리아|콩고|가나|필리핀|인도네시아|말레이시아|싱가포르|미얀마|캄보디아|라오스|방글라데시|파키스탄|아프가니스탄|네팔|스리랑카|몽골|카자흐스탄|우즈베키스탄|조지아|아르메니아|아제르바이잔|아이티|쿠바|베네수엘라|콜롬비아|에콰도르|볼리비아|파라과이|우루과이|과테말라|온두라스|니카라과|엘살바도르|코스타리카|파나마|도미니카|자메이카|바하마|아이슬란드|아일랜드|크로아티아|슬로바키아|슬로베니아|리투아니아|라트비아|에스토니아|벨라루스|몰도바|알바니아|보스니아|북마케도니아|코소보|몬테네그로|룩셈부르크|몰타|키프로스|팔레스타인|예멘|오만|바레인|리비아|알제리|세네갈|말리|차드|니제르|르완다|우간다|탄자니아|짐바브웨|잠비아|앙골라|모잠비크|마다가스카르|나미비아|보츠와나|카메룬|기니|라이베리아|시에라리온|베냉|토고|부르키나파소|말라위|에리트레아|지부티|부룬디|레소토|감비아|가봉|모리타니|모리셔스|세이셸|코모로|카보베르데|브루나이|동티모르|몰디브|부탄|키르기스스탄|타지키스탄|투르크메니스탄|피지|파푸아뉴기니|솔로몬|사모아|통가|바누아투|유럽|중동|해외|뉴욕|워싱턴|도쿄|베이징|런던|파리|모스크바|방콕|마드리드|로마|베를린|상하이|홍콩|타이베이|평양|가자지구'
FOREIGN_PLACE = r'(?<![가-힣])(?:'+FOREIGN_PLACE+r')(?!인|계|산|어)(?=$|[^가-힣]|에서|서|의|은|는|이|을|를|과|와|내|발|측|군)'
FOREIGN_ISSUE = re.compile(r'(?:'+FOREIGN_PLACE+r').{0,35}(?:선거|대선|중간선거|총선|대통령|총리|의회|정상회담|외교|전쟁|공습|증시|증권|금리|연준|관세|수출|경제|순방)|(?:트럼프|바이든|시진핑|푸틴|네타냐후|뉴욕증시|미 연준|중간선거|이스라엘군|우크라이나전|가자지구)')
LOCAL_ACTION = re.compile(r'화재|불이\s*나|정전|침수|홍수|산불|붕괴|폭발(?!적)|충돌|추돌|사망|부상|실종|구조(?!조정|적)|대피|사고|살인|살해|폭행|강도|절도|쓰레기|상수도|하수도|단수|주민|구민|시민|군민|지원|복지|장학|돌봄|급식|어린이집|학교|공원|도로|교통|버스|지하철|철도|재개발|재건축|도시계획|주차|개통|정비|착공|준공|공사|모집|접수|보건|예방접종|축제|전시|특별전|기획전|개인전|회고전|박람회|개관|폐관')
ACTUAL_SITE = re.compile(r'(?:에서|일대|현장|소재|위치한|인근).{0,65}(?:화재|불이\s*나|정전|발생|침수|붕괴|폭발|충돌|추돌|사망|부상|실종|사고|대피|살해|폭행|개최|열린|열렸|전시|개관|착공|준공|공사)')
INCIDENTAL_SITE = re.compile(r'본사|본점|대사관|회관|호텔|코엑스|프레스센터|정부세종청사|기자회견|브리핑|간담회|언론간담|소통관|의원회관|국회|대법원|고등법원|고법|지방법원|지법|법정|선고|판결|공판|심리|재판|대통령실|정부청사')
LOCAL_IMPACT = re.compile(r'화재|정전|침수|붕괴|폭발(?!적)|교통.{0,10}통제|도로.{0,10}폐쇄|주민.{0,20}피해|소음.{0,10}피해|분진.{0,10}피해')
NATIONAL_SUBJECT = re.compile(r'한\s*총리|韓총리|해수부|국토부|기재부|교육부|중기부|과기정통부|행안부|보건복지부|식약처|원안위|정부|부처|후보|유세|대통령|국무총리|국회의원|민주당|국민의힘|여야|공천|전당대회|수출|전국|글로벌|신제품|실적|매출|영업이익|주가|증시|기준금리|반도체')
CULTURE_SUBJECT = re.compile(r'전시|미술|박물관|미술관|갤러리|화랑|작가|소설|신간|출간|문학|공연|연극|뮤지컬|음반|앨범|드라마|영화|가수|배우(?!자)|아이돌|콘서트|음악회|문화제|축제|페스티벌|민요|명창|연주회|상영|극장|영화제|무용|국악')
EXHIBITION = re.compile(r'전시(?:회|전|를|가|는|에|\s|$)|특별전|기획전|개인전|회고전|초대전|소장품전|미술전|사진전')
EXHIBIT_VENUE = re.compile(r'미술관|박물관|갤러리|화랑|전시장|전시관|아트센터|문화회관|문화센터')


@lru_cache(maxsize=1)
def domestic_datelines():
    names = {'한국', '전국', '종합', '공동취재'}
    for node in load_nodes():
        if node['level'] == 'dong':
            continue
        names.add(node['name'])
        names.add(re.sub(r'(특별자치시|특별자치도|특별시|광역시|통합특별시|시|군|구|도)$', '', node['name']))
        if node['level'] == 'province':
            names.update(province_alias(node['name']))
    return names


def domestic_policy(raw, lead, related):
    feeds = raw.get('feeds') or [raw.get('feed', '')]
    title = re.sub(r'인도(?=\s*돌진|를|에|\s*위)', '보행로', raw['title'])
    lead = re.sub(r'인도(?=\s*돌진|를|에|\s*위)', '보행로', lead)
    title = re.sub(r'(?:'+FOREIGN_PLACE+r')\s*(?:국적|출신|노동자|근로자)', '외국인', title)
    lead = re.sub(r'(?:'+FOREIGN_PLACE+r')\s*(?:국적|출신|노동자|근로자)', '외국인', lead)
    if 'international' in feeds or raw.get('newsCategory') == '국제':
        return False, 'international-feed'
    # Foreign correspondent datelines are a veto, not location evidence.
    dateline = re.search(r'[\[【]([^\]】]+)=\s*뉴시스', raw.get('text',''))
    if dateline:
        tokens = [t for t in re.split(r'[·ㆍ, /]+', dateline[1].strip()) if t]
        if not tokens or any(t not in domestic_datelines() for t in tokens):
            return False, 'foreign-or-unverified-dateline'
    # Foreign accident/environment stories also arrive in general breaking feeds.
    if re.search(r'(?:'+FOREIGN_PLACE+r').{0,45}(?:홍수|지진|화재|산불|폭발|사고|참사|태풍|허리케인|사망|부상|총격|테러|쿠데타|시위|폭우|폭설|폭염|가뭄)', title+' '+lead[:180]):
        return False, 'foreign-event'
    # A domestic quotation venue cannot change the subject of a foreign story.
    if FOREIGN_ISSUE.search(title) or FOREIGN_ISSUE.search(lead[:220]):
        return False, 'international-subject'
    if re.search(r'(?:'+FOREIGN_PLACE+r')(?:에서|\s*현지|\s+[가-힣A-Za-z·]+(?:미술관|박물관|갤러리)에서).{0,35}(?:전시|개최|개막|공연)', title+' '+lead[:220]):
        return False, 'foreign-cultural-site'
    if re.search(r'신간|출간|리뷰|서평|북리뷰|책 소개|소설|출판', title):
        return False, 'culture-book-review'
    if re.search(r'베니스|베네치아|비엔날레|칸영화제|베를린영화제|해외.{0,12}전시', title) and not re.search(r'광주|부산|서울|대구|대전|제주|전남|전북|경남|경북',title):
        return False, 'foreign-cultural-site'
    cultural = ('culture' in feeds or 'entertain' in feeds or CULTURE_SUBJECT.search(title)) and not (LOCAL_IMPACT.search(title) and related)
    if cultural:
        combined = title+' '+lead[:300]
        names = {name for place in related for name in (place.split('/') if '/' in place else province_alias(place))}
        sentences = re.split(r'(?<=다)\.\s*|[!?\n]', combined)
        confirmed = any(EXHIBITION.search(sentence) and EXHIBIT_VENUE.search(sentence)
                        and any(name in sentence for name in names)
                        and re.search(r'개최|개막|열[린렸리]|전시한다|전시 중|전시중', sentence)
                        for sentence in sentences)
        if not confirmed:
            return False, 'culture-without-domestic-exhibition'
    return True, 'accepted'


def local_places(raw, lead, candidates, matchers):
    if raw.get('legacyLeadMissing'):
        return [], {}
    title = raw['title']
    if re.search(r'오늘의\s*주요\s*일정|오늘의\s*일정|[\[【](?:인사|부고)[\]】]', title):
        return [], {}
    physical_impact = bool(LOCAL_IMPACT.search(title)) and not re.search(r'난다면|가정한|시나리오|모의|훈련', title)
    if not physical_impact and re.search(r'울산\s*HD|부산\s*KCC|주전\s*공격수|구단|전지훈련', title):
        return [], {}
    if not physical_impact and ('sports' in (raw.get('feeds') or [raw.get('feed','')]) or raw.get('newsCategory') == '스포츠'):
        return [], {}
    # National affairs at a headquarters, court, parliament or briefing venue are
    # available to the broader map but never become local news from the address.
    if (NATIONAL_SUBJECT.search(title) or re.search(r'[2-9]\d*개\s*(?:지역|시도|시·도)', title)) and not physical_impact:
        return [], {}
    first = re.split(r'(?<=다)\.\s*|\n', lead, maxsplit=2)[:2]
    primary = ' '.join(first)[:300]
    patterns = {n['id']:p for n,p in matchers}
    result, reasons = [], {}
    for place in candidates:
        pattern = patterns[place]
        title_hit = pattern.search(title)
        if title_hit and re.match(r'(?:은행|신문|대학교|대학|방송|일보|기업|전력|공사|증권|보험|연구원|개발원|지법|고법)', title[title_hit.end():]):
            title_hit = None
        match = pattern.search(primary)
        accepted = False
        if title_hit and LOCAL_ACTION.search(title) and (not INCIDENTAL_SITE.search(title) or physical_impact):
            accepted = True
            reason = '제목의 지역 주제와 지역 사건·행정 근거'
        elif match:
            context = primary[max(0,match.start()-12):match.end()+150]
            if (not INCIDENTAL_SITE.search(context) or LOCAL_IMPACT.search(context)) and LOCAL_ACTION.search(context):
                accepted = bool(ACTUAL_SITE.search(context) or re.match(r'(?:시|군|구|도)?(?:청)?(?:은|는|가|이)\b', primary[match.end():]))
                reason = '핵심 도입부의 실제 지역 사건·지역 주체 근거'
        if accepted:
            result.append(place)
            reasons[place] = reason
    return result, reasons


def build_article(raw, matchers, nodes):
    places, lead = locate(raw['title'], raw['text'], matchers)
    related, reasons = related_locations(raw['title'],raw['text'],matchers,nodes)
    if raw.get('legacyRecheck') and not related and not {'met','country'}.intersection(raw.get('feeds',[])):
        return None
    accepted, policy_reason = domestic_policy(raw, lead, related)
    if not accepted:
        return None
    places, local_reasons = local_places(raw, lead, places, matchers)
    combined = raw['title']+' '+lead
    evidence = []
    patterns = {n['id']:pattern for n,pattern in matchers}
    for place in places:
        found = patterns[place].search(combined)
        if not found:
            return None
        evidence.append(combined[max(0,found.start()-30):found.end()+70])
    return {key:raw.get(key, '') for key in ['id','title','url','publishedAt','image']} | {
        'places':places, 'localPlaces':places, 'localEligible':bool(places),
        'policyVersion':POLICY_VERSION, 'domesticPolicy':policy_reason, 'localReasons':local_reasons,
        'category':category(raw['title']), 'evidence':evidence,
        'relatedPlaces':related,'placeReasons':reasons,'newsCategory':news_category(raw),
        'feeds':sorted(raw.get('feeds') or [raw.get('feed','')]),'leadChecked':raw.get('leadChecked',False),
        'summary':lead[:105].rstrip('. …')+'…', 'locationSource':raw.get('locationSource','rss'),
        'locationMethod':LOCATION_METHOD, 'locationLead':lead}


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
                    feeds=sorted(set(records.get(key,{}).get('feeds',[])+[feed]))
                    if key not in records or len(article['text']) > len(records[key]['text']):
                        records[key] = article
                    records[key]['feeds']=feeds
                if rejected:
                    warnings.append(feed+': invalid items '+str(rejected))
            except Exception as exc:
                warnings.append(feed+': '+str(exc)[:180])
    if 'international' not in succeeded:
        raise RuntimeError('International exclusion feed unavailable; publication stopped.')
    if len(succeeded)<3 or not {'society','met','sokbo'}.intersection(succeeded):
        raise RuntimeError('Insufficient live feeds; previous snapshot preserved. '+str(warnings))
    if len(records)<15:
        raise RuntimeError('Insufficient recent live articles; previous snapshot preserved.')
    blocked = {}
    for identifier, published in previous.get('excludedInternational', {}).items():
        try:
            if now-timedelta(days=RETENTION_DAYS) <= parse_time(published) <= now:
                blocked[identifier] = published
        except (TypeError, ValueError):
            continue
    for raw in records.values():
        if 'international' in raw.get('feeds', []):
            blocked[raw['id']] = raw['publishedAt']
    old_by_id = {a['id']:a for a in previous.get('articles',[])}
    for old in old_by_id.values():
        if 'international' in old.get('feeds',[]) or old.get('newsCategory')=='국제':
            blocked[old['id']] = old['publishedAt']
    blocked = {identifier:published for identifier,published in blocked.items() if now-timedelta(days=RETENTION_DAYS) <= parse_time(published) <= now}
    records = {key:raw for key,raw in records.items() if key not in blocked}
    pending = []
    for article in records.values():
        old = old_by_id.get(article['id'])
        places, _ = locate(article['title'],article['text'],matchers)
        fingerprint = hashlib.sha256(('|'.join(article.get(k,'') for k in ['title','text','image','publishedAt'])+'|'+','.join(article['feeds'])).encode()).hexdigest()
        article['sourceFingerprint'] = fingerprint
        if old and old.get('sourceFingerprint') == fingerprint and old.get('locationMethod')==LOCATION_METHOD and old.get('policyVersion')==POLICY_VERSION and old.get('domesticPolicy')=='accepted' and old.get('leadChecked'):
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
        if old and old.get('sourceFingerprint')==raw['sourceFingerprint'] and old.get('locationMethod')==LOCATION_METHOD and old.get('policyVersion')==POLICY_VERSION and old.get('domesticPolicy')=='accepted' and (old.get('leadChecked') or not raw.get('leadChecked')):
            current.append(old)
            continue
        article = build_article(raw,matchers,nodes)
        if article:
            article['sourceFingerprint'] = raw['sourceFingerprint']
            current.append(article)
        else:
            _, reason = domestic_policy(raw, focus_lead(raw['text']), [])
            if reason.startswith(('international', 'foreign')):
                blocked[raw['id']] = raw['publishedAt']
            rejected_ids.add(raw['id'])
            unassigned.append({'id':raw['id'],'title':raw['title']})
    # Recheck legacy records under the current matching rules, including biographies.
    retained = []
    for old in previous.get('articles',[]):
        if old['id'] in records or old['id'] in rejected_ids or old['id'] in blocked:
            continue
        if old.get('locationMethod')==LOCATION_METHOD and old.get('policyVersion')==POLICY_VERSION and old.get('domesticPolicy')=='accepted':
            retained.append(old)
        else:
            if not old.get('feeds') and not old.get('newsCategory'):
                continue
            revised = build_article({**old,'legacyRecheck':True,'legacyLeadMissing':not bool(old.get('locationLead')),'text':old.get('locationLead') or (old.get('summary','')+' '+ ' '.join(old.get('evidence',[])))},matchers,nodes)
            if revised:
                retained.append(revised)
    articles = merge_articles(retained,current,now)
    if not current or not articles:
        raise RuntimeError('No policy-approved live articles; publication stopped.')
    payload = {'schemaVersion':1,'collectedAt':now.isoformat(timespec='seconds'),
        'source':'NEWSIS official RSS + limited official article leads','mode':'scheduled-snapshot',
        'retentionDays':RETENTION_DAYS,'articleLimit':MAX_ARTICLES,'policyVersion':POLICY_VERSION,
        'excludedInternational':blocked,'articles':articles,'unassignedCount':sum(not a.get('relatedPlaces',a['places']) for a in articles),
        'collection':{'feedsSucceeded':sorted(succeeded),'feedWarnings':warnings,'enrichedCount':enriched}}
    # Collection metadata alone must not trigger a content deployment.
    changed = articles != previous.get('articles',[]) or blocked != previous.get('excludedInternational',{})
    return payload, changed, {'fetched':len(records),'mapped':sum(bool(a.get('relatedPlaces',a['places'])) for a in current),'retained':len(articles),
        'unassigned':payload['unassignedCount'],'enriched':enriched,'warnings':warnings}


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
            previous_url = args.previous_url + ('&' if '?' in args.previous_url else '?') + '_snapshot=' + str(time.time_ns())
            previous = decode_snapshot(request(previous_url))
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
