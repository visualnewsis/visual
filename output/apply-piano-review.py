from pathlib import Path
import re, zipfile
from PIL import Image
root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
assets=root/'goodeasy/assets'
for stem,width in [('landing-piano',1672),('landing-teaser-camera',800),('landing-teasers-three',1600)]:
    with Image.open(assets/(stem+'.png')) as im:
        im.thumbnail((width,3000))
        im.convert('RGB').save(assets/(stem+'.webp'),'WEBP',quality=85,method=6)
p=root/'goodeasy/assets/landing.js'; s=p.read_text('utf-8')
s=s.replace("      return context;", "      if(context.state==='running')status.textContent=muted?'소리가 꺼져 있습니다.':'직접 연주 중 · 합성음';\n      return context;")
old="function up(id){const item=inputs.get(id);if(!item)return;inputs.delete(id);if(last&&last.midi===item.midi&&last.start===item.start){last.duration=Math.max(100,Math.min(1800,performance.now()-item.start));document.getElementById('piano-next').href='piano/?landing-note='+last.midi+'&duration='+Math.round(last.duration)+'#inside';}if([...inputs.values()].some(v=>v.midi===item.midi))return;"
new="function up(id){const item=inputs.get(id);if(!item)return;inputs.delete(id);if([...inputs.values()].some(v=>v.midi===item.midi))return;if(last&&last.midi===item.midi){last.duration=Math.max(100,Math.min(1800,performance.now()-last.start));document.getElementById('piano-next').href='piano/?landing-note='+last.midi+'&duration='+Math.round(last.duration)+'#inside';}"
assert old in s;s=s.replace(old,new)
s=s.replace("  const bed=document.getElementById", "  const artwork=document.querySelectorAll('[data-art]');\n  const reveal=el=>{el.style.backgroundImage='url(\"'+el.dataset.art+'\")';};\n  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){reveal(entry.target);observer.unobserve(entry.target);}}),{rootMargin:'160px'});artwork.forEach(el=>observer.observe(el));}else artwork.forEach(reveal);\n  const bed=document.getElementById")
p.write_text(s,'utf-8')
p=root/'goodeasy/index.html'; s=p.read_text('utf-8').replace('assets/landing-piano.png','assets/landing-piano.webp').replace('20261026-five1','20261026-review2')
for klass,stem in [('piano','landing-piano'),('camera','landing-teaser-camera'),('guitar','landing-teasers-three'),('reel','landing-teasers-three'),('watch','landing-teasers-three')]:
    s=s.replace(f'class="chapter-art art-{klass}"',f'class="chapter-art art-{klass}" data-art="assets/{stem}.webp"')
p.write_text(s,'utf-8')
p=assets/'landing.css';s=p.read_text('utf-8');s=re.sub(r"background-image:url\('landing-(?:piano|teaser-camera|teasers-three)\.png'\);",'',s);p.write_text(s,'utf-8')
p=root/'assets/visual-header.js';s=p.read_text('utf-8')
s=s.replace('    overlay.dataset.open="false";','    overlay.dataset.open="false";\n    overlay.setAttribute("aria-hidden","true");\n    overlay.inert=true;')
a=s.index('    const close=()=>');b=s.index('    button.addEventListener',a)
s=s[:a]+'''    const background=new Map();
    const restoreBackground=()=>{background.forEach((value,el)=>{el.inert=value});background.clear()};
    const close=()=>{header.dataset.open="false";overlay.dataset.open="false";button.setAttribute("aria-expanded","false");button.setAttribute("aria-label","전체 메뉴 열기");restoreBackground();button.focus({preventScroll:true});overlay.inert=true;overlay.setAttribute("aria-hidden","true")};
    const open=()=>{header.dataset.open="true";overlay.dataset.open="true";button.setAttribute("aria-expanded","true");button.setAttribute("aria-label","전체 메뉴 닫기");overlay.inert=false;overlay.setAttribute("aria-hidden","false");[...document.body.children,...header.querySelectorAll("a")].forEach(el=>{if(el===header||el===overlay||/^(SCRIPT|STYLE|LINK)$/.test(el.tagName))return;background.set(el,el.inert);el.inert=true});overlay.querySelector("a")?.focus({preventScroll:true})};
    const focusable=()=>[...overlay.querySelectorAll("a[href]"),button];
    document.addEventListener("focusin",event=>{if(header.dataset.open==="true"&&!overlay.contains(event.target)&&event.target!==button)focusable()[0]?.focus({preventScroll:true})});
    document.addEventListener("keydown",event=>{if(header.dataset.open!=="true"||event.key!=="Tab")return;const items=focusable(),index=items.indexOf(document.activeElement);event.preventDefault();items[(index+(event.shiftKey?-1:1)+items.length)%items.length]?.focus({preventScroll:true})});
''' + s[b:];p.write_text(s,'utf-8')
# Invalidate the shared script on its existing consumers; no other page content changes.
for p in root.rglob('*.html'):
    if any(part.startswith('.') for part in p.relative_to(root).parts):continue
    s=p.read_text('utf-8');n=re.sub(r'(visual-header\.js\?v=)[^"\s>]+',r'\g<1>20261026-review2',s)
    if n!=s:p.write_text(n,'utf-8')
