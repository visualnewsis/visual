import {T,materials as M,mesh,box,cyl,ring,rod,part} from './quality-kit.js?v=20261028-release3';
import {buildReel} from './quality-machines.js?v=20261028-watchfit1';
import {snapReelRatio} from './release-machine-models.js?v=20261028-watchfit1';

const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const steel=new T.MeshStandardMaterial({color:0xbfc7c2,metalness:.82,roughness:.3});
const bronze=new T.MeshStandardMaterial({color:0xb59b62,metalness:.74,roughness:.32});
const carbon=new T.MeshStandardMaterial({color:0x353b38,roughness:.95});
const accent=new T.MeshStandardMaterial({color:0x00b4c9,roughness:.4,emissive:0x00313b});
const red=new T.MeshStandardMaterial({color:0x9f503b,roughness:.5});
function annulus(parent,name,outer,inner,height,material,x=0,y=0,z=0){
 const s=new T.Shape();s.absarc(0,0,outer,0,TAU,false);
 const h=new T.Path();h.absarc(0,0,inner,0,TAU,true);s.holes.push(h);
 const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:64});g.rotateX(-Math.PI/2);g.translate(0,-height/2,0);
 const o=mesh(parent,g,material,x,y,z);o.name=name;return o;
}
function wrapCylinder(parent,name,radius,length,material,x,y,z){
 const o=cyl(parent,radius,length,material,x,y,z);o.rotation.z=Math.PI/2;o.name=name;return o;
}
function markLine(parent,name,points,material){
 const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),o=new T.Line(g,material);o.name=name;parent.add(o);return o;
}
function sphereMarker(parent,name,material,x,y,z,radius){
 const o=mesh(parent,new T.SphereGeometry(radius,16,10),material,x,y,z);o.name=name;return o;
}

export function buildReelRetrieve(){
 const m=buildReel(),spool=m.parts.spool;
 const shell=m.parts.core||spool.children.find(o=>o.geometry?.type==='CylinderGeometry'&&o.geometry.parameters.radiusTop===.77);
 shell.geometry.dispose();shell.geometry=new T.CylinderGeometry(.39,.39,.65,64);shell.name='Spool core below minimum line radius';
 const coils=spool.children.filter(o=>o.geometry?.type==='TorusGeometry'&&o.geometry.parameters.tube<.02);
 const scale=.79/26;
 const radiusLine=markLine(spool,'Displayed line radius',[[.37,0,0],[.37,0,.79]],new T.LineBasicMaterial({color:0x00b4c9,depthTest:false}));radiusLine.userData.noFit=true;
 const marker=cyl(spool,.019,.028,accent,.37,0,.79);marker.rotation.z=Math.PI/2;marker.name='Line radius marker';
 const defaults={turns:0,ratio:5.2,radius:22};
 const result={...m,allowZoom:true,defaults,parts:{...m.parts,core:shell,coils,radiusLine},update(s){
  const radius=clamp(Number(s.radius)||22,15,26),turns=Math.max(0,Number(s.turns)||0),ratio=snapReelRatio(s.ratio);s.ratio=ratio;
  for(const o of coils)o.scale.set(1,radius/26,radius/26);
  const drawn=radius*scale;radiusLine.geometry.attributes.position.setXYZ(1,.37,0,drawn);radiusLine.geometry.attributes.position.needsUpdate=true;radiusLine.geometry.computeBoundingSphere();marker.position.z=drawn;
  m.update({turns,rotor:turns*ratio,payout:0,ratio,radius},true);s.displayedRadius=drawn;s.retrievalCm=TAU*radius*ratio/10;
 },advance(s,dt){s.turns=(s.turns||0)+dt*.4;},action(a,s){if(a==='turn')s.turns=(s.turns||0)+1;},
 reading:s=>'반지름 '+s.radius+'mm · 기어비 '+s.ratio+':1 · 손잡이 한 바퀴에 약 '+(TAU*(Number(s.radius)||22)*(Number(s.ratio)||5.2)/10).toFixed(1)+'cm',
 annotations:[{text:'손잡이의 한 바퀴',object:m.parts.handle},{text:'줄을 감는 로터와 베일',object:m.parts.rotor},{text:s=>'감긴 줄의 반지름 '+s.radius+'mm',object:marker}]};
 result.update({...defaults});return result;
}

