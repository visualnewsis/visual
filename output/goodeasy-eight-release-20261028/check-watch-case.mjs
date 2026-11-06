import * as T from 'file:///C:/Users/user/.codex/worktrees/piano-finish/editshop/goodeasy/piano/vendor/three.module.min.js';
import {buildWatchCase} from 'file:///C:/Users/user/.codex/worktrees/piano-finish/editshop/goodeasy/assets/watch-case.js';
const m=buildWatchCase(T);console.log(JSON.stringify(m.inspect.verifyBoresWithRaycaster()));console.log(JSON.stringify(m.inspect.verifySpringBarFit()));
const sizes=[];m.group.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();if(!Number.isFinite(o.geometry.boundingBox.max.x))throw Error('badmesh');}});console.log('bounds',new T.Box3().setFromObject(m.group).getSize(new T.Vector3()).toArray());