portal=Path(r'C:\Users\user\Documents\editshop\output\goodeasy-piano-release-20261025')
caption='피아노 건반. 건반을 누르면 내부의 해머가 현을 때리고, 손을 떼면 댐퍼가 진동을 줄인다. 사진은 일반 피아노 건반 자료사진으로, 체험 속 그랜드피아노 모형과는 다르다. (사진=Tama66/Pixabay)'
ai='피아노의 건반과 내부를 표현한 이미지로, 실제 악기의 구조와는 차이가 있다. 해당 이미지는 기사의 이해를 돕기 위해 AI 생성 후 가공 및 편집함. [그래픽=뉴시스]'
p=portal/'01_포털_출고원고.txt';s=p.read_text('utf-8');s=s.replace('<a href="https://visual.newsis.com/goodeasy/piano/">비주얼 뉴시스에서 피아노를 직접 연주하고 안쪽의 움직임을 살펴보세요. (https://visual.newsis.com/goodeasy/piano/)</a>','<a href="https://visual.newsis.com/goodeasy/piano/">\n◆ 비주얼 뉴시스에서 피아노를 직접 연주하고 안쪽의 움직임을 살펴보세요. https://visual.newsis.com/goodeasy/piano/\n</a>')
s=s.replace('하단 링크는 기존 포털 원고의 안내 문장 + 괄호 안 실제 URL을 하나의 a 태그로 감싸는 형식을 적용했다. 임의의 화살표 링크나 별도 관련 링크 형식으로 바꾸지 않는다.','하단 링크는 ◆ 안내 문장과 실제 URL을 하나의 a 태그로 감싼 확정 양식이다. URL에 괄호를 붙이지 않는다.')
s=re.sub(r'(3\. 첫 사진은 02_대표사진_실사_무문구\.jpg\. 캡션: ).*',lambda m:m[1]+caption,s);p.write_text(s,'utf-8')
p=portal/'03_사진_출처와_캡션.txt';s=p.read_text('utf-8');s+='\n본문 두 번째 사진 — 확정 캡션\n파일: 04_본문사진_AI_무문구.png\n'+ai+'\n';p.write_text(s,'utf-8')
p=portal/'00_배포와검수.txt';s=p.read_text('utf-8');s='2026-10-26 수정본 안내\n원고 하단 링크와 두 사진 캡션을 확정 양식으로 통일했습니다. 이 묶음의 코드 수정본은 배포 후 실제 URL 검증 전까지 공개 반영 완료로 보지 않습니다. 아래 배포 내역은 이전 버전의 기록입니다.\n\n'+s;p.write_text(s,'utf-8')
with zipfile.ZipFile(portal/'피아노_출고자료.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in ['00_배포와검수.txt','01_포털_출고원고.txt','02_대표사진_실사_무문구.jpg','03_사진_출처와_캡션.txt','04_본문사진_AI_무문구.png']:z.write(portal/name,name)
print('Updated source and portal package')
for p in assets.glob('landing*.webp'):print(p.name,p.stat().st_size)
