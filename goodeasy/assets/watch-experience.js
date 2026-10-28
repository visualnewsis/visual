const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Seconds and charge are deliberately shortened for observation, not a calibrated watch.
export function createWatchExperience({getState,setState,render=()=>{},announce=()=>{},wake=()=>{}}){
 let paused=false;
 const commit=state=>{setState(state);render();};
 return {
  wind(turns=1){const s=getState(),n=clamp(Number(turns)||0,0,12.5);if(!n)return;
   paused=false;commit({...s,turns:(s.turns||0)+n,reserve:clamp((s.reserve||0)+n*8,0,100),
    visualTurns:s.visualTurns??s.turns??0,visualReserve:s.visualReserve??s.reserve??0,winding:true,freeAge:s.freeAge||0,regulated:s.regulated!==false});
   announce('용두가 감기축을 돌리고, 태엽이 안쪽으로 감깁니다.');wake();
  },
  tick(seconds){if(paused)return false;const dt=clamp(Number(seconds)||0,0,.1),s=getState(),free=s.regulated===false;
   const reserve=Math.max(0,(s.reserve||0)-dt*(free?22:.5)),speed=free?3+(s.reserve||0)*.32:1;
   const step=Math.min(dt,(s.reserve||0)/(free?22:.5)),target=s.turns||0;
   const visualTurns=(s.visualTurns??target)+Math.min(Math.max(0,target-(s.visualTurns??target)),dt*5);
   const displayed=s.visualReserve??s.reserve??0,visualReserve=displayed+(reserve-displayed)*(1-Math.exp(-dt*9));
   const winding=Math.abs(target-visualTurns)>.0001;
   commit({...s,reserve,elapsed:(s.elapsed||0)+step*speed,visualTurns,visualReserve,winding,freeAge:free?(s.freeAge||0)+dt:0});
   return reserve>0||winding||Math.abs(visualReserve-reserve)>.02;
  },
  regulate(mode){const s=getState(),regulated=mode!==false&&mode!=='free';paused=false;
   commit({...s,regulated,freeAge:0});announce(regulated?'탈진기가 힘을 조금씩 풀어줍니다.':'팔렛을 빼면 빠르게 돌다가 태엽이 먼저 풀립니다.');wake();
  },
  reset(){paused=false;const s=getState();commit({...s,turns:0,reserve:0,elapsed:0,visualTurns:0,visualReserve:0,winding:false,regulated:true,freeAge:0});announce('태엽이 풀린 처음 상태입니다.');},
  pause(){paused=true;},
  resume(){paused=false;wake();}
 };
}
