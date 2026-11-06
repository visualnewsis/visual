from pathlib import Path
from PIL import Image
from html import escape
import zipfile, re

root=Path(__file__).parent
items=[dict(slug='fishing-reel',name='낚시릴',day=29,title='낚시 릴은 어떻게 줄을 감고 풀어줄까 [굳이구지]',sub='손잡이를 돌리고 줄을 당기며 로터·스풀·드랙의 역할을 살펴보는 체험',caption='낚싯대에 장착된 스피닝 릴의 스풀과 줄 안내 장치. 체험 속 모형과는 다른 제품이다. (사진=Thirdman/Pexels)',ai='낚시 릴을 표현한 이미지로, 실제 낚시 릴의 구조와는 차이가 있다. 해당 이미지는 기사의 이해를 돕기 위해 AI 생성 후 가공 및 편집함. [그래픽=뉴시스]',paras=[
'[서울=뉴시스] 안재현 기자 = “낚시는 수학과 같아서, 완전히 배울 수는 없다.”',
'영국 작가 아이작 월턴이 낚시를 다룬 책 ‘조어대전’에서 남긴 말이다. 낚싯줄을 감는 일도 들여다볼수록 궁금한 점이 생긴다. 손잡이를 돌릴 때 줄을 감는 것은 어느 부품일까. 물고기가 세게 당기면 줄은 왜 거꾸로 풀려나갈까.',
'스피닝 릴은 손잡이를 돌리면 기어를 통해 로터가 회전한다. 로터에 달린 줄 안내 장치가 낚싯줄을 스풀 둘레로 감는다. 이때 스풀은 앞뒤로 오가며 줄이 한곳에 몰리지 않도록 감기는 위치를 바꾼다. 스풀만 빙글빙글 돌아 줄을 감는 구조와는 다르다.',
'줄을 감다가도 강한 힘으로 잡아당기면 스풀이 돌아가며 줄을 내줄 수 있다. 이때 저항을 조절하는 장치가 드랙이다. 마찰을 이용해 버티다가 설정한 저항을 넘는 힘이 걸리면 미끄러지며 줄이 풀리게 한다. 다만 드랙이 있다고 줄이 끊어지지 않는 것은 아니다. 줄의 상태와 매듭, 낚싯대에 걸리는 힘도 영향을 준다.',
'손잡이 한 바퀴에 감기는 줄의 길이도 릴마다 다르다. 손잡이를 한 바퀴 돌릴 때 로터가 몇 바퀴 도는지를 나타내는 기어비뿐 아니라, 줄이 감긴 스풀의 반지름에 따라서도 달라진다.',
'비주얼 뉴시스의 ‘안재현의 굳이구지’ 낚시 릴편에서는 화면의 손잡이를 직접 돌려본다. ‘파헤쳐보기’에서는 방금 조작한 기록을 이어받아 손잡이와 로터, 스풀이 어떻게 연결되는지 살펴본다.',
'이어지는 실험에서는 기어비를 바꾸며 감기는 길이를 비교하고, 스풀이 앞뒤로 오가는 움직임도 관찰한다. 줄을 당기는 힘과 드랙의 상대적인 저항을 바꾸면 스풀이 버티는 경우와 미끄러지는 경우를 나눠 볼 수 있다.',
'체험의 기어비와 저항은 원리를 비교하기 위한 설정이다. 특정 제품의 성능을 재현하거나 물고기의 움직임을 계산한 것은 아니다. 줄을 감는 장치 안에 줄을 내주는 장치도 들어 있다는 사실을 직접 확인하는 체험이다.'
],link='낚시 릴 손잡이를 직접 돌리고 줄이 감기고 풀리는 원리를 살펴보세요.',sources='''발행표시: 2026-10-29 10:00 KST. 랜딩 비활성 유지, 직접 주소로 확인.
인용: Izaak Walton, The Compleat Angler, To the Reader. 1653년 초간 작품. 번역은 첫 절의 의미를 옮김. 현대 스피닝 릴에 관한 발언으로 소개하지 않음.
원문 발췌: For angling may be said to be so like the mathematics, that it can never be fully learnt
https://luminarium.org/renascence-editions/walton/walton1.html
https://anglicanhistory.org/walton/angler/dedicatory.html
메커니즘 참고: SHIMANO 공식 스피닝 릴 설명서 검색 본문 및 줄 감기 기술 설명. 설명서 PDF는 웹 도구에서 503으로 전체 열람되지 않아, 세부 수치나 특정 제품 설명을 원고에 사용하지 않음.
https://www.shimanofishingservice.jp/img/product/manual/manual_spinning_reel_ov.pdf
https://fishshop.shimano.com/pages/infinity-loop
DAIWA 공식 설명으로 기어비=손잡이 한 바퀴당 로터 회전수, 스풀 크기에 따른 회수 길이 차이, 드랙의 저항·줄 방출 역할을 추가 대조함.
https://www.daiwa.com/scandinavia/fishing_tips/How_to_choose_spinning_reel?category=ALL&page=1
실사: Thirdman, Close-Up Shot of a Fishing Reel. 공식 사진 페이지와 작가 확인.
https://www.pexels.com/photo/close-up-shot-of-a-fishing-reel-5537641/
원본 1600×2400에서 스풀·베일·몸체 중심의 가로 4:3 크롭. 손잡이 하단은 화면 밖임.
'''),dict(slug='watch',name='손목시계',day=30,title='손목시계는 건전지 없이 어떻게 움직일까 [굳이구지]',sub='태엽을 감고 부품을 펼쳐 기계식 시계 안쪽의 움직임을 살펴보는 체험',caption='내부 부품이 보이는 손목시계를 착용한 모습. 체험 속 수동 감기 모형과는 다른 제품이다. (사진=Ruslan Alekso/Pexels)',ai='기계식 손목시계를 표현한 이미지로, 실제 시계의 구조와는 차이가 있다. 해당 이미지는 기사의 이해를 돕기 위해 AI 생성 후 가공 및 편집함. [그래픽=뉴시스]',paras=[
'[서울=뉴시스] 안재현 기자 = “시간은 돈이다.”',
'벤저민 프랭클린은 1748년 젊은 상인에게 보내는 조언에서 이렇게 썼다. 시간을 허투루 쓰지 말라는 말이다. 그렇다면 그 시간을 재는 작은 시계 안에서는 어떤 일이 벌어질까. 건전지가 없는 기계식 시계는 무엇으로 바늘을 움직일까.',
'힘의 출발점은 태엽이다. 수동 감기 시계의 용두를 돌리면 태엽이 감기며 에너지를 저장한다. 태엽이 원래 모습으로 풀리려는 힘이 태엽통을 돌리고, 맞물린 기어들을 거쳐 전달된다. 자동 감기 시계도 태엽을 쓰지만, 손목의 움직임에 따라 도는 로터로 태엽을 감는 장치가 추가된다.',
'태엽이 풀리는 힘을 그대로 내버려두면 바늘은 시간을 재지 못한 채 빠르게 돌아가 버린다. 이를 조절하는 것이 탈진기와 조속기다. 탈진기는 기어의 움직임을 번갈아 막고 풀어주며 힘을 조금씩 전달한다.',
'이 과정에 맞물려 움직이는 부품이 밸런스와 헤어스프링이다. 작은 바퀴인 밸런스가 가느다란 스프링의 복원력을 받아 왕복 회전하고, 탈진기에서 전달받는 힘이 그 움직임을 이어가게 한다. 이 왕복 운동의 박자에 따라 기어가 조금씩 나아간다.',
'비주얼 뉴시스의 ‘안재현의 굳이구지’ 손목시계편에서는 먼저 용두를 돌려 태엽을 감는다. ‘파헤쳐보기’에서는 방금 감은 상태를 이어받아 태엽통과 기어, 탈진기, 밸런스를 살펴본다.',
'겹쳐 있는 부품을 펼쳐 보거나 다시 모으며 각 부품이 놓인 자리를 확인할 수 있다. 태엽통의 뚜껑을 열어 감기는 모습을 보고, 기어 두 개의 맞물림과 탈진기가 멈췄다 놓아주는 순간도 따로 관찰한다. 바늘 실험에서는 초침과 분침, 시침이 서로 다른 속도로 움직이는 관계를 확인한다.',
'체험은 수동 감기 기계식 시계의 원리를 보여주는 모형이다. 작동 시간과 부품 사이 간격은 관찰하기 쉽게 조정했으며, 특정 제품의 치수나 시간 오차를 재현하지 않는다. 실제 시계를 분해하는 순서를 안내하는 자료도 아니다.'
],link='태엽을 직접 감고 기계식 손목시계의 내부를 펼쳐보세요.',sources='''발행표시: 2026-10-30 10:00 KST. 랜딩 비활성 유지, 직접 주소로 확인.
인용: Benjamin Franklin, Advice to a Young Tradesman, 21 July 1748.
원문: Remember that Time is Money. 한국어 인용은 핵심 절 Time is Money의 번역이며 첫 사용·창안자라는 주장은 하지 않음.
https://founders.archives.gov/documents/Franklin/01-03-02-0130
기계 작동 검증: FHH의 winding/barrel/wheel train/escapement/regulator 설명. 수동·자동 감기를 구분. 배터리가 없는 모든 시계를 기계식으로 단정하지 않으며 체험은 수동 감기 모형.
https://www.hautehorlogerie.org/en/watches-and-culture/library/how-does-a-mechanical-watch-work
https://corporate.epson/en/technology/overview/wearable/orient-watch.html
구성 참고: 아래 레퍼런스의 설명이나 도판을 원고에 복제하지 않음.
https://ciechanow.ski/mechanical-watch/
실사: Ruslan Alekso, Photo Of Wristwatch. 원본 페이지가 mechanical wristwatch로 설명하지만 수동·자동 여부나 모델명은 확인되지 않아 캡션에 쓰지 않음.
https://www.pexels.com/photo/photo-of-wristwatch-1401847/
원본 1125×750에서 중앙 가로 5:3 크롭.
''')]

