"""International feed projection, isolated from domestic classification.

Country markers are representative anchors, never inferred event coordinates.
Existing deployment still ships one articles.js; `world` has its own schema.
"""
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone, timedelta
from pathlib import Path
sys.dont_write_bytecode=True
import collect_news as C

ROOT=Path(__file__).resolve().parents[1]
VERSION='world-country-v2'
COUNTRIES=json.loads((ROOT/'data/world-countries.json').read_text())
ALIASES={'US':['미국','美'], 'CN':['중국','中'], 'JP':['일본','日'], 'GB':['영국','英'],
 'RU':['러시아','러'], 'UA':['우크라이나','우크라'], 'DE':['독일','獨'], 'FR':['프랑스','佛'],
 'KP':['북한','北'], 'KR':['한국','대한민국','韓'], 'TR':['튀르키예','터키'], 'AE':['아랍에미리트','UAE'],
 'IL':['이스라엘'], 'PS':['팔레스타인','가자지구','가자'], 'CD':['콩고민주공화국'],
 'CG':['콩고공화국'], 'CZ':['체코'], 'GE':['조지아'], 'TW':['대만','타이완']}
CITIES={'워싱턴':'US','뉴욕':'US','로스앤젤레스':'US','베이징':'CN','상하이':'CN','도쿄':'JP','오사카':'JP',
 '런던':'GB','파리':'FR','베를린':'DE','모스크바':'RU','키이우':'UA','키예프':'UA','테헤란':'IR',
 '예루살렘':'IL','텔아비브':'IL','베이루트':'LB','다마스쿠스':'SY','타이베이':'TW','마닐라':'PH',
 '방콕':'TH','하노이':'VN','뉴델리':'IN','뭄바이':'IN','이슬라마바드':'PK','자카르타':'ID',
 '캔버라':'AU','시드니':'AU','오타와':'CA','토론토':'CA','마드리드':'ES','로마':'IT','브뤼셀':'BE',
 '제네바':'CH','카이로':'EG','앙카라':'TR','이스탄불':'TR','리야드':'SA','두바이':'AE','도하':'QA',
 '서울':'KR','부산':'KR','평양':'KP','트빌리시':'GE','크라쿠프':'PL','바르샤바':'PL'}
# Do not interpret these ambiguous common nouns or broad labels as a country.
AMBIGUOUS={'인도','조지아','콩고','니제르','이란','가자','오만','말리','가나','차드','토고'}
COUNTRY_CUES={'IN':r'뉴델리|뭄바이|모디|루피|인도\s*(?:정부|총리|대통령|북부|남부|동부|서부|중부|[가-힣]{2,}주)', 'OM':r'무스카트|오만\s*(?:정부|국왕|술탄|외무|수도|해역|항구|당국)', 'ML':r'바마코|말리\s*(?:정부|군정|대통령|총리|수도|북부|남부)', 'GH':r'아크라|가나\s*(?:정부|대통령|총리|수도|대표팀)', 'TD':r'은자메나|차드\s*(?:정부|대통령|수도|군정)', 'TG':r'로메|토고\s*(?:정부|대통령|수도)'}

def match_name(text,name):
    return re.search(r'(?<![가-힣A-Za-z])'+re.escape(name)+r'(?=$|[^가-힣A-Za-z]|에서|의|은|는|이|가|을|를|과|와|내|서|에)',text)

