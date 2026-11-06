from pathlib import Path
import re,json
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=r/'goodeasy/keyboard/index.html';s=p.read_text(encoding='utf8').replace('noindex,nofollow','index,follow,max-image-preview:large')
def ld(m):
 d=json.loads(m[1]);d.update(name='굳이구지 · 기계식 키보드',creativeWorkStatus='Published',datePublished='2026-11-05T10:00:00+09:00',image='https://visual.newsis.com/goodeasy/keyboard/preview.png',author={'@type':'Person','name':'안재현'},publisher={'@type':'NewsMediaOrganization','name':'뉴시스','url':'https://www.newsis.com/'});return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False)+'</script>'
s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',ld,s);p.write_text(s,encoding='utf8')
p=r/'goodeasy/check.py';s=p.read_text(encoding='utf8').replace("'sewing-machine','gramophone'}","'sewing-machine','gramophone','keyboard'}").replace("'https://visual.newsis.com/goodeasy/gramophone/'}","'https://visual.newsis.com/goodeasy/gramophone/','https://visual.newsis.com/goodeasy/keyboard/'}");p.write_text(s,encoding='utf8')
p=r/'sitemap-sections.xml';s=p.read_text(encoding='utf8');assert 'https://visual.newsis.com/goodeasy/keyboard/' not in s;s=s.replace('</urlset>','  <url><loc>https://visual.newsis.com/goodeasy/keyboard/</loc><lastmod>2026-11-05</lastmod><changefreq>monthly</changefreq></url>\n</urlset>');p.write_text(s,encoding='utf8')
