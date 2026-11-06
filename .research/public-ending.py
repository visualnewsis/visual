from pathlib import Path
import re, sys
root=Path(sys.argv[1])/'goodeasy'
notes={
'piano':('피아노','건반을 누른 뒤의 짧은 순간','손끝에서는 한 번의 누름이지만, 안에서는 해머가 움직이고 현이 울리고 댐퍼가 돌아옵니다. 그 짧은 순간을 멈춰서 볼 수 있도록 만들었습니다.','소리는 녹음이 아닌 합성음입니다. 작동 순서를 관찰하는 모형으로, 실제 악기의 치수·타건 세기·접촉력·공명을 재현하지 않습니다.'),
'guitar':('기타','줄 하나에서 시작한 소리','같은 줄도 어디를 짚느냐에 따라 소리가 달라집니다. 줄의 길이와 떨림, 몸통으로 이어지는 울림을 따로 살펴볼 수 있도록 구성했습니다.','소리는 합성음이며 현과 몸통의 실제 탄성·공명을 계산하지 않습니다. 비교 실험은 단순화한 조건을 사용합니다.'),
'fishing-reel':('낚시 릴','감는데, 왜 줄이 풀릴까요?','손잡이를 돌리는 일과 줄을 감는 일은 같은 회전이 아닙니다. 로터와 스풀을 따라가다가, 큰 힘이 걸렸을 때 줄을 놓아주는 드래그까지 살펴봤습니다.','기어비·장력·거리는 비교를 위한 가정입니다. 실제 제품의 성능이나 줄의 탄성·물속 저항·물고기의 움직임을 예측하지 않습니다.'),
'camera':('카메라','한순간에도 길이가 있습니다','셔터를 누르는 순간은 짧지만, 빛을 받아들이는 시간은 사진마다 다릅니다. 조리개와 셔터를 바꾸며 밝기와 움직임의 흔적을 비교하도록 만들었습니다.','사진은 가상 장면입니다. 실제 렌즈의 초점·회절·심도나 센서의 응답·노이즈를 계산하지 않습니다.'),
'watch':('기계식 시계','풀리는 힘으로 시간을 재는 일','태엽은 풀리려 하고, 시계는 그 힘을 조금씩 나눠 씁니다. 겹쳐 있던 부품을 열어 힘이 바늘까지 건너가는 길을 따라가도록 구성했습니다.','수동 감기 시계의 개념 모형입니다. 작동 시간과 분해 간격을 조정했으며 특정 칼리버의 치수·정밀 접촉·시간 오차를 재현하지 않습니다.'),
'violin':('바이올린','활이 지나간 자리에서','줄을 튕기는 대신 문지르면 어떤 일이 생길까요? 활과 현의 만남부터 브리지를 거쳐 몸통으로 이어지는 진동까지 살펴보는 데 집중했습니다.','소리는 합성음입니다. 활과 현의 마찰, 목재와 공기의 공명은 개념적으로 표현했으며 실제 악기의 측정값이나 음색을 재현하지 않습니다.'),
'projector':('필름 영사기','멈춘 사진이 움직여 보이기까지','필름은 계속 흘러가는 듯 보이지만, 빛 앞에서는 잠깐 멈춰야 합니다. 필름을 넘기는 때와 빛을 가리는 때를 나눠 볼 수 있도록 만들었습니다.','초기 영사 원리를 설명하는 개념 모형입니다. 프레임 수와 회전비는 시연용이며 특정 기종의 이송 기구·치수·광원 열을 재현하지 않습니다.'),
'keyboard':('기계식 키보드','바닥에 닿기 전에 입력되는 이유','손끝으로 느끼는 눌림과 글자가 찍히는 순간 사이에는 차이가 있습니다. 스위치 하나를 열어 스템·스프링·금속 접점이 맡은 일을 살펴봤습니다.','접점식 리니어 MX 계열의 개념 모형입니다. 2mm 입력·4mm 전체 이동은 비교 기준이며 제품별 금형·하중 곡선·펌웨어를 재현하지 않습니다. 소리는 합성 효과음입니다.'),
'espresso-machine':('에스프레소 머신','한 잔이 나오기 전, 물이 지나는 곳','잔에 떨어지는 커피보다 먼저 머신 안의 물길을 따라갔습니다. 물이 커피층을 만났을 때 흐름이 어떻게 달라지는지 비교할 수 있도록 만들었습니다.','유량·압력·추출량은 단순화한 비교값입니다. 실제 머신의 가열 과정이나 커피의 맛·크레마·추출 성능을 예측하지 않습니다.')}
for slug,(name,title,body,limits) in notes.items():
 p=root/slug/'index.html';s=p.read_text(encoding='utf8')
 match=re.search(r'<section\b[^>]*\bid="making"[\s\S]*?</section>',s);assert match,slug
 old=match.group(); links=re.findall(r'<a\b[^>]*href="https://[^>]+>[\s\S]*?</a>',old)
 links=[x for x in links if 'developer.mozilla.org' not in x]
 heading=' id="making-title"' if slug=='piano' else ''
 classes='making editorial-section' if slug=='piano' else 'making'
 new=f'<section class="{classes}" id="making" aria-labelledby="making-title"><div class="section-heading"><p class="eyebrow">제작 노트</p><h2 id="making-title">{title}</h2></div><div class="making-content"><p>{body}</p><details><summary>참고 자료와 체험의 범위</summary><p>{limits}</p><ul class="sources">'+''.join('<li>'+x+'</li>' for x in links)+'</ul></details></div></section>'
 s=s[:match.start()]+new+s[match.end():]
 s=re.sub(r'<a href="\.\./review/(?:#[^"]*)?">[\s\S]*?</a>','',s)
 s=s.replace('aria-label="개발 중인 아홉 편"','aria-label="굳이구지 다른 체험"')
 s=s.replace('이 페이지를 만든 과정 ↘','제작 노트 ↘')
 s=s.replace('3D·문장·조작 코드는 이 프로젝트에서 만들었습니다. 레퍼런스의 모델과 코드를 가져오지 않았습니다.','')
 s=s.replace('소리 비교 실험과 웹 제작 과정도 담았습니다.','소리 비교 실험도 담았습니다.').replace('소리 비교 실험과 웹 제작 과정.','소리 비교 실험.')
 if slug=='piano':
  s=s.replace('class="wordmark">굳이구지','class="wordmark"><small class="brand-byline">안재현의</small>굳이구지')
  s=s.replace('piano.css?v=20261024-2','piano.css?v=20261024-3')
 else:
  s=s.replace('<b>굳이구지</b>','<small class="brand-byline">안재현의</small><b>굳이구지</b>')
  s=s.replace('<b>굳이구지 究知</b>','<small class="brand-byline">안재현의</small><b>굳이구지 究知</b>')
  s=s.replace('lab.css?v=1','lab.css?v=20261024-2')
 s=s.replace('<p></p>','')
 p.write_text(s,encoding='utf8')
css='\n/* Quiet author byline above the series name. */\n.brand-byline{display:block;font-family:Arial,"Noto Sans KR",sans-serif;font-size:10px;font-weight:400;line-height:1.4;letter-spacing:.04em;color:var(--muted);margin:0 0 3px}.making details{margin-top:24px;font-size:12px;line-height:1.9}.making summary{cursor:pointer;color:var(--muted)}\n'
for p in [root/'assets/lab.css',root/'piano/piano.css']:
 p.write_text(p.read_text(encoding='utf8')+css,encoding='utf8')
print('Updated nine public endings and quiet author bylines; interaction code untouched.')
