from pathlib import Path
import re,json,shutil
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
def edit(name,fn):
 p=r/name;s=p.read_text(encoding='utf-8');p.write_text(fn(s),encoding='utf-8')
share='https://visual.newsis.com/goodeasy/sewing-machine/share.jpg'
shutil.copyfile(Path(__file__).parents[1]/'goodeasy-portals-20261102-03/sewing-machine/04_본문사진_AI_무문구.jpg',r/'goodeasy/sewing-machine/share.jpg')
def page(s):
 s=s.replace('noindex,nofollow','index,follow,max-image-preview:large').replace('https://visual.newsis.com/assets/logo2024.png',share).replace('name="twitter:card" content="summary"','name="twitter:card" content="summary_large_image"')
 pattern=r'(<script type="application/ld\+json">)(.*?)(</script>)'
 def ld(m):
  d=json.loads(m[2]);d.update(creativeWorkStatus='Published',datePublished='2026-11-02T10:00:00+09:00',image=share,author={'@type':'Person','name':'안재현'},publisher={'@type':'NewsMediaOrganization','name':'뉴시스','url':'https://www.newsis.com/'})
  return m[1]+json.dumps(d,ensure_ascii=False)+m[3]
 s=re.sub(pattern,ld,s,flags=re.S)
 s=s.replace('<meta name="twitter:card"','<meta property="og:image:alt" content="재봉틀의 바늘과 내부를 표현한 AI 생성 일러스트. 실제 기기의 구조와는 차이가 있습니다."><meta name="twitter:card"',1)
 s=s.replace('</footer>','<p class="publication-date">발행 <time datetime="2026-11-02T10:00:00+09:00">2026.11.02 10:00</time></p></footer>')
 return s
