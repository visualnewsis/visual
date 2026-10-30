import {T,M,box,cyl,rod,part} from './anatomy-core.js?v=20261028-craft7';
import {projectorAssembly} from './anatomy-optics.js?v=20261030-reviewed11';
import {paintFilmFrame,frameNumber,FILM_FRAME_COUNT} from './projector-frames.js?v=20261028-release3';
import {projectorHeroClock} from './projector-hero-clock.js?v=20261030-reviewed11';
const TAU=Math.PI*2,pitch=.56,clamp=x=>Math.max(0,Math.min(1,x));
function canvas(w=256,h=192){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function sequence(){return Array.from({length:FILM_FRAME_COUNT},(_,i)=>{const c=canvas();paintFilmFrame(c.getContext('2d'),i,c.width,c.height);return c;});}
export function projectorTransport(cycle,mode=0,startFrame=0){
 const c=Math.max(0,Number(cycle)||0),index=Math.floor(c),phase=c-index;
 const clock=projectorHeroClock(c);
 return {index:frameNumber(startFrame+index),phase,progress:Number(mode)===2?phase:clock.progress,shutterRemoved:Number(mode)===1,continuous:Number(mode)===2};
}
function screen(parent,x,y,z,w,h,texture){
 const g=part(parent,'projection screen');g.position.set(x,y,z);
 box(g,w+.16,h+.16,.09,M.black);
 const material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false});
 const panel=new T.Mesh(new T.PlaneGeometry(w,h),material);panel.position.z=-.055;panel.rotation.y=Math.PI;g.add(panel);
 for(const side of [-1,1])rod(parent,[x+side*w*.38,y-h*.5,z],[x+side*w*.38,-1.8,z],.035,M.steel);
 return {group:g,panel};
}
export function buildProjectorGateStudy(){
 const model=projectorAssembly(),hero=model.hardware,{group,parts}=hero,frames=sequence(),output=canvas(512,384),ctx=output.getContext('2d'),texture=new T.CanvasTexture(output);texture.colorSpace=T.SRGBColorSpace;parts.projected.material.map=texture;
 parts.optics.add(parts.screen,parts.beam);
 const opaque=[];parts.shutter.traverse(o=>{if(o.isMesh)opaque.push(o);});const ray=new T.Raycaster();let previousFrame=-1,previousMode=-1;
 function paint(index,mode){
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#080b0b';ctx.fillRect(0,0,512,384);ctx.globalCompositeOperation='lighter';const samples=[];
  for(let k=0;k<64;k++){const p=(k+.5)/64;if(mode===1||projectorHeroClock(p).exposed)samples.push(p);}ctx.globalAlpha=1/samples.length;
  for(const p of samples){const q=projectorTransport(p,mode).progress;ctx.drawImage(frames[index],0,-q*384,512,384);if(q>0)ctx.drawImage(frames[frameNumber(index+1)],0,(1-q)*384,512,384);}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';texture.needsUpdate=true;
 }
 const result={group,allowZoom:true,eye:[7,3.2,10],defaults:{cycle:0,mode:0,fps:12,startFrame:0},parts:{shutter:parts.shutter,intermittent:parts.mechanismMount,film:parts.filmGroup,screen:parts.screen},update(s){
  const state=projectorTransport(s.cycle,s.mode,s.startFrame);model.update({phase:state.phase,explode:0});hero.update({frames:Math.max(0,Number(s.cycle)||0)-.35,startFrame:s.startFrame||0,continuousFilm:state.continuous},false);parts.screen.visible=true;parts.shutter.visible=!state.shutterRemoved;parts.mechanismMount.visible=!state.continuous;
  group.updateMatrixWorld(true);const direction=new T.Vector3(0,0,1).transformDirection(parts.optics.matrixWorld);let covered=0;
  if(!state.shutterRemoved)for(const x of [-.325,0,.325])for(const y of [-.236,0,.236]){const origin=parts.optics.localToWorld(new T.Vector3(x,y,-.03));ray.set(origin,direction);if(ray.intersectObjects(opaque,false).length)covered++;}
  const open=1-covered/9;parts.beam.visible=open>0;parts.beam.material.opacity=.035*open;parts.projected.material.color.setScalar(.045+.955*open);
  if(state.index!==previousFrame||Number(s.mode||0)!==previousMode){paint(state.index,Number(s.mode||0));previousFrame=state.index;previousMode=Number(s.mode||0);}
  s.frameIndex=state.index;s.filmProgress=state.progress;s.openFraction=open;s.transport=state;group.userData.comparison={...state,openFraction:open,integratedScreen:true};
 },advance(s,dt){s.cycle=Math.max(0,(s.cycle||0)+Math.max(0,dt)*(s.fps||12)/8);},
 reading:s=>['정상 · 멈춰 있을 때 노출','회전 셔터 제거 · 이송 중인 필름도 노출','간헐 기구 제거 · 같은 평균 속도로 계속 이송'][Number(s.mode||0)]+' · '+((s.frameIndex||0)+1)+'/24번 그림 · 현재 광로 '+Math.round((s.openFraction||0)*100)+'% 열림 · 기구와 필름을 8배 느리게 관찰',
 annotations:[{text:'같은 24장의 그림 · 게이트',object:parts.gate},{text:s=>Number(s.mode)===1?'회전 셔터를 뺀 상태':'실제 광로를 가리는 회전 셔터',object:parts.shutter},{text:'완전히 열린 구간을 겹쳐 본 화면',object:parts.screen}]};result.update({...result.defaults});return result;
}
export function buildProjectorFramesStudy(){
 const group=new T.Group(),frames=sequence(),cards=[],borders=[],textureCache=frames.map(c=>{const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;});
 for(let i=0;i<FILM_FRAME_COUNT;i++){const g=part(group,'frame '+(i+1));g.position.set((i%8-3.5)*.72,Math.floor(i/8)*-.62,0);const border=box(g,.65,.49,.018,M.black);const panel=new T.Mesh(new T.PlaneGeometry(.59,.443),new T.MeshBasicMaterial({map:textureCache[i],side:T.DoubleSide,toneMapped:false}));panel.position.z=.015;g.add(panel);cards.push(g);borders.push(border);}
 const output=canvas(512,384),texture=new T.CanvasTexture(output);texture.colorSpace=T.SRGBColorSpace;const panel=new T.Mesh(new T.PlaneGeometry(3.2,2.4),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false}));panel.position.set(0,1.65,.03);group.add(panel);
 let previous=-1;
 return {group,allowZoom:true,eye:[0,1,9],defaults:{frame:0,fps:12},update(s){const f=frameNumber(s.frame);if(f!==previous){paintFilmFrame(output.getContext('2d'),f,512,384);texture.needsUpdate=true;cards.forEach((g,i)=>{g.position.z=i===f?.09:0;borders[i].material=i===f?M.brass:M.black;});previous=f;}s.frameIndex=f;},advance(s,dt){s.frame=((s.frame||0)+dt*(s.fps||12))%FILM_FRAME_COUNT;},
 reading:s=>'같은 24장'+' · 현재 '+((s.frameIndex||0)+1)+'번 · 초당 '+s.fps+'장 · 속도만 바꿉니다',
 annotations:[{text:'한 장씩 보면 멈춘 그림',object:cards[0]},{text:'선택한 그림을 보여주는 화면',object:panel}]};
}