export function buildReelOscillation(){
 const group=new T.Group(),base=part(group,'fixed support'),crank=part(group,'crank'),follower=part(group,'slotted follower');
 box(base,6.05,.14,1.9,M.black,.15,-.52,.02,.04);
 for(const x of [-2.28,-.82])box(base,.18,.70,.8,steel,x,-.10,-.23,.03);
 for(const z of [-.24,.24])rod(base,[-2.55,.25,z],[-.55,.25,z],.055,steel);
 crank.position.set(-1.55,1.05,0);
 wrapCylinder(base,'Crank axle',.085,.60,steel,-1.55,1.05,-.24).rotation.set(Math.PI/2,0,0);
 const wheel=cyl(crank,.64,.10,bronze);wheel.rotation.x=Math.PI/2;wheel.name='Oscillation driving wheel';
 const hub=cyl(crank,.12,.14,bronze,0,0,.09);hub.rotation.x=Math.PI/2;ring(crank,.60,.025,steel,0,0,.07,'z');rod(crank,[0,0,.12],[0,.60,.12],.04,bronze);
 const pin=cyl(crank,.075,.28,red,0,.60,.20);pin.rotation.x=Math.PI/2;pin.name='Crank pin inside follower slot';
 const frame=new T.Shape();frame.moveTo(-.19,-.82);frame.lineTo(.19,-.82);frame.lineTo(.19,.82);frame.lineTo(-.19,.82);frame.closePath();
 const slot=new T.Path();slot.moveTo(-.09,-.69);slot.lineTo(-.09,.69);slot.lineTo(.09,.69);slot.lineTo(.09,-.69);slot.closePath();frame.holes.push(slot);
 const fg=new T.ExtrudeGeometry(frame,{depth:.12,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2});
 const slotBody=mesh(follower,fg,steel,0,1.05,.14);slotBody.name='Slotted yoke with a real opening';
 box(follower,.38,.12,.64,bronze,0,.38,0,.025);
 for(const z of [-.24,.24]){const bush=annulus(follower,'Linear guide bushing',.10,.058,.34,bronze,0,.25,z);bush.rotation.z=Math.PI/2;}
 const boss=annulus(follower,'Output shaft support',.11,.072,.24,bronze,.10,.25,0);boss.rotation.z=Math.PI/2;
 rod(follower,[.05,.25,0],[3.3,.25,0],.07,steel);
 const spool=part(follower,'non-rotating spool');spool.position.set(3.3,.25,0);
 const core=annulus(spool,'Spool core',.39,.08,1.45,M.black);core.rotation.z=Math.PI/2;
 for(const x of [-.79,.79]){const flange=annulus(spool,'Spool flange',.63,.09,.065,steel);flange.rotation.z=Math.PI/2;flange.position.x=x;}
 const coils=[];for(let i=0;i<49;i++){const o=ring(spool,.55,.012,i%4?M.ivory:bronze,-.6+i*.025,0,0,'x');o.name='Line winding '+i;coils.push(o);}
 const contact=sphereMarker(spool,'Fixed guide contact on moving spool',accent,0,0,.565,.035);
 const incoming=markLine(group,'Line arriving at a fixed axial position',[[1.75,.25,1.28],[1.75,.25,.565]],new T.LineBasicMaterial({color:0xc9dbc4}));incoming.userData.noFit=true;
 rod(base,[1.75,-.45,1.15],[1.75,.16,1.15],.04,steel);ring(base,.09,.016,bronze,1.75,.25,1.15,'z');
 const result={group,allowZoom:true,eye:[3.2,3.1,8],defaults:{angle:0},parts:{crank,pin,follower,slotBody,spool,contact,coils},update(s){
  const angle=Number(s.angle)||0,dx=.60*Math.sin(angle);crank.rotation.z=-angle;follower.position.x=-1.55+dx;contact.position.x=-dx;
  s.spoolTravel=dx;s.guidePosition=-dx;
 },advance(s,dt){s.angle=(s.angle||0)+dt;},
 reading:s=>'스풀의 왕복 위치 '+(Number(s.spoolTravel)||0).toFixed(2)+' · 들어오는 줄의 위치는 고정',
 annotations:[{text:'슬롯 안에서 도는 크랭크 핀',object:pin},{text:'회전을 왕복으로 바꾸는 슬롯',object:slotBody},{text:'들어오는 줄의 위치',object:contact}]};
 result.update({...result.defaults});return result;
}

