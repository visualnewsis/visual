'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const {states:journeyStates,groups:journeyGroups}=gateStory;
const initialScene=location.hash.slice(1);
const M=gateJourneyModel,stage=$('#journeyStage'),story=$('#top');
const journeyAnchors=M.storyAnchors(journeyStates);
const mobileViewport=matchMedia('(max-width:800px), (pointer:coarse) and (max-width:1200px), (max-height:540px) and (max-width:1200px)');
let phoneLayout=mobileViewport.matches,readingClock=M.readingTrack(journeyStates,phoneLayout),scrollOrigin=story.offsetTop-(phoneLayout?0:104);
const interludeLayer=document.createElement('div');interludeLayer.className='journey-interlude';interludeLayer.setAttribute('aria-hidden','true');stage.append(interludeLayer);
const pinlight=document.createElement('div');pinlight.className='journey-pinlight';interludeLayer.append(pinlight);
const spotlightAttribution=document.createElement('p');spotlightAttribution.className='spotlight-attribution';spotlightAttribution.hidden=true;$('.journey-top').append(spotlightAttribution);
let current=0,visual=0,target=0,raf=0,requested=null,scrollMoving=false,scrollIdle=0,geometry=null,mapRenderer=null,globeData=null,lastPhoto='';
const pins={},mapField=$('#journeyMap'),mapCanvas=$('#journeyMap canvas'),globeCanvas=$('#journeyGlobe');
const koreaName=document.createElement('span');koreaName.className='country-name korea-country-name';koreaName.textContent='대한민국';koreaName.hidden=true;mapField.append(koreaName);
const countrySelect=$('#countryChoice'),detail=$('#sceneDetail'),menu=$('#chapters');
const transport=$('.journey-transport'),journeyTools=$('.journey-tools'),sceneActions=$('.journey-actions');
const refUrl=id=>/^https:\/\//.test(id)?id:source(id);
const textTitle=s=>s.accessibleTitle||s.title.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
function refsHTML(refs,seen){
 return refs.filter(([id])=>{if(!seen)return true;const url=refUrl(id);if(seen.has(url))return false;seen.add(url);return true}).map(([id,label])=>'<a href="'+refUrl(id)+'" target="_blank" rel="noopener">'+label+' ↗</a>').join('');
}

menu.innerHTML='<div class="chapter-heading">기사 목차</div>'+journeyGroups.map((g,i)=>'<button data-group="'+g.id+'" data-seek="'+g.index+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+g.label+'</button>').join('')+'<div class="chapter-countries">'+journeyStates.filter(s=>s.country&&s.type==='map').map(s=>'<button data-seek="'+journeyStates.indexOf(s)+'">'+s.countryName+'</button>').join('')+'</div><button id="allRecords">도시·날짜별 전체 기록</button><a href="#sources">설명 글과 취재 근거</a>';
const demandExplorer=createDemandExplorer({stage,mapField,top:$('.journey-top'),bottom:$('.journey-bottom'),places,project:mapProjection.project,repaint:()=>paint(visual),openScene:id=>{const i=journeyStates.findIndex(s=>s.id===id);if(i>=0)seek(i,true)}});
countrySelect.innerHTML=journeyStates.filter(s=>s.country&&s.type==='map').map(s=>'<option value="'+journeyStates.indexOf(s)+'">'+s.countryName+' · '+places[s.city].name+'</option>').join('');
countrySelect.onchange=()=>seek(+countrySelect.value,true);
function closeMenu(){menu.hidden=true;$('#menuButton').setAttribute('aria-expanded','false')}
$('#shareButton').addEventListener('click',closeMenu);
$('#menuButton').onclick=()=>{const open=menu.hidden;menu.hidden=!open;$('#menuButton').setAttribute('aria-expanded',String(open))};
$$('[data-seek]').forEach(b=>b.onclick=()=>{seek(+b.dataset.seek,true);closeMenu()});
menu.querySelector('a[href="#sources"]').onclick=closeMenu;
$('#prevScene').onclick=()=>seek(M.readingIndex(requested??target,journeyStates)-1);$('#nextScene').onclick=()=>seek(M.readingIndex(requested??target,journeyStates)+1);
$('#sourceButton').onclick=()=>showDetail(current);
$('#endSources').onclick=()=>document.getElementById('sources').scrollIntoView({behavior:'smooth'});
$('#restart').onclick=()=>seek(0);
$('#lyonSchool').onclick=()=>seek(journeyStates.findIndex(s=>s.id==='lyon-school'));
$('#lyonLiving').onclick=()=>seek(journeyStates.findIndex(s=>s.id==='lyon-living'));
$('#photoReturn').onclick=()=>seek(current-1);
let detailSceneId='';
function showDetail(index){
 if(journeyStates[index].id==='europe')index=journeyStates.findIndex(s=>s.id===demandExplorer.sourceScene);
 const active=journeyStates[index],s=active.coverReading&&$('#journeyTitle').dataset.reading==='korean'?journeyStates.find(s=>s.id==='world-korean'):active;
 const brief=sceneBriefs.get(s.id);if(!brief)return;detailSceneId=s.id;$('#detailTitle').textContent=textTitle(s);
 $('#detailBody').innerHTML='<p class="detail-summary">'+brief.summary+'</p><p class="detail-note">'+brief.scope+'</p><div class="detail-links compact-detail-links">'+s.refs.map(([id,label])=>'<a href="'+refUrl(id)+'" target="_blank" rel="noopener" title="'+label+'" aria-label="뉴시스 · '+label+'">'+(sceneBriefs.label(id)||label)+'</a>').join('')+'</div>';
 closeMenu();detail.showModal();detail.scrollTop=0;
}
$('#readFullDetail').onclick=()=>{
 detail.close();transcriptRoot.open=true;
 const articles=[...transcriptRoot.querySelectorAll('article')];
 const currentIndex=journeyStates.findIndex(s=>s.id===detailSceneId);
 let record=transcriptStates.findIndex(s=>s.id===detailSceneId);
 if(record<0)record=transcriptStates.findIndex(s=>s.id===journeyStates[currentIndex-1]?.id);
 (articles[record]||transcriptRoot).scrollIntoView({behavior:phoneLayout||reduceMotion.matches?'instant':'smooth',block:'start'});
};
$('#closeDetail').onclick=()=>detail.close();
detail.addEventListener('click',e=>{if(e.target===detail)detail.close()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape')closeMenu();
 if(detail.open||$('#recordDialog').open||$('#shareDialog').open||!menu.hidden||e.target.matches('select,button,input,a,canvas'))return;
 if(['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();seek(M.readingIndex(requested??target,journeyStates)+1)}
 if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();seek(M.readingIndex(requested??target,journeyStates)-1)}
});

// The full source record is an optional reading sheet, not a second map stage.
$('#allRecords').onclick=()=>{closeMenu();$('#recordDialog').showModal()};
$('#closeRecords').onclick=()=>$('#recordDialog').close();
const archive=[];
for(const [city,rows] of Object.entries(cityTimelines))for(const r of rows){if(!r.source)continue;archive.push({city,...r})}
archive.sort((a,b)=>(a.date||'').localeCompare(b.date||''));
$('#recordList').innerHTML=archive.map(r=>'<article><p>'+r.label+' · '+(places[r.city]?.name||r.city)+'</p><h3>'+r.title+'</h3><a href="'+refUrl(r.source)+'" target="_blank" rel="noopener">뉴시스 원문 ↗</a></article>').join('');
const transcriptSources=new Set();
// Adjacent views of the exact same report share one reading article.
// Keep every distinct note or source, and give actual paragraphs their spacing.
const transcriptStates=journeyStates.filter((s,i)=>{if(s.spotlightBlank)return false;const previous=journeyStates[i-1];return !(previous&&s.body===previous.body&&s.note===previous.note&&JSON.stringify(s.refs)===JSON.stringify(previous.refs))});
const transcriptRoot=$('#reportTranscript');
transcriptRoot.querySelectorAll('article').forEach(article=>article.remove());
transcriptRoot.insertAdjacentHTML('beforeend',transcriptStates.map(s=>'<article><h3>'+textTitle(s)+'</h3>'+s.body.split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+p+'</p>').join('')+'<p class="transcript-note">'+s.note+'</p>'+refsHTML(s.refs,transcriptSources)+'</article>').join(''));

