from pathlib import Path
import shutil,re
root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
assets=root/'goodeasy/assets'
images={
 'landing-teasers-three.png':r'C:\Users\user\.codex\generated_images\01a16619-0fc3-7723-9a18-398e99f9eef7\exec-e6375c49-845e-42ff-8988-1a84584850db.png',
 'landing-teaser-camera.png':r'C:\Users\user\.codex\generated_images\01a16619-0fc3-7723-9a18-398e99f9eef7\exec-bf9a73e5-f3f2-4ec0-86fb-e3e0d2df6015.png'}
for name,source in images.items():shutil.copyfile(source,assets/name)
p=root/'goodeasy/index.html';s=p.read_text(encoding='utf8')
start=s.index('      <div class="series-heading">');end=s.index('\n    </section>',start)
s=s[:start]+'''      <div class="series-heading"><span>첫 번째 이야기와, 이어질 이야기들</span><span>01 — 05</span></div>
      <div class="chapter-cards" aria-label="공개한 이야기 하나와 공개 예정인 이야기 네 편">
        <a class="chapter-card is-live" href="piano/" aria-label="1편 피아노 직접 체험하기">
          <div class="chapter-art art-piano" aria-hidden="true"></div>
          <div class="chapter-top"><span>01 / PIANO</span><small>공개</small></div>
          <div class="chapter-copy"><span>피아노</span><h3>건반을<br>눌러볼까요?</h3><p>한 음이 나는 순간의 안쪽.</p><b aria-hidden="true">↗</b></div>
        </a>
        <article class="chapter-card is-upcoming" aria-label="2편 카메라, 공개 예정">
          <div class="chapter-art art-camera" aria-hidden="true"></div>
          <div class="chapter-top"><span>02 / CAMERA</span><small>공개 예정</small></div>
          <div class="chapter-copy"><span>카메라</span><h3>셔터를<br>눌러볼까요?</h3><p>빛이 사진 한 장으로 남기까지.</p></div>
        </article>
        <article class="chapter-card is-upcoming" aria-label="3편 기타, 공개 예정">
          <div class="chapter-art art-guitar" aria-hidden="true"></div>
          <div class="chapter-top"><span>03 / GUITAR</span><small>공개 예정</small></div>
          <div class="chapter-copy"><span>기타</span><h3>줄을<br>튕겨볼까요?</h3><p>줄의 길이가 바꾸는 소리.</p></div>
        </article>
        <article class="chapter-card is-upcoming" aria-label="4편 낚시 릴, 공개 예정">
          <div class="chapter-art art-reel" aria-hidden="true"></div>
          <div class="chapter-top"><span>04 / FISHING REEL</span><small>공개 예정</small></div>
          <div class="chapter-copy"><span>낚시 릴</span><h3>손잡이를<br>돌려볼까요?</h3><p>줄을 감는 두 가지 움직임.</p></div>
        </article>
        <article class="chapter-card is-upcoming" aria-label="5편 기계식 손목시계, 공개 예정">
          <div class="chapter-art art-watch" aria-hidden="true"></div>
          <div class="chapter-top"><span>05 / WATCH</span><small>공개 예정</small></div>
          <div class="chapter-copy"><span>기계식 손목시계</span><h3>태엽을<br>감아볼까요?</h3><p>감아둔 힘이 바늘을 움직입니다.</p></div>
        </article>
      </div>
      <p class="chapter-note">피아노부터 직접 만져보세요. 다음 이야기들은 한 편씩 공개합니다.</p>'''+s[end:]
