const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),before=path.join(__dirname,'dmz-forest-baseline');
if(!fs.existsSync(before))fs.cpSync(path.join(root,'dmz'),path.join(before,'dmz'),{recursive:true});
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(url==='/__qa.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(fs.readFileSync(path.join(__dirname,'dmz-aerial-qa.js')));return;}
 const old=url.startsWith('/before/');if(old)url=url.slice(7);
 const base=old&&url.startsWith('/dmz/')?before:root;
 let file=path.resolve(base,'.'+url);if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}
  if(file.endsWith('.html')&&new URL(req.url,'http://localhost').searchParams.has('qa'))data=Buffer.from(data.toString().replace('</body>','<script src="/__qa.js"></script></body>'));
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
}).listen(8933,'127.0.0.1',()=>console.log('http://127.0.0.1:8932/dmz/?qa&bench'));