function origin(){return scrollOrigin}
function step(){return Math.max(460,innerHeight-(phoneLayout?0:104))*.94/M.transitionSpan}
function cancelSeek(event){
 if(event?.type==='touchstart'&&event.target.closest('button,select,a,input'))return;
 if(requested!==null)scrollTo({top:scrollY,behavior:'instant'});
 requested=null;
}
function seek(index,direct=false){
 index=M.clamp(index,0,journeyStates.length-1);
 const smooth=!direct&&!reduceMotion.matches&&Math.abs(index-visual)<=1.05;
 requested=smooth?index:null;
 // Native scroll is the single reading clock. Button motion can be cancelled
 // immediately by a new wheel/swipe instead of leaving a second camera queue.
 scrollTo({top:origin()+M.scrollOnTrack(index,readingClock)*step(),behavior:smooth?'smooth':'instant'});
 readScroll();if(!smooth)paint(visual);
}
function readScroll(){
 const raw=(scrollY-origin())/+(story.dataset?.step||step()),position=M.positionOnTrack(raw,readingClock);
 visual=target=position;if(requested!==null&&Math.abs(raw-M.scrollOnTrack(requested,readingClock))<.01)requested=null;
 scrollMoving=true;
 if(!raf)raf=requestAnimationFrame(()=>{raf=0;paint(visual)});
 clearTimeout(scrollIdle);scrollIdle=setTimeout(()=>{scrollMoving=false;cancelAnimationFrame(raf);raf=0;paint(visual)},120);
}
function setState(index){
 const s=journeyStates[index],wasCover=stage.dataset.cover==='true';current=index;stage.dataset.kind=s.type;stage.dataset.group=s.group;stage.dataset.state=s.id;stage.dataset.cover=String(!!s.coverReading);stage.dataset.standard=String(!s.coverReading&&s.id!=='gate-open'&&s.type!=='interlude');stage.dataset.spotlightBlank=String(!!s.spotlightBlank);
 const bookend=s.type!=='interlude'&&(!phoneLayout||!!s.coverReading||s.id==='gate-open'),screen=s.type==='interlude'?'black':bookend?'framed':'immersive';
 stage.dataset.screen=document.body.dataset.storyScreen=screen;
 document.body.dataset.layout=phoneLayout?'mobile':'desktop';
 for(const el of [$('#articleHeader'),transport,$('#siteFooter')]){const hidden=!bookend||(phoneLayout&&el===transport);el.inert=hidden;el.setAttribute('aria-hidden',String(hidden))}
 const toolsParent=bookend&&!phoneLayout?transport:sceneActions;
 if(journeyTools.parentElement!==toolsParent)toolsParent.append(journeyTools);
 if(screen==='black')closeMenu();
 document.dispatchEvent(new CustomEvent('journey:screenchange',{detail:{bookend}}));
 if(location.hash!=='#'+s.id){try{history.replaceState(null,'','#'+s.id)}catch{}}
 $('#journeyKicker').textContent=s.kicker;
 if(!wasCover||!s.coverReading)$('#journeyTitle').innerHTML=s.title;
 $('#journeyTitle').setAttribute('aria-label',textTitle(s));$('#journeyTitle').dataset.reading=s.coverReading||'korean';
 spotlightAttribution.replaceChildren();spotlightAttribution.hidden=!s.spotlightQuote;stage.dataset.spotlightQuote=String(!!s.spotlightQuote);
 if(s.spotlightQuote){const q=s.spotlightQuote,link=document.createElement('a');link.href=refUrl(q.source);link.target='_blank';link.rel='noopener';link.textContent=q.attribution;link.setAttribute('aria-label',q.attribution+' · 인용 출처: 뉴시스 보도');spotlightAttribution.append(link)}
 const lead=phoneLayout&&mobileLayoutData.leads[s.id]||s.lead;
 $('#journeyLead').textContent=s.quotedLead?lead.slice(1):lead;
 if(s.quotedLead){const quote=document.createElement('span');quote.className='hanging-quote';quote.setAttribute('aria-hidden','true');quote.textContent='"';$('#journeyLead').prepend(quote)}
 $('#journeyLead').setAttribute('aria-label',lead);
 $('#journeyTitle').setAttribute('tabindex','-1');$('#journeyTitle').hidden=!!s.spotlightBlank;
 const groupIndex=journeyGroups.findIndex(g=>g.id===s.group);
 menu.querySelectorAll('[data-group]').forEach(b=>{if(b.dataset.group===s.group)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
 $('#sceneCount').textContent=String(groupIndex+1).padStart(2,'0')+' / 06 · '+journeyGroups[groupIndex].label;
 $('#prevScene').disabled=index===0;$('#nextScene').disabled=index===journeyStates.length-1;
 $('#countryTools').hidden=!s.country;
 if(s.country){const mapIndex=journeyStates.findIndex(v=>v.country===s.country&&v.type==='map');countrySelect.value=String(mapIndex)}
 $('#photoReturn').hidden=!(s.country&&s.type==='photo');
 $('#lyonCompare').hidden=!s.lyon;
 $('#lyonSchool').setAttribute('aria-pressed',String(s.lyon==='school'));
 $('#lyonLiving').setAttribute('aria-pressed',String(s.lyon==='living'));
 $('#introByline').hidden=!s.coverReading;
 $('#finalActions').hidden=s.id!=='gate-open';
 $('#journeyStatus').textContent=s.kicker+' · '+textTitle(s);
 demandExplorer.setActive(s.id==='europe');
 $('#scrollCue').textContent=s.coverReading?(phoneLayout?(s.coverReading==='france'?'위로 밀어 다른 뜻 보기':'위로 밀어 크레테유로'):(s.coverReading==='france'?'스크롤해 다른 뜻 보기':'스크롤해 크레테유로')):s.type==='gate'&&s.gate!=='open'?'스크롤해 다음 장면으로':'';
 // Only one photographic surface exists. It cannot leak across hidden chapters.
 const upcoming=s.photo||journeyStates.slice(index,Math.min(index+3,journeyStates.length)).find(x=>x.photo)?.photo;
 if(upcoming)photoDelivery.preload(photos[upcoming].file,'high');
 for(const v of journeyStates.slice(index+1,index+4))if(v.photo)photoDelivery.preload(photos[v.photo].file);
 const mobilePhoto=mobileLayoutData.photos[s.photo]||{aspect:1.3,x:.5,y:.5};
 stage.style.setProperty('--mobile-photo-aspect',mobilePhoto.aspect);stage.style.setProperty('--mobile-photo-x',mobilePhoto.x);stage.style.setProperty('--mobile-photo-y',mobilePhoto.y);
 queueMobileLayout();
 requestAnimationFrame(()=>{photoDelivery.layout($('#journeyPhoto .photo-surface>img'));if(geometry)paint(visual)});
}
let mobileLayoutFrame=0;
function queueMobileLayout(){if(!phoneLayout||mobileLayoutFrame)return;mobileLayoutFrame=requestAnimationFrame(()=>{mobileLayoutFrame=0;const s=journeyStates[current],top=$('.journey-top');if(s.coverReading){stage.style.setProperty('--mobile-cover-title-bottom',top.offsetTop+top.offsetHeight+'px');return}if(s.type!=='photo')return;
 const bottom=$('.journey-bottom'),profile=mobileLayoutData.photos[s.photo];
 const box=M.mobilePhotoBox(stage.clientWidth,stage.clientHeight,top.offsetTop+top.offsetHeight,bottom.offsetTop,profile?.aspect,profile?.portrait);
 for(const [name,value]of Object.entries(box))stage.style.setProperty('--mobile-image-'+name,value+'px');
 photoDelivery.layout($('#journeyPhoto .photo-surface>img'));
})}
const mobileCopyObserver=new ResizeObserver(queueMobileLayout);mobileCopyObserver.observe($('.journey-top'));mobileCopyObserver.observe($('.journey-bottom'));
document.fonts?.ready.then(queueMobileLayout);
// The first native movement reveals the second meaning. Time never changes it.
function paintCover(p){
 if(!journeyStates[current].coverReading)return;
 const reading=M.coverReading(p,scrollY-origin(),journeyAnchors),s=journeyStates.find(s=>s.coverReading===reading);
 if($('#journeyTitle').dataset.reading!==reading){
  $('#journeyTitle').dataset.reading=reading;$('#journeyTitle').setAttribute('aria-label',textTitle(s));
  const lead=phoneLayout&&mobileLayoutData.leads[s.id]||s.lead;$('#journeyLead').textContent=lead;$('#journeyLead').setAttribute('aria-label',lead);
  $('#journeyStatus').textContent=textTitle(s);$('#scrollCue').textContent=phoneLayout?(reading==='france'?'위로 밀어 다른 뜻 보기':'위로 밀어 크레테유로'):(reading==='france'?'스크롤해 다른 뜻 보기':'스크롤해 크레테유로');
 }
}

function clearPins(){for(const pin of Object.values(pins))pin.hidden=true}
function mapAnchor(s){const place=places[s.selected];return place?[place.lon,place.lat]:s.view.center}
function mapFocus(s){return mapProjection.project(...mapAnchor(s))}
function mapCamera(s){
 const w=mapField.clientWidth,h=mapField.clientHeight,view=s.view;
 if(s.id==='europe')return demandExplorer.camera(w,h);
 const center=mapProjection.project(...view.center),focus=mapFocus(s);
 if(!s.selected)return M.centeredCamera(center,focus,view.width,view.height,w,h);
 const overview=journeyStates.find(v=>v.id==='europe').view,referencePoint=mapProjection.project(...overview.center),reference=M.centeredCamera(referencePoint,referencePoint,overview.width,overview.height,w,h);
 // Keep the nearby Paris name/outline below the two-line school headlines.
 return M.contextCamera(center,focus,view.width,view.height,w,h,reference,s.selected==='creteil'?{minY:.55}:undefined);
}
function cityArrival(a,b){return M.cityArrival(a,b)}
function paintKoreaMap(p){
 const frame=globeFrame(p),{w,h}=frame,anchor=mapProjection.project(frame.lon,frame.lat),k=M.globeScaleForCamera(1,frame.lat)/frame.scale;
 const cam={x:anchor[0]-frame.cx*k,y:anchor[1]-frame.cy*k,k};
 clearPins();mapRenderer.draw(cam,w,h,false,'South Korea',0,{scope:'country',focusFill:'#edf0df',cities:[]});
 mapCanvas.setAttribute('aria-label','대한민국으로 확대하는 국가 경계 지도');
 const point=mapProjection.project(127.8,36.4),x=(point[0]-cam.x)/k,y=(point[1]-cam.y)/k;
 koreaName.hidden=false;koreaName.style.fontSize=(w<=800?13:16)+'px';koreaName.style.left=x+'px';koreaName.style.top=y+'px';
 const width=koreaName.offsetWidth+4,height=koreaName.offsetHeight+4;
 koreaName.hidden=!mapRenderer.containsLabel('South Korea',{x:x-width/2,y:y-height/2,w:width,h:height},cam);
}
function paintMap(p,opacity){
 if(!mapRenderer||opacity<=0)return;
 koreaName.hidden=true;if(p>journeyAnchors.korea&&p<journeyAnchors.korea+1){paintKoreaMap(p);return}
 const w=mapField.clientWidth,h=mapField.clientHeight,frame=M.mapFrameAt(p,journeyStates,mapCamera,w,h,mapFocus);
 if(!frame)return;
 const s=journeyStates[frame.index],labels=journeyStates[frame.labels],cam=frame.cam;
 clearPins();
 const comparison=labels.id==='europe'&&demandExplorer.active;
 demandExplorer.paint(cam,comparison?frame.labelOpacity:0);
 const labelPoints=[];
 for(const id of comparison?[]:labels.cities||[]){
  const place=places[id];if(!place)continue;
  if(!pins[id]){const el=document.createElement('button');el.className='journey-pin flow-pin';el.innerHTML='<i></i><span></span>';el.onclick=()=>showDetail(current);$('#journeyPins').append(el);pins[id]=el;}
  const el=pins[id],[x,y]=mapProjection.project(place.lon,place.lat),px=(x-cam.x)/cam.k,py=(y-cam.y)/cam.k;
  el.hidden=frame.labelOpacity<.005||px<14||px>w-14||py<22||py>h-28;el.style.opacity=frame.labelOpacity;el.setAttribute('aria-hidden',String(el.hidden));if(el.hidden)continue;
  el.classList.toggle('selected',id===labels.selected);el.classList.toggle('label-left',labels.local&&id==='paris');
  el.style.left=px+'px';el.style.top=py+'px';el.querySelector('span').textContent=place.name;
  el.setAttribute('aria-label',place.name+' · 이 장면의 설명과 출처');
  const label=el.querySelector('span');label.hidden=false;label.style.right='auto';
  labelPoints.push({id,x:px,y:py,w:label.offsetWidth,h:label.offsetHeight,selected:id===labels.selected});
 }
 const safe={top:w<=800?(h<600?130:150):35,bottom:w<=800?h-180:h-40};
 const fieldBox=mapField.getBoundingClientRect(),obstacles=['.journey-top','.journey-bottom'].map(selector=>{const r=$(selector).getBoundingClientRect();return{x:r.left-fieldBox.left,y:r.top-fieldBox.top,w:r.width,h:r.height}});
 for(const box of layoutMapLabels(labelPoints,w,h,safe,{anchored:true,obstacles})){const point=labelPoints.find(p=>p.id===box.id),label=pins[box.id].querySelector('span');label.hidden=box.hidden;label.style.left=(box.x-point.x)+'px';label.style.top=(box.y-point.y)+'px';}
 mapRenderer.draw(cam,w,h,!!s.local&&cam.k<=.3,s.focus,1,{cities:labels.cities||[],flagOpacity:M.countryFlagOpacity(cam,w,h),highlightCountries:comparison?demandExplorer.countries:undefined});
 mapCanvas.setAttribute('aria-label',comparison?'유럽에서 선택한 요구가 확인된 도시 지도':(s.id==='europe'?'유럽':s.countryName||(s.focus==='France'?'프랑스':''))+' 사건 위치 지도');
}

let globeProjection=null,drag=null,dragPaint=0;
const globeTurns={},globeHelp=$('#globeHelp'),globeHome=$('#globeHome');
const earth=createReliefGlobe($('#journeyEarth'),'assets/earth-relief-4096.webp',()=>paint(visual));
function globeFrame(p){
 const {entry,korea,returnWorld,returnMap}=journeyAnchors;
 const w=stage.clientWidth,h=stage.clientHeight,phone=phoneLayout,landscape=phone&&w/h>1.4&&h<540,coverLandscape=landscape&&p<entry,r=phone?(landscape?Math.min(w*.22,h*(coverLandscape?.31:.4)):Math.min(w*.46,h*.25)):Math.min(w*.25,h*.39);
 let lon=12,lat=25,scale=r,cx=w*(coverLandscape?.25:landscape?.75:phone?.5:.69),cy=h*(coverLandscape?.72:phone?.54:.49);
 if(p<entry){
  const progress=M.introProgress(p,journeyAnchors),q=M.ease(progress),turn=M.ease(progress/.7),view=mapAnchor(journeyStates[entry]),flat=mapCamera(journeyStates[entry]),centre=mapProjection.project(...view),radius=M.globeScaleForCamera(flat.k,view[1]);
  lon=12*(1-turn)+view[0]*turn;lat=25*(1-turn)+view[1]*turn;
  scale=Math.exp(Math.log(r)*(1-q)+Math.log(radius)*q);cx=cx*(1-q)+(centre[0]-flat.x)/flat.k*q;cy=cy*(1-q)+(centre[1]-flat.y)/flat.k*q;
 }
 else if(p>=korea-1&&p<korea+1){
  const q=M.ease(p-korea+1),zoom=M.koreaZoom(p-korea),radius=M.koreaRadius(w,h);
  lon=12*(1-q)+127.8*q;lat=35*(1-q)+36.4*q;
  scale=Math.exp(Math.log(r)*(1-zoom)+Math.log(radius)*zoom);cx=cx*(1-zoom)+w*.5*zoom;cy=cy*(1-zoom)+h*.5*zoom;
 }
 else if(p>=returnWorld-1){
  const view=mapAnchor(journeyStates[returnMap]),flat=mapCamera(journeyStates[returnMap]),centre=mapProjection.project(...view),q=M.ease(p-returnWorld+1),zoom=M.ease(p-returnWorld),radius=M.globeScaleForCamera(flat.k,view[1]);
  lon=127.8*(1-q)+view[0]*q;lat=36.4*(1-q)+view[1]*q;
  const returnRadius=Math.exp(Math.log(M.koreaRadius(w,h))*(1-q)+Math.log(r)*q);
  cx=w*.5*(1-q)+cx*q;cy=h*.5*(1-q)+cy*q;
  scale=Math.exp(Math.log(returnRadius)*(1-zoom)+Math.log(radius)*zoom);cx=cx*(1-zoom)+(centre[0]-flat.x)/flat.k*zoom;cy=cy*(1-zoom)+(centre[1]-flat.y)/flat.k*zoom;
 }
 const {owner,weight}=M.globeControl(p,journeyAnchors),turn=globeTurns[owner];
 if(turn){lon+=turn.lon*weight;lat+=turn.lat*weight}
 return{w,h,lon:M.wrapLongitude(lon),lat:M.clamp(lat,-85,85),scale,cx,cy,owner,weight,turnLon:turn?.lon||0,turnLat:turn?.lat||0,moving:!!drag||scrollMoving||requested!==null};
}
function paintGlobe(p,opacity){
 if(!globeData||opacity<=0)return;
 const f=globeFrame(p),{w,h,lon,lat,scale,cx,cy}=f,dpr=Math.min(devicePixelRatio||1,2);
 if(globeCanvas.width!==Math.round(w*dpr)||globeCanvas.height!==Math.round(h*dpr)){globeCanvas.width=Math.round(w*dpr);globeCanvas.height=Math.round(h*dpr)}
 const ctx=globeCanvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const projection=d3.geoOrthographic().rotate([-lon,-lat]).scale(scale).translate([cx,cy]).clipExtent([[0,0],[w,h]]).precision(.5);
 globeProjection=projection;const path=d3.geoPath(projection,ctx),sphere={type:'Sphere'};
 const textured=earth.draw(f);
 if(!textured){
  const ocean=ctx.createRadialGradient(cx-scale*.3,cy-scale*.3,scale*.05,cx,cy,scale);ocean.addColorStop(0,'#315a74');ocean.addColorStop(1,'#102b41');
  ctx.beginPath();path(sphere);ctx.fillStyle=ocean;ctx.fill();
  for(const country of globeData.features){ctx.beginPath();path(country);ctx.fillStyle='#81937d';ctx.fill();}
 }
 // Country outlines share the relief projection and stay quiet beneath the
 // active country. They show geographic context, never a protest route.
 ctx.strokeStyle='#31544978';ctx.lineWidth=.65;ctx.lineJoin='round';
 for(const country of globeData.features){ctx.beginPath();path(country);ctx.stroke()}
 const focusCountry=p>=journeyAnchors.korea-1&&p<journeyAnchors.korea+1?'South Korea':'France',focus=globeData.features.find(c=>c.properties.name===focusCountry);
 if(focus){ctx.beginPath();path(focus);ctx.fillStyle='#ffcd8420';ctx.fill();ctx.strokeStyle='#fff1c1b0';ctx.lineWidth=1;ctx.stroke();}
 const destination=p>=journeyAnchors.korea-1&&p<journeyAnchors.korea+1?[127.8,36.4]:[2.455,48.79],point=projection(destination);
 const labelCoordinate=focusCountry==='South Korea'?[127.8,36.4]:storyCountryNames.France.slice(1),labelText=focusCountry==='South Korea'?'대한민국':'프랑스';
 const placed=[];
 function labelCountry(country,labelText,labelCoordinate,size,active=false){
  if(!country||d3.geoDistance([lon,lat],labelCoordinate)>=Math.PI/2)return;
  const labelPoint=projection(labelCoordinate);
  ctx.font='600 '+size+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  const width=ctx.measureText(labelText).width+6,halfHeight=size*.7;
  const fits=labelPoint&&labelPoint[0]>width/2&&labelPoint[0]<w-width/2&&labelPoint[1]>halfHeight&&labelPoint[1]<h-halfHeight&&[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].every(([x,y])=>{const geo=projection.invert([labelPoint[0]+x*width/2,labelPoint[1]+y*halfHeight]);return geo&&d3.geoContains(country,geo)});
  const box=labelPoint&&{x:labelPoint[0]-width/2,y:labelPoint[1]-halfHeight,w:width,h:halfHeight*2};
  if(fits&&!placed.some(b=>box.x<b.x+b.w+4&&box.x+box.w+4>b.x&&box.y<b.y+b.h+4&&box.y+box.h+4>b.y)){
   ctx.fillStyle=active?'#fff6dd':'#ccdbd1a6';ctx.shadowColor='#07151e';ctx.shadowBlur=active?5:3;ctx.fillText(labelText,labelPoint[0],labelPoint[1]);ctx.shadowBlur=0;placed.push(box);
  }ctx.textBaseline='alphabetic';
 }
 labelCountry(focus,labelText,labelCoordinate,focusCountry==='South Korea'?Math.min(18,Math.max(12,scale*.0027)):12,true);
 for(const country of globeData.features){const label=storyCountryNames[country.properties.name];if(country!==focus&&label)labelCountry(country,label[0],label.slice(1),10)}
 if(focusCountry!=='South Korea'&&d3.geoDistance([lon,lat],destination)<Math.PI/2&&point&&point[0]>=0&&point[0]<=w&&point[1]>=0&&point[1]<=h){
  ctx.beginPath();ctx.arc(point[0],point[1],3.5,0,Math.PI*2);ctx.fillStyle='#ffb58e';ctx.fill();ctx.beginPath();ctx.arc(point[0],point[1],8,0,Math.PI*2);ctx.strokeStyle='#fff5d8aa';ctx.stroke();
 }
}
function photoFor(p){return M.photoFrameAt(p,journeyStates)}

function paint(p){
 const index=M.readingIndex(p,journeyStates);
 if(stage.dataset.state!==journeyStates[index].id)setState(index);
 const inset=M.frameInset(p,journeyStates,phoneLayout);
 stage.style.setProperty('--frame-inset',inset+'px');
 const mobileBars=phoneLayout?M.mobileBookendWeight(p,journeyStates):0;
 stage.style.setProperty('--frame-bottom-inset',phoneLayout?44*mobileBars+'px':'0px');
 document.body.style.setProperty('--bookend-chrome-opacity',String(phoneLayout?mobileBars:inset/104));
 // Interludes retain their deliberate black gap even when scrolling pauses.
 const spotlight=M.spotlightFrame(p,journeyStates);
 const readingOpacity=journeyStates[index].type==='interlude'?spotlight.text:M.readingOpacity(p,journeyStates,scrollMoving&&!reduceMotion.matches);
 $('.journey-top').style.opacity=readingOpacity;$('#journeyLead').style.opacity=readingOpacity;
 $('.journey-bottom').style.setProperty('--photo-copy-opacity',readingOpacity);
 pinlight.style.opacity=spotlight.light;stage.dataset.spotlight=spotlight.light.toFixed(4);
 paintCover(p);
 const {entry,korea,returnWorld}=journeyAnchors,openingProgress=M.introProgress(p,journeyAnchors),interludeBlack=M.interludeOpacity(p,journeyStates);
 interludeLayer.style.opacity=interludeBlack;
 const s=journeyStates[index],koreaFlat=p>korea&&p<korea+1?M.koreaFlat(p-korea):0,globeOpacity=p<entry?1-M.ease((openingProgress-.82)/.18):p>korea-1&&p<korea+1?M.ease((p-korea+1)/.45)*(1-koreaFlat)*(1-M.koreaReveal(p-korea)):p>returnWorld-1&&p<returnWorld+1?M.ease(p-returnWorld+1)*(1-M.ease((p-returnWorld-.82)/.18)):0;
 const photographic=photoFor(p);const gate=M.gateAt(p,journeyAnchors);
 let mapOpacity=s.type==='map'?1:0;
 const a=journeyStates[Math.floor(p)],b=journeyStates[Math.floor(p)+1],t=p-Math.floor(p);
 if(a?.type==='map'&&b?.type!=='map')mapOpacity=1-M.ease((t-.3)/.7);
 if(b?.type==='map'&&a?.type!=='map')mapOpacity=M.ease(t);
 if(p<entry+.12)mapOpacity=M.ease((openingProgress-.82)/.18);
 if(p>returnWorld&&p<returnWorld+1)mapOpacity=M.ease((p-returnWorld-.82)/.18);
 if(cityArrival(a,b)||(a?.type==='photo'&&b?.type==='map'))mapOpacity=1;
 if(p>korea&&p<korea+1)mapOpacity=koreaFlat*(1-M.koreaReveal(p-korea));
 const visibleMap=mapOpacity*(1-photographic.opacity)*(1-interludeBlack);
 mapField.style.opacity=mapOpacity;mapField.inert=visibleMap<.75;mapField.setAttribute('aria-hidden',String(visibleMap<.05));
 $('#mapLegend').style.opacity=visibleMap;$('#mapLegend').setAttribute('aria-hidden',String(visibleMap<.05));
 globeCanvas.style.opacity=globeOpacity;globeCanvas.hidden=globeOpacity<.005;globeCanvas.setAttribute('aria-hidden',String(globeOpacity<.05));
 earth.canvas.style.opacity=globeOpacity;earth.canvas.hidden=globeOpacity<.005;
 const control=M.globeControl(p,journeyAnchors),interactive=globeOpacity>.05&&control.weight>.04;
 globeCanvas.style.pointerEvents=interactive?'auto':'none';globeCanvas.tabIndex=interactive?0:-1;
 globeHelp.hidden=!interactive;globeHome.hidden=!globeTurns[control.owner];
 $('#globeDragHint').textContent=innerWidth<=800?'좌우로 지구 회전 · 위로 올려 계속':'드래그로 지구 둘러보기';
 paintMap(p,mapOpacity);paintGlobe(p,globeOpacity);
 const figure=$('#journeyPhoto');figure.style.opacity=photographic.opacity;figure.dataset.view=photographic.opacity>.995?'full':'transition';figure.setAttribute('aria-hidden',String(photographic.opacity<.05));
 if(photographic.key&&lastPhoto!==photographic.key){
  lastPhoto=photographic.key;const photo=photos[lastPhoto];figure.dataset.photoKey=lastPhoto;
  photoDelivery.show(figure.querySelector('.photo-surface>img'),photo.file,photo.alt);
  $('#journeyCredit').innerHTML='<span>'+photo.credit+'</span><a href="'+refUrl(photo.source)+'" target="_blank" rel="noopener">원본 보도 ↗</a>';
 }
 figure.style.pointerEvents=photographic.opacity>.9?'auto':'none';
 const gateLayer=$('#schoolGate');gateLayer.hidden=!gate.visible;gateLayer.dataset.mode=gate.mode;
 gateLayer.style.opacity=gate.opacity;
 // Two stills share a school/camera composition. No simulated rotating gates.
 $('#gateOpenStill').style.opacity=gate.mode==='ending'?gate.open:0;
 $('#gateSymbolNote').hidden=!gate.visible||(gate.mode==='opening'&&p>journeyAnchors.opening+.9);
 $('#gateSymbolNote').textContent='교문은 AI로 생성한 이미지.';
 const statOpacity=p>=korea&&p<=korea+1?M.koreaReveal(p-korea):p>korea+1&&p<returnWorld?1-M.ease((p-korea-1.3)/.45):0;
 $('#koreaStat').hidden=statOpacity<=0;$('#koreaStat').style.opacity=statOpacity;
 $('#storyProgress').style.width=(p/(journeyStates.length-1)*100)+'%';
 $('.journey-top').style.setProperty('--intro-scale',p<entry?1-M.ease(openingProgress)*.2:1);
 stage.dataset.position=p.toFixed(6);
}

function queueDragPaint(){if(!dragPaint)dragPaint=requestAnimationFrame(()=>{dragPaint=0;paint(visual)})}
function saveGlobeTurn(pose,base){
 if(base.owner<0||base.weight<=.04)return;
 // Store the unweighted offset so a drag begun halfway through a scroll
 // moves by the pointer delta without applying the handoff fade twice.
 globeTurns[base.owner]={lon:base.turnLon+M.wrapLongitude(pose.lon-base.lon)/base.weight,lat:base.turnLat+(pose.lat-base.lat)/base.weight};
 stage.dataset.globeTurned='true';globeHome.hidden=false;
}
globeCanvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||globeCanvas.style.pointerEvents!=='auto')return;
 const f=globeFrame(visual),box=globeCanvas.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;
 if(Math.hypot(x-f.cx,y-f.cy)>f.scale)return;
 cancelSeek();drag={id:event.pointerId,x:event.clientX,y:event.clientY,pose:f,base:f,touch:event.pointerType==='touch',started:false};
 globeCanvas.setPointerCapture(event.pointerId);globeCanvas.classList.add('dragging');
});
globeCanvas.addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
 if(!drag.started){if(drag.touch&&(Math.abs(dx)<8||Math.abs(dy)>Math.abs(dx)))return;if(!drag.touch&&Math.hypot(dx,dy)<3)return;drag.started=true}
 const pose=M.dragOrientation(drag.pose,dx,dy,drag.pose.scale,drag.touch);
 saveGlobeTurn(pose,drag.base);queueDragPaint();
});
function releaseGlobe(event){if(!drag||event.pointerId!==drag.id)return;drag=null;globeCanvas.classList.remove('dragging');if(globeCanvas.hasPointerCapture(event.pointerId))globeCanvas.releasePointerCapture(event.pointerId);queueDragPaint()}
globeCanvas.addEventListener('pointerup',releaseGlobe);globeCanvas.addEventListener('pointercancel',releaseGlobe);
globeCanvas.addEventListener('keydown',event=>{
 if(globeCanvas.style.pointerEvents!=='auto')return;
 const keys={ArrowLeft:[25,0],ArrowRight:[-25,0],ArrowUp:[0,18],ArrowDown:[0,-18]};if(!keys[event.key])return;
 event.preventDefault();event.stopPropagation();cancelSeek();const f=globeFrame(visual),[dx,dy]=keys[event.key];saveGlobeTurn(M.dragOrientation(f,dx,dy,100),f);queueDragPaint();
});
globeHome.onclick=()=>{delete globeTurns[M.globeControl(visual).owner];stage.dataset.globeTurned='false';paint(visual)};

