from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'tests/collector.py';s=p.read_text(encoding='utf-8')
s += """
# The existing scheduled collection job runs this entry point.
expired_ledger={**payload,'excludedInternational':{'NISX20260901_9999999999':(now-timedelta(days=31)).isoformat()}}
ledger_only,ledger_changed,_=C.collect(expired_ledger,now,fetch=lambda url:b'<rss><channel></channel></rss>' if any('/'+f+'.xml' in url for f in ['international','culture','entertain']) else good,enrich_limit=0)
assert ledger_only['articles']==payload['articles']
assert ledger_changed and ledger_only['excludedInternational']=={}, 'History-only expiry must publish the new exclusion ledger'
import runpy
runpy.run_path(str(Path(__file__).with_name('domestic-policy.py')))
"""
p.write_text(s,encoding='utf-8')
p=r/'tests/rules.cjs';s=p.read_text(encoding='utf-8');s += "\n// Run mode policy regressions from the existing scheduled workflow entry point.\nrequire('./modes.cjs');\n";p.write_text(s,encoding='utf-8')
p=r/'tools/validate_snapshot.py';s=p.read_text(encoding='utf-8').replace('from datetime import datetime, timezone','from datetime import datetime, timezone, timedelta')
s=s.replace("        assert parse_time(published)<=datetime.now(timezone.utc),'Future excluded article'", "        assert parse_time(payload['collectedAt'])-timedelta(days=30)<=parse_time(published)<=parse_time(payload['collectedAt']),'Excluded article outside retention window'")
p.write_text(s,encoding='utf-8')
