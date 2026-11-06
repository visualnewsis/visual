const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../spai-battery-copy-20261105');
const base='https://visual.newsis.com/';
const normalize=s=>s.replace(/\r\n/g,'\n');
const files=['spai/index.html','spai/css/spai.css','spai/js/main.js','smartwatch/index.html','smartwatch/css/smartwatch.css','smartwatch/js/main.js'];
(async()=>{
 const checks=await Promise.all(files.map(async file=>{
  const url=new URL(file.endsWith('/index.html')?file.replace('index.html',''):file,base);if(!file.endsWith('.html'))url.searchParams.set('v','20261105-copy-ux4');
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(20000)}),body=await response.text();
  const result={file,status:response.status,matchesCommit:normalize(body)===normalize(fs.readFileSync(path.join(root,file),'utf8'))};
  if(file.endsWith('.html')&&response.ok){
   const json=[...body.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];json.forEach(x=>JSON.parse(x[1]));
   result.jsonLdBlocks=json.length;result.analyticsConfigs=(body.match(/gtag\('config'/g)||[]).length;
   result.canonicalCorrect=body.includes(`rel="canonical" href="${base}${file.split('/')[0]}/"`);
  }else if(file.endsWith('.js')&&response.ok)new vm.Script(body);
  return result;
 }));
 const assets=['assets/logo2024.png','spai/images/hero-office-night-1536.webp','spai/images/hero-office-night-mobile-1120.webp','spai/images/headset-desk-800.webp','spai/images/empty-chair-meeting-800.webp','smartwatch/images/hero-watch-off-pc.webp','smartwatch/images/hero-watch-off-mobile.webp','smartwatch/images/songpa-court-20261013-800.webp','smartwatch/images/watch-demo-20220412-800.webp'];
 const media=await Promise.all(assets.map(async file=>{const r=await fetch(new URL(file,base),{method:'HEAD',signal:AbortSignal.timeout(20000)});return {file,status:r.status,type:r.headers.get('content-type')};}));
 const passed=checks.every(x=>x.status===200&&x.matchesCommit&&(!x.file.endsWith('.html')||(x.jsonLdBlocks>0&&x.analyticsConfigs===1&&x.canonicalCorrect)))&&media.every(x=>x.status===200);
 const result={checkedAt:new Date().toISOString(),commit:'8693bade0e329534c650ac5c18ca4b67fa1390c9',passed,checks,media};
 fs.writeFileSync(path.join(__dirname,'public-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!passed)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1});
