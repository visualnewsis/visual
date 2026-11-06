from pathlib import Path
from html import escape
from zipfile import ZipFile, ZIP_DEFLATED
from PIL import Image
import json

ROOT = Path(__file__).parent
ITEMS = [
 dict(slug='sewing-machine',name='재봉틀',date='2026-11-02',day='월',number='06',
 title='재봉틀은 어떤 원리로 옷을 꿰맬까? [굳이구지]',
 sub='바늘 아래 숨은 두 실의 만남…한 땀씩 움직이며 살펴보는 재봉틀',
 category='문화 · 생활',
 photo='재봉틀의 바늘과 천을 눌러주는 노루발. 바늘판 아래에는 밑실을 공급하는 장치가 있다. (사진=Iryna Marienko/Unsplash)',
 ai='재봉틀의 바늘과 내부를 표현한 이미지로, 실제 기기의 구조와는 차이가 있다. 해당 이미지는 기사의 이해를 돕기 위해 AI 생성 후 가공 및 편집함. [그래픽=뉴시스]',
 lead=[
 '[서울=뉴시스] 안재현 기자 = “제때 꿰맨 한 땀이 아홉 땀을 덜어준다.”',
 '작은 문제를 제때 손보면 더 큰 수고를 덜 수 있다는 영어 속담이다. 찢어진 옷을 꿰매는 바느질에서 나온 표현이다. 재봉틀도 바늘이 오르내리며 한 땀씩 박음선을 만든다. 그런데 위에서 내려오는 실 하나만으로 어떻게 천을 단단히 이을까.'
 ],
 paras=[
 '이번에 살펴볼 것은 윗실과 밑실을 쓰는 본봉 재봉틀이다. 바늘에 꿴 윗실과 천 아래의 작은 실패인 보빈에서 풀려 나오는 밑실이 서로 걸려 박음선을 만든다.',
 '바늘이 천을 뚫고 내려갔다 조금 올라올 때 윗실에 고리가 생긴다. 천 아래에서 도는 훅이 이 고리를 잡아 보빈 케이스 둘레로 넓힌다. 그 안으로 밑실이 놓인 뒤, 위쪽의 실채기가 윗실을 당겨 고리를 조인다. 두 실이 걸리는 지점은 장력이 알맞으면 천 두께 안에 자리 잡는다.',
 '바늘이 천에서 빠져나오면 이송톱니가 다음 땀을 놓을 만큼 천을 옮긴다. 노루발은 위에서 천을 눌러준다. 바늘의 왕복, 실을 잡는 훅, 실채기와 이송톱니가 제때 움직여야 한 줄의 박음선이 이어진다.',
 '비주얼 뉴시스의 ‘안재현의 굳이구지 연구소’ 재봉틀편에서는 화면의 ‘한 땀 박기’를 눌러 바늘땀을 남겨본다. 버튼을 누른 채 연속으로 박거나 다음 땀의 간격을 바꿔볼 수도 있다.',
 '‘파헤쳐보기’에서는 천 아래를 열어 훅이 윗실 고리를 잡는 순간부터 실채기가 고리를 회수하는 과정까지 천천히 살펴본다. 두 실의 걸림점과 천이 움직이는 시점도 따로 관찰한다.',
 '체험은 수평 완전회전 훅을 쓰는 본봉의 작동 순서를 단순화한 모형이다. 실과 부품 사이의 간격은 보기 쉽게 조정했다. 실제 제품의 장력과 마찰을 계산하거나 재봉틀 정비 방법을 안내하는 자료는 아니다. 화면에서 들리는 작동음은 합성음이다.'
 ],
 cta='재봉틀로 한 땀씩 박고, 천 아래에서 두 실이 엮이는 과정을 살펴보세요.',
 sources=[
 ('속담 원문·뜻', 'https://dictionary.cambridge.org/dictionary/english/stitch-in-time-saves-nine?topic=immediately', 'A stitch in time (saves nine). 본편과 같은 한국어 번역. 특정 인물의 발언으로 쓰지 않음.'),
 ('본봉의 두 실', 'https://museum.global.brother/guide/zone/1/5?lang=en', 'Brother Museum 공식 설명. 바늘실과 보빈실, 바늘·셔틀의 타이밍을 확인. 발명 최초 인물 논쟁은 원고에서 다루지 않음.'),
 ('본봉 작동 순서', 'https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/prh_change1.pdf', 'FAA Parachute Rigger Handbook 6장. 회전 훅·윗실 고리·밑실·실채기와 이송 순서 확인. 원고는 특정 모델이나 모든 스티치 방식으로 일반화하지 않음.'),
 ('첫 사진 원본', 'https://unsplash.com/photos/a-close-up-of-a-sewing-machine-on-a-table-ebgaor66TSk', 'Iryna Marienko. 무료 Unsplash 사진이며 Unsplash+가 아님. 다운로드한 원본비율 2400×1800을 1600×1200 JPG로 축소. 사진 속 실제 기기의 브랜드·모델은 원고에서 특정하지 않음.'),
 ('사진 이용조건', 'https://unsplash.com/license', '2026-10-30 확인. 상업·비상업 무료 사용 허용. 사진 자체 판매나 경쟁 사진 서비스 구축에 사용하지 않음. 촬영자 출처를 자발적으로 명시.')
 ]),
 dict(slug='gramophone',name='축음기',date='2026-11-03',day='화',number='07',
 title='축음기는 전기 없이 어떻게 소리를 낼까 [굳이구지]',
 sub='레코드의 홈에서 바늘·진동판·나팔까지…소리가 지나가는 길',
 category='문화 · 문화일반',
 photo='원반식 축음기의 사운드박스와 레코드. 바늘의 움직임은 사운드박스 안의 진동판에 전달된다. (사진=Diana/Pexels)',
 ai='축음기의 레코드와 나팔을 표현한 이미지로, 실제 기기의 구조와는 차이가 있다. 해당 이미지는 기사의 이해를 돕기 위해 AI 생성 후 가공 및 편집함. [그래픽=뉴시스]',
 lead=[
 '[서울=뉴시스] 안재현 기자 = “내 평생 그렇게 놀란 적은 없었다.”',
 '토머스 에디슨은 초기 축음기에서 녹음한 소리가 다시 나왔을 때의 놀라움을 이렇게 회고했다. 당시 장치는 원통을 돌리는 방식이었다. 이번에 살펴볼 것은 그와 다른 원반식 축음기다. 태엽으로 판을 돌리는 이 장치는 전기 없이 어떻게 소리를 낼까.'
 ],
 paras=[
 '힘의 출발점은 손으로 감은 태엽이다. 풀리려는 태엽의 힘이 기어를 거쳐 회전판에 전해진다. 회전 속도를 조절하는 조속기는 판이 지나치게 빠르게 돌지 않도록 한다.',
 '판이 도는 것만으로 음악이 들리지는 않는다. 레코드 표면에는 소리의 진동을 새긴 홈이 있다. 이 체험에서 다루는 모노 횡진동 방식은 홈의 좌우 굴곡에 정보를 담는다. 바늘이 홈을 따라 흔들리면 그 움직임이 사운드박스 안의 얇은 진동판에 전달된다.',
 '진동판이 공기를 흔들고, 그 소리가 관을 따라 나팔로 이어진다. 넓어지는 나팔은 진동을 주변 공기에 전달해 소리가 퍼지도록 돕는다. 전기 신호를 키우는 앰프와는 다른 방식이다.',
 '비주얼 뉴시스의 ‘안재현의 굳이구지 연구소’ 축음기편에서는 레코드 위에 바늘을 내려 짧은 선율을 들어본다. 회전 속도를 바꾸면 같은 선율의 빠르기와 음높이가 함께 달라지는 것도 비교할 수 있다.',
 '‘파헤쳐보기’에서는 홈의 굴곡을 따라가는 바늘과 진동판을 확대해 본다. 부품을 펼쳐 사운드박스에서 나팔까지 이어지는 길을 살피고, 태엽 모터와 회전 속도를 조절하는 장치도 관찰한다.',
 '들리는 선율은 체험을 위해 만든 합성음이다. 바늘과 진동판의 움직임, 홈의 간격은 관찰하기 쉽게 늘리거나 느리게 표현했다. 실제 축음기의 음색이나 특정 음반을 재현한 것은 아니며, 스테레오 LP의 기록 방식과도 구분된다.'
 ],
 cta='레코드 위에 바늘을 내려 소리를 듣고, 홈에서 나팔까지 이어지는 구조를 살펴보세요.',
 sources=[
 ('인용·맥락', 'https://www.pbs.org/wgbh/americanexperience/films/edison/', 'PBS American Experience 《Edison》 Transcript: I was never so taken aback in all my life. 한국어는 본편과 같은 번역. 1877년 초기 원통형 장치의 재생을 회고한 대목이며 원반식 장치의 발명자 발언처럼 쓰지 않음.'),
 ('사운드박스·나팔', 'https://www.clpgs.org.uk/the-reproducer-and-sound-box.html', 'CLPGS 공식 기초 설명. 바늘/스타일러스 → 진동판 → 관 → 나팔의 경로 확인.'),
 ('태엽 모터', 'https://www.clpgs.org.uk/the-spring-motor.html', 'CLPGS. 전기 없이 태엽으로 구동하는 음향식 축음기로 범위를 한정. 모든 시대의 축음기·턴테이블이 무전원이라고 쓰지 않음.'),
 ('속도 조절', 'https://www.clpgs.org.uk/speed-regulating.html', 'CLPGS. 회전축 속도에 따른 추의 벌어짐과 속도 조절을 확인.'),
 ('첫 사진 원본', 'https://www.pexels.com/photo/close-up-photo-of-a-gramophone-9547830/', '촬영자 Diana ✨. 원본 3858×5787의 x=0~3858, y=2500~5394를 4:3으로 크롭 후 1600×1200 JPG로 축소. 사진 속 실제 나팔·팔의 연결 형태는 AI 그림과 다르며 동일 제품이라고 쓰지 않음.'),
 ('사진 이용조건', 'https://www.pexels.com/license/', '2026-10-30 확인. 무료 사용·수정 허용. 사진 자체 스톡 재판매·재배포, 인물·브랜드의 추천/보증 표현에 사용하지 않음. 촬영자 출처 명시.')
 ])
]

