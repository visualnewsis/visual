const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const host=process.env.TONGI_HOST||'127.0.0.1';
const port=Number(process.env.TONGI_PORT||8794);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png'};
http.createServer((req,res)=>{
 let file;
 try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);return res.end();}
 if(file===root)file=path.join(root,'index.html');
 if(!file.startsWith(root+path.sep)||!['index.html','compact.css','compact.js','search-core.js','recommend-core.js','roam.css','roam.js','tongi-roam-poses-v1.png','tongi-curtain-lift-v1.png','tongi-grip-hands-v1.png','tongi-back.png','dock.css','dock.js','tongi.css','interactions.css','character.css','tongi.js','tongi-poses-v1.png','tongi-poses-3d-v1.png','tongi-poses-newsis-v2.png','tongi-poses-logo-mint-v3.png','tongi-poses-logo-mint-v4.png'].includes(path.basename(file))){res.writeHead(404);return res.end();}
 fs.readFile(file,(err,body)=>{if(err){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});res.end(body);});
}).listen(port,host,()=>console.log('Preview: http://'+host+':'+port+'/'));
