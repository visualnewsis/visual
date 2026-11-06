import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const port = Number(process.env.BRAILLE_PREVIEW_PORT || 8418);
const host = process.env.BRAILLE_PREVIEW_HOST || '127.0.0.1';
const publicFiles = new Set([
  '/assets/logo2024.png', '/assets/visual-header.css', '/assets/visual-header.js',
  '/assets/editshop-carousel.css', '/assets/editshop-carousel.js', '/assets/editshop-brand-banner.css',
  '/assets/images/editshop-editor-navy-v3.webp', '/assets/menu-icon-goodeasy.svg',
  '/assets/menu-icon-onepoint.png', '/assets/menu-icon-here-news.svg'
]);
const carousel = await readFile(path.join(root,'assets/editshop-carousel.js'),'utf8');
for(const match of carousel.matchAll(/image:"([^"]+)"/g)) publicFiles.add(match[1]);
const publishedRoutes = new Set(['/','/editshop/']);
for(const match of carousel.matchAll(/slug:"([^"]+)"/g)) publishedRoutes.add('/'+match[1]+'/');
const articlePath = /^\/braille-100\/(?:(?:index|learn)\.html|learn\.(?:css|js)|story\.(?:css|js)|braille-(?:engine|experience)\.js|vendor\/braillify\/(?:index_bg\.(?:js|wasm)|LICENSE\.txt|NOTICE\.txt)|images\/(?:contact|history|document|book)-(?:720|1280|1920)\.jpg)?$/;
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm','.txt':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.ico':'image/x-icon'};
const server = http.createServer(async(req,res) => {
  try {
    const requestUrl = new URL(req.url,'http://localhost');
    const pathname = decodeURIComponent(requestUrl.pathname);
    if(req.method!=='GET' && req.method!=='HEAD') {res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
    if(publishedRoutes.has(pathname)) {res.writeHead(302,{'Location':'https://visual.newsis.com'+pathname}).end();return;}
    if(!articlePath.test(pathname) && !publicFiles.has(pathname)) {res.writeHead(404).end();return;}
    let target = path.resolve(root, '.' + pathname);
    const relative = path.relative(root,target);
    if(relative.startsWith('..') || path.isAbsolute(relative)) {res.writeHead(403).end();return;}
    if((await stat(target)).isDirectory()) target = path.join(target,'index.html');
    const data = await readFile(target);
    const headers = {'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    if(requestUrl.searchParams.has('nojs') && path.extname(target)==='.html') headers['Content-Security-Policy'] = "script-src 'none'";
    res.writeHead(200,headers);
    res.end(req.method==='HEAD'?undefined:data);
  } catch {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');}
});
server.listen(port,host,()=>console.log(`${host==='127.0.0.1'?'Local':'Mobile'}: http://${host}:${port}/braille-100/`));
