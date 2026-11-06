from pathlib import Path
import json,re
p=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop\goodeasy\piano\index.html')
s=p.read_text(encoding='utf8')
stamp='2026-10-26T09:00:00+09:00'
def update(m):
 d=json.loads(m.group(1));d['datePublished']=stamp
 return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False)+'</script>'
s,count=re.subn(r'<script type="application/ld\+json">(.*?)</script>',update,s,flags=re.S);assert count==1
old='피아노 인터랙션 · 2026.10';new='피아노 인터랙션<br>발행 <time datetime="'+stamp+'">2026.10.26 09:00</time>'
assert s.count(old)==1;s=s.replace(old,new)
p.write_text(s,encoding='utf8')
assert s.index('id="play"')<s.index('class="opening-quote"')<s.index('id="inside"')
assert stamp in s
print('Publication timestamp set to 2026-10-26 09:00 KST in JSON-LD and visible footer. No scheduling or timer added.')
