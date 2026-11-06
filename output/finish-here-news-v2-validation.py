from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'tools/validate_snapshot.py'
s=p.read_text(encoding='utf-8').replace('MAX_ARTICLES, POLICY_VERSION','MAX_ARTICLES, POLICY_VERSION, LOCATION_METHOD')
s=s.replace("        assert article.get('policyVersion')==POLICY_VERSION,'Unreviewed article policy'", """        assert article.get('policyVersion')==POLICY_VERSION,'Unreviewed article policy'
        assert article.get('locationMethod')==LOCATION_METHOD,'Stale classification rules'
        assert isinstance(article.get('leadBoundariesVerified'),bool),'Missing lead trust state'
        assert isinstance(article.get('sourceSection'),str) and isinstance(article.get('sourceSection2'),str),'Missing official section metadata'
        assert article['sourceSection']!='국제' and not article['sourceSection2'].startswith('해외'),'International source metadata'
""")
p.write_text(s,encoding='utf-8')
import sys
sys.dont_write_bytecode=True
sys.path.insert(0,str(r/'tools'))
import validate_snapshot as V
import collect_news as C
candidate=Path(r'C:/Users/user/Documents/editshop/output/here-news-audit-v2-reviewed.js')
V.validate(candidate)
C.write_snapshot(r/'data/articles.js',C.decode_snapshot(candidate.read_bytes()))
print('Reviewed v2 snapshot adopted for final live collection')
