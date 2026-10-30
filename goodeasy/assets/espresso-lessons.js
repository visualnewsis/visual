import {espressoAssembly} from './anatomy-espresso.js?v=20261030-reviewed11';
import {espressoSequence} from './espresso-sequence.js?v=20261028-release3';
import {buildCoffeeComparison as detailedCoffeeComparison} from './coffee-detail.js?v=20261030-reviewed11';
import {T,materials as M,box,cyl,rod,tube,part} from './quality-kit.js?v=20261028-craft7';
import {buildEspressoStudy} from './quality-replacements.js?v=20261030-reviewed11';
import {coffeeFlow} from './model.js?v=20261026-release3';

const water=new T.MeshStandardMaterial({color:0x70cbd5,emissive:0x164651,roughness:.25});
const clamp=x=>Math.max(0,Math.min(1,x));
function legacyCoffeeComparison(){
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
 const m=espressoAssembly(),update=m.update.bind(m),ids=['tank','pump','boiler','head','cup'];
 const captions=['물탱크 바닥의 흡입구 → 펌프 입구','펌프 출구 → 보일러 입구','보일러의 히터 → 데워진 물의 출구','그룹헤드 → 샤워스크린 → 커피층','바스켓의 구멍 → 추출구 → 잔'];
 return {...m,allowZoom:true,defaults:{phase:0,explode:0},annotations:ids.map((id,i)=>({object:m.components.find(c=>c.id===id).object,text:['물탱크','펌프','보일러','그룹헤드','잔'][i]})),update(s){s.activePart=espressoSequence(s.phase).stage;update(s);},advance(s,dt){s.phase=Math.min(1,(s.phase||0)+Math.max(0,dt)/12);if(s.phase>=1)s.running=false;},reading:s=>captions[s.activePart||0]+' · 펌프식 단일 보일러의 개념 구조입니다.'};
}

export {detailedCoffeeComparison as buildCoffeeComparison};