s=s.replace('landing.css?v=20261026-lab1','landing.css?v=20261026-five1').replace('피아노 배경: AI 생성 일러스트','배경 이미지: AI 생성 일러스트')
p.write_text(s,encoding='utf8')
p=root/'goodeasy/assets/landing.css';s=p.read_text(encoding='utf8')
# Retire only the now-unused large story and camera-teaser layout rules.
start=s.index('.piano-story{');end=s.index('.footer{',start);s=s[:start]+s[end:]
s=re.sub(r'\.piano-story(?:-copy>?[^{}]*)?[^{}]*\{[^{}]*\}','',s)
s=re.sub(r'\.piano-story-image[^{}]*\{[^{}]*\}','',s)
start=s.index('\n.camera-teaser{');end=s.index('\n.signature .brand-lab',start);s=s[:start]+s[end:]
s+='''
.chapter-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px}.chapter-card{position:relative;display:block;min-width:0;height:330px;overflow:hidden;background:#181b18;border:1px solid #ffffff18;border-radius:4px;isolation:isolate}.chapter-art{position:absolute;inset:0;z-index:-2;background-repeat:no-repeat;background-color:#141713;transform:scale(1.015)}.chapter-art:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#090d0cf5 0%,#090d0cbb 25%,transparent 66%,#090d0c88)}.art-piano{background-image:url('landing-piano.png');background-size:cover;background-position:73% center}.art-camera{background-image:url('landing-teaser-camera.png');background-size:auto 100%;background-position:center}.art-guitar,.art-reel,.art-watch{background-image:url('landing-teasers-three.png');background-size:300% auto;background-position-y:28%}.art-guitar{background-position-x:left}.art-reel{background-position-x:center}.art-watch{background-position-x:right}.chapter-top{position:absolute;left:16px;right:16px;top:17px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;font-size:9px;line-height:1.5;letter-spacing:.07em}.chapter-top small{font-size:8px;padding:3px 5px;border:1px solid #ffffff2a;color:#c4c5bc;letter-spacing:0;white-space:nowrap}.chapter-copy{position:absolute;left:16px;right:16px;bottom:23px}.chapter-copy>span{font-size:10px;color:#d2ccbb}.chapter-copy h3{font-size:clamp(18px,1.65vw,25px);line-height:1.55;letter-spacing:-.045em;margin:9px 0 11px}.chapter-copy p{font-size:10px;line-height:1.8;max-width:90%;color:#a9afa1;margin:0}.chapter-copy>b{position:absolute;right:0;bottom:5px;border:1px solid #dfd7c482;border-radius:50%;display:grid;place-items:center;width:28px;height:28px;font:18px Arial}.is-live{border-color:#b69a6580}.is-live .chapter-top small{color:var(--gold);border-color:#b69a6580}.is-live .chapter-copy p{padding-right:24px;max-width:100%}.is-live:hover,.is-live:focus-visible{border-color:var(--gold)}.is-live:hover .chapter-copy>b{background:#d9c398;color:#111}.is-upcoming{color:#b5b9b1}.is-upcoming .chapter-art{filter:grayscale(1) blur(2.3px);opacity:.5;transform:scale(1.04)}.is-upcoming .chapter-copy>span,.is-upcoming .chapter-copy p{color:#929c8e}.chapter-note{font-size:10px;line-height:1.8;color:#8f9989;margin:20px 0 0}
@media(min-width:1400px){.chapter-card{height:355px}.chapter-top,.chapter-copy{left:20px;right:20px}}
@media(max-width:960px){.chapter-cards{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:clamp(175px,36vw,230px);overflow-x:auto;overflow-y:hidden;gap:14px;padding:4px 4px 12px;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#677361 #1b211a}.chapter-card{height:315px;scroll-snap-align:start}.chapter-copy h3{font-size:22px}.chapter-top{font-size:9px}.chapter-note{margin-top:12px}}
@media(max-width:650px){.chapter-cards{grid-auto-columns:clamp(175px,55vw,215px);gap:12px}.chapter-card{height:310px}.chapter-copy h3{font-size:21px}.chapter-top,.chapter-copy{left:15px;right:15px}.chapter-note{font-size:9px}}
'''
p.write_text(s,encoding='utf8')
p=root/'goodeasy/piano/index.html';s=p.read_text(encoding='utf8')
old='<small class="director">안재현의 굳이구지 연구소 · PIANO</small>'
new='<a class="piano-lab-signature" href="../" aria-label="안재현의 굳이구지 연구소"><img src="../../assets/menu-icon-goodeasy.svg" width="22" height="28" alt=""><span><small>안재현의</small><strong>굳이구지 <em>연구소</em></strong></span></a>'
assert s.count(old)==1;s=s.replace(old,new).replace('piano.css?v=20261026-lab1','piano.css?v=20261026-five1');p.write_text(s,encoding='utf8')
p=root/'goodeasy/piano/piano.css';s=p.read_text(encoding='utf8');s+='''
.piano-lab-signature{display:flex;align-items:center;gap:8px;color:#e1e1d5;flex:none}.piano-lab-signature>img{display:block;object-fit:contain;width:22px;height:28px}.piano-lab-signature>span{display:grid;gap:3px}.piano-lab-signature small{font-size:8px;letter-spacing:.03em;color:var(--muted)}.piano-lab-signature strong{font-size:12px;letter-spacing:-.04em;font-weight:500}.piano-lab-signature em{font-size:9px;letter-spacing:.08em;font-weight:400;font-style:normal;color:#a9b9ae;margin-left:4px}
@media(max-width:700px){.piano-lab-signature{gap:5px}.piano-lab-signature>img{width:18px;height:23px}.piano-lab-signature strong{font-size:11px}.piano-lab-signature small{font-size:7px}.piano-lab-signature em{font-size:8px;margin-left:3px}}
''';p.write_text(s,encoding='utf8')
(assets/'landing-teaser-credit.txt').write_text('Decorative teaser artwork: generated with the built-in image generation tool on 2026-10-26. Camera image and guitar/reel/watch contact sheet are illustrative backgrounds, not product photographs or mechanically verified diagrams. Request: cinematic amber-lit objects on charcoal, no typography or UI; displayed in grayscale with slight blur until release. Source images are preserved without raster editing. CSS displays individual panels.\n',encoding='utf8')
print('Installed five desktop cards (one active/four disabled), mobile horizontal scrolling, and visible piano-hero flask signature.')
