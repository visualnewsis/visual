from pathlib import Path
root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=root/'goodeasy/piano/index.html';s=p.read_text(encoding='utf8')
needle='    <section class="inside" id="inside"'
quote='''    <aside class="opening-quote" aria-label="피아니스트 아르투르 루빈스타인의 말">
      <figure>
        <blockquote><p>“돈을 받지 않아도 피아노를 칠 겁니다.<br>그만큼 즐거우니까요.”</p></blockquote>
        <figcaption><span>— 아르투르 루빈스타인</span><a href="https://prod.steinway.com/artists/arthur-rubinstein" target="_blank" rel="noopener">출처: Steinway &amp; Sons · 발언 일부 번역 ↗</a></figcaption>
      </figure>
    </aside>

'''
assert s.count(needle)==1
s=s.replace(needle,quote+needle).replace('piano.css?v=20261025-release1','piano.css?v=20261026-quote1')
p.write_text(s,encoding='utf8')
p=root/'goodeasy/piano/piano.css';s=p.read_text(encoding='utf8')
s+='''
/* Portal and full experience share the same verified quotation. */
.opening-quote{padding:72px 6%;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#101312}.opening-quote figure{max-width:860px;margin:0 auto}.opening-quote blockquote{margin:0}.opening-quote blockquote p{font:400 clamp(21px,2.45vw,34px)/1.9 "Batang",Georgia,serif;letter-spacing:-.045em;color:var(--text);margin:0;text-wrap:pretty;overflow-wrap:break-word}.opening-quote figcaption{display:grid;justify-items:end;gap:10px;margin-top:25px;text-align:right}.opening-quote figcaption span{font-size:12px;color:#cbb895}.opening-quote figcaption a{font-size:9px;line-height:1.8;color:var(--muted);text-decoration:underline;text-underline-offset:4px}.opening-quote figcaption a:hover{color:var(--gold)}
@media(max-width:700px){.opening-quote{padding:46px 24px}.opening-quote blockquote p{font-size:clamp(18px,4.8vw,25px);line-height:1.95}.opening-quote figcaption{margin-top:22px;gap:8px}.opening-quote figcaption span{font-size:11px}.opening-quote figcaption a{font-size:9px}}
'''
p.write_text(s,encoding='utf8')
print('Added portal-matching Rubinstein quote after the playable hero, before exploration.')
