import {T,M,mesh,box,cyl,ring,rod,part} from './anatomy-core.js?v=20261028-craft7';
import {cameraAssembly as baseCameraAssembly} from './anatomy-optics.js?v=20261028-craft7';
const TAU=Math.PI*2;
function clear(group){for(const child of [...group.children]){group.remove(child);child.traverse(o=>o.geometry?.dispose());}}
function retainingRing(parent,outer,inner,z,material){const shape=new T.Shape();shape.absarc(0,0,outer,0,TAU,false);const hole=new T.Path();hole.absarc(0,0,inner,0,TAU,true);shape.holes.push(hole);const g=new T.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:false,curveSegments:64});return mesh(parent,g,material,0,0,z-.02);}
function element(parent,name,radius,z,shapeType,material){
 const n=36,profile=[],front=q=>shapeType==='concave'?.077-.045*(1-q*q):.023+.065*(1-q*q),back=q=>shapeType==='meniscus'?-.024+.048*(1-q*q):shapeType==='concave'?-.077+.045*(1-q*q):-.023-.055*(1-q*q);
 for(let i=0;i<=n;i++){const q=i/n;profile.push(new T.Vector2(radius*q,front(q)));}
 for(let i=n;i>=0;i--){const q=i/n;profile.push(new T.Vector2(radius*q,back(q)));}
 const lens=mesh(parent,new T.LatheGeometry(profile,80),material,0,0,z);lens.rotation.x=Math.PI/2;lens.name=name;lens.userData={opticalAxis:'z',radius,shapeType,opticalExample:true};
 return lens;
}
export function cameraAssembly(){
 const model=baseCameraAssembly(),C=model.components,find=id=>C.find(c=>c.id===id),frame=find('frame').object,sensor=find('sensor').object,rear=find('rear-glass').object,front=find('front-glass').object,iris=find('iris').object;
 const black=new T.MeshPhysicalMaterial({color:0x1c2529,metalness:.58,roughness:.34,clearcoat:.32}),steel=new T.MeshStandardMaterial({color:0x9faeac,metalness:.88,roughness:.29}),gold=new T.MeshStandardMaterial({color:0xb7a878,metalness:.75,roughness:.4}),glass=new T.MeshPhysicalMaterial({color:0x82a6b3,metalness:.02,roughness:.055,clearcoat:1,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false});
 // Retain the original curtain animation and all component IDs. Add context around its optical path.
 const body=part(frame,'Cutaway camera body context');box(body,3.75,.15,1.0,black,.05,1.24,-.28,.06);box(body,.70,2.44,1.02,black,1.85,0,-.30,.18);box(body,3.72,.14,.95,black,.05,-1.23,-.31,.045);box(body,.14,2.43,.82,black,-1.74,0,-.32,.035);
 for(let i=0;i<9;i++)rod(body,[2.20,-.84+i*.17,.16],[2.20,-.84+i*.17,.32],.009,steel);
 clear(sensor);const board=box(sensor,2.9,1.98,.11,steel,0,0,-.35,.028);board.name='Sensor package support plate';
 box(sensor,2.64,1.78,.07,black,0,0,-.27,.012);
 const pixels=new T.InstancedMesh(new T.PlaneGeometry(.054,.054),new T.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.12}),42*28),matrix=new T.Matrix4(),color=new T.Color();let k=0;
 for(let y=0;y<28;y++)for(let x=0;x<42;x++){matrix.makeTranslation((x-20.5)*.057,(y-13.5)*.057,-.224);pixels.setMatrixAt(k,matrix);color.setHex((x+y)%2===0?0x426a58:y%2?0x465d79:0x795a56);pixels.setColorAt(k++,color);}pixels.name='Enlarged colour filter mosaic';pixels.instanceMatrix.needsUpdate=true;sensor.add(pixels);
 const filter=box(sensor,2.45,1.65,.012,glass.clone(),0,0,-.202,.006);filter.name='Sensor protective filter glass';
 for(const sign of [-1,1])for(let i=0;i<12;i++)box(sensor,.10,.055,.015,gold,sign*1.34,-.80+i*.145,-.276,.003);
 // Five illustrative elements, with air gaps and different front/back curvatures.
 clear(rear);clear(front);const glassElements=[];
 for(const [parent,name,r,z,type] of [[rear,'Rear positive glass element',.79,.48,'convex'],[rear,'Rear meniscus glass element',.73,.69,'meniscus'],[front,'Front rear negative glass element',.83,1.43,'concave'],[front,'Front middle positive glass element',.89,1.68,'convex'],[front,'Front protective meniscus element',.92,1.94,'meniscus']]){
  glassElements.push(element(parent,name,r,z,type,glass.clone()));const mount=retainingRing(parent,1.0,r-.012,z,black);mount.name=name+' retaining seat';ring(parent,r,.008,steel,0,0,z,'z');
 }
 const builtInGlass=iris.getObjectByName('front and rear glass');if(builtInGlass)builtInGlass.visible=false;
 const rearEntry=find('rear-glass');rearEntry.title='뒤쪽 광학 유리 · 2매';rearEntry.description='빛이 지나가는 곡면 유리와 고정 링입니다. 렌즈 사이에는 공기층이 있습니다.';
 const frontEntry=find('front-glass');frontEntry.title='앞쪽 광학 유리 · 3매';frontEntry.description='오목·볼록·메니스커스 형상을 나눠 봅니다. 특정 제품의 광학 처방이나 결상 성능을 재현한 배열은 아닙니다.';
 find('sensor').description='빛을 기록하는 면과 보호 유리, 지지판입니다. 색 필터 격자는 실제 크기보다 크게 표현했습니다.';
 model.parts={...(model.parts||{}),glassElements,sensor,pixels,frame,iris,body};
 model.eye=[5.5,3.4,8];model.note='렌즈의 곡률·공기층·고정 링과, 두 셔터막 뒤의 센서를 나눠 봅니다. 유리 5매는 설명용 배열이며 특정 렌즈의 광학 설계가 아닙니다.';
 return model;
}