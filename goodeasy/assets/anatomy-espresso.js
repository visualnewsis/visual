import {T,M,assembly,clamp} from './anatomy-core.js?v=20261028-craft7';
import {buildEspressoStudy} from './quality-replacements.js?v=20261109-espresso5';
import {espressoSequence} from './espresso-sequence.js?v=20261028-release3';
export function espressoAssembly(){
 const m=buildEspressoStudy(T,M),p=m.parts,group=m.group,C=[],connections=[];
 m.update({locked:true,brewing:false,volume:0,pressure:0});
 const basket=new T.Group();basket.name='teaching basket and puck';basket.position.copy(p.filter.position);group.add(basket);
 for(const o of [...p.filter.children])if(o.name==='coffee puck inside locked basket'||o.name==='grounds below shower screen'||o.name==='actual perforated basket floor'||o.geometry?.type==='ExtrudeGeometry')basket.add(o);
 const entries=[['cover','외피와 상판','덮개를 열어 같은 기계의 물길을 봅니다.',p.body],['rear','뒤쪽 덮개','섀시에서 분리하는 외피입니다.',p.rearPanel],['warmer','컵 워머','위쪽을 열어 내부를 관찰합니다.',p.cupWarmer],['chassis','지지 프레임과 앞판','내부 부품과 외부 조작부의 지지 위치를 유지합니다.',p.chassis],['tank','물탱크','오른쪽 물탱크 아래쪽 흡입구에서 펌프로 이어집니다.',p.tank],['pump','펌프','물을 밀어 압력을 만듭니다.',p.pump],['boiler','보일러','가로 보일러의 물을 히터로 데웁니다.',p.boiler],['head','그룹헤드와 샤워스크린','뜨거운 물을 커피층 위로 나눕니다.',p.head],['basket','바스켓과 커피층','물은 커피층을 지나 바스켓 바닥으로 나옵니다.',basket],['filter','포터필터와 추출구','바스켓을 고정하고 커피를 아래로 모읍니다.',p.filter],['cup','잔','추출구 아래에서 커피를 받습니다.',p.cup]];
 for(const [id,title,description,object]of entries)C.push({id,title,description,object,offset:new T.Vector3(),color:0x8fa7a3});
 const routes=[['tank-pump',p.tank,p.pump,'tank outlet to pump inlet'],['pump-boiler',p.pump,p.boiler,'pump outlet to boiler endcap'],['boiler-head',p.boiler,p.head,'boiler surface to grouphead inlet']];
 function connect(id,A,a,B,b,pipe,curve){const points=[new T.Vector3(...a),new T.Vector3(...b)],guide=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineDashedMaterial({color:0x70cbd5,dashSize:.07,gapSize:.04}));group.add(guide);connections.push({id,A,a:points[0].clone(),B,b:points[1].clone(),points,pipe,curve,guide});}
 for(const[id,A,B,name]of routes){const pipe=p.pipes.getObjectByName(name),curve=pipe.geometry.parameters.path;connect(id,A,curve.getPoint(0).toArray(),B,curve.getPoint(1).toArray(),pipe,curve);}
 // A dashed port connection replaces only the opened group-to-basket joint.
 const joint=new T.Group();group.add(joint);connect('head-basket',p.head,[-.62,1.2875,1.72],basket,[0,.042,0],joint,null);connections.at(-1).points[1].add(basket.position);
 const marker=new T.Mesh(new T.SphereGeometry(.045,16,12),new T.MeshBasicMaterial({color:0x70cbd5}));marker.name='water route teaching marker';group.add(marker);
 const vec=(object,point)=>{const q=object.localToWorld(new T.Vector3(...point));return group.worldToLocal(q);};
 const filters=p.filter.position.clone(),basketRest=basket.position.clone();for(const stream of p.cup.children.filter(o=>o.name==='detailed coffee stream'))stream.userData.side=stream.position.x>-.62?1:-1;
 return assembly(group,C,s=>{
  const e=clamp(s.explode||0),split=clamp((e-.4)/.6),q=espressoSequence(s.phase);
  m.update({locked:true,brewing:q.pump,pressure:q.pump?9:0,volume:q.fill*40,brewElapsed:q.phase*12,espressoCutaway:e>0||!!s.cutaway,espressoPouring:q.pouring,espressoStreamProgress:q.front},false,q.phase*12000);
  p.body.visible=!s.cutaway;p.cupWarmer.visible=!s.cutaway;p.rearPanel.visible=!s.cutaway;
  p.body.position.set(0,e*3.4,0);p.cupWarmer.position.y=e*4;p.rearPanel.position.z=-e*2;
  const stage=(start,end)=>clamp((e-start)/(end-start));
  p.cup.position.set(0,stage(.15,.2)*.04-stage(.6,.8)*.65,stage(.2,.4)*1.65);
  p.filter.position.copy(filters).add(new T.Vector3(0,-stage(.4,.45)*.10-stage(.6,.8)*.65,stage(.45,.6)*1.65));
  basket.position.copy(p.filter.position).add(new T.Vector3(0,stage(.8,.9)*.40,stage(.9,1)*.65));
  p.flowInterior.getObjectByName('continuous flow through puck and spouts').visible=q.pump&&e<=.4;group.userData.flowSequence=q;group.userData.canonicalMachine='buildEspressoStudy';
 },{eye:m.eye,duration:12,phaseLabel:'물의 이동 · 앞뒤로 보기',connections,note:'첫 체험과 같은 기계입니다. 외피를 먼저 열고 바스켓과 포터필터를 나눕니다. 분리된 부품 사이의 점과 점선은 원래 연결 순서를 짚는 표시입니다. 커피 줄기는 추출구 바로 아래에 잔이 있을 때만 보입니다.',after(s){
  group.updateMatrixWorld(true);const q=espressoSequence(s.phase),t=q.phase;
  for(const c of connections){const A=vec(c.A,c.a.toArray()),B=vec(c.B,c.b.toArray()),separated=A.distanceTo(c.points[0])>1e-6||B.distanceTo(c.points[1])>1e-6;c.pipe.visible=!separated;c.guide.visible=separated;c.guide.geometry.setFromPoints([A,B]);c.guide.computeLineDistances();}
  if(t<.2)marker.position.copy(connections[0].curve.getPoint(t/.2));
  else if(t<.4)marker.position.copy(connections[1].curve.getPoint((t-.2)/.2));
  else if(t<.6)marker.position.lerpVectors(new T.Vector3(.235,1.47,-.43),new T.Vector3(-.43,2,-.43),(t-.4)/.2);
  else if(t<.72)marker.position.copy(connections[2].curve.getPoint((t-.6)/.12));
  else if(t<.76)marker.position.lerpVectors(vec(p.head,[-.62,2.37,1.27647]),vec(p.head,[-.62,1.2875,1.72]),(t-.72)/.04);
  else if(t<.8)marker.position.lerpVectors(vec(basket,[0,.042,0]),vec(p.filter,[0,-.275,.27]),(t-.76)/.04);
  else marker.position.lerpVectors(vec(p.filter,[0,-.275,.27]),vec(p.cup,[-.62,.15+.58*.2,1.99]),((t-.8)/.04)%1);
  marker.material.color.setHex(t<.6?0x70cbd5:t<.76?0xe3bd73:0x61381b);marker.visible=t>.02&&t<1;
  // Streams follow the actual moved outlet and cup at every independent explode value.
  for(const stream of p.cup.children.filter(o=>o.name==='detailed coffee stream')){const side=stream.userData.side,A=vec(p.filter,[side*.12,-.275,.27]),B=vec(p.cup,[-.62+side*.12,.15+.58*(p.cup.children.find(o=>o.name==='Reusable porcelain espresso cup')?.userData.surfaceY||.2),1.99]);const end=A.clone().lerp(B,q.front);const a=p.cup.worldToLocal(group.localToWorld(A.clone())),b=p.cup.worldToLocal(group.localToWorld(end));stream.position.copy(a).add(b).multiplyScalar(.5);stream.scale.y=Math.max(.0001,a.distanceTo(b));stream.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),a.clone().sub(b).normalize());stream.visible=q.pouring&&Math.hypot(A.x-B.x,A.z-B.z)<.01&&B.y<A.y;}
 }});
}