template=(root/'goodeasy-camera-portal-20261026'/'00_사진포함_미리보기.html').read_text(encoding='utf-8').split('<main>')[0]
for d in items:
 folder=root/f"goodeasy-{d['slug']}-portal-20261026"
 footer=f'<a href="https://visual.newsis.com/goodeasy/{d["slug"]}/">\n◆ 비주얼 뉴시스에서 {d["link"]} https://visual.newsis.com/goodeasy/{d["slug"]}/\n</a>'
 blocks=['제목\n'+d['title'],'부제\n'+d['sub'],'[첫 번째 사진 삽입: 02_대표사진_실사_무문구.jpg]\n'+d['caption']]+d['paras'][:2]+['[본문 두 번째 사진 삽입: 04_본문사진_AI_무문구.jpg]\n'+d['ai']]+d['paras'][2:]+[footer,'크리에이티브 디렉터 = 안재현']
 (folder/'01_포털_출고원고.txt').write_text('\n\n'.join(blocks)+'\n',encoding='utf-8-sig')
 def fig(filename,caption):return f'<figure><img src="{filename}" alt="{escape(caption)}"><figcaption>{escape(caption)}</figcaption></figure>'
 markup=f'<main><h1>{escape(d["title"])}</h1><p class="sub">{escape(d["sub"])}</p>'+fig('02_대표사진_실사_무문구.jpg',d['caption'])
 for i,p in enumerate(d['paras']):
  if i==2:markup+=fig('04_본문사진_AI_무문구.jpg',d['ai'])
  markup+='<p>'+escape(p)+'</p>'
 markup+='<p class="link">'+footer+'</p><p>크리에이티브 디렉터 = 안재현</p></main></html>'
 prefix=re.sub(r'<title>.*?</title>',f'<title>{escape(d["title"])} · 출고자료</title>',template)
 (folder/'00_사진포함_미리보기.html').write_text(prefix+markup,encoding='utf-8')
 note=d['sources']+'''\n사진 공통 이용조건 확인: 2026-10-26 Pexels 공식 라이선스. 무료 사용·수정 허용. 인물·브랜드의 추천이나 보증으로 사용하지 않고 사진 자체 재판매·스톡 재배포를 하지 않음.
https://www.pexels.com/license/
두 번째 사진은 해당 시리즈 랜딩 티저를 스타일 참고로 built-in image_gen으로 별도 제작한 무문구 AI 이미지. 실사·실측 구조도·특정 실물 제품으로 제시하지 않음. 사진 두 장 모두 RGB JPG.
원고 본문에는 검증 출처 URL이나 제작 과정 설명을 삽입하지 않았음. 위 메모는 내부 확인용이며 송고 본문이 아님.
'''
 (folder/'03_사진_출처와_검증.txt').write_text(note,encoding='utf-8-sig')
 prompt={'fishing-reel':'검은 스피닝 릴 한 개. 스풀·베일·줄 안내 장치·손잡이가 보이는 사선 구도. 차콜 배경, 절제된 앰버 조명. 기타·시계·문구·로고·가상 분해 부품 제외.','watch':'검은 가죽줄과 브론즈 색 케이스의 스켈레톤 기계식 손목시계 한 개. 기어와 브리지의 질감, 차콜 배경과 앰버 조명. 문구·숫자·로고·허공의 부품 제외.'}[d['slug']]
 (folder/'05_AI이미지_제작기록.txt').write_text('도구: built-in image_gen\n스타일 참고: goodeasy/assets/landing-teasers-three.png\n프롬프트 요지: '+prompt+'\n가로 3:2, 본문용 일러스트. PNG 원본을 JPG로 변환.\n',encoding='utf-8-sig')
 files=['00_사진포함_미리보기.html','01_포털_출고원고.txt','02_대표사진_실사_무문구.jpg','03_사진_출처와_검증.txt','04_본문사진_AI_무문구.jpg','05_AI이미지_제작기록.txt']
 with zipfile.ZipFile(folder/f'{d["name"]}_포털출고자료.zip','w',zipfile.ZIP_DEFLATED) as z:
  for f in files:z.write(folder/f,f)
 for f in files:
  assert (folder/f).exists()
  if f.endswith('.jpg'):
   im=Image.open(folder/f);assert im.format=='JPEG' and im.width>im.height
 print(d['name'],'READY',len('\n'.join(d['paras'])), 'characters')

combined=re.sub(r'<title>.*?</title>','<title>굳이구지 04·05 포털 출고자료</title>',template)+'<nav style="padding:18px;position:sticky;top:0;background:white;z-index:2;text-align:center"><a href="#reel">04 낚시 릴</a>　·　<a href="#watch">05 손목시계</a></nav>'
for anchor,d in zip(['reel','watch'],items):
 folder=f'goodeasy-{d["slug"]}-portal-20261026'
 page=(root/folder/'00_사진포함_미리보기.html').read_text(encoding='utf-8')
 main='<main id="'+anchor+'">'+page.split('<main>',1)[1].split('</main>',1)[0]+'</main>'
 combined+=main.replace('src="','src="'+folder+'/')
combined+='</html>'
(root/'굳이구지_04_05_포털_모아보기.html').write_text(combined,encoding='utf-8')
