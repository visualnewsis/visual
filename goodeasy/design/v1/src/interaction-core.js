/* Pure JS reference: state and events only; NOT a mechanical simulation. */
export const episodeIds=['fishing-reel','camera','watch','projector','keyboard','espresso-machine'];
export function createSession(id){if(!episodeIds.includes(id))throw Error('unknown episode');return {id,phase:'ready',history:[],lastAction:null,observation:null,revision:0};}
export function commitAction(session,type,payload={}){
  const event={type,payload:structuredClone(payload),at:performance.now()};
  session.history.push(event);session.lastAction=event;session.revision++;
  session.phase='acted';return event;
}
export function enterObservation(session){if(!session.lastAction)return false;
 session.observation=structuredClone(session.lastAction);session.phase='observing';return true;}
export function returnToExperience(session){session.phase='ready';return session;}
export const controls={
 'fishing-reel':{primary:'wind',keyboard:'ArrowRight',axes:['turns','drag','tension']},
 camera:{primary:'capture',keyboard:'Space',axes:['shutterSeconds','aperture','iso']},
 watch:{primary:'windCrown',keyboard:'ArrowRight',axes:['turns','energy']},
 projector:{primary:'turnCrank',keyboard:'ArrowRight',axes:['turns','frame']},
 keyboard:{primary:'keyDown',keyboard:'KeyA',axes:['code','duration']},
 'espresso-machine':{primary:'toggleBrew',keyboard:'Enter',axes:['locked','time','flow']}
};
// Never overwrite session.lastAction when a different observation target is chosen.
// Do not call getUserMedia: camera scene is locally rendered.
