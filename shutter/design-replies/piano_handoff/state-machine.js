/* Reference controller: static HTML + vanilla JS; no framework/server.
   Renderer subscribes to state changes and owns 3D meshes; not a physics solver. */
export const PHASES = Object.freeze([
  'REST · 대기','건반 누름·전달','잭 이탈','타현',
  '반발·백체크 / 현 진동','손 뗌·댐퍼 분기'
]);
export const SPEEDS = Object.freeze([0.25,0.5,1,2]);
export function createObservationController(onChange = () => {}) {
  const state = {
    playback:'empty', assembly:'assembled', camera:'default',
    timeMs:0, durationMs:0, speed:1, phase:0,
    lastPerformance:null, selectedObservationNote:null,
    pedalOverride:null, selectedPart:null, labels:'selected',
    error:null
  };
  const emit = () => onChange({...state});
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const canSeek=()=>state.lastPerformance && state.assembly==='assembled' && !['loading','error'].includes(state.playback);
  function dispatch(type,payload={}) {
    switch(type){
      case 'IMPORT_PERFORMANCE': {
        // Snapshot copied: do not mutate original performance event log.
        state.lastPerformance=Object.freeze(structuredClone(payload.performance));
        state.selectedObservationNote=state.lastPerformance.note;
        state.durationMs=payload.durationMs;
        state.timeMs=0;state.phase=0;state.playback='ready';break;
      }
      case 'PLAY':
        if(!canSeek())break;
        if(state.playback==='ended')state.timeMs=0;
        state.playback='playing';break;
      case 'PAUSE':if(state.playback==='playing')state.playback='paused';break;
      case 'RESTART':if(canSeek()){state.timeMs=0;state.phase=0;state.playback='paused';}break;
      case 'SEEK':if(canSeek()){state.timeMs=clamp(payload.timeMs,0,state.durationMs);state.phase=payload.phase??state.phase;state.playback='paused';}break;
      case 'SPEED':if(SPEEDS.includes(payload.value))state.speed=payload.value;break;
      case 'EXPLODE':if(state.assembly==='assembled'){state.playback=state.playback==='playing'?'paused':state.playback;state.assembly='exploding';}break;
      case 'EXPLODE_DONE':if(state.assembly==='exploding')state.assembly='exploded';break;
      case 'ASSEMBLE':if(state.assembly==='exploded')state.assembly='reassembling';break;
      case 'ASSEMBLE_DONE':if(state.assembly==='reassembling'){state.assembly='assembled';if(state.lastPerformance)state.playback='paused';}break;
      case 'SELECT_NOTE':state.selectedObservationNote=payload.note;if(state.lastPerformance){state.timeMs=0;state.playback='paused';}break;
      case 'RESTORE_LAST_NOTE':if(state.lastPerformance)state.selectedObservationNote=state.lastPerformance.note;break;
      case 'PEDAL_OVERRIDE':state.pedalOverride=payload.value;break; // null restores performance events
      case 'CAMERA':state.camera=payload.value;break;
      case 'PART':state.selectedPart=payload.id;break;
      case 'ERROR':state.error=payload.message;state.playback='error';break;
      case 'LOADING':state.playback='loading';break;
      case 'END':if(state.playback==='playing'){state.playback='ended';state.timeMs=state.durationMs;}break;
    }
    emit();return {...state};
  }
  return {state,dispatch};
}
/* Required renderer invariants: jackEscapement < hammerStrike < hammerRebound;
   pedal ON + keyUp => damper stays lifted; pedalUp => damper descends.
   The controller is NOT a validated kinematics or audio implementation. */
