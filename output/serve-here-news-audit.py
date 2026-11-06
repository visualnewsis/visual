from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import json
root=r'C:/Users/user/.codex/worktrees/newsmap-review/editshop'
policy=json.loads(Path(r'C:/Users/user/Documents/editshop/output/here-news-public-csp.json').read_text(encoding='utf-8'))['csp']
# Production absolute logo URLs are self-origin there, but cross-origin on localhost.
policy=policy.replace("img-src 'self'", "img-src 'self' https://visual.newsis.com")
class ReviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if policy:self.send_header('Content-Security-Policy',policy)
        self.send_header('Cache-Control','no-cache')
        super().end_headers()
    def log_message(self,*args):pass
ThreadingHTTPServer(('127.0.0.1',8771),partial(ReviewHandler,directory=root)).serve_forever()