style='''<style>*{box-sizing:border-box}body{margin:0;background:#f3f2ed;color:#202827;font:17px/1.85 system-ui,"Malgun Gothic",sans-serif}main{max-width:820px;margin:auto;padding:32px 22px 80px}h1{font-size:30px;line-height:1.4}h2{line-height:1.4}figure{margin:28px 0}img{display:block;width:100%;height:auto}figcaption{font-size:14px;color:#626b68;margin-top:10px}a{color:#087d7d;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#e6ebe6;padding:18px;font:14px/1.65 monospace}.memo{background:#e7eeeb;padding:18px;border-left:4px solid #078d91;font-size:15px}details{margin-top:30px;border-top:1px solid #ccd3ce;padding-top:16px}.tag{font-size:14px;color:#47706b}p{margin:22px 0}.sub{color:#59635f}nav a{display:inline-block;margin:8px 18px 8px 0}@media(max-width:480px){h1{font-size:25px}main{padding:22px 18px 60px}}</style>'''
def figure(d,n,cap,prefix=''):
 return f'<figure><img src="{prefix}{n}" alt="{escape(cap)}"><figcaption>{escape(cap)}</figcaption></figure>'

manifest=[]
for d in ITEMS:
 folder=ROOT/d['slug'];url=f'https://visual.newsis.com/goodeasy/{d["slug"]}/'
 footer=f'<a href="{url}">\n◆ 비주얼 뉴시스에서 {d["cta"]} {url}\n</a>'
 blocks=['제목\n'+d['title'],'부제\n'+d['sub'],'[첫 번째 사진 삽입: 02_대표사진_실사_무문구.jpg]\n'+d['photo']]+d['lead']+['[본문 두 번째 사진 삽입: 04_본문사진_AI_무문구.jpg]\n'+d['ai']]+d['paras']+[footer,'크리에이티브 디렉터 = 안재현']
 (folder/'01_포털_출고원고.txt').write_text('\n\n'.join(blocks)+'\n',encoding='utf-8-sig')
 source='내부 편집 메모 — 송고 본문에 포함하지 않음\n\n'+f'예약 입력안: {d["date"]}({d["day"]}) 10:00 KST\nCMS 송고 예약: 미등록 (사용자 예약 입력용 자료)\n카테고리 제안: {d["category"]} — CMS 실제 분류명은 확인 필요\n\n'
 source+='\n\n'.join(f'{name}\n{url}\n{note}' for name,url,note in d['sources'])
 source+='\n\n두 번째 사진: 2026-10-30 내장 GPT 이미지 생성 도구로 새 제작한 무문구 이미지. 실제 제품 사진·정확한 구조도로 제시하지 않음. 본편 스크린샷 또는 본편에 설치된 자산이라고 주장하지 않음.\n본문 사진은 모두 RGB JPG. 첫 사진 1600×1200(4:3).\n클로드는 사용량 소진으로 후속 검수를 요청하지 않았음. 삼단검수 완료 원고라고 표시하지 않음.\n본편 개선 작업과 별도로 준비한 송고 원고이며 실제 예약 전 링크 및 최종 개선본 반영 여부 확인 필요.\n'
 (folder/'03_사진_출처와_검증.txt').write_text(source,encoding='utf-8-sig')
 markup=f'<article id="{d["slug"]}"><p class="tag">{d["date"]}({d["day"]}) · {d["number"]}편 · 예약 입력안 10:00</p><h1>{escape(d["title"])}</h1><p class="sub">{escape(d["sub"])}</p>'
 markup+=figure(d,'02_대표사진_실사_무문구.jpg',d['photo'])
 markup+=''.join('<p>'+escape(t)+'</p>' for t in d['lead'])
 markup+=figure(d,'04_본문사진_AI_무문구.jpg',d['ai'])
 markup+=''.join('<p>'+escape(t)+'</p>' for t in d['paras'])
 markup+='<p>'+footer+'</p><p>크리에이티브 디렉터 = 안재현</p><details><summary>복사용 하단 링크 · 고정 양식</summary><pre>'+escape(footer)+'</pre></details><details><summary>내부 확인용 출처·사진 이용조건</summary><pre>'+escape(source)+'</pre></details></article>'
 document='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(d['name']+' 포털 송고 준비본')+'</title>'+style+'<main><p class="memo">송고 준비본 · 실제 CMS 예약은 아직 등록하지 않았습니다.</p>'+markup+'</main></html>'
 (folder/'00_사진포함_미리보기.html').write_text(document,encoding='utf-8')
 with ZipFile(folder/(d['name']+'_포털출고자료.zip'),'w',ZIP_DEFLATED) as z:
  for name in ['00_사진포함_미리보기.html','01_포털_출고원고.txt','02_대표사진_실사_무문구.jpg','03_사진_출처와_검증.txt','04_본문사진_AI_무문구.jpg']:z.write(folder/name,name)
 manifest.append(dict(episode=d['number'],name=d['name'],title=d['title'],proposedPublication=d['date']+'T10:00:00+09:00',cmsScheduled=False,url=url))

