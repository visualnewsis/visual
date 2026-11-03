"""Validate the static candidate before publication; no network access."""
import argparse
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
sys.dont_write_bytecode=True
from collect_news import decode_snapshot, load_nodes, parse_time, MAX_ARTICLES, POLICY_VERSION

def validate(path):
    payload=decode_snapshot(Path(path).read_bytes())
    nodes={n['id'] for n in load_nodes()}
    articles=payload['articles']
    assert payload.get('policyVersion')==POLICY_VERSION,'Snapshot policy mismatch'
    browser_policy=re.search(r"const POLICY_VERSION='([^']+)'",(Path(__file__).resolve().parents[1]/'core.js').read_text(encoding='utf-8'))
    assert browser_policy and browser_policy[1]==POLICY_VERSION,'Browser and collector policy mismatch'
    excluded=payload.get('excludedInternational')
    assert isinstance(excluded,dict),'Missing international exclusion history'
    for identifier,published in excluded.items():
        assert re.fullmatch(r'NISX\d+_\d+',identifier),'Malformed excluded ID'
        assert parse_time(payload['collectedAt'])-timedelta(days=30)<=parse_time(published)<=parse_time(payload['collectedAt']),'Excluded article outside retention window'

    assert 15<=len(articles)<=MAX_ARTICLES,'Unexpected article count'
    assert parse_time(payload['collectedAt'])<=datetime.now(timezone.utc),'Future collection time'
    seen=set()
    for article in articles:
        assert article.get('policyVersion')==POLICY_VERSION,'Unreviewed article policy'
        assert article.get('domesticPolicy')=='accepted','Unaccepted domestic article'
        assert article.get('newsCategory')!='국제' and 'international' not in article.get('feeds',[]),'International article'
        assert isinstance(article.get('localEligible'),bool),'Missing local eligibility'
        assert article['localEligible']==bool(article['places']),'Inconsistent local eligibility'
        assert article.get('localPlaces')==article['places'],'Local location mismatch'
        assert set(article['places']).issubset(article.get('relatedPlaces',[])),'Local article absent from all news'
        identifier=article['id']
        assert identifier not in excluded,'Excluded international ID reappeared'
        assert re.fullmatch(r'NISX\d+_\d+',identifier),identifier
        assert identifier not in seen,'Duplicate article ID'
        seen.add(identifier)
        assert article['url']=='https://www.newsis.com/view/'+identifier,'Unexpected article URL'
        assert isinstance(article['title'],str) and article['title'].strip(),'Empty title'
        assert parse_time(article['publishedAt'])<=datetime.now(timezone.utc),'Future article'
        assert isinstance(article['places'],list) and all(p in nodes for p in article['places']),'Unknown place'
        assert article['places'] or article.get('newsCategory'),'Unlocated articles require a category'
        assert all(p in nodes for p in article.get('relatedPlaces',[])),'Unknown related place'
        assert isinstance(article.get('evidence'),list) and all(isinstance(e,str) for e in article['evidence']),'Missing evidence'
        assert 'text' not in article and 'articleBody' not in article,'Full body must not be published'
    return len(articles)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('path',type=Path)
    print('PASS:',validate(parser.parse_args().path),'validated articles ready for publication')
