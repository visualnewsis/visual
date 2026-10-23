"""Validate the static candidate before publication; no network access."""
import argparse
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
sys.dont_write_bytecode=True
from collect_news import decode_snapshot, load_nodes, parse_time, MAX_ARTICLES

def validate(path):
    payload=decode_snapshot(Path(path).read_bytes())
    nodes={n['id'] for n in load_nodes()}
    articles=payload['articles']
    assert 15<=len(articles)<=MAX_ARTICLES,'Unexpected article count'
    assert parse_time(payload['collectedAt'])<=datetime.now(timezone.utc),'Future collection time'
    seen=set()
    for article in articles:
        identifier=article['id']
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