index='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>굳이구지 월·화 포털 송고 준비</title>'+style+'<main><h1>다음 주 월·화 포털 송고 준비</h1><p class="memo">11월 2일(월) 재봉틀 · 3일(화) 축음기 / 오전 10시 입력안<br>이 파일은 원고·사진 묶음입니다. CMS 예약이나 랜딩 공개 예약을 등록한 것은 아닙니다.</p>'
for d in ITEMS:
 index+=f'<section><p class="tag">{d["date"]}({d["day"]}) · {d["number"]}편</p><h2>{escape(d["title"])}</h2>'+figure(d,'02_대표사진_실사_무문구.jpg',d['photo'],d['slug']+'/')+f'<nav><a href="{d["slug"]}/00_사진포함_미리보기.html">사진 포함 원고 전체</a><a href="{d["slug"]}/01_포털_출고원고.txt">복사용 원고 TXT</a><a href="{d["slug"]}/{d["name"]}_포털출고자료.zip">사진·원고 ZIP</a></nav></section>'
index+='</main></html>'
(ROOT/'00_월화_모아보기.html').write_text(index,encoding='utf-8')
(ROOT/'예약입력안.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
with ZipFile(ROOT/'굳이구지_월화_포털출고자료.zip','w',ZIP_DEFLATED) as z:
 for name in ['00_월화_모아보기.html','예약입력안.json']:z.write(ROOT/name,name)
 for d in ITEMS:
  for name in ['00_사진포함_미리보기.html','01_포털_출고원고.txt','02_대표사진_실사_무문구.jpg','03_사진_출처와_검증.txt','04_본문사진_AI_무문구.jpg']:z.write(ROOT/d['slug']/name,d['slug']+'/'+name)
for d in ITEMS:
 for name in ['02_대표사진_실사_무문구.jpg','04_본문사진_AI_무문구.jpg']:
  im=Image.open(ROOT/d['slug']/name);assert im.format=='JPEG' and im.mode=='RGB';print(d['name'],name,im.size)
print('Prepared two portal packages; CMS scheduling not executed.')
