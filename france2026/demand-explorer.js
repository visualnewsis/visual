'use strict';
function createDemandExplorer({stage,mapField,top,bottom,places,project,repaint,openScene}){
 const A=demandAtlas,controls=document.createElement('div'),detail=document.createElement('section'),layer=document.createElement('div');
 let active=false,state=A.choose('education'),layoutFrame=0;
 controls.className='demand-controls';controls.hidden=true;
 controls.innerHTML='<div class="demand-topics" role="group" aria-label="비교할 요구 선택"></div><p class="demand-context"></p><p class="demand-guide">요구를 고르고 도시를 눌러 비교 <span></span></p>';
 detail.className='demand-detail';detail.hidden=true;detail.setAttribute('aria-label','선택한 도시의 요구');detail.setAttribute('aria-live','polite');detail.setAttribute('aria-atomic','true');
 detail.innerHTML='<p class="demand-location"></p><h2 class="demand-fact"></h2><p class="demand-scope"></p><div class="demand-detail-footer"><p class="demand-overlap"></p><button class="demand-open" type="button">현장 보기 <span aria-hidden="true">→</span></button></div>';
 layer.className='demand-pins';layer.hidden=true;layer.setAttribute('aria-label','선택한 요구가 확인된 도시');
 stage.prepend(controls);bottom.prepend(detail);mapField.append(layer);
 const openButton=detail.querySelector('.demand-open');openButton.hidden=true;bottom.querySelector('.journey-actions').insertBefore(openButton,bottom.querySelector('#photoReturn'));
 const topicButtons=A.topics.map(t=>{const b=document.createElement('button');b.type='button';b.dataset.topic=t.id;b.textContent=t.label;b.setAttribute('aria-pressed','false');b.onclick=()=>select(t.id,state.city);controls.firstElementChild.append(b);return b});
 const pinEntries=A.records.map(r=>{
  const b=document.createElement('button');b.type='button';b.className='demand-pin';b.dataset.city=r.city;b.dataset.side=r.side;b.innerHTML='<i aria-hidden="true"></i><span><b></b><small></small></span>';
  b.querySelector('b').textContent=places[r.city].name;b.querySelector('small').textContent=r.name;b.querySelector('span').style.top=r.offset+'px';b.onclick=()=>select(state.topic,r.city);layer.append(b);return{record:r,button:b};
 });
 openButton.onclick=()=>{const f=A.fact(state);if(f)openScene(f.scene)};
 function select(topic,city){state=A.choose(topic,city);render();layout();repaint()}
 function render(){
  const topic=A.topics.find(t=>t.id===state.topic),matches=A.matches(state.topic),f=A.fact(state);
  controls.querySelector('.demand-context').textContent=topic.context;
  controls.querySelector('.demand-guide span').textContent='기사 속 '+matches.length+'개국';
  for(const b of topicButtons)b.setAttribute('aria-pressed',String(b.dataset.topic===state.topic));
  for(const {record:r,button:b}of pinEntries){const match=!!r.demands[state.topic],selected=r.city===state.city;b.hidden=!match;b.tabIndex=match&&active?0:-1;b.setAttribute('aria-pressed',String(selected));b.setAttribute('aria-label',r.name+' '+places[r.city].name+(match?' · '+r.demands[state.topic].text:''));}
  detail.querySelector('.demand-location').textContent=f.record.name+' · '+places[f.record.city].name+' · '+f.date;
  detail.querySelector('.demand-fact').textContent=f.text;
  detail.querySelector('.demand-scope').textContent=f.scope;
  const others=A.topics.filter(t=>f.record.demands[t.id]&&t.id!==state.topic).map(t=>t.label);
  detail.querySelector('.demand-overlap').textContent=others.length?'이 도시의 다른 요구: '+others.join(' · '):'';
  detail.querySelector('.demand-detail-footer').hidden=!others.length;
  openButton.setAttribute('aria-label',f.record.name+' '+places[f.record.city].name+'의 기존 장면 보기');
  stage.dataset.demandTopic=state.topic;stage.dataset.demandCity=state.city;
 }
 function layout(){
  if(!active)return;
  const topY=top.offsetTop+top.offsetHeight+12;controls.style.top=topY+'px';
 }
 const observer=new ResizeObserver(()=>{if(!active||layoutFrame)return;layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;layout();repaint()})});observer.observe(top);observer.observe(bottom);observer.observe(controls);
 function camera(w,h){
  const rect=A.viewport(w,h,document.body.dataset.layout==='mobile');
  return A.overviewCamera(A.records.map(r=>project(places[r.city].lon,places[r.city].lat)),rect);
 }
 function paint(cam,opacity){
  layer.hidden=!active||opacity<.05;if(layer.hidden)return;layer.style.opacity=opacity;layer.inert=opacity<.8;
  for(const {record:r,button:b}of pinEntries){if(b.hidden)continue;const [x,y]=project(places[r.city].lon,places[r.city].lat);b.style.left=(x-cam.x)/cam.k+'px';b.style.top=(y-cam.y)/cam.k+'px';}
 }
 render();
 return{
  setActive(value){active=value;controls.hidden=detail.hidden=openButton.hidden=!value;layer.hidden=true;stage.dataset.demandExplorer=String(value);controls.inert=detail.inert=!value;render();if(value)layout()},
  get active(){return active},get sourceScene(){return A.fact(state).scene},get countries(){return A.matches(state.topic).map(r=>r.country)},camera,paint,layout
 };
}
