from pathlib import Path
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/app.js')
s=p.read_text(encoding='utf-8')
start=s.index('  function updateDataStatus(){');end=s.index('  function renderList(){',start)
part=s[start:end].replace("    $('view-status').textContent=",'    const scopeStatus=').replace("    $('snapshot-time').textContent=",'    const snapshotStatus=')
part=part.replace('  }\n',"    if($('view-status').textContent!==scopeStatus)$('view-status').textContent=scopeStatus;\n    if($('snapshot-time').textContent!==snapshotStatus)$('snapshot-time').textContent=snapshotStatus;\n  }\n")
s=s[:start]+part+s[end:];p.write_text(s,encoding='utf-8')