export function buildReelDrag(){
 const group=new T.Group(),washers=part(group,'washers'),carrier=part(group,'spool carrier'),shaft=part(group,'fixed shaft');
 const thickness=.064,start=.10,discs=[],fixed=[],moving=[];
 annulus(group,'Stack support',.87,.11,.09,M.black,0,.023,0);
 cyl(shaft,.075,.75,steel,0,.27,0);for(const x of [-.09,.09])box(shaft,.035,.43,.055,steel,x,.23,0,.006);
 for(let i=0;i<5;i++){
  const disc=annulus(washers,i%2?'Spool-side friction disc '+i:'Shaft-keyed steel disc '+i,.68,.115,thickness,i%2?carbon:steel,0,start+i*thickness,0);
  disc.userData.side=i%2?'spool':'shaft';discs.push(disc);
  if(i%2){moving.push(disc);for(const sign of [-1,1])box(disc,.10,.05,.12,red,sign*.70,0,0,.006);}
  else{fixed.push(disc);for(const sign of [-1,1])box(disc,.055,.05,.065,bronze,sign*.09,0,0,.004);}
  const mark=box(disc,.09,.018,.07,i%2?red:bronze,.69,0,0,.004);mark.name='Rotation marker '+i;
 }
 ring(carrier,.82,.025,bronze,0,.04,0);for(const a of [0,Math.PI])rod(carrier,[Math.cos(a)*.75,.04,Math.sin(a)*.75],[Math.cos(a)*.75,.46,Math.sin(a)*.75],.022,bronze);
 const pressure=annulus(group,'Pressure washer',.56,.115,.08,bronze,0,.428,0);
 const knob=part(group,'drag adjustment knob');cyl(knob,.45,.15,M.black,0,.543,0);for(let i=0;i<24;i++){const a=i/24*TAU;rod(knob,[Math.cos(a)*.45,.49,Math.sin(a)*.45],[Math.cos(a)*.45,.59,Math.sin(a)*.45],.014,steel);}
 const line=markLine(group,'Line leaving spool',[[.82,.28,0],[2.10,.28,0]],new T.LineBasicMaterial({color:0xdfd0b1}));line.userData.noFit=true;
 const indicator=sphereMarker(group,'Drag slipping indicator',accent,1.27,.28,0,.05);
 const result={group,allowZoom:true,eye:[3.5,3,5],defaults:{load:30,setting:50,time:0},parts:{washers,discs,fixed,moving,shaft,carrier,pressure,knob},update(s){
  const slipping=Number(s.load)>Number(s.setting),a=slipping?(Number(s.time)||0):0;
  for(const d of fixed)d.rotation.y=0;for(const d of moving)d.rotation.y=a;carrier.rotation.y=a;knob.rotation.y=-(Number(s.setting)||50)/100*TAU*.65;
  indicator.material=slipping?red:accent;indicator.scale.setScalar(slipping?1.3:1);s.slipping=slipping;
  s.caption=slipping?'스풀 쪽 판이 미끄러지며 줄이 풀립니다.':'축 쪽 판과 스풀 쪽 판이 함께 버팁니다.';
 },advance(s,dt){s.time=(s.time||0)+dt;},reading:s=>s.caption+' · 당기는 힘 '+s.load+' / 저항 '+s.setting+' (상대값)',
 annotations:[{text:'축에 고정된 금속판',object:fixed[2]},{text:'스풀 쪽 마찰판과 회전 표시',object:moving[1]},{text:'판을 누르는 조절 노브',object:knob}]};
 result.update({...result.defaults});return result;
}