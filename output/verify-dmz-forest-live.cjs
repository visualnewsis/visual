const https=require('node:https'),fs=require('node:fs'),crypto=require('node:crypto');
const get=url=>new Promise((resolve,reject)=>{https.get(url,res=>{if(res.statusCode>=300&&res.statusCode<400){res.resume();get(new URL(res.headers.location,url)).then(resolve,reject);return;}const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>res.statusCode===200?resolve(Buffer.concat(chunks)):reject(new Error(url+' HTTP '+res.statusCode)));}).on('error',reject).setTimeout(20000,function(){this.destroy(new Error('timeout '+url));});});
(async()=>{
 const base='https://visual.newsis.com/dmz/',html=(await get(base+'?v=20261027-forest3')).toString();
 if(!html.includes('js/main.js?v=20261027-forest3'))throw new Error('Production still serves the previous DMZ release');
 const results=await Promise.all(['css/dmz.css','js/main.js','js/scene3d.js','js/hero.js','js/terrain.js','js/vegetation.js','js/surface-detail.js','js/tree-detail.js','js/camera.js','js/fence.js','js/ui.js','js/xray.js','images/web/foliage-cluster-v1.webp','images/web/ground-hillside-v2.webp'].map(async file=>{
  const remote=await get(base+file+'?v=20261027-forest3'),local=fs.readFileSync('dmz/'+file),binary=file.endsWith('.webp');
  const normalize=b=>binary?b:Buffer.from(b.toString().replace(/\r\n/g,'\n'));
  if(!normalize(remote).equals(normalize(local)))throw new Error(file+' differs from verified local release');
  return {file,status:200,bytes:remote.length,sha256:crypto.createHash('sha256').update(remote).digest('hex')};
 }));
 const json=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 if(html.split('gtag/js?id=G-6BKMWE02W5').length!==2)throw new Error('analytics count');
 const report={checkedAt:new Date().toISOString(),url:base,cacheVersion:'20261027-forest3',jsonLdBlocks:json.length,files:results};fs.writeFileSync('output/dmz-forest-live-20261027.json',JSON.stringify(report,null,2));console.log('PASS: live article, analytics, JSON-LD and '+results.length+' exact release assets');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
