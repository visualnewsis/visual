"""Check shared ending styles; --sync refreshes only their HTML fallback/link."""
import argparse
import hashlib
import os
import re
import subprocess
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / 'assets/editshop-brand-banner.css'
STYLE = re.compile(r'<style data-editshop-brand-banner(?:-fallback)?>.*?</style>', re.S)
LINK = re.compile(r'(<link\b[^>]*href=")([^"\s]*assets/editshop-brand-banner\.css)(?:\?[^\"]*)?("[^>]*>)')
URL = re.compile(r"url\('([^']+)'\)")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sync', action='store_true')
    args = parser.parse_args()
    source = CSS.read_text()
    version = hashlib.sha256(source.encode()).hexdigest()[:12]
    errors, count = [], 0
    for value in URL.findall(source):
        url = urlsplit(value)
        asset = (CSS.parent / url.path).resolve()
        if asset.is_file() and asset.suffix == '.woff2':
            font_version = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
            if url.query != 'v=' + font_version:
                errors.append(f'{CSS.name}: font cache version differs from font content')
    names = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z', '*.html'], cwd=ROOT).decode().split('\0')
    for name in filter(None, names):
        path = ROOT / name
        page = path.read_text()
        if not re.search(r'class=["\'][^"\']*\bves-brand\b', page):
            continue
        count += 1
        def relative(match):
            url = urlsplit(match[1])
            asset = (CSS.parent / url.path).resolve()
            if not asset.is_file():
                errors.append(f'{name}: missing asset {url.path}')
            suffix = '?' + url.query if url.query else ''
            return "url('" + os.path.relpath(asset, path.parent) + suffix + "')"
        fallback = '<style data-editshop-brand-banner-fallback>\n' + URL.sub(relative, source) + '\n</style>'
        if args.sync:
            page = LINK.sub(lambda m: m[1] + m[2] + '?v=' + version + m[3], page)
            if STYLE.search(page):
                page = STYLE.sub(lambda _: fallback, page, count=1)
            else:
                page = LINK.sub(lambda m: m[0] + '\n' + fallback, page, count=1)
            path.write_text(page)
        styles = STYLE.findall(page)
        if len(styles) != 1 or re.sub(r'^<style[^>]*>', '<style>', styles[0]) != fallback.replace('<style data-editshop-brand-banner-fallback>', '<style>', 1):
            errors.append(f'{name}: fallback missing or differs from shared CSS (run --sync)')
        match = LINK.search(page)
        if match and '?v=' + version + '"' not in match[0]:
            errors.append(f'{name}: shared CSS cache version differs (run --sync)')
    for error in errors:
        print('FAIL:', error)
    print(f'{"FAIL" if errors else "PASS"}: {count} shared banners; fallback, asset paths, content-based CSS version')
    return bool(errors)


if __name__ == '__main__':
    raise SystemExit(main())
