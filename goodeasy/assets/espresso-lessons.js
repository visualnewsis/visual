import {T,materials as M,box,cyl,rod,tube,part} from './quality-kit.js?v=20261026-release3';
import {buildEspressoStudy} from './quality-replacements.js?v=20261026-release3';
import {coffeeFlow} from './model.js?v=20261026-release3';

const water=new T.MeshStandardMaterial({color:0x70cbd5,emissive:0x164651,roughness:.25});
const clamp=x=>Math.max(0,Math.min(1,x));
export function buildCoffeeComparison(){
 const group=new T.Group(),beds=[],labels=[];
 for(let side=0;side<2;side++){
  const g=part(group,side?'selected grind':'coarse reference');g.position.x=side?1.45:-1.45;
  box(g,2,.08,1.4,M.steel,0,-.18,0);
  // An open section: particles and the water between them remain visible.
  const particles=[];
  for(let row=0;row<10;row++)for(let col=0;col<16;col++){
   const grain=cyl(g,.11,.12,M.coffee,-.78+col*.26,-.01+row*.17,(col%2? .09:-.09));grain.rotation.x=Math.PI/2;particles.push(grain);
  }
  const drops=[];for(let i=0;i<18;i++){
   const o=new T.Mesh(new T.SphereGeometry(.032,12,8),water);g.add(o);drops.push(o);
  }
  const glass=new T.MeshStandardMaterial({color:0xacc9c9,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide});
  const cup=cyl(g,.52,.56,glass,0,-.78,0);const fill=cyl(g,.47,.02,M.coffee,0,-1,0);
  beds.push({g,particles,drops,fill});labels.push({text:side?'② 분쇄도 변경':'① 굵게 고정',point:[g.position.x,1.18,0]});
 }
 return {group,eye:[0,2,9],defaults:{grind:70,pressure:9,channel:0,time:0},annotations:labels,
  update(s){const reference=coffeeFlow(30,9),values=[30,s.grind??70];s.comparison=[];
   beds.forEach((b,side)=>{const grind=values[side],q=coffeeFlow(grind,s.pressure??9)/reference;
    s.comparison.push(Math.round(q*100));
    const cols=Math.max(4,Math.min(16,Math.round(7+(grind-30)*.175))),rows=Math.max(3,Math.min(10,Math.round(4+(grind-30)*.1)));b.particles.forEach((o,i)=>{const col=i%16,row=Math.floor(i/16);o.visible=col<cols&&row<rows;o.scale.setScalar((.76/cols)/.11);o.position.set(-.82+col*1.64/(cols-1),.02+row*.65/(rows-1),.02);});
    b.drops.forEach((o,i)=>{const channel=!!s.channel&&side===1;const phase=((s.time||0)*q*.45+i/18)%1;o.position.set(channel? .53+(i%3)*.025:-.79+(i%7)*.26,1.06-phase*2.0,.14);});
    const fraction=clamp(q*.65);b.fill.position.y=-1+fraction*.45;
   });
  },advance(s,dt){s.time+=dt;},reading:s=>`두 쪽 모두 ${s.pressure}bar · 왼쪽 ${s.comparison[0]} / 오른쪽 ${s.comparison[1]} · 굵게·9bar의 흐름을 100으로 둔 비교값`,
  compare:s=>({left:s.comparison[0],right:s.comparison[1],pressure:s.pressure,grind:s.grind,channel:!!s.channel})};
}

export function buildCoffeeWaterPath(){
 const m=buildEspressoStudy(T,M),group=m.group;
 const points=[[1.02,1.26,-.54],[.80,.57,.24],[-.43,1.47,-.43],[-.62,2.37,1.72],[-.62,1.15,1.72],[-.62,.70,2.04]];
 for(let i=0;i<points.length-1;i++){const pipe=rod(group,points[i],points[i+1],.027,water);pipe.userData.noFit=true;}
 const bead=new T.Mesh(new T.SphereGeometry(.085,20,12),new T.MeshBasicMaterial({color:0xc2f5f5}));bead.userData.noFit=true;group.add(bead);
 const names=['tank','pump','boiler','filter','cup'];
 const texts=['① 물탱크','② 펌프','③ 보일러','④ 커피층','⑤ 잔'];
 const annotations=names.map((key,i)=>({text:texts[i],part:key,point:points[[0,1,2,4,5][i]]}));
 for(const name of [...names,'head'])m.parts[name]?.traverse(o=>{if(o.isMesh&&o.material.emissive)o.material=o.material.clone();});
 return {...m,eye:[4,3.8,8],defaults:{phase:0},annotations,
  update(s){m.update({locked:true,brewing:s.phase>=.8,volume:0,pressure:9},true);
   for(const name of ['tank','pump','boiler','pipes'])m.parts[name].position.set(0,0,0);
   const active=Math.min(4,Math.floor(clamp(s.phase)*5));s.activePart=active;
   // Equal slider intervals per named stage, with the dot passing through each part.
   const section=Math.min(4,Math.floor(clamp(s.phase)*5)),local=clamp(s.phase)*5-section;
   const a=new T.Vector3(...points[section===4?4:section]),b=new T.Vector3(...points[section===4?5:section+1]);
   bead.position.copy(a.lerp(b,clamp(local)));
   for(const [i,name] of names.entries())m.parts[name]?.traverse(o=>{if(o.isMesh&&o.material.emissive)o.material.emissive.setHex(i===active?0x265f69:0);});
  },advance(s,dt){s.phase=Math.min(1,s.phase+dt*.15);if(s.phase===1)s.running=false;},
  action(a,s){if(a==='path-start'){s.phase=0;s.running=true;}},
  reading:s=>['① 물탱크 · 추출에 쓸 물을 담습니다.','② 펌프 · 커피층 쪽으로 물을 밀어 보냅니다.','③ 보일러 · 추출에 쓸 물을 데웁니다.','④ 커피층 · 뜨거운 물이 가루 사이를 통과합니다.','⑤ 잔 · 커피층을 지난 액체가 내려옵니다.'][s.activePart||0]};
}
