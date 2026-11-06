from pathlib import Path
import re,json

root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop\goodeasy')
css=root/'assets/research.css'
s=css.read_text(encoding='utf-8')
s+='''
/* Keep research copy and controls inside the same readable mobile gutter. */
.research-section,.research-chapter,.research-head>div,.research-controls>label{min-width:0}
.research-section .research-index a{max-width:100%;box-sizing:border-box;overflow-wrap:anywhere}
.research-controls input[type=range],.research-controls select{min-width:0;max-width:100%;box-sizing:border-box}
@media(max-width:700px){
  .inside.research-section{padding:40px 24px 20px}
  .research-chapter h3,.research-intro,.research-caption,.research-limits{overflow-wrap:anywhere;word-break:keep-all}
  .research-controls>label{flex:1 1 125px}
}
'''
css.write_text(s,encoding='utf-8')
for p in root.glob('*/index.html'):
 s=p.read_text(encoding='utf-8')
 s=re.sub(r'(research\.css\?v=)[^"\s]+',r'\g<1>20261024-layout1',s)
 if p.parent.name!='review':p.write_text(s,encoding='utf-8')

p=root/'review/index.html'
s=p.read_text(encoding='utf-8'); head=s.split('</head>')[0]
title='안재현의 굳이구지 · 모든 실험'
desc='건반을 누르고, 줄을 튕기고, 태엽을 감아보세요. 직접 만져보며 사물의 작동 원리를 살펴보는 아홉 가지 실험.'
head=re.sub(r'<title>.*?</title>',f'<title>{title}</title>',head)
head=re.sub(r'(<meta (?:name="(?:description|twitter:description)"|property="og:description") content=")[^"]*',lambda m:m[1]+desc,head)
head=re.sub(r'(<meta (?:name="twitter:title"|property="og:title") content=")[^"]*',lambda m:m[1]+title,head)
head=re.sub(r'(<meta (?:name="twitter:image"|property="og:image") content=")[^"]*',lambda m:m[1]+'https://visual.newsis.com/goodeasy/design/research-actual/watch-mobile.png',head)
episodes=[
 ('piano','피아노','건반을 눌러볼까요?','건반에서 해머와 현까지, 한 음이 나는 과정을 살펴봅니다.'),
 ('guitar','기타','줄을 튕겨볼까요?','줄의 길이와 진동이 소리를 어떻게 바꾸는지 비교합니다.'),
 ('fishing-reel','낚시 릴','손잡이를 돌려볼까요?','로터와 스풀이 움직이며 줄을 감는 과정을 살펴봅니다.'),
 ('camera','카메라','사진을 찍어볼까요?','조리개와 셔터가 빛을 조절하는 방식을 살펴봅니다.'),
 ('watch','기계식 손목시계','태엽을 감아볼까요?','무브먼트를 펼치고, 태엽의 힘이 바늘까지 가는 길을 따라갑니다.'),
 ('violin','바이올린','활을 그어볼까요?','활과 현이 만나는 곳에서 시작된 진동을 살펴봅니다.'),
 ('projector','필름 영사기','필름을 돌려볼까요?','멈췄다 움직이는 필름과 셔터의 타이밍을 맞춰봅니다.'),
 ('keyboard','기계식 키보드','키를 눌러볼까요?','스위치를 펼쳐 스템, 스프링, 접점의 움직임을 살펴봅니다.'),
 ('espresso-machine','에스프레소 머신','커피를 내려볼까요?','물과 열, 압력이 커피를 지나는 경로를 살펴봅니다.')]
ld={'@context':'https://schema.org','@type':'CollectionPage','name':title,'url':'https://visual.newsis.com/goodeasy/review/','inLanguage':'ko','mainEntity':{'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i,'name':e[1],'url':f'https://visual.newsis.com/goodeasy/{e[0]}/'} for i,e in enumerate(episodes,1)]}}
head=re.sub(r'<script type="application/ld\+json">.*?</script>','<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False)+'</script>',head)
head+='''<style>
.collection-header{gap:20px}.collection-brand{display:grid;gap:4px;text-decoration:none}.collection-brand small{font-size:10px;color:var(--muted);letter-spacing:.03em}.collection-brand b{font-size:20px}.collection-header>a:last-child{font-size:11px;color:var(--muted)}
.review-list{margin:70px auto 90px}.collection-intro{padding-bottom:35px}.collection-intro h1{font-size:clamp(30px,5vw,48px);font-weight:400;letter-spacing:-.05em;line-height:1.5;margin:18px 0 24px}.collection-intro>p:last-child{max-width:550px;font-size:14px;color:var(--muted);line-height:1.9}.review-list .episode{grid-template-columns:38px 1fr 24px;padding:26px 0;gap:18px}.episode-number{font-size:11px;color:var(--gold)}.episode-copy{min-width:0}.episode-copy strong{display:block;font-size:21px;font-weight:400;margin-bottom:9px}.episode-copy em{display:block;font-size:13px;font-style:normal;margin-bottom:7px}.episode-copy small{display:block;font-size:12px;line-height:1.8}.episode-arrow{color:var(--gold);font-size:22px}.episode:focus-visible{outline:1px solid var(--gold);outline-offset:6px}.collection-footer p{line-height:1.8}.collection-footer small{display:block;font-size:10px;margin-bottom:6px}
@media(max-width:700px){.review-list{margin:40px auto 60px;padding:0 24px}.collection-intro{padding-bottom:20px}.collection-intro>p:last-child{font-size:12px}.review-list .episode{grid-template-columns:25px minmax(0,1fr) 20px;gap:12px}.review-list .episode small{grid-column:auto}.episode-copy strong{font-size:19px}.episode-copy em{font-size:12px}.episode-copy small{font-size:11px}.collection-header>a:last-child{font-size:10px}}
</style>'''
body='''</head><body><header class="collection-header"><a class="collection-brand" href="./"><small>안재현의</small><b>굳이구지</b></a><a href="../piano/">건반부터 눌러보기 ↗</a></header>
<main class="review-list"><div class="collection-intro"><p class="eyebrow">GOODEASY · 모든 실험</p><h1>이런 걸 왜 굳이?<br>굳이? 싶은 걸 연구합니다.</h1><p>건반을 누르고, 줄을 튕기고, 태엽을 감아보세요.<br>손끝에서 시작된 움직임이 안에서 어떻게 이어지는지 살펴봅니다.</p></div>
<nav aria-label="아홉 가지 실험">'''
for i,(slug,name,action,detail) in enumerate(episodes,1):
 body+=f'<a class="episode" href="../{slug}/"><span class="episode-number">{i:02}</span><div class="episode-copy"><strong>{name}</strong><em>{action}</em><small>{detail}</small></div><span class="episode-arrow" aria-hidden="true">↗</span></a>\n'
body+='''</nav></main><footer class="collection-footer"><div><small>안재현의</small><b>굳이구지 究知</b><p>이런 걸 왜 굳이?<br>굳이? 싶은 걸 연구합니다.</p></div><div>크리에이티브 디렉터 = 안재현</div></footer></body></html>'''
p.write_text(head+body,encoding='utf-8')
print('Updated research gutters and nine-episode collection; retained existing analytics and indexing policy.')
