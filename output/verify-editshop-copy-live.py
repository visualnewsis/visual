from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
import json

root = Path(__file__).parent / 'editshop-copy-20261024'
slugs = ['oil', 'thief', 'kangin', 'children', 'buy-live', 'aijob', 'pension', 'senior', 'atleti-2gang', 'smartwatch', 'spai', 'temperature', 'witness', 'homecoming', 'quit', 'shelter', 'dmz']
paths = [slug + '/index.html' for slug in slugs] + ['spai/js/main.js', 'spai/js/scenarios.js']

def normalized(text):
    return text.replace('\r\n', '\n').strip()

def verify(path):
    query = '?v=20261025-copy-1' if path.endswith('.js') else '?verify=025cdc5'
    address = 'https://visual.newsis.com/' + path + query
    req = Request(address, headers={'Cache-Control': 'no-cache', 'User-Agent': 'VISUAL-NEWSIS-deployment-verification'})
    try:
        with urlopen(req, timeout=40) as response:
            actual = response.read().decode('utf-8-sig')
            expected = (root / path).read_text(encoding='utf-8-sig')
            return {'path': path, 'status': response.status, 'matches': normalized(actual) == normalized(expected)}
    except Exception as error:
        return {'path': path, 'error': str(error), 'matches': False}

with ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(verify, paths))
print(json.dumps(results, ensure_ascii=False, indent=2))
raise SystemExit(0 if all(row['matches'] for row in results) else 1)