function resize(){
 requested=null;
 const beforeStep=+(story.dataset.step||step()),raw=beforeStep?(scrollY-origin())/beforeStep:0,previous=readingClock,changed=phoneLayout!==mobileViewport.matches;
 phoneLayout=mobileViewport.matches;readingClock=M.readingTrack(journeyStates,phoneLayout);scrollOrigin=story.offsetTop-(phoneLayout?0:104);
 story.style.height=(readingClock.end*step()+innerHeight-(phoneLayout?0:104))+'px';story.dataset.step=step();story.dataset.holdAfter=M.holdAfter;story.dataset.transitionSpan=M.transitionSpan;story.dataset.readingStarts=JSON.stringify(readingClock.starts);story.dataset.readingHolds=JSON.stringify(readingClock.holds);
 if(raw>0&&raw<=previous.end)scrollTo({top:origin()+M.rebaseScroll(raw,previous,readingClock)*step(),behavior:'instant'});
 visual=target=M.positionOnTrack((scrollY-origin())/step(),readingClock);
 if(changed)setState(M.readingIndex(visual,journeyStates));
 queueMobileLayout();
 photoDelivery.layout($('#journeyPhoto .photo-surface>img'));paint(visual);
}
addEventListener('wheel',cancelSeek,{passive:true});addEventListener('touchstart',cancelSeek,{passive:true});
addEventListener('scroll',readScroll,{passive:true});addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);clearTimeout(scrollIdle);raf=0;scrollIdle=0;scrollMoving=false;requested=null;if(!document.hidden){readScroll();}});
addEventListener('hashchange',()=>{const index=journeyStates.findIndex(s=>s.id===location.hash.slice(1));if(index>=0&&index!==current)seek(index)});
addEventListener('pageshow',()=>{requestAnimationFrame(()=>{target=M.positionOnTrack((scrollY-origin())/step(),readingClock);visual=target;paint(visual)})});
reduceMotion.addEventListener('change',()=>{cancelSeek();readScroll()});

