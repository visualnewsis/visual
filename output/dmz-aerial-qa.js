const bar=document.createElement('aside');bar.style='position:fixed;z-index:9999;bottom:0;left:0;right:0;padding:7px;background:#fff;color:#111;font:11px sans-serif;display:flex;gap:5px;flex-wrap:wrap';
const output=document.createElement('output');output.id='qa-result';
const button=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{if(!window.__dmz){output.textContent='3D 준비 중';return;}fn();};bar.append(b);};
for(const [label,key,f] of [['처음','hero',0],['중간 그림','hero',.56],['조감 그림','hero',.72],['3D 조감','hero',1],['구조','structure',.5],['철책','start',.5],['숲','forest',.5],['단면','xray',.75],['북측','north',.3],['연표','timeline',.8],['엔딩','finale',.96]])button(label,()=>window.__dmz.go(key,f));
button('전체 3D 측정',()=>{
 const s=window.__dmz.scroller,from=s.span('hero').b,to=s.span('forest').b;let start=0,last=0;const frames=[],draw=[];
 const step=now=>{if(!start)start=last=now;const f=Math.min(1,(now-start)/8000),p=f<.5?f*2:2-2*f;window.scrollTo(0,from+(to-from)*p);if(now>start+700){frames.push(now-last);draw.push(JSON.parse(document.querySelector('#stage').dataset.bench||'{}').meanMs||0);}last=now;
 if(f<1){requestAnimationFrame(step);return;}frames.sort((a,b)=>a-b);output.textContent=JSON.stringify({samples:frames.length,p50:+frames[Math.floor(frames.length*.5)].toFixed(2),p95:+frames[Math.floor(frames.length*.95)].toFixed(2),over50ms:frames.filter(x=>x>50).length,render:JSON.parse(document.querySelector('#stage').dataset.bench||'{}')});};window.__dmz.go('hero',1);requestAnimationFrame(step);
});
bar.append(output);document.body.append(bar);
