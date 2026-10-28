import {watchAssembly} from './anatomy-watch.js?v=20261028-watchguide4';
import {T,materials as M,mesh,box,cyl,ring,rod,tube,gear,part,bolt} from './quality-kit.js?v=20261028-watchmechanism2';
import {TAU,clamp,layerOffset,gearAngle,escapeState,handAngles,period} from './research-math.js?v=20261026-release3';
import {cycloidalPairSpec,makeWatchGear,pinionPhase} from './watch-wheel-geometry.js?v=20261028-watchmechanism2';
import {buildSwissLever} from './watch-escapement.js?v=20261028-watchmechanism2';
const silver=M.steel, gold=M.brass, ruby=new T.MeshPhysicalMaterial({color:0x862d4b,roughness:.2,metalness:.2,clearcoat:1});
const palette={silver,gold,ruby};
function plate(parent,r,y,holes=[],material=silver){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);for(const [x,z,R] of holes){const h=new T.Path();h.absarc(x,-z,R,0,TAU,true);s.holes.push(h);}const g=new T.ExtrudeGeometry(s,{depth:.085,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:64});g.rotateX(-Math.PI/2);return mesh(parent,g,material,0,y,0);}
export function toothWheel(parent,teeth,module,x,y,z,material=gold,spokes=true){const r=teeth*module/2,s=new T.Shape(),root=r-module*1.15,tip=r+module*.9;for(let i=0;i<teeth*4;i++){const a=i/(teeth*4)*TAU,R=i%4===0||i%4===3?root:tip;i?s.lineTo(Math.cos(a)*R,Math.sin(a)*R):s.moveTo(Math.cos(a)*R,Math.sin(a)*R);}s.closePath();if(spokes&&r>.2)for(let i=0;i<5;i++){const h=new T.Path(),a=i/5*TAU;h.absarc(Math.cos(a)*r*.57,Math.sin(a)*r*.57,r*.22,0,TAU,true);s.holes.push(h);}const h=new T.Path();h.absarc(0,0,module*1.4,0,TAU,true);s.holes.push(h);const g=new T.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSize:module*.08,bevelThickness:.004,bevelSegments:2,curveSegments:20});g.rotateX(-Math.PI/2);const wheel=mesh(parent,g,material,x,y,z);cyl(wheel,module*1.1,.14,silver,0,.03,0);wheel.userData={teeth,pitchRadius:r};return wheel;}
function springRibbon(parent,radius=.72){const count=640,positions=new Float32Array((count+1)*6),indices=[];for(let i=0;i<count;i++){let a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setIndex(indices);const material=new T.MeshStandardMaterial({color:0xb4a47e,metalness:.8,roughness:.3,side:T.DoubleSide}),o=mesh(parent,g,material);let previous=-1;
 return {mesh:o,update(w){if(Math.abs(w-previous)<.0001)return;previous=w;const turns=3.5+4*w;for(let i=0;i<=count;i++){const t=i/count,a=t*turns*TAU,rr=.08+(radius-.08)*t**(1.8-w*.75);positions[i*6]=Math.cos(a)*rr;positions[i*6+1]=.01;positions[i*6+2]=Math.sin(a)*rr;positions[i*6+3]=Math.cos(a)*rr;positions[i*6+4]=.13;positions[i*6+5]=Math.sin(a)*rr;}g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();}};
}
function balance(parent,x,y,z,r=.65){const root=part(parent,'balance');root.position.set(x,y,z);ring(root,r,.035,gold);for(let i=0;i<3;i++){const a=i/3*TAU;rod(root,[0,0,0],[Math.cos(a)*r,0,Math.sin(a)*r],.025,gold);}cyl(root,.06,.18,silver);for(let i=0;i<12;i++){const a=i/12*TAU;const o=cyl(root,.027,.045,silver,Math.cos(a)*r,.02,Math.sin(a)*r);}const collet=cyl(root,.055,.026,silver,0,.09,0);collet.name='Balance spring inner collet';const hair=tube(root,Array.from({length:181},(_,i)=>{const t=i/180,a=t*TAU*5,R=.05+.37*t;return [Math.cos(a)*R,.09,Math.sin(a)*R];}),.006,silver);root.remove(hair);parent.add(hair);hair.position.copy(root.position);const rest=hair.geometry.attributes.position.array.slice();return {root,hair,update(angle){root.rotation.y=angle;const a=hair.geometry.attributes.position;for(let i=0;i<a.count;i++){const xx=rest[i*3],yy=rest[i*3+1],zz=rest[i*3+2],R=Math.hypot(xx,zz),v=-angle*(1-clamp((R-.05)/.37));a.setXYZ(i,xx*Math.cos(v)-zz*Math.sin(v),yy,xx*Math.sin(v)+zz*Math.cos(v));}a.needsUpdate=true;hair.geometry.computeBoundingSphere();hair.geometry.computeBoundingBox();}};}
function dial(parent,r=1.8,y=0){plate(parent,r,y,[[0,0,.09]],M.ivory);for(let i=0;i<60;i++){const a=i/60*TAU,o=box(parent,i%5?.012:.035,.015,i%5?.055:.15,M.black,Math.sin(a)*(r-.12),y+.1,Math.cos(a)*(r-.12),.003);o.rotation.y=a;}}
function hands(parent,y=0,r=1.6){const h={};for(const [name,len,w,mat,offset] of [['hour',r*.52,.06,M.black,.0],['minute',r*.82,.038,M.black,.04],['second',r*.96,.014,M.red,.08]]){const g=part(parent,name);box(g,w,.025,len,mat,0,y+offset,-len/2+.06,.007);cyl(g,.06,.025,silver,0,y+offset,0);h[name]=g;}return h;}
function train(parent){const centers=[[-1.1,.3],[-.264,.3],[.484,.3],[.880,-.3858921198],[1.254,.2618948822]],m=.022;const wheels=[];const specs=[[64,0,.15],[60,1,.28],[64,2,.41],[60,3,.54],[15,4,.69]];for(let i=0;i<specs.length;i++){const [N,index,y]=specs[i],[x,z]=centers[index],root=part(parent,'train-'+i);root.position.set(x,0,z);const wheel=toothWheel(root,N,i===4?.046:m,0,y,0,i===4?silver:gold);if(i>0){const pinN=[0,12,8,8,8][i];toothWheel(root,pinN,m,0,y-.13,0,silver,false);}rod(root,[0,.0,0],[0,.89,0],.025,silver);wheels.push(root);}const b=balance(parent,.65,.75,-1.05,.62),fork=part(parent,'pallet');fork.position.set(1.02,.73,-.28);rod(fork,[0,0,0],[.277,0,.175],.022,silver);rod(fork,[0,0,0],[-.063,0,.321],.022,silver);box(fork,.08,.055,.06,ruby,.277,0,.175,.01);box(fork,.08,.055,.06,ruby,-.063,0,.321,.01);rod(fork,[0,0,0],[-.35,0,-.25],.022,silver);return {wheels,b,fork};}
export function buildAssembly(){
 const model=watchAssembly(),update=model.update.bind(model);let heldWindingTurns=0;
 return {...model,allowZoom:true,annotations:model.components.filter(c=>['wheel-0','wheel-1','wheel-3','pallet','balance'].includes(c.id)).map(c=>({text:c.title,object:c.object})),defaults:{time:0,charge:0,explode:0},
  update(s){const reserve=s.reserve??s.charge??0,turns=Number.isFinite(s.turns)?s.turns:Math.max(heldWindingTurns,reserve/8);heldWindingTurns=turns;update({phase:(s.time||0)*5/8,reserve,charge:reserve,turns,regulated:s.regulated!==0&&s.regulated!==false,freeAge:s.freeAge||0,explode:s.explode||0});},
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
 plate(barrel,.87,.015,[[0,0,.10]],silver);const outerShape=new T.Shape();outerShape.absarc(0,0,.91,0,TAU,false);const wallHole=new T.Path();wallHole.absarc(0,0,.86,0,TAU,true);outerShape.holes.push(wallHole);
 const wallGeo=new T.ExtrudeGeometry(outerShape,{depth:.25,bevelEnabled:false,curveSegments:64});wallGeo.rotateX(-Math.PI/2);const wall=mesh(barrel,wallGeo,silver);wall.name='Barrel wall with open interior';
 const outerHook=rod(barrel,[.82,.18,0],[.875,.18,0],.012,gold);outerHook.name='Outer spring hook';
 const arborStaff=cyl(arbor,.075,.49,gold,0,.20,0);arborStaff.name='Power spring arbor staff';const key=mesh(arbor,new T.BoxGeometry(.11,.13,.11),silver,0,.50,0);key.name='Power ratchet square arbor key';const innerHook=rod(arbor,[.075,.18,0],[.10,.18,0],.012,gold);innerHook.name='Inner spring hook';
 const ratchetOutline=[];for(let i=0;i<24;i++){const a=i/24*TAU;for(const [da,r] of [[0,.30],[TAU/24-.025,.365],[TAU/24-.005,.30]])ratchetOutline.push([Math.cos(a+da)*r,Math.sin(a+da)*r]);}
 const ratchetShape=new T.Shape(ratchetOutline.map(([x,z])=>new T.Vector2(x,-z))),keyHole=new T.Path();keyHole.moveTo(-.0551,-.0551);keyHole.lineTo(-.0551,.0551);keyHole.lineTo(.0551,.0551);keyHole.lineTo(.0551,-.0551);keyHole.closePath();ratchetShape.holes.push(keyHole);const ratchetGeo=new T.ExtrudeGeometry(ratchetShape,{depth:.045,bevelEnabled:false});ratchetGeo.rotateX(-Math.PI/2);const ratchet=mesh(arbor,ratchetGeo,gold,0,.50,0);ratchet.name='Power keyed asymmetric ratchet';cyl(arbor,.085,.025,silver,0,.57,0);box(arbor,.035,.02,.18,M.red,0,.56,-.13,.004);
 const support=cyl(group,1.15,.04,silver,0,-.10,0);support.name='Fixed power study support';rod(group,[0,-.08,1.05],[0,.5225,1.05],.045,silver);const click=part(group,'fixed winding click');click.position.set(0,.5225,1.05);rod(click,[0,0,0],[0,0,-.75],.010,silver);const clickTip=cyl(click,.012,.025,silver,0,0,-.75);clickTip.name='Power click working tip';bolt(group,0,.55,1.05);rod(group,[.25,-.08,1.02],[.25,.5225,1.02],.035,silver);let clickSpring;
 const bearingShape=new T.Shape();bearingShape.absarc(0,0,.13,0,TAU,false);const bearingHole=new T.Path();bearingHole.absarc(0,0,.0755,0,TAU,true);bearingShape.holes.push(bearingHole);const bg=new T.ExtrudeGeometry(bearingShape,{depth:.04,bevelEnabled:false,curveSegments:32});bg.rotateX(-Math.PI/2);const lowerBearing=mesh(group,bg,ruby,0,-.08,0);lowerBearing.name='Power lower arbor bearing';
 function contactDistance(q,poly){let distance=Infinity,inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i],x=b[0]-a[0],z=b[1]-a[1],t=clamp(((q[0]-a[0])*x+(q[1]-a[1])*z)/(x*x+z*z));distance=Math.min(distance,Math.hypot(q[0]-a[0]-t*x,q[1]-a[1]-t*z));if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside?-distance:distance;}
 function updateClick(angle){const poly=ratchetOutline.map(([x,z])=>[x*Math.cos(angle)+z*Math.sin(angle),-x*Math.sin(angle)+z*Math.cos(angle)]);let low=0,high=.65;for(let i=0;i<32;i++){const b=(low+high)/2;if(contactDistance([.75*Math.sin(b),1.05-.75*Math.cos(b)],poly)<.0122)low=b;else high=b;}click.rotation.y=-(low+high)/2;click.updateMatrix();const end=new T.Vector3(.012,0,-.20).applyMatrix4(click.matrix);const g=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.25,.5225,1.02),new T.Vector3(.18,.5225,.85),end]),24,.006,6,false);if(clickSpring){clickSpring.geometry.dispose();clickSpring.geometry=g;}else {clickSpring=mesh(group,g,silver);clickSpring.name='Power click spring anchored to fixed post';}}
 const lid=plate(barrel,.89,.262,[[0,0,.10]],silver);lid.name='Barrel lid';
 const spring=anchoredPowerSpring(group);let lastCharge=null,lastTime=0,innerAngle=0,outerAngle=0;
 const result={group,allowZoom:true,eye:[4,6,6],parts:{barrel,arbor,arborStaff,wheel,ratchet,click,clickTip,lid,spring:spring.mesh,innerHook,outerHook},defaults:{time:0,charge:50,open:.8,regulated:0},
 update(s){
  const charge=clamp((s.charge??50)/100),t=s.time||0;
  if(lastCharge===null||t<lastTime-1e-7){innerAngle=-charge*3*TAU;outerAngle=0;}
  else if(charge>lastCharge)innerAngle-=(charge-lastCharge)*3*TAU;
  else outerAngle-=(lastCharge-charge)*3*TAU;
  lastCharge=charge;lastTime=t;arbor.rotation.y=-innerAngle;barrel.rotation.y=-outerAngle;lid.position.y=.262+(s.open??.8)*1.2;updateClick(arbor.rotation.y);
  spring.update(charge,innerAngle,outerAngle);s.arborAngle=innerAngle;s.barrelAngle=outerAngle;
 },
 advance(s,dt){const before=s.time||0;s.time=before+dt;
 const release=s.regulated===1?(escapeState(s.time*.8).angle-escapeState(before*.8).angle)/(Math.PI/15)*3:dt*12;
 s.charge=Math.max(0,(s.charge??50)-release);if(!s.charge)s.running=false;},

 reading:s=>'저장량 '+Math.round(s.charge)+'% · '+(s.running?(s.regulated===1?'조금씩 풀기 · 멈춤과 진행을 반복합니다.':'그냥 풀기 · 빠르게 돌아 힘을 소진합니다.'):'감기축과 태엽통에 붙은 두 끝을 보세요.'),
 annotations:[{text:'감기축 · 풀리는 동안 고정',object:arbor},{text:'회전하는 태엽통과 바깥 고정점',object:outerHook},{text:'축과 통에 각각 연결된 태엽',object:spring.mesh}]};
 result.update({...result.defaults});return result;
}
export function buildGears(){
 const group=new T.Group(),pair=cycloidalPairSpec(48,12,.04),phase=pinionPhase(48,12,0),a=part(group,'48 tooth driver arbor'),b=part(group,'12 leaf driven arbor');a.position.x=-.6;b.position.x=.6;
 const A=makeWatchGear(a,pair.wheel,{material:gold,boreRadius:.039,hubRadius:.065,depth:.045}),B=makeWatchGear(b,pair.pinion,{material:silver,boreRadius:.039,hubRadius:.065,spokes:false,phase,depth:.045});for(const root of [a,b]){const shaft=rod(root,[0,-.18,0],[0,.25,0],.04,silver);shaft.name='Press fitted demonstration gear staff';}
 const marker=M.red.clone();cyl(A,.035,.02,marker,.7,.065,0);cyl(B,.025,.02,marker,.16,.065,0);const contact=cyl(group,.035,.025,ruby,.36,.08,0);
 return {group,parts:{wheel:A,pinion:B,driver:a,driven:b},eye:[1,8,4],update(s){a.rotation.y=s.angle||0;b.rotation.y=gearAngle(s.angle||0,48,12);contact.visible=!!s.contact;}};
}
export function buildEscapement(){
 const group=new T.Group(),lever=buildSwissLever({T,scale:.75,origin:[0,-.75],materials:{steel:silver,gold,ruby}});group.add(lever.group);const p=lever.parts,B=lever.geometry.centers.balance;
 const innerCollet=cyl(p.balance,.055,.035,silver,0,.68,0);innerCollet.name='Lesson balance rotating spring collet';
 const hair=tube(lever.group,Array.from({length:241},(_,i)=>{const t=i/240,a=t*TAU*5,r=.05+.37*t;return [B[0]+Math.cos(a)*r,.68,B[1]+Math.sin(a)*r];}),.006,silver);hair.name='Lesson fixed-end balance spring';const rest=hair.geometry.attributes.position.array.slice();
 const anchor=rod(lever.group,[B[0]+.42,.68,B[1]],[B[0]+.42,.82,B[1]],.025,silver);anchor.name='Lesson hairspring fixed outer stud';const bridge=rod(lever.group,[B[0],.82,B[1]],[B[0]+1.92,.82,B[1]],.035,silver);bridge.name='Lesson balance bridge';rod(lever.group,[B[0]+1.92,-.34,B[1]],[B[0]+1.92,.82,B[1]],.045,silver);rod(lever.group,[B[0],-.34,B[1]],[B[0]+1.92,-.34,B[1]],.035,silver);rod(lever.group,[B[0],.72,B[1]],[B[0],.82,B[1]],.07,silver);
 const bearing=(y)=>{const shape=new T.Shape();shape.absarc(0,0,.07,0,TAU,false);const hole=new T.Path();hole.absarc(0,0,.0305,0,TAU,true);shape.holes.push(hole);const g=new T.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:false,curveSegments:32});g.rotateX(-Math.PI/2);return mesh(lever.group,g,ruby,B[0],y,B[1]);};bearing(-.31);bearing(.68);
 let freeAt=null;
 const result={group,allowZoom:true,eye:[4,8,5],defaults:{phase:0,regulated:1},lever,parts:{...p,wheel:p.escapeWheel,fork:p.pallet,entryStone:p.rubies[0],exitStone:p.rubies[1],hairspring:hair},
 update(s){const t=s.phase||0,free=s.regulated===0||s.regulated===false;if(free&&freeAt===null)freeAt=t;if(!free)freeAt=null;const state=lever.update({beat:free?t+(t-freeAt)*36.5:t,regulated:!free,freeAge:free?(t-freeAt)/5:0,showContact:true});s.caption=state.stage;const attr=hair.geometry.attributes.position;for(let i=0;i<attr.count;i++){const x=rest[i*3]-B[0],y=rest[i*3+1],z=rest[i*3+2]-B[1],angle=state.balanceAngle*(1-clamp((Math.hypot(x,z)-.05)/.37));attr.setXYZ(i,B[0]+x*Math.cos(angle)-z*Math.sin(angle),y,B[1]+x*Math.sin(angle)+z*Math.cos(angle));}attr.needsUpdate=true;hair.geometry.computeBoundingSphere();},
 advance(s,dt){s.phase=(s.phase||0)+dt*.8;},reading:s=>s.regulated===0?'팔렛 분리 · 연속 회전과 줄어드는 밸런스 진폭':(s.caption||'잠김')+' · '+Math.floor(s.phase||0)+' 비트',
 annotations:[{text:'실제 접촉으로 잠기는 탈진바퀴',object:p.escapeWheel},{text:'두 팔렛과 곡선 포크 뿔',object:p.pallet},{text:'포크를 미는 롤러 핀',object:p.impulsePin},{text:'안쪽은 회전하고 바깥 끝은 고정된 스프링',object:hair}]};result.update({...result.defaults});return result;
}
export function buildBalance(){
 const group=new T.Group(),b=balance(group,0,0,0,1.15),staff=cyl(b.root,.025,.56,silver,0,-.02,0);staff.name='Lesson balance staff';const base=cyl(group,1.52,.06,silver,0,-.34,0);base.name='Lesson balance support base';rod(group,[1.40,-.31,0],[1.40,.26,0],.05,silver);rod(group,[.05,.26,0],[1.40,.26,0],.035,silver);const stud=rod(group,[.42,.09,0],[.42,.26,0],.025,silver);stud.name='Balance spring outer stud fixed to bridge';
 for(const y of [-.31,.23]){const shape=new T.Shape();shape.absarc(0,0,.06,0,TAU,false);const hole=new T.Path();hole.absarc(0,0,.0255,0,TAU,true);shape.holes.push(hole);const g=new T.ExtrudeGeometry(shape,{depth:.03,bevelEnabled:false,curveSegments:32});g.rotateX(-Math.PI/2);const bearing=mesh(group,g,ruby,0,y,0);bearing.name='Lesson pierced balance bearing';}
 return {group,parts:{balance:b.root,hairspring:b.hair,staff,stud},eye:[3,7,5],update(s){const I=(s.inertia||100)/100,k=(s.stiffness||100)/100,t=s.time||0,damping=s.driven?1:Math.exp(-.15*t);b.update(Math.cos(t*TAU/(period(I,k)/4))*.9*damping);s.caption=(period(I,k)/4).toFixed(2)+'초';}};
}
export function buildHands(){const group=new T.Group();dial(group,1.8,0);const h=hands(group,.15);return {group,eye:[0,9,2],update(s){const a=handAngles(s.seconds||0);for(const k in h)h[k].rotation.y=-a[k];}};}
export const watchBuilders={assembly:buildAssembly,power:buildPower,gears:buildGears,escapement:buildEscapement,balance:buildBalance,hands:buildHands};
