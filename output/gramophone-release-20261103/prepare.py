from pathlib import Path
import re,json,shutil
from PIL import Image
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(r'C:\Users\user\Documents\editshop\output\gramophone-release-20261103');thumb=out/'thumbnail';thumb.mkdir(exist_ok=True)
a=Image.open(r'C:\Users\user\.codex\generated_images\01a16619-0fc3-7723-9a18-398e99f9eef7\exec-f92ec295-fd03-42bf-aac0-72921367607b.png').convert('RGB')
a.save(thumb/'gramophone-site-thumbnail-large.jpg',quality=95);a=a.resize((360,240),Image.Resampling.LANCZOS);a.save(thumb/'gramophone-site-thumbnail-360x240.jpg',quality=95);a.crop((0,0,360,203)).save(thumb/'mobile-top-crop.jpg',quality=95);a.crop((0,18,360,221)).save(thumb/'mobile-center-crop.jpg',quality=95)
shutil.copyfile(r'C:\Users\user\Documents\editshop\output\goodeasy-portals-20261102-03\gramophone\04_본문사진_AI_무문구.jpg',r/'goodeasy/gramophone/share.jpg')
shutil.copyfile(thumb/'gramophone-site-thumbnail-360x240.jpg',r/'goodeasy/gramophone/site-thumbnail.jpg')
p=r/'goodeasy/gramophone/index.html';s=p.read_text(encoding='utf-8').replace('noindex,nofollow','index,follow,max-image-preview:large').replace('https://visual.newsis.com/assets/logo2024.png','https://visual.newsis.com/goodeasy/gramophone/share.jpg').replace('name="twitter:card" content="summary"','name="twitter:card" content="summary_large_image"')
s=s.replace('<meta name="twitter:card"','<meta property="og:image:alt" content="원반식 축음기의 레코드와 나팔을 표현한 AI 생성 이미지. 실제 기기의 구조와는 차이가 있습니다."><meta name="twitter:card"',1)
def ld(m):
 d=json.loads(m[1]);d.update(creativeWorkStatus='Published',datePublished='2026-11-03T10:00:00+09:00',image='https://visual.newsis.com/goodeasy/gramophone/share.jpg',author={'@type':'Person','name':'안재현'},publisher={'@type':'NewsMediaOrganization','name':'뉴시스','url':'https://www.newsis.com/'});return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False)+'</script>'
