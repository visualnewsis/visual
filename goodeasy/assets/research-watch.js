import {watchAssembly} from './anatomy-watch.js?v=20261028-craft7';
import {T,materials as M,mesh,box,cyl,ring,rod,tube,gear,part,bolt} from './quality-kit.js?v=20261028-craft7';
import {TAU,clamp,layerOffset,gearAngle,escapeState,handAngles,period} from './research-math.js?v=20261026-release3';
const silver=M.steel, gold=M.brass, ruby=new T.MeshPhysicalMaterial({color:0x862d4b,roughness:.2,metalness:.2,clearcoat:1});
const palette={silver,gold,ruby};
function plate(parent,r,y,holes=[],material=silver){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);for(const [x,z,R] of holes){const h=new T.Path();h.absarc(x,-z,R,0,TAU,true);s.holes.push(h);}const g=new T.ExtrudeGeometry(s,{depth:.085,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:64});g.rotateX(-Math.PI/2);return mesh(parent,g,material,0,y,0);}
export function toothWheel(parent,teeth,module,x,y,z,material=gold,spokes=true){const r=teeth*module/2,s=new T.Shape(),root=r-module*1.15,tip=r+module*.9;for(let i=0;i<teeth*4;i++){const a=i/(teeth*4)*TAU,R=i%4===0||i%4===3?root:tip;i?s.lineTo(Math.cos(a)*R,Math.sin(a)*R):s.moveTo(Math.cos(a)*R,Math.sin(a)*R);}s.closePath();if(spokes&&r>.2)for(let i=0;i<5;i++){const h=new T.Path(),a=i/5*TAU;h.absarc(Math.cos(a)*r*.57,Math.sin(a)*r*.57,r*.22,0,TAU,true);s.holes.push(h);}const h=new T.Path();h.absarc(0,0,module*1.4,0,TAU,true);s.holes.push(h);const g=new T.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSize:module*.08,bevelThickness:.004,bevelSegments:2,curveSegments:20});g.rotateX(-Math.PI/2);const wheel=mesh(parent,g,material,x,y,z);cyl(wheel,module*1.1,.14,silver,0,.03,0);wheel.userData={teeth,pitchRadius:r};return wheel;}
function springRibbon(parent,radius=.72){const count=640,positions=new Float32Array((count+1)*6),indices=[];for(let i=0;i<count;i++){let a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setIndex(indices);const material=new T.MeshStandardMaterial({color:0xb4a47e,metalness:.8,roughness:.3,side:T.DoubleSide}),o=mesh(parent,g,material);let previous=-1;
 return {mesh:o,update(w){if(Math.abs(w-previous)<.0001)return;previous=w;const turns=3.5+4*w;for(let i=0;i<=count;i++){const t=i/count,a=t*turns*TAU,rr=.08+(radius-.08)*t**(1.8-w*.75);positions[i*6]=Math.cos(a)*rr;positions[i*6+1]=.01;positions[i*6+2]=Math.sin(a)*rr;positions[i*6+3]=Math.cos(a)*rr;positions[i*6+4]=.13;positions[i*6+5]=Math.sin(a)*rr;}g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();}};
}
function balance(parent,x,y,z,r=.65){const root=part(parent,'balance');root.position.set(x,y,z);ring(root,r,.035,gold);for(let i=0;i<3;i++){const a=i/3*TAU;rod(root,[0,0,0],[Math.cos(a)*r,0,Math.sin(a)*r],.025,gold);}cyl(root,.06,.18,silver);for(let i=0;i<12;i++){const a=i/12*TAU;const o=cyl(root,.027,.045,silver,Math.cos(a)*r,.02,Math.sin(a)*r);}const hair=tube(root,Array.from({length:181},(_,i)=>{const t=i/180,a=t*TAU*5,R=.05+.37*t;return [Math.cos(a)*R,.09,Math.sin(a)*R];}),.006,silver);root.remove(hair);parent.add(hair);hair.position.copy(root.position);const rest=hair.geometry.attributes.position.array.slice();return {root,hair,update(angle){root.rotation.y=angle;const a=hair.geometry.attributes.position;for(let i=0;i<a.count;i++){const xx=rest[i*3],yy=rest[i*3+1],zz=rest[i*3+2],R=Math.hypot(xx,zz),v=angle*(1-clamp((R-.05)/.37));a.setXYZ(i,xx*Math.cos(v)-zz*Math.sin(v),yy,xx*Math.sin(v)+zz*Math.cos(v));}a.needsUpdate=true;hair.geometry.computeBoundingSphere();hair.geometry.computeBoundingBox();}};}
function dial(parent,r=1.8,y=0){plate(parent,r,y,[[0,0,.09]],M.ivory);for(let i=0;i<60;i++){const a=i/60*TAU,o=box(parent,i%5?.012:.035,.015,i%5?.055:.15,M.black,Math.sin(a)*(r-.12),y+.1,Math.cos(a)*(r-.12),.003);o.rotation.y=a;}}
function hands(parent,y=0,r=1.6){const h={};for(const [name,len,w,mat,offset] of [['hour',r*.52,.06,M.black,.0],['minute',r*.82,.038,M.black,.04],['second',r*.96,.014,M.red,.08]]){const g=part(parent,name);box(g,w,.025,len,mat,0,y+offset,-len/2+.06,.007);cyl(g,.06,.025,silver,0,y+offset,0);h[name]=g;}return h;}
function train(parent){const centers=[[-1.1,.3],[-.264,.3],[.484,.3],[.880,-.3858921198],[1.254,.2618948822]],m=.022;const wheels=[];const specs=[[64,0,.15],[60,1,.28],[64,2,.41],[60,3,.54],[15,4,.69]];for(let i=0;i<specs.length;i++){const [N,index,y]=specs[i],[x,z]=centers[index],root=part(parent,'train-'+i);root.position.set(x,0,z);const wheel=toothWheel(root,N,i===4?.046:m,0,y,0,i===4?silver:gold);if(i>0){const pinN=[0,12,8,8,8][i];toothWheel(root,pinN,m,0,y-.13,0,silver,false);}rod(root,[0,.0,0],[0,.89,0],.025,silver);wheels.push(root);}const b=balance(parent,.65,.75,-1.05,.62),fork=part(parent,'pallet');fork.position.set(1.02,.73,-.28);rod(fork,[0,0,0],[.277,0,.175],.022,silver);rod(fork,[0,0,0],[-.063,0,.321],.022,silver);box(fork,.08,.055,.06,ruby,.277,0,.175,.01);box(fork,.08,.055,.06,ruby,-.063,0,.321,.01);rod(fork,[0,0,0],[-.35,0,-.25],.022,silver);return {wheels,b,fork};}
export function buildAssembly(){
 const model=watchAssembly(),update=model.update.bind(model);
 return {...model,allowZoom:true,annotations:model.components.filter(c=>['wheel-0','wheel-1','wheel-3','pallet','balance'].includes(c.id)).map(c=>({text:c.title,object:c.object})),defaults:{time:0,charge:0,explode:0},
  update(s){update({phase:(s.time||0)*3.75/8,charge:s.charge??0,turns:s.turns??(s.charge||0)/8,regulated:s.regulated!==0,explode:s.explode||0});},
  reading:s=>'분해 '+Math.round((s.explode||0)*100)+'% · 첫 체험과 같은 태엽·윤열·브리지'
 };
}
export function anchoredPowerSpring(parent,{inner=.10,outer=.82,y=.12,height=.12}={}){
 const n=640,positions=new Float32Array((n+1)*6),indices=[];
 for(let i=0;i<n;i++){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setIndex(indices);
 const o=mesh(parent,g,new T.MeshStandardMaterial({color:0xb5a99b,metalness:.84,roughness:.3,side:T.DoubleSide}));o.name='Mainspring anchored to arbor and barrel';
 return {mesh:o,update(charge,innerAngle,outerAngle){
  for(let i=0;i<=n;i++){const t=i/n,a=innerAngle+t*(8*TAU+outerAngle-innerAngle),r=inner+(outer-inner)*t**(1+charge*1.8);positions[i*6]=positions[i*6+3]=Math.cos(a)*r;positions[i*6+1]=y;positions[i*6+4]=y+height;positions[i*6+2]=positions[i*6+5]=Math.sin(a)*r;}
  g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();
  o.userData.inner=[positions[0],y+height/2,positions[2]];o.userData.outer=[positions[n*6],y+height/2,positions[n*6+2]];o.userData.charge=charge;
 }};
}
export function buildPower(){
 const group=new T.Group(),barrel=part(group,'barrel'),arbor=part(group,'winding arbor');
 const wheel=toothWheel(barrel,64,.028,0,0,0,gold),shape=wheel.geometry.parameters.shapes.clone(),bore=new T.Path();bore.absarc(0,0,.10,0,TAU,true);shape.holes[shape.holes.length-1]=bore;
 const wg=new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSize:.002,bevelThickness:.004,bevelSegments:2,curveSegments:20});wg.rotateX(-Math.PI/2);wheel.geometry.dispose();wheel.geometry=wg;
 for(const child of [...wheel.children]){wheel.remove(child);child.geometry?.dispose();}
 plate(barrel,.87,.025,[[0,0,.10]],silver);const outerShape=new T.Shape();outerShape.absarc(0,0,.91,0,TAU,false);const wallHole=new T.Path();wallHole.absarc(0,0,.86,0,TAU,true);outerShape.holes.push(wallHole);
 const wallGeo=new T.ExtrudeGeometry(outerShape,{depth:.25,bevelEnabled:false,curveSegments:64});wallGeo.rotateX(-Math.PI/2);const wall=mesh(barrel,wallGeo,silver);wall.name='Barrel wall with open interior';
 const outerHook=rod(barrel,[.82,.18,0],[.875,.18,0],.012,gold);outerHook.name='Outer spring hook';
 cyl(arbor,.075,.53,gold,0,.22,0);const innerHook=rod(arbor,[.075,.18,0],[.10,.18,0],.012,gold);innerHook.name='Inner spring hook';
 const ratchet=toothWheel(arbor,24,.028,0,.50,0,gold);box(arbor,.035,.02,.18,M.red,0,.56,-.13,.004);
 const click=part(group,'fixed winding click');rod(click,[-.48,.52,.12],[-.32,.52,.02],.025,silver);bolt(click,-.48,.49,.12);
 const lid=plate(barrel,.89,.32,[[0,0,.10]],silver);lid.name='Barrel lid';
 const spring=anchoredPowerSpring(group);let lastCharge=null,lastTime=0,innerAngle=0,outerAngle=0;
 const result={group,allowZoom:true,eye:[4,6,6],parts:{barrel,arbor,wheel,ratchet,lid,spring:spring.mesh,innerHook,outerHook},defaults:{time:0,charge:50,open:.8,regulated:0},
 update(s){
  const charge=clamp((s.charge??50)/100),t=s.time||0;
  if(lastCharge===null||t<lastTime-1e-7){innerAngle=-charge*3*TAU;outerAngle=0;}
  else if(charge>lastCharge)innerAngle-=(charge-lastCharge)*3*TAU;
  else outerAngle-=(lastCharge-charge)*3*TAU;
  lastCharge=charge;lastTime=t;arbor.rotation.y=-innerAngle;barrel.rotation.y=-outerAngle;lid.position.y=.32+(s.open??.8)*1.2;
  spring.update(charge,innerAngle,outerAngle);s.arborAngle=innerAngle;s.barrelAngle=outerAngle;
 },
 advance(s,dt){const before=s.time||0;s.time=before+dt;
 const release=s.regulated===1?(escapeState(s.time*.8).angle-escapeState(before*.8).angle)/(Math.PI/15)*3:dt*12;
 s.charge=Math.max(0,(s.charge??50)-release);if(!s.charge)s.running=false;},

 reading:s=>'저장량 '+Math.round(s.charge)+'% · '+(s.running?(s.regulated===1?'조금씩 풀기 · 멈춤과 진행을 반복합니다.':'그냥 풀기 · 빠르게 돌아 힘을 소진합니다.'):'감기축과 태엽통에 붙은 두 끝을 보세요.'),
 annotations:[{text:'감기축 · 풀리는 동안 고정',object:arbor},{text:'회전하는 태엽통과 바깥 고정점',object:outerHook},{text:'축과 통에 각각 연결된 태엽',object:spring.mesh}]};
 result.update({...result.defaults});return result;
}
export function buildGears(){const group=new T.Group();const A=toothWheel(group,48,.04,-.6,0,0,gold),B=toothWheel(group,12,.04,.6,0,0,silver,false);B.rotation.y=Math.PI/12;for(const x of [-.6,.6])rod(group,[x,-.18,0],[x,.25,0],.04,silver);const marker=M.red.clone();cyl(A,.035,.02,marker,.7,.065,0);cyl(B,.025,.02,marker,.16,.065,0);const contact=cyl(group,.035,.025,ruby,.36,.08,0);return {group,eye:[1,8,4],update(s){A.rotation.y=s.angle||0;B.rotation.y=Math.PI/12+gearAngle(s.angle||0,48,12);contact.visible=!!s.contact;}};}
export function buildEscapement(){
 const group=new T.Group(),wheel=part(group,'escape wheel');
 for(let i=0;i<15;i++){const a=i/15*TAU,shape=new T.Shape();shape.moveTo(.57,0);shape.lineTo(.83,.09);shape.lineTo(.72,.14);shape.lineTo(.58,.13);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.05,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:2});geo.rotateX(-Math.PI/2);const o=mesh(wheel,geo,silver);o.rotation.y=a;}
 ring(wheel,.48,.055,silver);for(let i=0;i<5;i++){const a=i/5*TAU;rod(wheel,[0,0,0],[Math.cos(a)*.5,0,Math.sin(a)*.5],.028,silver);}cyl(wheel,.07,.2,gold);
 const fork=part(group,'pallet fork');fork.position.set(0,.07,1.18);
 const stones=[];for(const x of [-.422,.422]){rod(fork,[0,0,0],[x,0,-.449],.03,gold);const stone=box(fork,.13,.08,.14,ruby.clone(),x,0,-.449,.015);stone.name=x<0?'Entry pallet stone':'Exit pallet stone';stones.push(stone);}
 rod(fork,[0,0,0],[0,-.07,.18],.035,gold);rod(fork,[0,-.07,.18],[0,-.07,1.10],.035,gold);
 const horns=[];for(const x of [-.111,.111]){rod(fork,[0,-.07,1.10],[x,-.07,1.10],.020,gold);horns.push(rod(fork,[x,-.07,1.10],[x,-.07,1.35],.020,gold));}
 const b=balance(group,0,.30,2.45,.62),roller=cyl(b.root,.16,.05,silver,0,-.25,0),impulsePin=cyl(b.root,.024,.075,ruby,0,-.31,-.11);
 cyl(b.root,.025,.64,silver,0,-.04,0);roller.name='Balance roller below rim';impulsePin.name='Roller impulse pin between fork horns';
 const bridge=part(group,'balance support');rod(bridge,[.76,.0,2.45],[.76,.56,2.45],.05,silver);rod(bridge,[.76,.56,2.45],[0,.56,2.45],.045,silver);cyl(bridge,.06,.11,ruby,0,.56,2.45);box(bridge,.14,.10,.14,silver,.43,.40,2.45,.012);rod(bridge,[.43,.45,2.45],[.43,.56,2.45],.035,silver);cyl(bridge,.06,.07,silver,0,-.035,2.45);
 let freeAt=null,freeAngle=0;
 const result={group,allowZoom:true,eye:[4,8,5],defaults:{phase:0,regulated:1},parts:{wheel,fork,entryStone:stones[0],exitStone:stones[1],balance:b.root,hairspring:b.hair,roller,impulsePin,horns},
 update(s){
  const t=s.phase||0,p=escapeState(t),free=s.regulated===0;
  if(free){if(freeAt===null){freeAt=t;freeAngle=p.angle;}const dt=Math.max(0,t-freeAt);wheel.rotation.y=-(freeAngle+dt*TAU*1.25);fork.position.x=1.65;fork.rotation.y=0;b.update(p.balance*Math.exp(-dt*.85));s.caption='팔렛 분리 · 연속 회전';}
  else{freeAt=null;fork.position.x=0;wheel.rotation.y=-p.angle;fork.rotation.y=p.fork*.325;b.update(p.balance);s.caption=p.phase;}
  stones.forEach((o,i)=>o.material.emissive.setHex(!free&&i===p.side&&p.phase==='잠김'?0x43111e:0x000000));
 },
 advance(s,dt){s.phase=(s.phase||0)+dt*.8;},
 reading:s=>s.regulated===0?'팔렛을 빼면 바퀴가 계속 돌고 밸런스의 진폭은 줄어듭니다.':(s.caption||'잠김')+' · '+Math.floor(s.phase||0)+' 비트',
 annotations:[{text:s=>s.regulated===0?'잠금 없이 연속 회전':'잠겼다가 풀리는 탈진바퀴',object:wheel},{text:'두 팔렛 · 반 톱니 위상 차이',object:fork},{text:'포크 뿔 사이의 롤러 핀',object:impulsePin},{text:'왕복하는 밸런스와 고정된 스프링 끝',object:b.root}]};
 result.update({...result.defaults});return result;
}
export function buildBalance(){const group=new T.Group(),b=balance(group,0,0,0,1.15);cyl(group,.08,.65,silver,0,-.2,0);const anchor=box(group,.2,.1,.2,silver,.43,.13,0);return {group,eye:[3,7,5],update(s){const I=(s.inertia||100)/100,k=(s.stiffness||100)/100,t=s.time||0,damping=s.driven?1:Math.exp(-.15*t);b.update(Math.cos(t*TAU/(period(I,k)/4))*.9*damping);s.caption=(period(I,k)/4).toFixed(2)+'초';}};}
export function buildHands(){const group=new T.Group();dial(group,1.8,0);const h=hands(group,.15);return {group,eye:[0,9,2],update(s){const a=handAngles(s.seconds||0);for(const k in h)h[k].rotation.y=-a[k];}};}
export const watchBuilders={assembly:buildAssembly,power:buildPower,gears:buildGears,escapement:buildEscapement,balance:buildBalance,hands:buildHands};