def classify(title,lead):
    lead=C.focus_lead(lead)
    text=title+'\n'+'\n'.join(lead.splitlines()[:2])
    text=re.sub(r'(?:한국|현지)\s*(?:시간|시각)','',text)
    result={}
    for code,country in COUNTRIES.items():
        names=ALIASES.get(code,[country['name']])
        if code=='CN': names=names+['홍콩'] # Region name is labelled as country relation, not a city pin.
        hits=[]
        for name in names:
            hit=match_name(text,name)
            if not hit: continue
            after=text[hit.end():hit.end()+24]
            before=text[max(0,hit.start()-12):hit.start()]
            if re.match(r'\s*(?:국적|출신|태생|교포|브랜드|기업)',after): continue
            if name in AMBIGUOUS:
                if name=='인도' and re.match(r'(?:·태평양|로\s*(?:돌진|진입)|를\s*(?:걷|걸|침범)|에\s*(?:돌진|보행))',after): continue
                if name=='조지아' and (re.search(r'미국\s*$',before) or re.match(r'\s*주',after) or not re.search(r'트빌리시|코카서스|조지아\s*(?:정부|대통령|총리|공화국)',text)): continue
                if name=='콩고': continue
                if code in COUNTRY_CUES and not re.search(COUNTRY_CUES[code],text): continue
                if name=='이란' and before and (unicodedata.category(before[-1]) in {'Pe','Pf'} or before[-1] in ['"', "'", '>']) and not re.match(r'\s*(?:정부|대통령|외무|군|핵|수도|당국)',after): continue
                if name=='가자' and not re.match(r'\s*(?:지구|전쟁|휴전|전투|주민|구호|공습|기근|지상전|봉쇄|북부|남부|에서|의)',after): continue
            if len(name)==1 and name in '러' and not re.match(r'[·,\s\-"“”]',after): continue
            hits.append((name,hit.start(),hit.end()))
        for city,c in CITIES.items():
            if c==code:
                h=match_name(text,city)
                if h and not (city=='도하' and ('카타르' not in text and not re.match(r'\s*(?:에서|시내|국제공항|협정|라운드|정상회의|회의)',text[h.end():]))): hits.append((city,h.start(),h.end()))
        if not hits: continue
        role='related'
        evidence=[]
        for name,start,end in hits:
            # Slice the exact matched sentence, not an earlier mention.
            unit_start=max(text.rfind(mark,0,start) for mark in ['.','!','?','\n'])+1
            ends=[p for mark in ['.','!','?','\n'] if (p:=text.find(mark,end))>=0]
            unit_end=min(ends) if ends else len(text)
            excerpt=text[unit_start:unit_end]
            # Explicit locative phrase + physical event only. Governments in
            # Washington/Beijing, datelines, nationality and past events are not locations.
            after=text[end:min(unit_end,end+70)]
            if re.match(r'\s*(?:에서|서(?=\s))',after) and re.search(r'지진|홍수|산불|화재|총격|폭발|충돌|추락|개최|열렸|열린|발생|상륙|공습|피격|시위',after) and not re.search(r'출신|과거|지난해|사진|자료|회고|언급|보도|발표|논평',excerpt):
                role='place'
            evidence.append(excerpt.strip()[:160])
        result[code]={'country':code,'role':role,'evidence':list(dict.fromkeys(evidence))[:2]}
    return sorted(result.values(),key=lambda x:x['country'])

def valid(world,now=None):
    now=now or datetime.now(timezone.utc)
    assert isinstance(world,dict) and world.get('schemaVersion')==1 and world.get('policyVersion')==VERSION,'World schema mismatch'
    collected=C.parse_time(world['collectedAt'])
    assert collected<=now+timedelta(seconds=60),'Future world snapshot'
    articles=world['articles']
    assert isinstance(articles,list) and len(articles)<=3000
    seen=set()
    for a in articles:
        assert re.fullmatch(r'NISX\d+_\d+',a['id']) and a['id'] not in seen
        seen.add(a['id'])
        assert a['url']=='https://www.newsis.com/view/'+a['id']
        assert isinstance(a['title'],str) and 0<len(a['title'])<=500
        assert collected-timedelta(days=30)<=C.parse_time(a['publishedAt'])<=collected
        assert isinstance(a.get('locations'),list) and len(a['locations'])<=len(COUNTRIES)
        assert len({x['country'] for x in a['locations']})==len(a['locations'])
        assert all(x['country'] in COUNTRIES and x['role'] in ['place','related'] and isinstance(x['evidence'],list) and all(isinstance(e,str) for e in x['evidence']) for x in a['locations'])
        assert not any(k in a for k in ['text','articleBody'])
    return True

def collect(previous=None,now=None,source=None):
    now=now or datetime.now(timezone.utc)
    source=source if source is not None else C.request('https://www.newsis.com/RSS/international.xml')
    records,rejected=C.parse_feed(source,'international',now)
    if not records: raise ValueError('International feed empty; previous world snapshot preserved')
    old={}
    previous_valid=False
    try:
        valid(previous,now)
        previous_valid=True
        old={a['id']:a for a in previous['articles'] if C.parse_time(a['publishedAt'])>=now-timedelta(days=30)}
    except (AssertionError,KeyError,TypeError,ValueError): pass
    for raw in records.values():
        if len(raw['title'])>500: continue
        locations=classify(raw['title'],raw['text'])
        old[raw['id']]={k:raw[k] for k in ['id','title','url','publishedAt']}|{'locations':locations}
    payload={'schemaVersion':1,'policyVersion':VERSION,'collectedAt':now.isoformat(),
             'source':'NEWSIS international RSS','articles':sorted(old.values(),key=lambda a:a['publishedAt'],reverse=True)[:3000]}
    valid(payload,now)
    if previous_valid and payload['articles']==previous['articles']:
        return previous
    return payload

if __name__=='__main__':
    path=ROOT/'data/articles.js'
    payload=C.decode_snapshot(path.read_bytes())
    payload['world']=collect(payload.get('world'))
    C.write_snapshot(path,payload)
    print(json.dumps({'worldArticles':len(payload['world']['articles']),'located':sum(bool(a['locations']) for a in payload['world']['articles']),'collectedAt':payload['world']['collectedAt']},ensure_ascii=False))
