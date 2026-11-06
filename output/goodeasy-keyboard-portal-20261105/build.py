from pathlib import Path
from PIL import Image
from html import escape
from zipfile import ZipFile,ZIP_DEFLATED
import json
r=Path(r'C:\Users\user\Documents\editshop\output\goodeasy-keyboard-portal-20261105')
im=Image.open(r/'source-photo.jpg').convert('RGB');w,h=im.size;ch=round(w*3/5);top=h-ch;im.crop((0,top,w,h)).resize((1500,900),Image.Resampling.LANCZOS).save(r/'02_대표사진_실사_무문구.jpg',quality=95)
ai=Image.open(r'C:\Users\user\.codex\generated_images\01a16619-0fc3-7723-9a18-398e99f9eef7\exec-ab5c0bb2-2983-4edb-b334-4e42386281a8.png').convert('RGB');ai.save(r/'04_본문사진_AI_무문구.jpg',quality=95)
title='기계식 키보드는 어떻게 글자를 찍을까 [굳이구지]'
sub='키캡 아래 스템·스프링·접점…끝까지 누르기 전에 입력되는 이유'
cap1='기계식 키보드의 키캡과 스위치. 키마다 놓인 스위치가 눌림을 전기 신호로 바꾼다. (사진=John Petalcurin/Pexels)'
cap2='기계식 키보드와 스위치 내부를 표현한 이미지로, 실제 기기의 구조와는 차이가 있다. 해당 이미지는 기사의 이해를 돕기 위해 AI 생성 후 가공 및 편집함. [그래픽=뉴시스]'
lead=['[서울=뉴시스] 안재현 기자 = “우리의 필기도구도 우리의 생각에 한몫한다.”','철학자 프리드리히 니체가 타자기를 쓰던 1882년 편지에 남긴 말이다. 오늘날 손끝이 닿는 도구는 키보드다. 키를 누를 때마다 화면에 글자가 나타나지만, 키캡 아래에서는 어떤 일이 일어날까.']
body=['이번에 살펴볼 것은 금속 접점으로 입력을 감지하는 리니어 방식의 기계식 스위치다. 손가락으로 키캡을 누르면 그 아래의 스템이 내려가고, 코일 스프링이 압축된다. 스템이 일정 거리 움직이면 금속 접점이 닫힌다. 키보드는 이 전기적 변화를 읽어 해당 키의 입력을 컴퓨터에 보낸다.',
'키를 바닥까지 눌러야만 입력되는 것은 아니다. 체리 MX2A RED의 경우 입력 지점까지의 이동 거리는 2㎜, 끝까지 눌리는 전체 이동 거리는 4㎜다. 손가락이 끝까지 내려가기 전에 이미 입력이 이뤄지는 셈이다. 이 거리는 스위치 제품에 따라 다르다.',
'손을 떼면 압축됐던 스프링이 스템과 키캡을 밀어 올린다. 접점도 다시 떨어져 키를 놓은 상태가 된다. 같은 깊이로 눌러도 스프링이 얼마나 단단한지에 따라 손끝에 느껴지는 힘은 달라진다.',
'접점이 붙는 순간에도 작은 일이 벌어진다. 금속 접점은 한 번에 안정적으로 닫히지 않고 짧게 붙었다 떨어지기를 반복할 수 있다. 키보드는 이런 접점 튐을 처리해 한 번 누른 키가 여러 번 입력되는 일을 막는다. 이를 디바운싱이라고 한다.',
'비주얼 뉴시스의 ‘안재현의 굳이구지 연구소’ 키보드편에서는 직접 타이핑한 뒤 스위치를 펼쳐볼 수 있다. 누른 깊이를 바꾸며 접점이 닫히는 순간을 찾고, 스프링의 강성과 접점 튐을 처리하는 과정도 비교한다.',
'체험은 접점식 리니어 스위치의 작동을 단순화한 모형이다. 실제 제품의 눌림 깊이나 하중을 측정하는 도구는 아니며, 들리는 소리는 합성 효과음이다.']
url='https://visual.newsis.com/goodeasy/keyboard/'
cta='◆ 비주얼 뉴시스에서 직접 타이핑하고, 키캡 아래 스위치를 펼쳐 글자가 입력되는 과정을 살펴보세요. '+url
footer='<a href="'+url+'">\n'+cta+'\n</a>'
text='제목\n'+title+'\n\n부제\n'+sub+'\n\n[첫 번째 사진 삽입: 02_대표사진_실사_무문구.jpg]\n'+cap1+'\n\n'+'\n\n'.join(lead)+'\n\n[본문 두 번째 사진 삽입: 04_본문사진_AI_무문구.jpg]\n'+cap2+'\n\n'+'\n\n'.join(body)+'\n\n'+footer+'\n\n크리에이티브 디렉터 = 안재현\n'
(r/'01_포털_출고원고.txt').write_text(text,encoding='utf8')
sources=[('명언·1882년 편지','https://german.princeton.edu/node/2345','니체의 독일어 문장과 1882년2월 편지 맥락 확인. 본편과 같은 한국어 번역. 현대 기계식 스위치를 평가한 발언으로 쓰지 않음.'),('타자기 소장기관·인용','https://www.klassik-stiftung.de/startseite/digital/sammlungshighlights/friedrich-nietzsches-schreibkugel/','본편 출처. 직접 열기는 시간 초과였으나 공식 도메인의 검색 본문에서 원문 인용 확인. 소장기관 별도 100 Schätze 페이지에서 니체의 타자기 사용 맥락 확인.'),('구조와 이동 거리','https://www.cherry.de/en-gb/product/mx2a-red','공식 제품 페이지:2mm 입력 전 이동,4mm 전체 이동,스템·스프링·접점. 모든 키보드로 일반화하지 않음.'),('접점 튐과 디바운스','https://docs.qmk.fm/feature_debounce_type','공식 문서:접점의 복수 전이와 다양한 소프트웨어 처리 방식. 하나의 고정 대기 시간이 모든 키보드의 방식이라고 쓰지 않음.'),('첫 사진 원본','https://www.pexels.com/photo/close-up-photo-of-gaming-keyboard-2115257/','John Petalcurin. 실제 다운로드5860×3981. 하단 기준5:3 가로 크롭 후1500×900 JPG. 실제 각인·조명만 있으며 합성 글자 없음. 사진의 제품명·스위치 종류는 특정하지 않음.'),('사진 이용조건','https://www.pexels.com/license/','2026-11-05 확인. 무료 사용·편집 및 상업적 사용 사례 허용. 출처 표기는 의무가 아니지만 기재. 원본 그대로 판매·스톡 재배포·브랜드 보증 암시 금지. 기사 편집용 이미지로 사용.'),('공개 본편',url,'공개 페이지. 소리는 합성음,접점식 리니어 모형으로 한정. 랜딩에는 노출하지 않음.')]
notes='내부 편집 메모 — 송고 본문에 포함하지 않음\n\n카테고리 제안: IT·과학 계열의 기술·기기 항목(실제 CMS 분류명 확인 필요)\n본편 파일 발행일:2026-11-05 10:00 KST\n포털 CMS 예약:미등록. 사용자가 직접 송고·예약할 자료.\n\n'+'\n\n'.join(k+'\n'+u+'\n'+v for k,u,v in sources)
(r/'03_사진_출처와_검증.txt').write_text(notes,encoding='utf8')
(r/'05_AI이미지_제작기록.txt').write_text('도구: 기본 imagegen. 본편 실제 화면을 색·외관 참고로 사용.\n프롬프트: 아이보리·차콜 기계식 키보드와 리니어 스위치 한 개의 정렬된 분해 일러스트. 글자·라벨·로고 없는 기사용 가로 이미지. 두꺼운 곡면 키캡, 투명 상부 하우징, 빨간 십자 스템, 스프링과 금속 접점, 검은 하부 하우징.\n추가 수정: 키캡 아래를 돌출 십자가 아닌 암형 십자 소켓으로 고침. 설명용 AI 이미지이며 실물 설계도 아님.\n최종 생성 원본:exec-ab5c0bb2-2983-4edb-b334-4e42386281a8.png. JPG 변환 외 도형 합성 없음.\n',encoding='utf8')
photo=lambda f,c:'<figure><img src="'+f+'" alt="'+escape(c)+'"><figcaption>'+escape(c)+'</figcaption></figure>'
html='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>body{margin:0;background:#f3f3ef;color:#171b1b;font-family:Arial,"Malgun Gothic",sans-serif}main{max-width:760px;margin:auto;padding:36px 22px 60px;background:white}h1{font-size:30px;line-height:1.45;word-break:keep-all}.sub{color:#52605d}p{font-size:17px;line-height:1.95;word-break:keep-all}figure{margin:30px 0}img{width:100%;height:auto;display:block}figcaption{font-size:13px;line-height:1.75;color:#606b68;margin-top:12px}.memo{border-top:1px solid #ddd;margin-top:40px;padding-top:20px;font-size:13px}a{color:#006b78}pre{white-space:pre-wrap;font-size:12px;line-height:1.8}</style><main><h1>'+escape(title)+'</h1><p class="sub">'+escape(sub)+'</p>'+photo('02_대표사진_실사_무문구.jpg',cap1)+''.join('<p>'+escape(x)+'</p>' for x in lead)+photo('04_본문사진_AI_무문구.jpg',cap2)+''.join('<p>'+escape(x)+'</p>' for x in body)+'<p><a href="'+url+'">'+escape(cta)+'</a></p><p>크리에이티브 디렉터 = 안재현</p><aside class="memo"><b>내부 검증 메모 — 송고 제외</b><ul>'+''.join('<li><a href="'+u+'">'+escape(k)+'</a> — '+escape(v)+'</li>' for k,u,v in sources)+'</ul><b>말미 HTML 복사용</b><pre>'+escape(footer)+'</pre></aside></main></html>'
(r/'00_사진포함_미리보기.html').write_text(html,encoding='utf8')
for n in ['02_대표사진_실사_무문구.jpg','04_본문사진_AI_무문구.jpg']:
 im=Image.open(r/n);assert im.format=='JPEG';assert im.width>im.height;print(n,im.size)
with ZipFile(r/'키보드_포털출고자료.zip','w',ZIP_DEFLATED) as z:
 for p in sorted(r.iterdir()):
  if p.suffix in ['.txt','.html','.jpg'] and p.name!='source-photo.jpg':z.write(p,p.name)
print('Saved',r)