s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',ld,s);p.write_text(s,encoding='utf-8')
p=r/'goodeasy/index.html';s=p.read_text(encoding='utf-8');s=s.replace('한 땀을 박고 재봉틀의 안쪽을 살펴보세요. 피아노·카메라·기타·낚시 릴·시계도 함께 체험할 수 있습니다.','바늘을 내려 축음기의 소리를 듣고 안쪽을 살펴보세요. 피아노·카메라·기타·낚시 릴·시계·재봉틀도 함께 체험할 수 있습니다.').replace('sewing-machine/share.jpg','gramophone/share.jpg').replace('재봉틀의 바늘과 내부를 표현한 AI 생성 일러스트','원반식 축음기의 레코드와 나팔을 표현한 AI 생성 이미지').replace('한 땀을 박아 재봉틀의 안쪽을 살펴보세요.','레코드에 바늘을 내려 축음기의 안쪽을 살펴보세요.').replace('assets/landing-sewing','assets/landing-gramophone').replace('20261102-release1','20261103-release1').replace('class="landing-sewing"','class="landing-gramophone"').replace('#landing-stitch','\x23landing-needle').replace('한 땀 박기로 건너뛰기','바늘 내리기로 건너뛰기').replace('06 <span>SEWING MACHINE</span>','07 <span>GRAMOPHONE</span>').replace('한 땀 박아볼까요?','바늘을 내려볼까요?').replace('아래 버튼으로 바늘땀을 남겨보세요.','레코드 위에 바늘을 내려보세요.')
start=s.index('      <div class="sewing-preview"');end=s.index('      <a class="down"',start)
s=s[:start]+'''      <div class="gramophone-preview" aria-label="직접 소리를 듣는 축음기">
        <canvas id="landing-gramophone-canvas" role="img" aria-label="레코드와 바늘, 나팔이 연결된 원반식 축음기 모형"></canvas>
      </div>
      <div class="playable gramophone-tools">
        <button id="landing-needle" type="button">바늘 내리기</button>
        <button id="landing-reset" type="button">처음부터 듣기</button>
        <p id="gramophone-status" role="status">바늘을 내리면 레코드가 돌고 소리가 납니다.</p>
        <p class="gramophone-scope">24초 체험 선율 · 합성음 · 횡진동 원반식 모형</p><p class="gramophone-audio">소리가 납니다. 스피커를 켜거나 이어폰을 사용해 주세요.</p>
      </div>
      <a class="hero-next" href="gramophone/#opening-quote"><span>레코드의 홈은 어떻게 소리가 될까요?</span><strong>축음기 파헤쳐보기 <b aria-hidden="true">↗</b></strong></a>
'''+s[end:]
s=s.replace('한 땀을 박고, 태엽과 릴을 감고, 줄과 건반·셔터를 만져보세요.','바늘을 내리고, 한 땀을 박고, 태엽과 릴을 감아보세요.').replace('01 — 06','01 — 07').replace('공개한 이야기 여섯 편','공개한 이야기 일곱 편').replace('피아노·카메라·기타·낚시 릴·시계·재봉틀을 직접 만져보세요.','피아노·카메라·기타·낚시 릴·시계·재봉틀·축음기를 직접 만져보세요.')
# Restore sewing card image after hero-wide source replacement.
s=s.replace('class="chapter-art art-sewing" data-art="gramophone/share.jpg"','class="chapter-art art-sewing" data-art="sewing-machine/share.jpg"')
end=s.index('      </div>\n      <p class="chapter-note">')
s=s[:end]+'''        <a class="chapter-card is-live" href="gramophone/" aria-label="7편 축음기 직접 체험하기">
          <div class="chapter-art art-gramophone" data-art="gramophone/share.jpg" aria-hidden="true"></div>
          <div class="chapter-top"><span>07 / GRAMOPHONE</span><small>공개</small></div>
          <div class="chapter-copy"><span>축음기</span><h3>바늘을<br>내려볼까요?</h3><p>레코드의 홈에서 나팔까지.</p><b aria-hidden="true">↗</b></div>
        </a>
'''+s[end:];s=s.replace('릴과 태엽을 감고 한 땀을 박으며','릴과 태엽을 감고 한 땀을 박고 레코드를 들으며');p.write_text(s,encoding='utf-8')
p=r/'goodeasy/check.py';s=p.read_text(encoding='utf-8').replace("'watch','sewing-machine'","'watch','sewing-machine','gramophone'").replace("'https://visual.newsis.com/goodeasy/sewing-machine/'}","'https://visual.newsis.com/goodeasy/sewing-machine/','https://visual.newsis.com/goodeasy/gramophone/'}");p.write_text(s,encoding='utf-8')
p=r/'sitemap-sections.xml';s=p.read_text(encoding='utf-8').replace('<loc>https://visual.newsis.com/goodeasy/</loc><lastmod>2026-11-02','<loc>https://visual.newsis.com/goodeasy/</loc><lastmod>2026-11-03');line='  <url><loc>https://visual.newsis.com/goodeasy/gramophone/</loc><lastmod>2026-11-03</lastmod><changefreq>monthly</changefreq></url>\n';s=s.replace('</urlset>',line+'</urlset>');p.write_text(s,encoding='utf-8')
css=(r/'goodeasy/assets/landing-sewing.css').read_text(encoding='utf-8').replace('landing-sewing','landing-gramophone').replace('sewing-preview','gramophone-preview').replace('sewing-tools','gramophone-tools').replace('sewing-status','gramophone-status').replace('sewing-scope','gramophone-scope').replace('sewing-audio','gramophone-audio').replace('.art-sewing','.art-gramophone').replace('actual episode watch','actual episode gramophone');(r/'goodeasy/assets/landing-gramophone.css').write_text(css,encoding='utf-8')