function pathFromGeo(g){const ring=r=>'M'+r.map(p=>mapProjection.project(...p).map(v=>+v.toFixed(3)).join(',')).join('L')+'Z';return(g.type==='Polygon'?[g.coordinates]:g.coordinates).map(p=>p.map(ring).join('')).join('')}
Promise.all([fetch('assets/map-mercator.json').then(r=>r.json()),fetch('assets/city-boundaries.geojson').then(r=>r.json()),fetch('assets/france-departments-map.json').then(r=>r.json())]).then(([countries,cities,departments])=>{
 const municipal=cities.features.map(f=>({d:pathFromGeo(f.geometry),city:f.properties.storyCity,code:f.properties.code}));
 geometry={countries,municipal,departments};mapRenderer=createStoryMap(mapCanvas,countries,municipal,departments);
 // Keep the geographic key readable above the text shade, then fade it with
 // the map so it cannot remain over a photograph or the symbolic gate.
 $('#mapLegend').append(mapField.querySelector('.map-reference'));paint(visual);
}).catch(()=>{$('#geometryError').hidden=false});
fetch('assets/globe-countries.geojson').then(r=>r.json()).then(data=>{globeData=data;paint(visual)}).catch(()=>{$('#globeError').hidden=false});
setState(0);resize();
const initialIndex=journeyStates.findIndex(s=>s.id===initialScene);if(initialIndex>=0)seek(initialIndex);else readScroll();
