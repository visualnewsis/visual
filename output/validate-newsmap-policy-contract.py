from pathlib import Path
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/tools/validate_snapshot.py')
s=p.read_text(encoding='utf-8')
s=s.replace("    articles=payload['articles']", """    articles=payload['articles']
    assert payload.get('policyVersion')==POLICY_VERSION,'Snapshot policy mismatch'
    browser_policy=re.search(r"const POLICY_VERSION='([^']+)'",(Path(__file__).resolve().parents[1]/'core.js').read_text(encoding='utf-8'))
    assert browser_policy and browser_policy[1]==POLICY_VERSION,'Browser and collector policy mismatch'
    excluded=payload.get('excludedInternational')
    assert isinstance(excluded,dict),'Missing international exclusion history'
    for identifier,published in excluded.items():
        assert re.fullmatch(r'NISX\\d+_\\d+',identifier),'Malformed excluded ID'
        assert parse_time(published)<=datetime.now(timezone.utc),'Future excluded article'
""")
s=s.replace("        identifier=article['id']", "        identifier=article['id']\n        assert identifier not in excluded,'Excluded international ID reappeared'")
p.write_text(s,encoding='utf-8')
