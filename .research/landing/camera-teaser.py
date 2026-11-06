from pathlib import Path
import re,json
root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
base=root/'goodeasy'
p=base/'index.html';s=p.read_text(encoding='utf8')
needle='      </article>\n    </section>'
teaser='''      </article>
      <article class="camera-teaser" aria-labelledby="camera-teaser-title" aria-describedby="camera-teaser-status">
        <div class="camera-teaser-image" aria-hidden="true"><img src="assets/landing-camera-teaser.svg" width="800" height="480" alt="" loading="lazy"></div>
        <div class="camera-teaser-copy"><p class="eyebrow">NEXT / 02 <span>CAMERA</span></p><h3 id="camera-teaser-title">다음은, 카메라입니다.</h3><p>셔터를 누르는 순간,<br>카메라 안에서는 무슨 일이 일어날까요?</p><span class="coming-soon" id="camera-teaser-status">공개 예정</span></div>
      </article>
    </section>'''
assert s.count(needle)==1;s=s.replace(needle,teaser).replace('landing.css?v=20261025-1','landing.css?v=20261025-2')
p.write_text(s,encoding='utf8')
p=base/'assets/landing.css';s=p.read_text(encoding='utf8')
s+='''
.camera-teaser{display:grid;grid-template-columns:1.35fr 1fr;gap:7%;align-items:center;margin-top:55px;padding-top:40px;border-top:1px solid var(--line);color:#a1a39e}.camera-teaser-image{aspect-ratio:2;overflow:hidden;background:radial-gradient(ellipse at center,#30322e,#151713 75%);border:1px solid #ffffff0c}.camera-teaser-image img{display:block;width:100%;height:100%;object-fit:contain;filter:grayscale(1) blur(4px);opacity:.43;transform:scale(.94)}.camera-teaser-copy .eyebrow{font-size:10px;color:#a4a89d;letter-spacing:.12em}.camera-teaser-copy .eyebrow span{font-size:9px;color:#82897c}.camera-teaser-copy h3{font-size:clamp(23px,2.2vw,31px);font-weight:400;letter-spacing:-.05em;line-height:1.6;margin:16px 0}.camera-teaser-copy>p:not(.eyebrow){font-size:12px;line-height:1.9;color:#868e80}.coming-soon{display:inline-block;margin-top:13px;padding:7px 13px;border:1px solid #ffffff27;border-radius:2px;color:#a0a797;font-size:10px;letter-spacing:.08em}
@media(max-width:1050px){.camera-teaser{gap:5%}}
@media(max-width:650px){.camera-teaser{grid-template-columns:1fr;gap:18px;margin-top:35px;padding-top:30px}.camera-teaser-image{aspect-ratio:2.1}.camera-teaser-copy h3{font-size:25px;margin:10px 0}.camera-teaser-copy>p:not(.eyebrow){font-size:11px}.coming-soon{margin-top:8px}}
'''
p.write_text(s,encoding='utf8')
order=[('piano','피아노'),('camera','카메라'),('guitar','기타'),('fishing-reel','낚시 릴'),('watch','기계식 손목시계'),('violin','바이올린'),('projector','필름 영사기'),('keyboard','기계식 키보드'),('espresso-machine','에스프레소 머신')]
for slug,title in order:
 p=base/slug/'index.html';s=p.read_text(encoding='utf8')
 if slug=='camera':s=s.replace('04 · CAMERA','02 · CAMERA')
 if slug=='guitar':s=s.replace('02 · GUITAR','03 · GUITAR')
 if slug=='fishing-reel':s=s.replace('03 · FISHING','04 · FISHING')
 def nav(match):
  opening=match.group().split('>',1)[0]+'>'
  return opening+''.join(f'<a href="../{key}/"'+(' aria-current="page"' if key==slug else '')+f'>{i:02d} {label}</a>' for i,(key,label) in enumerate(order,1))+'</nav>'
 s=re.sub(r'<nav class="review-nav"[^>]*>.*?</nav>',nav,s,flags=re.S)
 p.write_text(s,encoding='utf8')
p=base/'review/index.html';s=p.read_text(encoding='utf8')
items={}
for key,label in order:
 m=re.search(r'<a class="episode" href="../'+re.escape(key)+r'/">.*?</a>',s,re.S)
 assert m,key
 items[key]=m.group()
start=s.index('<nav aria-label="아홉 가지 실험">');end=s.index('</nav>',start)
prefix='<nav aria-label="아홉 가지 실험">'
s=s[:start]+prefix+'\n'.join(re.sub(r'(<span class="episode-number">)\d+',lambda m:m.group(1)+f'{i:02d}',items[key]) for i,(key,label) in enumerate(order,1))+s[end:]
def ld(match):
 obj=json.loads(match.group(1));obj['mainEntity']['itemListElement']=[{'@type':'ListItem','position':i,'name':label,'url':f'https://visual.newsis.com/goodeasy/{key}/'} for i,(key,label) in enumerate(order,1)]
 return '<script type="application/ld+json">'+json.dumps(obj,ensure_ascii=False)+'</script>'
s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',ld,s,flags=re.S);p.write_text(s,encoding='utf8')
p=base/'README.md';s=p.read_text(encoding='utf8');s=s.replace('현재 순서: 피아노 / 기타 / 낚시 릴 / 카메라 /','현재 순서: 피아노 / 카메라 / 기타 / 낚시 릴 /')
s+='\n## 2026-10-25 공개 편성\n사용자 승인: 01 피아노, 02 카메라, 03 기타, 04 낚시 릴, 05 기계식 손목시계, 06 바이올린, 07 필름 영사기, 08 기계식 키보드, 09 에스프레소 머신. 기존 순서 기록은 이 지시 이전 이력이다.\n/goodeasy/ 랜딩에는 피아노 본편과 링크 없는 회색·흐림 카메라 예고만 표시한다. 나머지 편은 랜딩에서 노출하지 않는다. 랜딩은 noindex 미리보기로 운영하며 메인 랜딩과 공용 메뉴에 추가하지 않는다.\n'
p.write_text(s,encoding='utf8')
print('Piano live + non-clickable gray camera teaser; camera moved to episode 02, other relative order preserved.')