edit('goodeasy/sewing-machine/index.html',page)
def landing(s):
 s=s.replace('용두를 감아 기계식 시계의 안쪽을 살펴보세요. 피아노·카메라·기타·낚시 릴도 함께 체험할 수 있습니다.','한 땀을 박고 재봉틀의 안쪽을 살펴보세요. 피아노·카메라·기타·낚시 릴·시계도 함께 체험할 수 있습니다.')
 s=s.replace('watch/share.jpg','sewing-machine/share.jpg').replace('기계식 손목시계의 외관과 내부를 표현한 AI 생성 일러스트','재봉틀의 바늘과 내부를 표현한 AI 생성 일러스트')
 s=s.replace('용두를 감아 기계식 시계의 안쪽을 살펴보세요.','한 땀을 박아 재봉틀의 안쪽을 살펴보세요.')
 s=s.replace('assets/landing-watch.css?v=20261030-watch1','assets/landing-sewing.css?v=20261102-release1').replace('assets/landing-watch.js?v=20261030-watch1','assets/landing-sewing.js?v=20261102-release1')
 s=s.replace('class="landing-watch"','class="landing-sewing"').replace('href="#landing-wind">용두 감기로','href="#landing-stitch">한 땀 박기로')
 s=s.replace('width="1536" height="1024"','width="1619" height="971"')
 s=s.replace('05 <span>MECHANICAL WATCH</span>','06 <span>SEWING MACHINE</span>').replace('자,<br>태엽을 감아볼까요?','자,<br>한 땀 박아볼까요?').replace('아래 버튼으로 용두를 감아보세요.','아래 버튼으로 바늘땀을 남겨보세요.')
 s=s.replace('class="watch-preview" aria-label="직접 감아보는 기계식 시계"','class="sewing-preview" aria-label="직접 한 땀 박아보는 재봉틀"').replace('id="landing-watch-canvas"','id="landing-sewing-canvas"').replace('용두를 감으면 태엽과 밸런스, 초침이 움직이는 시계 모형','한 땀 박으면 바늘과 천, 손바퀴가 움직이는 재봉틀 모형')
 s=s.replace('class="playable watch-tools"','class="playable sewing-tools"').replace('id="landing-wind" type="button">용두 한 번 감기 ↻','id="landing-stitch" type="button">한 땀 박기').replace('id="landing-reset" type="button">처음 상태로','id="landing-reset" type="button">새 천으로')
 s=s.replace('id="watch-status" role="status">태엽이 풀린 상태입니다. 용두를 감아보세요.','id="sewing-status" role="status">한 땀 박기를 누르면 바늘이 움직입니다.')
 s=s.replace('<p class="watch-scope">작동 원리를 보여주는 모형 · 작동 시간은 짧게 조정했습니다.</p>','<p class="sewing-scope">한 땀 3 mm · 관찰용 느린 움직임 · 합성음</p><p class="sewing-audio">소리가 납니다. 스피커를 켜거나 이어폰을 사용해 주세요.</p>')
 s=s.replace('href="watch/#opening-quote"><span>감아둔 힘은 어떻게 시간을 나눌까요?</span><strong>시계 파헤쳐보기','href="sewing-machine/#opening-quote"><span>천 아래에서 두 실은 어떻게 만날까요?</span><strong>재봉틀 파헤쳐보기')
 s=s.replace('태엽과 릴을 감고, 줄을 튕기고, 셔터와 건반을 눌러보세요.','한 땀을 박고, 태엽과 릴을 감고, 줄과 건반·셔터를 만져보세요.')
 s=s.replace('01 — 05','01 — 06').replace('공개한 이야기 다섯 편','공개한 이야기 여섯 편')
 card='''        <a class="chapter-card is-live" href="sewing-machine/" aria-label="6편 재봉틀 직접 체험하기">
          <div class="chapter-art art-sewing" data-art="sewing-machine/share.jpg" aria-hidden="true"></div>
          <div class="chapter-top"><span>06 / SEWING MACHINE</span><small>공개</small></div>
          <div class="chapter-copy"><span>재봉틀</span><h3>한 땀<br>박아볼까요?</h3><p>천 아래에서 만나는 두 실.</p><b aria-hidden="true">↗</b></div>
        </a>
'''
 s=s.replace('      </div>\n      <p class="chapter-note">',card+'      </div>\n      <p class="chapter-note">')
 s=s.replace('피아노·카메라·기타·낚시 릴·시계를 직접 만져보세요.','피아노·카메라·기타·낚시 릴·시계·재봉틀을 직접 만져보세요.')
 s=s.replace('릴과 태엽을 감으며 사물의 작동 원리를','릴과 태엽을 감고 한 땀을 박으며 사물의 작동 원리를')
 return s
edit('goodeasy/index.html',landing)
edit('goodeasy/check.py',lambda s:s.replace("'fishing-reel','watch'}","'fishing-reel','watch','sewing-machine'}").replace("'https://visual.newsis.com/goodeasy/watch/'}","'https://visual.newsis.com/goodeasy/watch/','https://visual.newsis.com/goodeasy/sewing-machine/'}"))
edit('sitemap-sections.xml',lambda s:s.replace('goodeasy/</loc><lastmod>2026-10-30','goodeasy/</loc><lastmod>2026-11-02').replace('</urlset>','  <url><loc>https://visual.newsis.com/goodeasy/sewing-machine/</loc><lastmod>2026-11-02</lastmod><changefreq>monthly</changefreq></url>\n</urlset>'))
css=(r/'goodeasy/assets/landing-watch.css').read_text(encoding='utf-8').replace('landing-watch','landing-sewing').replace('watch-preview','sewing-preview').replace('watch-tools','sewing-tools').replace('watch-status','sewing-status').replace('watch-scope','sewing-scope')
css+='\n.art-sewing{background-size:cover;background-position:58% center}\n.sewing-audio{font-size:12px;line-height:1.7;color:#b6e6df}\n.landing-sewing .hero-next{bottom:80px}\n@media(max-width:650px){.landing-sewing .hero{height:940px;min-height:940px}.landing-sewing .sewing-preview{top:290px;bottom:300px}.landing-sewing .sewing-tools{bottom:145px}.landing-sewing .hero-next{bottom:50px}}\n'
(r/'goodeasy/assets/landing-sewing.css').write_text(css,encoding='utf-8')
print('Prepared release HTML, metadata, six-card collection, sitemap and styles')
