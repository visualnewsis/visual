/* Native touch scrolling; mouse dragging and keyboard year selection use the same annual data. */
(() => {
 const $=id=>document.getElementById(id),viewport=$('growth-chart-viewport');
 const bars=[...viewport.querySelectorAll('[data-growth-year]')];
 const prev=$('growth-prev'),next=$('growth-next'),summary=$('growth-summary');
 const story=$('growth-time-story'),timeFrame=$('growth-time-frame'),dayCounter=$('growth-elapsed-days');
 const elapsedPeriod=$('growth-elapsed-period'),totalPeriod=$('growth-total-period');
 const dates=[...timeFrame.querySelectorAll('time')],motion=matchMedia('(prefers-reduced-motion: reduce)');
 const dayMs=86400000,start=Date.parse(dates[0].getAttribute('datetime')+'T00:00:00Z'),end=Date.parse(dates[1].getAttribute('datetime')+'T00:00:00Z');
 const totalDays=Math.round((end-start)/dayMs);
 let timeFrameRequest=0,manualAtY=null;
 let selected=-1,frame=0,drag=null,suppressClickUntil=0,programmedScroll=null;
 const yearStories={
  2011:['열여덟의 첫 골.','아시안컵 인도전에서 A매치 첫 골을 넣었다.'],
  2012:['득점 없이 보낸 한 해.','이 해에는 A매치 득점이 없었다.'],
  2013:['추가시간에 터진 결승골.','카타르전 후반 추가시간에 결승골을 넣었다.'],
  2014:['첫 월드컵 골, 2:4 패배.','알제리전에서 첫 월드컵 골을 넣었지만 한국은 2:4로 졌다.'],
  2015:['결승의 동점골에서 첫 해트트릭까지.','아시안컵 결승 호주전에서 동점골을, 라오스전에서 첫 해트트릭을 기록했다.'],
  2016:['이 해의 한 골은 결승골이었다.','카타르와 2:2로 맞선 월드컵 예선. 손흥민의 골이 한국의 3:2 승리를 만들었다.'],
  2017:['콜롬비아전의 두 골.','수원에서 열린 콜롬비아전 2:1 승리. 한국이 넣은 두 골 모두 손흥민의 몫이었다.'],
  2018:['월드컵에서 두 골.','멕시코전에서는 1:2로 졌고, 독일전에서는 2:0으로 이겼다. 두 경기 모두 골을 넣었다.'],
  2019:['아홉 달 만에 다시 골.','독일전 이후 콜롬비아전에서 다시 골을 넣었다. 한국은 2:1로 이겼다.'],
  2020:['이 해에도 득점은 0골.','이 해에는 A매치 득점이 없었다. 누적 득점은 26골에 머물렀다.'],
  2021:['레바논전 역전골, 시리아전 결승골.','레바논전에서 역전 페널티킥을, 시리아전에서 막판 결승골을 넣었다.'],
  2022:['A매치 100번째 경기, 프리킥 골.','칠레전 후반 추가시간 프리킥. A매치 100번째 경기를 2:0 승리로 마쳤다.'],
  2023:['한 경기에서 양발로 만든 두 골.','콜롬비아전 왼발 슛과 오른발 프리킥. 두 골을 앞섰지만 경기는 2:2로 끝났다.'],
  2024:['한 해 가장 많은 열 골.','호주전 연장 프리킥 결승골을 포함해 10골. 첫 골 이후 연간 A매치 득점이 가장 많았던 해다.'],
  2025:['세 경기에서 한 골씩.','미국·멕시코·볼리비아전에서 한 골씩 넣었다. 누적 득점은 54골.'],
  2026:['나란히 선 뒤, 넘어섰다.','우루과이전에서 58호골로 공동 1위, 우즈베키스탄전에서 59호골로 단독 1위에 올랐다.']
 };
 function calendarPeriod(days){
  const first=new Date(start),last=new Date(start+days*dayMs);
  let months=(last.getUTCFullYear()-first.getUTCFullYear())*12+last.getUTCMonth()-first.getUTCMonth();
  if(last.getUTCDate()<first.getUTCDate())months--;
  months=Math.max(0,months);
  return months>=12?`${Math.floor(months/12)}년 ${months%12}개월`:months?`${months}개월`:'1개월 미만';
 }
 totalPeriod.textContent=`(${calendarPeriod(totalDays)})`;
 function showTime(timestamp){
  // The opening counter starts at one; the endpoint remains the actual date difference.
  const days=Math.max(1,Math.min(totalDays,Math.round((timestamp-start)/dayMs)));
  const text=String(days);if(dayCounter.textContent!==text)dayCounter.textContent=text;
  const period=`(${calendarPeriod(days)})`;if(elapsedPeriod.textContent!==period)elapsedPeriod.textContent=period;
 }
 function selectYear(index,reveal=false,fromScroll=false){
  select(index,reveal);
  if(!fromScroll){
   manualAtY=scrollY;
   const year=Number(bars[selected].dataset.growthYear);
   showTime(selected===0?start:Math.min(end,Date.UTC(year,11,31)));
  }
 }
 function select(index,reveal=false){
  index=Math.max(0,Math.min(bars.length-1,index));
  if(index!==selected){
   selected=index;
   bars.forEach((bar,i)=>bar.setAttribute('aria-pressed',String(i===index)));
   const data=bars[index].dataset;
   $('growth-reading-year').textContent=data.growthYear;
   $('growth-reading-annual').textContent=data.growthGoals;
   $('growth-reading-total').textContent=data.growthTotal;
   $('growth-total-label').textContent=data.growthYear==='2026'?'10월 6일 누적':'연말 누적';
   $('growth-chart-position').textContent=`${data.growthYear} / 2026`;
   const [title,context]=yearStories[data.growthYear];
   $('growth-year-title').textContent=title;
   $('growth-year-description').textContent=context;
   prev.disabled=index===0;next.disabled=index===bars.length-1;
  }
  if(reveal){
   const view=viewport.getBoundingClientRect(),bar=bars[index].getBoundingClientRect();
   const target=viewport.scrollLeft+bar.left-view.left-(viewport.clientWidth-bar.width)/2;
   const left=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,target));
   programmedScroll=left;viewport.scrollTo({left,behavior:'instant'});
  }
 }
 function readPosition(){
  frame=0;
  if(programmedScroll!==null){const intended=programmedScroll;programmedScroll=null;if(Math.abs(viewport.scrollLeft-intended)<2)return;}
  // A fitted desktop chart has no scroll distance; keep the hovered or chosen year.
  if(viewport.scrollWidth<=viewport.clientWidth+1)return;
  if(viewport.scrollLeft<=1){selectYear(0);return;}
  if(viewport.scrollLeft>=viewport.scrollWidth-viewport.clientWidth-1){selectYear(bars.length-1);return;}
  const view=viewport.getBoundingClientRect(),center=view.left+view.width/2;
  let closest=0,distance=Infinity;
  bars.forEach((bar,i)=>{const rect=bar.getBoundingClientRect(),d=Math.abs(rect.left+rect.width/2-center);if(d<distance){closest=i;distance=d;}});
  selectYear(closest);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(readPosition);}
 bars.forEach((bar,i)=>{
  bar.addEventListener('click',()=>{if(performance.now()<suppressClickUntil)return;selectYear(i);});
  bar.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&!drag)selectYear(i);});
 });
 function responsiveControls(){
  const scrolls=viewport.scrollWidth>viewport.clientWidth+1;
  $('growth-chart-hint').textContent=story.classList.contains('is-enhanced')
    ? '스크롤로 시간 따라가기 · 연도를 눌러 선택'
    : scrolls?'옆으로 넘겨 연도 선택':'연도를 눌러 선택';
 }
 prev.addEventListener('click',()=>selectYear(selected-1,true));
 next.addEventListener('click',()=>selectYear(selected+1,true));
 viewport.addEventListener('scroll',schedule,{passive:true});
 viewport.addEventListener('keydown',event=>{
  const keys={ArrowLeft:selected-1,ArrowRight:selected+1,Home:0,End:bars.length-1};
  if(!(event.key in keys))return;
  event.preventDefault();selectYear(keys[event.key],true);bars[selected].focus({preventScroll:true});
 });
 viewport.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='mouse'||event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,start:viewport.scrollLeft,moving:false};
 });
 viewport.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moving&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy)){
   drag.moving=true;viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');summary.setAttribute('aria-live','off');
  }
  if(drag.moving){
   event.preventDefault();
   if(viewport.scrollWidth<=viewport.clientWidth+1){
    let closest=0,distance=Infinity;
    bars.forEach((bar,i)=>{const rect=bar.getBoundingClientRect(),d=Math.abs(rect.left+rect.width/2-event.clientX);if(d<distance){closest=i;distance=d;}});
    selectYear(closest);
   }else{viewport.scrollLeft=drag.start-dx;schedule();}
  }
 });
 function endDrag(event){
  if(!drag||event.pointerId!==drag.id)return;
  if(drag.moving){suppressClickUntil=performance.now()+250;viewport.classList.remove('is-dragging');summary.setAttribute('aria-live','polite');schedule();}
  drag=null;
 }
 viewport.addEventListener('pointerleave',()=>{if(drag&&!drag.moving)drag=null;});
 viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);viewport.addEventListener('lostpointercapture',endDrag);
 function readTime(){
  timeFrameRequest=0;
  const bounds=story.getBoundingClientRect();
  document.documentElement.classList.toggle('is-reading-growth',story.classList.contains('is-enhanced')&&bounds.top<innerHeight&&bounds.bottom>sonReadingTop());
  if(!story.classList.contains('is-enhanced'))return;
  if(manualAtY!==null&&Math.abs(scrollY-manualAtY)<2)return;
  manualAtY=null;
  const top=parseFloat(getComputedStyle(timeFrame).top)||sonReadingTop();
  const travel=Math.max(1,story.offsetHeight-timeFrame.offsetHeight);
  // Reserve the last 65% of a viewport for reading the completed date/count.
  const countTravel=Math.max(1,travel-innerHeight*.65);
  const progress=Math.max(0,Math.min(1,(top-bounds.top)/countTravel));
  const timestamp=start+Math.round(progress*totalDays)*dayMs;
  const year=new Date(timestamp).getUTCFullYear(),index=Math.max(0,Math.min(bars.length-1,year-2011));
  selectYear(index,index!==selected&&innerWidth<801,true);showTime(timestamp);
 }
 function scheduleTime(){if(!timeFrameRequest)timeFrameRequest=requestAnimationFrame(readTime);}
 function configureTime(){
  const font=Math.max(parseFloat(getComputedStyle(document.body).fontSize),parseFloat(getComputedStyle(document.documentElement).fontSize));
  story.classList.toggle('is-enhanced',!motion.matches&&innerHeight>=600&&font<=20);
  if(story.classList.contains('is-enhanced')&&timeFrame.scrollHeight>timeFrame.clientHeight+1)story.classList.remove('is-enhanced');
  responsiveControls();
  manualAtY=null;
  if(story.classList.contains('is-enhanced'))readTime();
  else{document.documentElement.classList.remove('is-reading-growth');select(bars.length-1);showTime(end);}
 }
 addEventListener('scroll',scheduleTime,{passive:true});addEventListener('resize',configureTime);
 motion.addEventListener('change',configureTime);
 configureTime();
})();
