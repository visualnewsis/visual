import {T,M,TAU,clamp,colors,metal,component,assembly,part,mesh,box,cyl,ring,rod,bolt,sleeve} from './anatomy-core.js?v=20261028-craft7';
import {buildIris} from './camera-lessons.js?v=20261028-craft7';
import {buildProjector} from './projector-hero.js?v=20261030-reviewed11';
import {curtainWindow,filmCycle} from './mechanism-checks.js?v=20261026-release3';
export function cameraAssembly(){
 const group=new T.Group(),C=[],add=(...a)=>{const c=component(group,...a);C.push(c);return c.object;},chrome=metal(colors.frame),blue=new T.MeshPhysicalMaterial({color:0x87b8c4,metalness:.15,roughness:.12,transparent:true,opacity:.52,side:T.DoubleSide,depthWrite:false});
 const frame=add('frame','마운트와 프레임','렌즈의 광축과 셔터·센서의 위치를 고정합니다.',[0,0,0]);
 for(const x of [-1.65,1.65])box(frame,.12,2.35,.35,chrome,x,0,-.05,.025);for(const y of [-1.13,1.13])box(frame,3.4,.12,.35,chrome,0,y,-.05,.025);
 for(const x of [-1.48,1.48])for(const y of [-.96,.96]){const b=cyl(frame,.055,.07,M.black,x,y,.16);b.rotation.x=Math.PI/2;}
 const sensor=add('sensor','센서와 지지판','셔터막이 열려 있는 동안 들어온 빛을 기록합니다.',[0,0,-1.6],colors.optics);box(sensor,2.9,1.98,.12,chrome,0,0,-.34,.03);box(sensor,2.58,1.72,.035,metal(0x447b87),0,0,-.26,.01);for(let i=0;i<20;i++)box(sensor,.012,1.68,.008,metal(0x68a1a7),-1.24+i*.13,0,-.235,.001);
 const rear=add('rear-curtain','후막과 레일','선막을 뒤따라 센서를 가리고 노출을 끝냅니다.',[0,0,-.8],colors.spring),front=add('front-curtain','선막과 레일','센서를 드러내며 노출을 시작합니다.',[0,0,.75],colors.drive),slats=[];
 for(const [k,p] of [[0,front],[1,rear]]){for(const x of [-1.42,1.42])box(p,.07,2.2,.07,chrome,x,0,k*.08,.01);const a=[];for(let i=0;i<8;i++){const o=box(p,2.78,.232,.025,metal(k?0x4e6267:0x313f43),0,-.9+(i+.5)*.225,.04+k*.08+i*.003,.004);a.push(o);}slats.push(a);}
 const mount=add('mount','렌즈 마운트','렌즈와 본체를 같은 축에 고정합니다.',[0,0,1.1]);ring(mount,1.03,.09,chrome,0,0,.35,'z');for(let i=0;i<4;i++){const a=i*TAU/4;box(mount,.16,.09,.05,M.brass,Math.cos(a)*.95,Math.sin(a)*.95,.36,.01);}
 const rearGlass=add('rear-glass','뒤쪽 렌즈군','여러 렌즈를 조합해 빛이 센서에 상을 맺도록 합니다.',[0,0,1.65],colors.optics);lens(rearGlass,.82,.49,blue,chrome);
 const irisModel=buildIris(),iris=add('iris','조리개 유닛','겹친 날개 사이 구멍이 바뀌면서 통과하는 빛의 양이 달라집니다.',[0,0,2.3],colors.spring);iris.add(irisModel.group);irisModel.group.rotation.x=Math.PI/2;irisModel.group.scale.setScalar(.68);iris.position.z=.9;
 const focus=add('focus','초점 링과 경통','렌즈를 지지하는 경통입니다. 일부를 절개해 안쪽 배열을 드러냈습니다.',[0,0,2.8],colors.frame);for(const z of [1.1,1.8])ring(focus,1.03,.065,M.black,0,0,z,'z');for(let i=0;i<44;i++){const a=i/44*TAU;rod(focus,[Math.cos(a)*1.03,Math.sin(a)*1.03,1.3],[Math.cos(a)*1.03,Math.sin(a)*1.03,1.72],.013,M.black);}for(const a of [0,Math.PI])rod(focus,[Math.cos(a),Math.sin(a),.4],[Math.cos(a),Math.sin(a),1.85],.035,chrome);
 const frontGlass=add('front-glass','앞쪽 렌즈군','광축을 따라 렌즈가 배열됩니다. 특정 제품의 광학 설계는 아닙니다.',[0,0,3.5],colors.optics);lens(frontGlass,.92,1.9,blue,chrome);
 return assembly(group,C,s=>{irisModel.update({fstop:s.aperture||2.8});const w=curtainWindow(clamp(s.phase||0),s.fast!==false);for(let i=0;i<8;i++){const rest=-.9+(i+.5)*.225;slats[0][i].position.y=Math.min(rest+w.first,1.02+i*.012);slats[1][i].position.y=Math.max(rest+w.second,-1.02-i*.012);}}, {eye:[5,3.5,8],duration:5,phaseLabel:'셔터 한 번의 진행',note:'렌즈는 광축, 셔터와 센서는 깊이 방향으로 벌어집니다. 렌즈군은 배열을 설명하기 위한 대표형입니다.'});
}
function lens(p,r,z,glass,frame){const profile=[[0,-.065],[r*.4,-.06],[r*.82,-.03],[r,0],[r*.82,.03],[r*.4,.06],[0,.065]];const o=mesh(p,new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),64),glass,0,0,z);o.rotation.x=Math.PI/2;ring(p,r,.035,frame,0,0,z,'z');}
export function projectorAssembly(){
 // One physical machine serves hero, disassembly and optical studies.
 const hero=buildProjector(),{group,parts}=hero;
 // The structure viewer measures all descendants, including invisible ones.
 // A remote projection screen must not shrink this assembled hardware view.
 parts.screen.removeFromParent();parts.beam.removeFromParent();
 const descriptors=[
 ['frame','지지 프레임','릴과 게이트, 광학계를 지지하는 본체입니다.',parts.body,[0,0,-1.5],colors.frame],
 ['reels','공급 릴과 권취 릴','릴은 연속으로 돌고, 상하 루프는 게이트의 간헐 이송을 받아 줍니다.',parts.reels,[0,1.2,-.8],colors.drive],
 ['gate','게이트와 압판','세워진 필름 한 프레임을 광축과 직각으로 붙잡습니다.',parts.gate,[-.8,0,0],colors.frame],
 ['film','필름과 상하 루프','같은 폭의 필름이 릴에서 게이트를 지나 권취 릴로 이어집니다.',parts.filmGroup,[0,0,.9],colors.spring],
 ['shutter','회전 셔터','필름이 움직이는 동안 광로를 가립니다.',parts.shutter,[1.1,0,0],colors.drive],
 ['intermittent','간헐 이송 · 핀과 슬롯','구동 핀이 슬롯을 밀 때만 같은 축의 스프로킷이 90도 회전합니다.',parts.mechanismMount,[0,0,1.8],colors.drive],
 ['lamp','램프와 콘덴서','게이트 뒤에서 필름에 빛을 모읍니다.',parts.lamp,[0,0,-1.2],colors.optics],
 ['lens','투사 렌즈','필름과 직각인 같은 광축에서 상을 확대합니다.',parts.lens,[0,0,2.0],colors.optics]];
 const components=descriptors.map(([id,title,description,object,offset,color])=>({id,title,description,object,offset:new T.Vector3(...offset),color}));
 const model=assembly(group,components,s=>{
 hero.update({frames:(Number(s.phase)||0)-.35},false);
 parts.screen.visible=false;parts.beam.visible=false;parts.shutter.visible=true;
 },{eye:[7,3.2,10],phaseLabel:'멈춤·차광·한 프레임 이송',note:'릴에서 풀린 필름이 게이트를 지나 다시 감깁니다. 필름이 움직이는 동안 셔터가 빛을 가리는 순서를 살펴보세요.'});
 model.anatomyReading=()=>{
  const clock=group.userData.transport;
  if(clock.engaged)return '빛 차단 · 필름을 한 칸 옮깁니다.';
  const stopped=clock.index>0?'다음 프레임 정지':'필름 정지';
  if(clock.openFraction===1)return stopped+' · 셔터 열림 · 한 프레임을 비춥니다.';
  if(clock.openFraction>0)return stopped+' · 셔터가 일부만 열려 있습니다.';
  return stopped+' · 셔터가 빛을 가립니다.';
 };
 model.hardware=hero;model.optical=parts.optics;return model;
}
