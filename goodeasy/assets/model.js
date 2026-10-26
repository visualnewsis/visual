export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function reelStep(s,turns){const pull=.25,drag=s.drag/100;const slipping=drag<pull;return {...s,turns:s.turns+turns,rotor:s.rotor+turns*5.2,distance:clamp(s.distance+(slipping?.25:-.75)*turns,0,30),slipping};}
export function exposure(aperture,shutter){return (2.8/aperture)**2*250/shutter;}
export function wind(s,turns){return {...s,turns:s.turns+turns,reserve:clamp(s.reserve+turns*8,0,100)};}
export function watchStep(s,seconds){return {...s,elapsed:s.elapsed+(s.reserve>0?Math.min(seconds,s.reserve*2):0),reserve:Math.max(0,s.reserve-seconds*.5)};}
export function filmStep(s,frames){return {...s,frames:s.frames+frames,frame:Math.floor(s.frames+frames)%24};}
export function switchState(travel){return {travel:clamp(travel,0,4),closed:travel>=2};}
export function coffeeFlow(grind,pressure){return Math.max(0,pressure)*(.15+(100-grind)/100*.8);}
