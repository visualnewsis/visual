from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=r/'output/coffee-violin-hold-20261102/qa.html';s=p.read_text(encoding='utf-8').replace('<style>','<style>[hidden]{display:none!important}')
s=s.replace("$('subject').addEventListener('change',choose);", "$('subject').value=new URLSearchParams(location.search).get('subject')||'violin';$('subject').addEventListener('change',()=>location.search='?subject='+$('subject').value);")
s=s.replace('inspect.focus(c,s*factor,','inspect.focus(c,factor,').replace("focus(model.parts.ribs,.9)","focus(model.parts.ribs,.65)").replace("focus(model.parts.chinrest,.8)","focus(model.parts.chinrest,.23)").replace("focus(model.parts.neck,.65)","focus(model.parts.neck,.30)")
p.write_text(s,encoding='utf-8')
