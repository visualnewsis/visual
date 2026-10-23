// Relative ideal-string relation: f/f0 = sqrt(T/mu) / L.
export function stringRatio(length=1,tension=1,density=1){
 if(![length,tension,density].every(n=>Number.isFinite(n)&&n>0))throw new RangeError('Positive string conditions required');
 return Math.sqrt(tension/density)/length;
}
export function repeatedStrikeReady(mode,release){return mode==='repetition'?release==='partial'||release==='full':release==='full';}
export function toneFor(midi,{velocity=1,contact=false,length=1,tension=1,density=1}={}){
 return {midi,frequency:440*2**((midi-69)/12)*stringRatio(length,tension,density),velocity,decay:contact?.08:4};
}
