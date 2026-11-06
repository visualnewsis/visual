from pathlib import Path
import re,json
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
order=['piano','camera','guitar','fishing-reel','watch','sewing-machine','gramophone','keyboard','projector','espresso-machine','violin']
numbers={key:f'{i:02d}' for i,key in enumerate(order,1)}
for p in (r/'goodeasy').glob('*/index.html'):
 s=p.read_text(encoding='utf-8');old=s
 if p.parent.name in {'violin','projector','espresso-machine'}:
  s=re.sub(r'(?<=class="eyebrow">)\d{2}(?= · (?:VIOLIN|FILM PROJECTOR|ESPRESSO MACHINE))',numbers[p.parent.name],s)
 if 'class="review-nav"' in s:
  def nav(m):
   links=re.findall(r'<a\b[^>]*href="\.\./([^/"]+)/"[^>]*>.*?</a>',m[0])
   entries={re.search(r'href="\.\./([^/]+)/"',a)[1]:a for a in re.findall(r'<a\b[^>]*>.*?</a>',m[0])}
   return '<nav class="review-nav" aria-label="굳이구지 다른 체험">'+''.join(re.sub(r'(>)(\d{2})( )',lambda m:m[1]+numbers[key]+m[3],entries[key],count=1) for key in order if key in entries)+'</nav>'
  s=re.sub(r'<nav class="review-nav".*?</nav>',nav,s,flags=re.S)
 if p.parent.name=='review':
  def ld(m):
   d=json.loads(m[1]);items=d['mainEntity']['itemListElement'];items.sort(key=lambda x:order.index(x['url'].rstrip('/').split('/')[-1]));
   for i,item in enumerate(items,1):item['position']=i
   return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False,separators=(',',':'))+'</script>'
  s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',ld,s,flags=re.S)
  nav=re.search(r'<nav aria-label="열한 가지 실험">(.*?)</nav>',s,re.S)
  entries={re.search(r'href="\.\./([^/]+)/"',a)[1]:a for a in re.findall(r'<a class="episode".*?</a>',nav[1],re.S)}
  for key,a in entries.items():
   a=re.sub(r'(<span class="episode-number">)\d{2}',lambda m:m[1]+numbers[key],a)
   if key=='violin':a=a.replace('<strong>바이올린</strong>','<strong>바이올린 · 출고 보류</strong>').replace('활을 그어볼까요?','형상·부품 접촉 재검토 중')
   entries[key]=a
  s=s[:nav.start(1)]+'\n'.join(entries[key] for key in order)+s[nav.end(1):]
 if s!=old:p.write_text(s,encoding='utf-8');print(p.relative_to(r))
