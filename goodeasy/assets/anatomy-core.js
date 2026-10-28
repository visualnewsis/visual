import {T,materials as M,part,mesh,box,cyl,ring,rod,bolt} from './quality-kit.js?v=20261028-craft7';
export {T,M,part,mesh,box,cyl,ring,rod,bolt};
export const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
export const colors={frame:0x9baaa7,drive:0xc8a65d,optics:0x6cabb7,spring:0xb87157,balance:0x9682ad,water:0x419aa6,coffee:0x774229};
export function metal(color){return new T.MeshStandardMaterial({color,metalness:.64,roughness:.36});}
export function component(root,id,title,description,offset=[0,0,0],color=colors.frame){const object=part(root,id);return {id,title,description,offset:new T.Vector3(...offset),object,color};}
export function assembly(root,components,animate=()=>{},options={}){
 const rests=components.map(c=>c.object.position.clone());
 for(const c of components)c.object.traverse(o=>{if(o.isMesh)o.userData.component=c.id;});
 const model={group:root,components,eye:options.eye||[5,4,8],duration:options.duration||5,phaseLabel:options.phaseLabel||'작동 진행',note:options.note||'펼친 배치는 구조를 보기 위한 것입니다. 점선은 원래의 조립 위치를 잇습니다.',connections:options.connections||[],
 update(state={}){components.forEach((c,i)=>c.object.position.copy(rests[i]));animate(state);const e=clamp(state.explode||0);components.forEach((c,i)=>{const t=clamp((e-c.order*.16)/(1-c.order*.16));c.object.position.addScaledVector(c.offset,t*t*(3-2*t));});root.updateMatrixWorld(true);options.after?.(state,model);},bounds(){return new T.Box3().setFromObject(root);}};
 components.forEach((c,i)=>c.order=components.length<2?0:i/(components.length-1));model.update();return model;
}
export function plate(parent,r,holes=[],material=M.steel,y=0){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);for(const [x,z,R] of holes){const h=new T.Path();h.absarc(x,-z,R,0,TAU,true);s.holes.push(h);}const g=new T.ExtrudeGeometry(s,{depth:.065,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,curveSegments:64});g.rotateX(-Math.PI/2);return mesh(parent,g,material,0,y,0);}
export function sleeve(parent,r,h,material,x=0,y=0,z=0){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);const hole=new T.Path();hole.absarc(0,0,r*.82,0,TAU,true);s.holes.push(hole);const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:64});g.rotateX(-Math.PI/2);return mesh(parent,g,material,x,y,z);}
export function spiral(parent,r=.6,turns=12,y=0,material=M.steel){return tube(parent,Array.from({length:481},(_,i)=>{const t=i/480,a=t*turns*TAU,R=.08+(r-.08)*t;return [Math.cos(a)*R,y,Math.sin(a)*R];}),.007,material);}
export function tube(parent,points,r,material){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),80,r,8,false),material);}
