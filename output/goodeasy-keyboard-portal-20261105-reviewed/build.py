from pathlib import Path
from PIL import Image
from html import escape
from zipfile import ZipFile,ZIP_DEFLATED
import json
r=Path(r'C:\Users\user\Documents\editshop\output\goodeasy-keyboard-portal-20261105-reviewed')
im=Image.open(r/'source-photo.jpg').convert('RGB');w,h=im.size;ch=round(w*3/5);top=h-ch;im.crop((0,top,w,h)).resize((1500,900),Image.Resampling.LANCZOS).save(r/'02_대표사진_실사_무문구.jpg',quality=95)
ai=Image.open(r'C:\Users\user\.codex\generated_images\01a16619-0fc3-7723-9a18-398e99f9eef7\exec-a79f52cc-54ff-4787-89f1-644fcaf55bca.png').convert('RGB');ai.save(r/'04_본문사진_AI_무문구.jpg',quality=95)
title='두드려라, 그러면 글자가 될 것이다…키보드는 어떤 원리? [굳이구지]'
sub='키캡 아래 스템·스프링·접점…한 글자가 입력되기까지'
cap1='조명이 켜진 기계식 키보드. (사진=John Petalcurin/Pexels)'
cap2='키캡 하나를 벗긴 기계식 키보드를 표현한 이미지로, 자판 배열과 구조는 실제 기기와 차이가 있다. 해당 이미지는 기사의 이해를 돕기 위해 AI 생성 후 가공 및 편집함. [그래픽=뉴시스]'
lead=['[서울=뉴시스] 안재현 기자 = “우리의 필기도구도 우리의 생각에 한몫한다.”', '타자기를 쓰던 니체가 1882년 편지에 남긴 말이다. 종이에 활자를 찍는 타자기와 달리, 키보드는 컴퓨터에 키 입력 신호를 보낸다. 키캡 아래에서 그 신호는 어떻게 만들어질까.']
body=['금속 접점을 쓰는 기계식 스위치에는 키캡을 받치는 스템과 코일 스프링이 들어 있다. 키캡을 누르면 스템이 스프링을 누르며 내려가고, 일정 거리에 이르면 금속 접점이 닫힌다. 키보드는 이 변화를 읽어 어떤 키가 눌렸는지 컴퓨터에 알린다.', '체리 MX2A 레드 스위치는 2㎜ 눌리면 접점이 닫히고, 끝까지 눌리는 거리는 4㎜다. 스위치가 끝까지 눌리기 전에 입력된다는 뜻이다. 이 거리는 제품마다 다르다. 손가락을 떼면 스프링이 스템과 키캡을 밀어 올리고 접점도 다시 떨어진다.', '접점은 닿거나 떨어질 때 짧게 여러 번 붙었다 떨어지기도 한다. 이 신호를 그대로 읽으면 한 번 누른 키가 여러 번 입력될 수 있다. 키보드 펌웨어는 보통 이런 접점 튐을 걸러 한 번의 입력으로 처리한다. 이를 디바운싱이라고 한다.', '키보드가 보내는 것은 글자 자체가 아니라 어떤 키가 눌렸는지를 알리는 신호다. 컴퓨터는 자판 설정과 입력 방식에 따라 이를 처리한다. 같은 키를 눌러도 한글·영문 입력 상태나 시프트 키를 함께 눌렀는지에 따라 다른 글자가 나오는 이유다.', '비주얼 뉴시스 ‘안재현의 굳이구지 연구소’ 키보드편에서는 누른 깊이를 조절하며 스템과 스프링, 접점의 움직임을 볼 수 있다. 스프링 강성을 바꾸면 스프링이 밀어 올리는 힘이 어떻게 달라지는지, 접점 튐이 한 번의 입력으로 정리되는 과정도 확인할 수 있다.', '체험에는 접점식 리니어 스위치의 개념 모형을 썼다. 2㎜ 입력·4㎜ 전체 이동은 비교 기준이며, 특정 제품의 하중 곡선이나 펌웨어를 재현하지 않는다. 타건 소리는 합성 효과음이다.']
url='https://visual.newsis.com/goodeasy/keyboard/'
cta='◆ 비주얼 뉴시스에서 직접 타이핑하고, 키캡 아래 스위치를 펼쳐 글자가 입력되는 과정을 살펴보세요. '+url
footer='<a href="'+url+'">\n'+cta+'\n</a>'
text='제목\n'+title+'\n\n부제\n'+sub+'\n\n[첫 번째 사진 삽입: 02_대표사진_실사_무문구.jpg]\n'+cap1+'\n\n'+'\n\n'.join(lead)+'\n\n[본문 두 번째 사진 삽입: 04_본문사진_AI_무문구.jpg]\n'+cap2+'\n\n'+'\n\n'.join(body)+'\n\n'+footer+'\n\n크리에이티브 디렉터 = 안재현\n'
(r/'01_포털_출고원고.txt').write_text(text,encoding='utf8')
sources=[('키 입력과 문자 처리','https://docs.qmk.fm/how_keyboards_work','키보드는 문자 자체가 아닌 키 입력을 보내며 운영체제가 자판 배열에 따라 처리함. 공식 문서 확인.'),('명언·1882년 편지','https://german.princeton.edu/node/2345','니체의 독일어 문장과 1882년2월 편지 맥락 확인. 본편과 같은 한국어 번역. 현대 기계식 스위치를 평가한 발언으로 쓰지 않음.'),('타자기 소장기관·인용','https://www.klassik-stiftung.de/startseite/digital/sammlungshighlights/friedrich-nietzsches-schreibkugel/','본편 출처. 직접 열기는 시간 초과였으나 공식 도메인의 검색 본문에서 원문 인용 확인. 소장기관 별도 100 Schätze 페이지에서 니체의 타자기 사용 맥락 확인.'),('구조와 이동 거리','https://www.cherry.de/en-gb/product/mx2a-red','공식 제품 페이지:2mm 입력 전 이동,4mm 전체 이동,스템·스프링·접점. 모든 키보드로 일반화하지 않음.'),('접점 튐과 디바운스','https://docs.qmk.fm/feature_debounce_type','공식 문서:접점의 복수 전이와 다양한 소프트웨어 처리 방식. 하나의 고정 대기 시간이 모든 키보드의 방식이라고 쓰지 않음.'),('첫 사진 원본','https://www.pexels.com/photo/close-up-photo-of-gaming-keyboard-2115257/','John Petalcurin. 실제 다운로드5860×3981. 하단 기준5:3 가로 크롭 후1500×900 JPG. 실제 각인·조명만 있으며 합성 글자 없음. 사진의 제품명·스위치 종류는 특정하지 않음.'),('사진 이용조건','https://www.pexels.com/license/','2026-11-05 확인. 무료 사용·편집 및 상업적 사용 사례 허용. 출처 표기는 의무가 아니지만 기재. 원본 그대로 판매·스톡 재배포·브랜드 보증 암시 금지. 기사 편집용 이미지로 사용.'),('공개 본편',url,'공개 페이지. 소리는 합성음,접점식 리니어 모형으로 한정. 랜딩에는 노출하지 않음.')]
notes='내부 편집 메모 — 송고 본문에 포함하지 않음\n\n카테고리 제안: IT·과학 계열의 기술·기기 항목(실제 CMS 분류명 확인 필요)\n본편 파일 발행일:2026-11-05 10:00 KST\n포털 CMS 예약:미등록. 사용자가 직접 송고·예약할 자료.\n\n'+'\n\n'.join(k+'\n'+u+'\n'+v for k,u,v in sources)
(r/'03_사진_출처와_검증.txt').write_text(notes,encoding='utf8')
(r/'05_AI이미지_제작기록.txt').write_text('도구: 기본 imagegen. 본편 실제 화면을 색·외관 참고로 사용.\n프롬프트: GPT 재검수에서 부정확한 접점 분해도 지적을 채택. 아이보리·차콜 키보드에서 키캡 하나만 벗겨 빨간 스템이 보이는 조립 상태로 이미지 교체. 글자·라벨·로고 없음.\n추가 수정: 떠 있는 부품·스프링·금속 접점 표현을 제거. 키캡은 책상 위에 두고 스위치는 키보드에 장착된 상태. 설명용 AI 이미지이며 실물 설계도 아님.\n최종 생성 원본:exec-a79f52cc-54ff-4787-89f1-644fcaf55bca.png. JPG 변환 외 도형 합성 없음.\n',encoding='utf8')
photo=lambda f,c:'<figure><img src="'+f+'" alt="'+escape(c)+'"><figcaption>'+escape(c)+'</figcaption></figure>'
html='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>body{margin:0;background:#f3f3ef;color:#171b1b;font-family:Arial,"Malgun Gothic",sans-serif}main{max-width:760px;margin:auto;padding:36px 22px 60px;background:white}h1{font-size:30px;line-height:1.45;word-break:keep-all}.sub{color:#52605d}p{font-size:17px;line-height:1.95;word-break:keep-all}figure{margin:30px 0}img{width:100%;height:auto;display:block}figcaption{font-size:13px;line-height:1.75;color:#606b68;margin-top:12px}.memo{border-top:1px solid #ddd;margin-top:40px;padding-top:20px;font-size:13px}a{color:#006b78}pre{white-space:pre-wrap;font-size:12px;line-height:1.8}</style><main><h1>'+escape(title)+'</h1><p class="sub">'+escape(sub)+'</p>'+photo('02_대표사진_실사_무문구.jpg',cap1)+''.join('<p>'+escape(x)+'</p>' for x in lead)+photo('04_본문사진_AI_무문구.jpg',cap2)+''.join('<p>'+escape(x)+'</p>' for x in body)+'<p><a href="'+url+'">'+escape(cta)+'</a></p><p>크리에이티브 디렉터 = 안재현</p><aside class="memo"><b>내부 검증 메모 — 송고 제외</b><ul>'+''.join('<li><a href="'+u+'">'+escape(k)+'</a> — '+escape(v)+'</li>' for k,u,v in sources)+'</ul><b>말미 HTML 복사용</b><pre>'+escape(footer)+'</pre></aside></main></html>'
(r/'00_사진포함_미리보기.html').write_text(html,encoding='utf8')
for n in ['02_대표사진_실사_무문구.jpg','04_본문사진_AI_무문구.jpg']:
 im=Image.open(r/n);assert im.format=='JPEG';assert im.width>im.height;print(n,im.size)
with ZipFile(r/'키보드_포털출고자료.zip','w',ZIP_DEFLATED) as z:
 for p in sorted(r.iterdir()):
  if p.suffix in ['.txt','.html','.jpg'] and p.name!='source-photo.jpg':z.write(p,p.name)
print('Saved',r)
