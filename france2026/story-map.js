'use strict';
// Draw raw geographic outlines in this story's own palette. No basemap images.
// The overview stays quiet. A flag identifies only the country being read.
const storyProtestCountries={France:'fr',Belgium:'be',Germany:'de',Italy:'it',Albania:'al',Greece:'gr',Spain:'es',Portugal:'pt',Denmark:'dk'};
const storyFlagImages={};
const storyLandColor='#dce6d4';
function storyCountryColor(){return storyLandColor}
const storyCountryNames={
 'France':['프랑스',2.5,46.6],Belgium:['벨기에',4.6,50.7],Germany:['독일',10.4,51.2],Italy:['이탈리아',10.6934,44.8595],Albania:['알바니아',20,40.5],Greece:['그리스',21.7045,39.5225],Spain:['스페인',-1.7102,39.4496],Portugal:['포르투갈',-8,39.0],
 'United Kingdom':['영국',-2,52.8],Ireland:['아일랜드',-8,53.4],Iceland:['아이슬란드',-18.5,65],Netherlands:['네덜란드',5.5,52.2],Luxembourg:['룩셈부르크',6.1,49.8],Switzerland:['스위스',8.2,46.7],Austria:['오스트리아',14.2,47.7],Poland:['폴란드',19,52],'Czech Republic':['체코',15.4,49.8],Czechia:['체코',15.4,49.8],Slovakia:['슬로바키아',19.5,48.7],Hungary:['헝가리',19.2,47.1],Romania:['루마니아',24.9,45.9],Bulgaria:['불가리아',25.4,42.7],Serbia:['세르비아',20.8,44.1],Croatia:['크로아티아',16.3,45.2],'Bosnia and Herzegovina':['보스니아 헤르체고비나',17.8,44.1],Slovenia:['슬로베니아',14.8,46.1],Montenegro:['몬테네그로',19.2,42.8],Kosovo:['코소보',20.9,42.6],'North Macedonia':['북마케도니아',21.7,41.6],Macedonia:['북마케도니아',21.7,41.6],Ukraine:['우크라이나',31.3,49],Belarus:['벨라루스',28,53.5],Lithuania:['리투아니아',23.8,55.3],Latvia:['라트비아',24.7,56.9],Estonia:['에스토니아',25.8,58.7],Finland:['핀란드',26,64.5],Sweden:['스웨덴',15,62],Norway:['노르웨이',8.5,61],Denmark:['덴마크',9.5,56.2],Russia:['러시아',44,56],Turkey:['튀르키예',33,39],Moldova:['몰도바',28.5,47.2],Georgia:['조지아',43.5,42.2],Armenia:['아르메니아',44.7,40.3],Azerbaijan:['아제르바이잔',47.5,40.4],Morocco:['모로코',-6,32],Algeria:['알제리',2.6,28],Tunisia:['튀니지',9.5,34.4],China:['중국',103,35],Japan:['일본',138.2,36.2],'North Korea':['북한',127,40.1],Mongolia:['몽골',104,46],Kazakhstan:['카자흐스탄',67,48]
};
function createCountryNameLayer(parent,land){
 const layer=document.createElement('div');layer.className='country-names';parent.append(layer);
 const entries=land.filter(g=>storyCountryNames[g.name]).map(g=>{const [name,lon,lat]=storyCountryNames[g.name],el=document.createElement('span');el.className='country-name';el.textContent=name;el.hidden=true;layer.append(el);return{geometry:g,el,name:g.name,bounds:g.bounds,anchor:mapProjection.project(lon,lat),sizes:{}}});
 return{paint(cam,w,h,local,focus){
  const root=parent.closest('.narrative-scene')||parent,box=parent.getBoundingClientRect();
  const top=root.querySelector('.mobile-top')||parent.querySelector('.arrival-reading-top'),bottom=root.querySelector('.mobile-bottom')||parent.querySelector('.arrival-reading-bottom');
  const obstacle=el=>{const r=el.getBoundingClientRect();return{x:r.left-box.left-8,y:r.top-box.top-8,w:r.width+16,h:r.height+16}};
  const cityNames=[...root.querySelectorAll('.flow-pin:not([hidden]) span,.demand-pin:not([hidden])>span')].filter(el=>{const pin=el.closest('button');return !el.hidden&&el.getClientRects().length&&pin.style.visibility!=='hidden'&&Number(pin.style.opacity||1)>.05});
  const arrivalName=parent.querySelector('.arrival-place strong');if(arrivalName&&arrivalName.parentElement.style.display!=='none'&&arrivalName.parentElement.style.opacity!=='0')cityNames.push(arrivalName);
  const obstacles=[top,bottom,root.querySelector('.demand-controls:not([hidden])'),...cityNames].filter(Boolean).map(obstacle),placed=[];
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(const entry of [...entries].sort((a,b)=>(a.name===focus?-1:0)-(b.name===focus?-1:0))){
   const x=(entry.anchor[0]-cam.x)/cam.k,y=(entry.anchor[1]-cam.y)/cam.k,bw=(entry.bounds[2]-entry.bounds[0])/cam.k,bh=(entry.bounds[3]-entry.bounds[1])/cam.k;
   entry.el.hidden=true;if(local||bw<35||bh<22||x<16||x>w-16||y<20||y>h-25)continue;
   const size=w<=900||entry.name==='Belgium'||entry.name==='Greece'?11:13;entry.el.style.fontSize=size+'px';
   if(!entry.sizes[size]){entry.el.hidden=false;entry.sizes[size]={w:entry.el.offsetWidth||entry.el.textContent.length*size,h:entry.el.offsetHeight||size*1.4};entry.el.hidden=true}
   const {w:width,h:height}=entry.sizes[size],label={x:x-width/2,y:y-height/2,w:width,h:height};
   if(!countryContainsBox(entry.geometry.labelGeometry,{x:cam.x+(label.x-2)*cam.k,y:cam.y+(label.y-2)*cam.k,w:(width+4)*cam.k,h:(height+4)*cam.k}))continue;
   if(label.x<8||label.x+width>w-8||obstacles.some(b=>overlap(label,b))||placed.some(b=>overlap(label,b)))continue;
   entry.el.style.fontSize=size+'px';entry.el.style.left=x+'px';entry.el.style.top=y+'px';entry.el.hidden=false;placed.push(label);
  }

 }};
}
let flagRepaint=0;
if(typeof Image!=='undefined')for(const [name,code] of Object.entries(storyProtestCountries)){
 const image=new Image();image.onload=()=>{if(flagRepaint)return;flagRepaint=requestAnimationFrame(()=>{flagRepaint=0;if(typeof readScroll==='function')readScroll();if(typeof storyMapContexts!=='undefined'){const visibleMap=storyMapContexts.find(c=>c.index===current);if(visibleMap)drawMap(visibleMap)}})};image.src='assets/flags/'+code+'-map.svg?v='+(code==='dk'?'whole-flag-20261105-fit':'border-fill-20261104');storyFlagImages[name]=image;
}
function storyFlagCountry(b){if(b.korea)return 'South Korea';if(b.scope==='유럽')return null;const city=places[photos[b.photo]?.city||b.selected];return city?.countryKey||'France'}
function storyFlagOpacity(ratio){const t=Math.max(0,Math.min(1,(ratio-1.2)/1.5));return .82*(1-t*t*(3-2*t))}
// Use the mainland rather than overseas islands to size the original flag.
function storyMainlandBounds(path){
 let best=null,bestArea=-1;
 for(const ring of path.match(/M[^Z]+Z/g)||[]){
  const points=[...ring.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(m=>[+m[1],+m[2]]);let area=0;
  for(let i=0,j=points.length-1;i<points.length;j=i++)area+=points[j][0]*points[i][1]-points[i][0]*points[j][1];
  if(Math.abs(area)>bestArea){bestArea=Math.abs(area);best=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]}
 }
 return best;
}
// Extend the flag fields to every island without changing geographic outlines.
// The generated texture uses this exact frame, with original vector symbols
// uniformly scaled within the mainland. Never stretch the original flag image.
function storyFlagFrame(g){
 const b=g.flagBounds,all=g.bounds,bw=b[2]-b[0],bh=b[3]-b[1];
 const x=Math.min(all[0],b[0]-bw*.25),y=Math.min(all[1],b[1]-bh*.25);
 return{x,y,w:Math.max(all[2],b[2]+bw*.25)-x,h:Math.max(all[3],b[3]+bh*.25)-y};
}
function paintStoryFlag(ctx,g,image,opacity){
 const frame=storyFlagFrame(g);
 // Fade the white tint plate with the flag, so its last frame cannot flash
 // white before the neutral land appears. At .82 the original tint is intact.
 const visibility=Math.max(0,Math.min(1,opacity/.82));
 ctx.save();ctx.clip(g.path);ctx.globalAlpha=opacity>=1?0:(visibility-opacity)/(1-opacity);ctx.fillStyle='#fff';ctx.fillRect(frame.x,frame.y,frame.w,frame.h);
 ctx.globalAlpha=opacity;ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h);ctx.restore();
}
function createStoryMap(canvas,countries,communes,context=[]){
 const ctx=canvas.getContext('2d',{alpha:false});
 let furniture=null;
 if(canvas.parentElement){
  furniture=document.createElement('div');furniture.className='map-reference';furniture.hidden=true;
  furniture.innerHTML='<div class="map-scale"><span></span><small></small></div><span class="boundary-credit">주변 행정 경계 · 도시 위치</span>';
  canvas.parentElement.append(furniture);
 }
 function geometry(input){const d=typeof input==='string'?input:input.d,values=(d.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(let i=0;i<values.length;i+=2){x0=Math.min(x0,values[i]);x1=Math.max(x1,values[i]);y0=Math.min(y0,values[i+1]);y1=Math.max(y1,values[i+1])}return{...(typeof input==='string'?{}:input),path:new Path2D(d),bounds:[x0,y0,x1,y1]}}
 const land=countries.map(f=>({...geometry(f),labelGeometry:countryLabelGeometry(f.d),flagBounds:storyProtestCountries[f.name]?storyMainlandBounds(f.d):null})),municipal=communes.map(geometry),regions=context.filter(f=>f.level==='department').map(geometry);
 const names=canvas.parentElement?createCountryNameLayer(canvas.parentElement,land):null;
 function draw(cam,w,h,local,flagCountry=null,flagStrength=1,options={}){
  if(!w||!h)return;const dpr=Math.min(devicePixelRatio||1,2),cw=Math.round(w*dpr),ch=Math.round(h*dpr);
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#a9c9d9';ctx.fillRect(0,0,w,h);
  ctx.scale(1/cam.k,1/cam.k);ctx.translate(-cam.x,-cam.y);
  const x1=cam.x+w*cam.k,y1=cam.y+h*cam.k,visible=g=>g.bounds[0]<x1&&g.bounds[2]>cam.x&&g.bounds[1]<y1&&g.bounds[3]>cam.y;
  for(const g of land){if(!visible(g))continue;ctx.fillStyle=options.highlightCountries?.includes(g.name)?'#efe0c3':g.name===flagCountry&&options.focusFill?options.focusFill:storyCountryColor(g.name);ctx.strokeStyle='#789188';ctx.lineWidth=cam.k*(g.name===flagCountry&&options.scope==='country'?1.4:.8);ctx.fill(g.path);
   const flag=storyFlagImages[g.name];
   if(g.name===flagCountry&&storyProtestCountries[g.name]&&flag?.complete&&flag.naturalWidth&&flagStrength>0){
    const bounds=g.flagBounds,bw=bounds[2]-bounds[0],bh=bounds[3]-bounds[1],opacity=(options.flagOpacity??(local?0:storyFlagOpacity(Math.max(bw/(w*cam.k),bh/(h*cam.k)))))*flagStrength;
    if(opacity>0)paintStoryFlag(ctx,g,flag,opacity);
   }
   ctx.stroke(g.path)}
  const closeScale=local?1:Math.max(0,Math.min(1,(.3-cam.k)/.2)),detail=flagCountry==='France'?closeScale:0,detailed=detail>0;
  if(detailed){
   const selectedCities=options.cities?municipal.filter(g=>options.cities.includes(g.city)):municipal;
   ctx.save();ctx.globalAlpha=detail*.32;ctx.strokeStyle='#8fa597';ctx.lineWidth=cam.k*.65;ctx.lineJoin='round';
   for(const region of regions)if(visible(region)&&!(region.code==='75'&&selectedCities.some(g=>g.city==='paris'&&visible(g))))ctx.stroke(region.path);
   ctx.globalAlpha=detail;ctx.strokeStyle='#426454';ctx.lineWidth=cam.k*1.4;
   for(const city of selectedCities)if(visible(city))ctx.stroke(city.path);
   ctx.restore();
  }
  names?.paint(cam,w,h,local||!!options.hideCountryNames,flagCountry);
  if(furniture){
   furniture.hidden=!closeScale;furniture.style.opacity=1;canvas.dataset.detailMap=detailed?'country-closeup':closeScale?'city-location':'countries';
   furniture.querySelector('.map-scale').hidden=!closeScale;
   furniture.querySelector('.boundary-credit').textContent=options.scope==='country'?'국가 경계':detailed?'진한 선: 시 경계 · 옅은 선: 광역 경계':closeScale?'도시 위치 · 주변 국경':'';
   if(closeScale){const lat=mapProjection.unproject(cam.x+w*cam.k/2,cam.y+h*cam.k/2)[1],perPixel=mapProjection.metersPerUnit(lat)*cam.k,max=perPixel*85;
    const length=[100,200,500,1000,2000,5000,10000,20000,50000].filter(n=>n<=max).at(-1)||100;
    furniture.querySelector('.map-scale span').style.width=length/perPixel+'px';furniture.querySelector('.map-scale small').textContent=length>=1000?length/1000+' km':length+' m';
   }
  }
 }
 return{draw,containsLabel(name,box,cam){const g=land.find(c=>c.name===name);return !!g&&countryContainsBox(g.labelGeometry,{x:cam.x+(box.x-2)*cam.k,y:cam.y+(box.y-2)*cam.k,w:(box.w+4)*cam.k,h:(box.h+4)*cam.k})}};
}
