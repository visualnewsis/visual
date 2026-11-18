'use strict';
// Scroll positions describe the reader's view, never a protester's journey.
const gateJourneyModel=(()=>{
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
 const globeScaleForCamera=(k,latitude,unitsPerDegree=58)=>unitsPerDegree*180/(Math.PI*Math.cos(latitude*Math.PI/180)*k);
 const wrapLongitude=n=>((n+180)%360+360)%360-180;
 function storyAnchors(states){
  const at=id=>{const i=states.findIndex(s=>s.id===id);if(i<0)throw new Error('Missing reading scene: '+id);return i};
  return{entry:at('france-entry'),opening:at('closed-gate'),korea:at('korea-world'),returnWorld:at('return-world'),returnMap:at('return-creteil'),promise:at('gate-promise'),evidence:at('gate-evidence'),end:at('gate-open')};
 }
 const introProgress=(p,anchors)=>clamp(p-anchors.entry+1);
 // Phones reserve compact publishing bars only around the opening/ending.
 function mobileBookendWeight(p,states){
  const lastCover=states.findLastIndex(s=>s.coverReading),ending=states.findIndex(s=>s.id==='gate-open');
  return Math.max(lastCover>=0?1-ease(p-lastCover):0,ending>=0?ease(p-ending+1):0);
 }
 const frameInset=(p,states,mobile=false)=>mobile?52*mobileBookendWeight(p,states):104*(1-interludeOpacity(p,states));
 function mobilePhotoBox(w,h,headingBottom,copyTop,aspect=1.3,portrait=false){
  if(w>=500&&w/h>1.4&&h<540){const width=w*.5,height=Math.min(h-44,width/aspect);return{left:0,top:(h-height)/2,width,height}}
  const top=Math.max(headingBottom+18,100),bottom=Math.min(copyTop-18,h-42),room=Math.max(0,bottom-top),height=Math.min(w/aspect*(portrait?1.13:1),room);
  return{left:0,top:top+(room-height)*.4,width:w,height};
 }
 const coverReading=(p,offset,anchors)=>p>=anchors.entry-1||offset>1?'korean':'france';
 function interludeOpacity(p,states){let opacity=0;for(let i=Math.max(0,Math.floor(p)-1);i<=Math.min(states.length-1,Math.ceil(p)+1);i++)if(states[i].type==='interlude')opacity=Math.max(opacity,ease((1-Math.abs(p-i))/.5));return opacity}
 // Each voice has its own native reading stop. A short unlit interval
 // separates voices; stopping the scroll never starts an automatic replay.
 function spotlightFrame(p,states){
  const index=readingIndex(p,states);
  if(states[index]?.type!=='interlude'||states[index].spotlightBlank)return{index,light:0,text:0};
  const distance=Math.abs(p-index);
  return{index,light:ease((.46-distance)/.055),text:ease((.42-distance)/.045)};
 }
 // Stable reading stops use scroll distance, with no timer or input capture.
 // Transition distance stays unchanged when step() includes the reading hold.
 const holdAfter=.17,transitionSpan=.75;
 function readingPosition(raw){const i=Math.floor(raw);return i+clamp((raw-i-holdAfter)/transitionSpan)}
 function scrollPosition(p){const i=Math.floor(p),t=p-i;return t?i+holdAfter+t*transitionSpan:i}
 // Extra distance holds the Korean title and each spotlight before departure.
 // Moving between scenes keeps the same distance, including dark intervals.
 const spotlightHold=.32,coverHold=.4;
 function readingTrack(states,mobile=false){
  const holds=states.map(s=>s.type==='interlude'&&!s.spotlightBlank?spotlightHold+(mobile?.2:0):s.id==='world-korean'?coverHold+(mobile?.16:0):mobile&&s.type==='photo'?.18:0);let distance=0;
  const starts=states.map((s,i)=>{const start=distance;distance+=1+holds[i];return start});
  return{starts,holds,end:(starts.at(-1)||0)+(mobile?.72:0)};
 }
 function positionOnTrack(raw,track){
  raw=clamp(raw,0,track.end);let low=0,high=track.starts.length-1;
  while(low<high){const mid=Math.ceil((low+high)/2);if(track.starts[mid]<=raw)low=mid;else high=mid-1}
  if(low===track.starts.length-1)return low;
  return low+clamp((raw-track.starts[low]-holdAfter-track.holds[low])/transitionSpan);
 }
 function scrollOnTrack(p,track){
  p=clamp(p,0,track.starts.length-1);const i=Math.floor(p),t=p-i;
  return track.starts[i]+(t?holdAfter+track.holds[i]+t*transitionSpan:0);
 }
 function rebaseScroll(raw,from,to){
  const p=positionOnTrack(raw,from),i=Math.floor(p);
  if(p!==i)return scrollOnTrack(p,to);
  const last=i===from.starts.length-1,oldHold=last?from.end-from.starts[i]:holdAfter+from.holds[i],newHold=last?to.end-to.starts[i]:holdAfter+to.holds[i];
  return to.starts[i]+(oldHold?clamp((raw-from.starts[i])/oldHold)*newHold:0);
 }
 function globeControl(p,anchors){
  const {entry,korea,returnWorld}=anchors;
  const owner=p>=0&&p<entry?0:p>korea-1&&p<korea+1?korea:p>returnWorld-1&&p<returnWorld+1?returnWorld:-1;
  const weight=owner===0?1-ease(introProgress(p,anchors)):owner>0?1-ease(Math.abs(p-owner)):0;
  return{owner,weight};
 }
 function dragOrientation(pose,dx,dy,radius,touch=false){return{lon:wrapLongitude(pose.lon-dx/Math.max(1,radius)*80),lat:clamp(pose.lat+(touch?0:dy/Math.max(1,radius)*65),-82,82)}}
 function geographicAt(x,y,pose){
  const rr=x*x+y*y;if(rr>1)return null;
  const rad=Math.PI/180,lat0=pose.lat*rad,z=Math.sqrt(1-rr);
  return[wrapLongitude(pose.lon+Math.atan2(x,z*Math.cos(lat0)-y*Math.sin(lat0))/rad),Math.asin(clamp(y*Math.cos(lat0)+z*Math.sin(lat0),-1,1))/rad];
 }
 function centeredCamera(center,focus,width,height,w,h){
  const safeW=w*.92,safeH=h-(w<=800?250:100);
  const k=Math.max((width+2*Math.abs(focus[0]-center[0]))/safeW,(height+2*Math.abs(focus[1]-center[1]))/Math.max(160,safeH));
  return{x:focus[0]-w*k/2,y:focus[1]-h*k/2,k};
 }
 function contextCamera(center,focus,width,height,w,h,reference,position={}){
  // Preserve where this city sits in the shared Europe view. Only constrain
  // its screen position enough to keep names between the reading bands.
  const phone=w<=800,px=clamp((focus[0]-reference.x)/reference.k,w*(phone?.2:.18),w*(phone?.76:.82)),py=clamp((focus[1]-reference.y)/reference.k,h*(position.minY??(phone?.37:.3)),h*(phone?.62:.66));
  const edge=w*.04,top=phone?130:45,bottom=phone?175:45;
  const k=Math.max((focus[0]-center[0]+width/2)/Math.max(1,px-edge),(center[0]+width/2-focus[0])/Math.max(1,w-edge-px),(focus[1]-center[1]+height/2)/Math.max(1,py-top),(center[1]+height/2-focus[1])/Math.max(1,h-bottom-py));
  return{x:focus[0]-px*k,y:focus[1]-py*k,k};
 }
 function zoomAt(base,focus,k,t=1){
  const q=ease(t),scale=Math.exp(Math.log(base.k)*(1-q)+Math.log(k)*q),px=(focus[0]-base.x)/base.k,py=(focus[1]-base.y)/base.k;
  return{x:focus[0]-px*scale,y:focus[1]-py*scale,k:scale};
 }
 function mixCamera(a,b,t){const q=ease(t),k=Math.exp(Math.log(a.k)*(1-q)+Math.log(b.k)*q);return{x:a.x*(1-q)+b.x*q,y:a.y*(1-q)+b.y*q,k}}
 function cameraBetween(a,b,w,h,t){
  const q=ease(t),ax=a.x+w*a.k/2,ay=a.y+h*a.k/2,bx=b.x+w*b.k/2,by=b.y+h*b.k/2;
  const distance=Math.hypot(bx-ax,by-ay),wide=Math.max(a.k,b.k,distance/Math.min(w*.85,h*.9));
  const pullback=wide>Math.max(a.k,b.k)*1.8;
  let k;
  if(pullback)k=t<.38?Math.exp(Math.log(a.k)*(1-ease(t/.38))+Math.log(wide)*ease(t/.38)):Math.exp(Math.log(wide)*(1-ease((t-.38)/.62))+Math.log(b.k)*ease((t-.38)/.62));
  else k=Math.exp(Math.log(a.k)*(1-q)+Math.log(b.k)*q);
  return{x:ax*(1-q)+bx*q-w*k/2,y:ay*(1-q)+by*q-h*k/2,k};
 }
 function advance(p,target,elapsed,reduced=false,pace=3){if(reduced)return target;const delta=Math.max(0,Math.min(48,elapsed))/1000*pace;return p+Math.max(-delta,Math.min(delta,target-p))}
 const cityScale=(w,h)=>Math.max(24/(w*.92),22/Math.max(160,h-(w<=800?250:100)));
 function countryFlagOpacity(cam,w,h){return .82*ease((cam.k/cityScale(w,h)-3)/5)}
 function cityCamera(base,w,h,focus=[base.x+w*base.k/2,base.y+h*base.k/2],depth=1){
  const k=Math.min(base.k,cityScale(w,h)*depth);
  return zoomAt(base,focus,k);
 }
 const cityReveal=t=>ease((t-.74)/.26);
 const koreaReveal=t=>ease((t-.86)/.14);
 const koreaZoom=t=>ease(t/.86);
 const koreaFlat=t=>ease((t-.38)/.24);
 function koreaRadius(w,h){return Math.min(w*.68/(3.5*Math.PI/180*Math.cos(36.4*Math.PI/180)),h*.65/(5.5*Math.PI/180))}
 function readingBoundary(a,b){
  if(cityArrival(a,b))return .94;
  if(a?.type==='photo'&&b?.type==='map')return .9;
  return a?.globe==='korea'&&b?.type==='stat'?.93:.5;
 }
 function readingIndex(p,states){
  const i=Math.floor(clamp(p,0,states.length-1)),a=states[i],b=states[i+1],t=p-i;
  if(!b)return i;
  const threshold=readingBoundary(a,b);
  return t<threshold?i:i+1;
 }
 function readingOpacity(p,states,moving=true){
  const i=Math.floor(clamp(p,0,states.length-1)),a=states[i],b=states[i+1];
  if(!b)return 1;
  const t=p-i,boundary=readingBoundary(a,b);
  // A photographic handoff has one scroll-controlled visual owner. Pausing
  // must not relight the old headline over the next country's map.
  if(cityArrival(a,b))return t<boundary?1-ease(photoFrameAt(p,states).opacity/.65):ease((t-boundary)/(1-boundary));
  if(a.type==='photo'&&b.type==='map')return t<boundary?ease(photoFrameAt(p,states).opacity):ease((t-boundary)/(1-boundary));
  if(!moving)return 1;
  if(a.coverReading&&b.coverReading)return 1;
  return ease(Math.abs(p-i-boundary)/Math.min(.07,1-boundary));
 }
 function cityArrival(a,b){return !!(a?.cityArrival&&b?.type==='photo'&&a.selected===b.city)}
 function mapFrameAt(p,states,cameraFor,w,h,focusFor){
  const i=Math.floor(p),t=p-i,a=states[i],b=states[i+1],active=readingIndex(p,states);
  const before=n=>{for(let k=n;k>=0;k--)if(states[k].type==='map')return k;return-1};
  const after=n=>{for(let k=n;k<states.length;k++)if(states[k].type==='map')return k;return-1};
  // The next country owns the returning map while the outgoing photo still
  // covers it. Copy changes later, once that map has actually been revealed.
  const index=a?.type==='photo'&&b?.type==='map'?i+1:states[active].type==='map'?active:before(i)>=0?before(i):after(i+1);
  if(index<0)return null;
  let cam=cameraFor(states[index]),labels=index,labelOpacity=1;
  let departureIndex=i;while(states[departureIndex]?.type==='interlude')departureIndex--;
  const departurePhoto=states[departureIndex]?.type==='photo'?states[departureIndex]:null;
  if(departurePhoto&&cityArrival(states[index],departurePhoto))cam=cityCamera(cam,w,h,focusFor?.(states[index]),states[index].cityZoom??1);
  if(b?.type==='map'&&a?.type!=='globe'&&a?.type!=='stat'){
   const from=a.type==='map'?i:before(i);
   if(from>=0){
    const base=cameraFor(states[from]),focus=focusFor?.(states[from]),nextFocus=focusFor?.(b),start=departurePhoto&&cityArrival(states[from],departurePhoto)?cityCamera(base,w,h,focus,states[from].cityZoom??1):base,end=cameraFor(b);
    const distance=Math.hypot(start.x+w*start.k/2-end.x-w*end.k/2,start.y+h*start.k/2-end.y-h*end.k/2);
    const sameFocus=focus&&nextFocus&&Math.hypot(focus[0]-nextFocus[0],focus[1]-nextFocus[1])<1e-7&&Math.abs((focus[0]-start.x)/start.k-(focus[0]-end.x)/end.k)<1e-7&&Math.abs((focus[1]-start.y)/start.k-(focus[1]-end.y)/end.k)<1e-7;
    if(sameFocus)cam=zoomAt(start,focus,end.k,t);
    else if(distance>1e-7){
     // Hide departure names before motion; show arrival names after settling.
     cam=cameraBetween(start,end,w,h,clamp((t-.08)/.84));
     labels=t<.08?from:i+1;labelOpacity=t<.08?1-ease(t/.08):ease((t-.92)/.08);
    }else cam=cameraBetween(start,end,w,h,t);
   }
  }
  if(cityArrival(a,b)){const base=cameraFor(a),focus=focusFor?.(a)||[base.x+w*base.k/2,base.y+h*base.k/2],close=cityCamera(base,w,h,focus,a.cityZoom??1);cam=zoomAt(base,focus,close.k,t);labels=i}
  return{cam,index,labels,labelOpacity};
 }
 function photoFrameAt(p,states){
  const i=Math.floor(p),t=p-i,a=states[i],b=states[i+1];
  if(a?.gate==='opening'&&b?.type==='photo')return{key:b.photo,opacity:ease(t/.5)};
  if(cityArrival(a,b))return{key:b.photo,opacity:cityReveal(t)};
  // Pull back from the city behind the photograph first. Revealing the map
  // too early exposes a flat pale close-up between two country chapters.
  if(a?.type==='photo'&&(b?.type==='map'||b?.type==='globe'))return{key:a.photo,opacity:1-ease((t-.52)/.38)};
  if(a?.type==='photo')return{key:a.photo,opacity:b&&b.type!=='photo'?1-ease((t-.35)/.65):1};
  if(b?.type==='photo')return{key:b.photo,opacity:ease((t-.15)/.85)};
  return{key:null,opacity:0};
 }
 // A closed symbolic gate reveals a separately dated documentary photograph.
 function gateAt(p,anchors){
  const {opening,promise,evidence,end}=anchors;
  if(p>=opening-.35&&p<opening+1.4)return{visible:true,open:ease(p-opening),opacity:1-ease((p-opening-.25)/.65),mode:'opening'};
  if(p>=promise-.35&&p<=end)return{visible:true,open:ease((p-evidence-.55)/.4),opacity:ease((p-promise+.35)/.35),mode:'ending'};
  return{visible:false,open:0,opacity:0,mode:'none'};
 }
 return{clamp,ease,storyAnchors,introProgress,frameInset,mobileBookendWeight,mobilePhotoBox,coverReading,interludeOpacity,spotlightFrame,holdAfter,transitionSpan,readingPosition,scrollPosition,spotlightHold,coverHold,readingTrack,positionOnTrack,scrollOnTrack,rebaseScroll,globeScaleForCamera,wrapLongitude,globeControl,dragOrientation,geographicAt,centeredCamera,contextCamera,zoomAt,mixCamera,cameraBetween,advance,gateAt,cityScale,countryFlagOpacity,cityCamera,cityReveal,koreaReveal,koreaZoom,koreaFlat,koreaRadius,readingBoundary,readingIndex,readingOpacity,cityArrival,mapFrameAt,photoFrameAt};
})();
if(typeof module!=='undefined')module.exports=gateJourneyModel;
