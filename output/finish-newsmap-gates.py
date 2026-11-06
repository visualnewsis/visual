from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'core.js';s=p.read_text(encoding='utf-8').replace("a.policyVersion===POLICY_VERSION&&a.newsCategory", "a.policyVersion===POLICY_VERSION&&a.domesticPolicy==='accepted'&&a.newsCategory");p.write_text(s,encoding='utf-8')
p=r/'tests/modes.cjs';s=p.read_text(encoding='utf-8').replace("policyVersion:R.POLICY_VERSION,id:","policyVersion:R.POLICY_VERSION,domesticPolicy:'accepted',id:");p.write_text(s,encoding='utf-8')
p=r/'tests/navigation.cjs';s=p.read_text(encoding='utf-8').replace("id:'multi',title:","policyVersion:'domestic-local-v1',domesticPolicy:'accepted',localEligible:true,id:'multi',title:");p.write_text(s,encoding='utf-8')
p=r/'tools/validate_snapshot.py';s=p.read_text(encoding='utf-8').replace('parse_time, MAX_ARTICLES','parse_time, MAX_ARTICLES, POLICY_VERSION');needle="        identifier=article['id']";s=s.replace(needle,"""        assert article.get('policyVersion')==POLICY_VERSION,'Unreviewed article policy'
        assert article.get('domesticPolicy')=='accepted','Unaccepted domestic article'
        assert article.get('newsCategory')!='국제' and 'international' not in article.get('feeds',[]),'International article'
        assert isinstance(article.get('localEligible'),bool),'Missing local eligibility'
        assert article['localEligible']==bool(article['places']),'Inconsistent local eligibility'
        assert article.get('localPlaces')==article['places'],'Local location mismatch'
        assert set(article['places']).issubset(article.get('relatedPlaces',[])),'Local article absent from all news'
"""+needle);p.write_text(s,encoding='utf-8')
print('Updated validation and frontend policy contract')
