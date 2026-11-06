from pathlib import Path
import re,json,shutil
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=r/'goodeasy/piano/index.html';s=p.read_text(encoding='utf-8')
title='피아노 건반을 누르면 무슨 일이 일어날까 | 안재현의 굳이구지'
desc='건반을 직접 연주하고 해머·현·댐퍼의 작동을 3D로 살펴보세요. 타격 세기, 해머 이탈, 현의 길이와 페달을 바꾸며 피아노 소리의 원리를 비교합니다.'
s=re.sub(r'<title>.*?</title>',f'<title>{title}</title>',s)
s=s.replace('content="noindex,nofollow"','content="index,follow,max-image-preview:large"')
s=re.sub(r'(<meta (?:name="(?:description|twitter:description)"|property="og:description") content=")[^"]*',lambda m:m[1]+desc,s)
s=re.sub(r'(<meta (?:name="twitter:title"|property="og:title") content=")[^"]*',lambda m:m[1]+title,s)
s=s.replace('/goodeasy/piano/preview.jpg','/goodeasy/piano/images/piano-photo.jpg').replace('굳이구지 피아노 연주 체험 미리보기','흑백 피아노 건반 실사진 · Tama66 / Pixabay')
s=s.replace('<meta name="twitter:card" content="summary">','<meta name="twitter:card" content="summary_large_image">')
s=s.replace('<meta property="og:image:alt"','<meta property="og:image:width" content="1280"><meta property="og:image:height" content="853">\n  <meta property="og:image:alt"')
ld={'@context':'https://schema.org','@type':'LearningResource','name':'피아노 — 안재현의 굳이구지','inLanguage':'ko-KR','description':desc,'url':'https://visual.newsis.com/goodeasy/piano/','image':'https://visual.newsis.com/goodeasy/piano/images/piano-photo.jpg','learningResourceType':'Interactive simulation','isAccessibleForFree':True,'educationalUse':'demonstration','author':{'@type':'Person','name':'안재현'},'creditText':'크리에이티브 디렉터 = 안재현','publisher':{'@type':'NewsMediaOrganization','name':'뉴시스','url':'https://www.newsis.com/'}}
s=re.sub(r'<script type="application/ld\+json">.*?</script>','<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False)+'</script>',s,flags=re.S)
# Use the current shared header; it removes the old .masthead on startup.
s=s.replace('</head>','<link rel="stylesheet" href="../../assets/visual-header.css?v=20261025-piano1">\n<script defer src="../../assets/visual-header.js?v=20261025-piano1" data-section="굳이구지" data-header-theme="dark"></script>\n</head>')
s=s.replace('<small class="director">크리에이티브 디렉터 = 안재현</small>','<small class="director">안재현의 굳이구지 · PIANO</small>')
s=s.replace('작동 시제품 / 합성음','합성음 · 작동 원리 모형').replace('피아노 인터랙션 시제품 · 2026.10','피아노 인터랙션 · 2026.10')
s=s.replace('</footer>','<p class="photo-credit">공유 이미지 사진: <a href="https://pixabay.com/photos/piano-keys-instrument-music-1493797/" target="_blank" rel="noopener">Tama66 / Pixabay</a></p></footer>')
s=s.replace('piano.css?v=20261024-3','piano.css?v=20261025-release1')
p.write_text(s,encoding='utf-8')
p=r/'goodeasy/piano/piano.css';s=p.read_text(encoding='utf-8');s+='''
/* Published piano: shared header and photo attribution. */
body.vnh-ready .play{height:calc(100svh - 64px - env(safe-area-inset-top,0px))}
.skip:focus{top:72px;z-index:10001}
footer{flex-wrap:wrap}.photo-credit{flex-basis:100%;margin:0;font-size:10px;color:var(--muted);line-height:1.8}.photo-credit a{text-decoration:underline;text-underline-offset:3px}
.research-index a:focus-visible,.research-controls button:focus-visible{outline:2px solid #d8c09c;outline-offset:4px}
''';p.write_text(s,encoding='utf-8')
img=r/'goodeasy/piano/images';img.mkdir(exist_ok=True)
shutil.copyfile(r'C:\Users\user\Documents\editshop\output\goodeasy-piano-release-20261025\01-piano-photo-original.jpg',img/'piano-photo.jpg')
(img/'photo-credit.txt').write_text('Photo: Tama66 / Pixabay\nSource: https://pixabay.com/photos/piano-keys-instrument-music-1493797/\nLicense: https://pixabay.com/service/license-summary/\nDownloaded 2026-10-25. Photo page lists Nikon D3300 and publication date 2016-07-04.\nNo AI generation, retouching, text overlay, or alteration; downloaded 1280x853 JPEG.\nThis is a piano keyboard photo, not a photograph of the 3D grand-action model.\n',encoding='utf-8')
# This is a regular URL sitemap entry, not a landing card or a News sitemap story.
p=r/'sitemap-sections.xml';s=p.read_text(encoding='utf-8');entry='  <url><loc>https://visual.newsis.com/goodeasy/piano/</loc><lastmod>2026-10-25</lastmod><changefreq>monthly</changefreq></url>\n';assert '/goodeasy/piano/' not in s;s=s.replace('</urlset>',entry+'</urlset>');p.write_text(s,encoding='utf-8')
p=r/'sitemap.xml';s=p.read_text(encoding='utf-8');s=re.sub(r'(sitemap-sections\.xml</loc><lastmod>)[^<]+',r'\g<1>2026-10-25',s);p.write_text(s,encoding='utf-8')
p=r/'goodeasy/check.py';s=p.read_text(encoding='utf-8');s=s.replace("  if 'noindex,nofollow' not in s:errors.append(str(p)+' prototype indexing')", "  if p.parent.name=='piano':\n   if 'index,follow,max-image-preview:large' not in s or 'noindex' in s:errors.append(str(p)+' published piano indexing')\n   if 'https://visual.newsis.com/goodeasy/piano/' not in s:errors.append(str(p)+' published piano URL')\n  elif 'noindex,nofollow' not in s:errors.append(str(p)+' prototype indexing')");s=s.replace('GA and noindex','GA and release/prototype indexing');p.write_text(s,encoding='utf-8')
print('Piano release prepared: crawlable metadata, existing global header, licensed real photo, sitemap discovery, no landing changes.')
