// A single teaching clock for the connected pump-machine demonstration.
// These intervals are explanatory stages, not an extraction-time prediction.
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
export function espressoSequence(phase){
 const p=clamp(phase);
 return {phase:p,stage:Math.min(4,Math.floor(p*5)),pump:p>0&&p<1,heated:clamp((p-.40)/.20),front:clamp((p-.80)/.04),pouring:p>.80&&p<1,fill:clamp((p-.84)/.16)*.75,finished:p===1};
}
