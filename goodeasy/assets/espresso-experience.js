const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number(x)||0));
export const ESPRESSO_OBSERVATION_SECONDS=12;
export const espressoGrinds=[{value:30,name:'굵게',flow:3.65},{value:50,name:'기준',flow:2.6},{value:75,name:'곱게',flow:1.65}];
export function espressoTrialAt(elapsed,grind=50){
 const t=clamp(elapsed,0,12),preset=espressoGrinds.reduce((a,b)=>Math.abs(b.value-grind)<Math.abs(a.value-grind)?b:a),front=clamp((t-1.4)/.4),volume=clamp((t-1.8)*preset.flow,0,40);
 return {brewElapsed:t,espressoPhase:t<1.4?'wetting':t<1.8?'first-drop':t<12?'extracting':'done',espressoPouring:t>=1.4&&t<12,espressoStreamProgress:front,volume,pressure:t>=12?0:t<1.4?2+5*t/1.4:9,locked:true,brewing:t<12,grind:preset.value};
}
export function createEspressoExperience({getState,setState,render=()=>{},announce=()=>{},wake=()=>{}}){
 const results=new Map();let paused=false;
 const el=id=>typeof document==='undefined'?null:document.getElementById(id);
 function sync(){const s=getState(),preset=espressoGrinds.find(x=>x.value===s.grind)||espressoGrinds[1];
  if(el('action')){el('action').disabled=false;el('action').textContent=s.brewing?'추출 멈추기':s.espressoPhase==='paused'?'계속 추출하기':s.espressoPhase==='done'?'한 번 더 내려보기':'한 잔 내려보기';el('action').setAttribute('aria-pressed',String(!!s.brewing));}
  if(el('espresso-clock'))el('espresso-clock').textContent=(s.brewElapsed||0).toFixed(1)+' / 12초';
  if(el('espresso-stage'))el('espresso-stage').textContent=({ready:'준비됨',wetting:'커피층을 적시는 중', 'first-drop':'첫 방울이 내려오는 중',extracting:'커피가 잔에 모이는 중',paused:'추출 멈춤',done:'비교 결과'})[s.espressoPhase]||'준비됨';
  if(el('grind-value'))el('grind-value').textContent=preset.name;
  if(typeof document!=='undefined'){for(const b of document.querySelectorAll('[data-espresso-grind]'))b.setAttribute('aria-pressed',String(Number(b.dataset.espressoGrind)===s.grind));for(const b of document.querySelectorAll('[data-espresso-result]')){const r=results.get(Number(b.dataset.espressoResult));b.textContent=r===undefined?'아직 비교하지 않음':'잔 '+Math.round(r/40*100)+'%';}}
 }
 function show(){render();sync();const s=getState();announce(s.espressoPhase==='ready'?'원두와 뜨거운 물이 준비됐습니다. 버튼을 눌러 한 잔 내려보세요.':s.espressoPhase==='wetting'?'물이 커피층을 적십니다. 아직 잔으로 나오지 않습니다.':s.espressoPhase==='first-drop'?'커피층을 지난 첫 방울이 추출구 아래로 내려옵니다.':s.espressoPhase==='paused'?'추출을 멈췄습니다. 다시 누르면 이어집니다.':s.espressoPhase==='done'?'같은 12초를 관찰했습니다. 분쇄도를 바꿔 잔에 모인 양을 비교해보세요.':'커피가 잔에 모입니다. ‘물길 보기’를 누르면 내부의 연결을 볼 수 있습니다.');}
 function reset(){const s=getState();paused=false;setState({...s,locked:true,brewing:false,volume:0,pressure:0,brewElapsed:0,espressoPhase:'ready',espressoPouring:false,espressoStreamProgress:0,grind:espressoGrinds.reduce((a,b)=>Math.abs(b.value-s.grind)<Math.abs(a.value-s.grind)?b:a).value});show();}
 function pause(){const s=getState();paused=!!s.brewing;setState({...s,brewing:false,pressure:0,espressoPouring:false,espressoPhase:s.brewing?'paused':s.espressoPhase});show();}
 function brew(){const s=getState();if(s.brewing){pause();return false;}const resume=paused&&s.espressoPhase==='paused';paused=false;setState({...s,...espressoTrialAt(resume?s.brewElapsed:0,s.grind)});show();wake();return true;}
 function tick(dt){const s=getState();if(!s.brewing)return false;const next={...s,...espressoTrialAt((s.brewElapsed||0)+clamp(dt,0,.15),s.grind)};setState(next);if(!next.brewing)results.set(next.grind,next.volume);show();return next.brewing;}
 if(typeof document!=='undefined'){
  for(const b of document.querySelectorAll('[data-espresso-grind]'))b.addEventListener('click',()=>{setState({...getState(),grind:Number(b.dataset.espressoGrind)});reset();});
  el('espresso-cutaway')?.addEventListener('click',e=>{const open=!getState().espressoCutaway;setState({...getState(),espressoCutaway:open});e.currentTarget.setAttribute('aria-pressed',String(open));e.currentTarget.textContent=open?'외피 닫기':'물길 보기';show();});
 }
 reset();return {brew,tick,reset,pause};
}
