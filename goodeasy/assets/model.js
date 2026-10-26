export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
// Separate retrieval from a deliberate external pull. Distances are illustrative.
export function reelStep(s,turns){const winding=Math.max(0,turns),length=2*Math.PI*.022*5.2*winding;return {...s,turns:s.turns+winding,rotor:s.rotor+winding*5.2,distance:clamp(s.distance-length,0,30),slipping:false};}
export function reelPull(s,force=s.pull??35){const slipping=force>s.drag,available=Math.max(0,30-s.distance),released=slipping?Math.min(available,(force-s.drag)/100):0;return {...s,slipping:released>0,distance:s.distance+released,payout:(s.payout||0)+released/(2*Math.PI*.022)};}
export function observationRecord(kind,state){const record=JSON.parse(JSON.stringify(state));if(kind==='camera'&&record.photo){record.aperture=record.photo.a;record.shutter=record.photo.d;}return record;}
export function exposure(aperture,shutter){return (2.8/aperture)**2*250/shutter;}
export function wind(s,turns){return {...s,turns:s.turns+turns,reserve:clamp(s.reserve+turns*8,0,100)};}
export function watchStep(s,seconds){return {...s,elapsed:s.elapsed+(s.reserve>0?Math.min(seconds,s.reserve*2):0),reserve:Math.max(0,s.reserve-seconds*.5)};}
export function filmStep(s,frames){return {...s,frames:s.frames+frames,frame:Math.floor(s.frames+frames)%24};}
export function switchState(travel){return {travel:clamp(travel,0,4),closed:travel>=2};}
export function coffeeFlow(grind,pressure){return Math.max(0,pressure)*(.15+(100-grind)/100*.8);}
