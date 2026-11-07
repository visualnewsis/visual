/* Pure state/geometry: no input text, network, analytics or 3D dependency. */
export function createGuideState(saved={}) {
  let experienced=!!saved.experienced, muted=!!saved.muted, autoShown=!!saved.autoShown, done=!!saved.done;
  let misses=[], pendingUntil=0;
  return {
    get experienced(){return experienced;},
    get stage(){return experienced?'next':'input';},
    get pendingUntil(){return pendingUntil;},
    export(){return {experienced,muted,autoShown,done};},
    experience(nonempty){if(nonempty){experienced=true;misses=[];pendingUntil=0;}},
    attempt(result,time){
      if(result==='key'){misses=[];pendingUntil=0;return;}
      if(result!=='case'||experienced||muted||autoShown||done)return;
      misses=misses.filter(t=>time-t<=6000);misses.push(time);
      if(misses.length>=2){pendingUntil=time+10000;misses=[];}
    },
    eligible(time,{reduced=false,blocked=false}={}){return !reduced&&!blocked&&!experienced&&!muted&&!autoShown&&!done&&time<=pendingUntil&&pendingUntil>0;},
    shown(){autoShown=true;pendingUntil=0;},
    clearAttempts(){misses=[];pendingUntil=0;},
    dismiss(){muted=true;misses=[];pendingUntil=0;},
    finish(){done=true;misses=[];pendingUntil=0;}
  };
}
export function intersects(a,b,pad=0){return a.left<b.right+pad&&a.right>b.left-pad&&a.top<b.bottom+pad&&a.bottom>b.top-pad;}
export function findGuidePosition(target,obstacles,viewport,{labelTop=target.top,width=360,height=56}={}) {
  width=Math.min(width,viewport.width-24);
  const candidates=[
    {left:target.left,top:labelTop-height-4,pose:'down'},
    {left:target.left-width-12,top:target.top+(target.height-height)/2,pose:'right'},
    {left:target.right+12,top:target.top+(target.height-height)/2,pose:'left'},
    {left:target.right-width,top:labelTop-height-4,pose:'down'}
  ];
  for(const p of candidates){const r={...p,width,height,right:p.left+width,bottom:p.top+height};
    if(r.left<12||r.right>viewport.width-12||r.top<viewport.top+4||r.bottom>viewport.bottom-4)continue;
    if(!obstacles.some(o=>intersects(r,o,2)))return r;
  }
  return null;
}
