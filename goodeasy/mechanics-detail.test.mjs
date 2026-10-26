import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {buildIris,buildShutter}=await import('./assets/camera-lessons.js');
const {createCoffeeCup,buildCoffeeComparison}=await import('./assets/coffee-detail.js');
const {buildCamera,buildReel,buildWatch,buildProjector,buildKeyboard}=await import('./assets/quality-machines.js');
const {otherBuilders}=await import('./assets/research-other.js');
const {Playback}=await import('./gramophone/playback.js');
const {cycleAt,STAGES}=await import('./sewing-machine/motion.js');
function meshes(root){const a=[];root.traverse(o=>{if(o.isMesh)a.push(o);});return a;}
test('iris leaves actually occlude light when f-number increases',()=>{const m=buildIris(),ray=new T.Raycaster(new T.Vector3(.4,3,0),new T.Vector3(0,-1,0));const leaves=meshes(m.group).filter(o=>o.name.startsWith('diaphragm leaf'));m.update({fstop:1.4});m.group.updateMatrixWorld(true);assert.equal(ray.intersectObjects(leaves).length,0);m.update({fstop:8});m.group.updateMatrixWorld(true);assert.ok(ray.intersectObjects(leaves).length>0);});
test('opaque shutter covers closed sensor and opens a real gap',()=>{const m=buildShutter(),first=m.group.getObjectByName('first opening curtain'),second=m.group.getObjectByName('second closing curtain');function hit(cycle,fast,z){m.update({cycle,fast});m.group.updateMatrixWorld(true);const origin=new T.Vector3(0,2,z).applyMatrix4(m.group.matrixWorld),direction=new T.Vector3(0,-1,0).transformDirection(m.group.matrixWorld);return new T.Raycaster(origin,direction).intersectObjects([...meshes(first),...meshes(second)]).length>0;}assert.ok(hit(0,0,0));assert.equal(hit(.48,0,0),false);assert.equal(hit(.25,1,-.08),false);assert.ok(hit(.25,1,.7));});
test('camera lens barrel extends outside body and recorded shutter has distinct phases',()=>{const m=buildCamera();m.update({aperture:2.8,shutterPhase:0},false);m.group.updateMatrixWorld(true);const barrel=m.parts.lens.children.find(o=>o.geometry?.type==='LatheGeometry');assert.ok(new T.Box3().setFromObject(barrel).max.z>2.6);m.update({shutterPhase:.48},true);const first=m.group.getObjectByName('First opening curtain');assert.ok(first.position.y>1);});
test('cup is empty at zero and full coffee volume stays below porcelain rim',()=>{const m=createCoffeeCup(),liquid=m.group.getObjectByName('coffee volume');assert.equal(liquid.visible,false);for(const f of [.1,.5,1]){m.setFill(f);m.group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(liquid);assert.ok(b.max.y<1.1);assert.ok(b.min.y>.16);assert.ok(b.max.x<.5);}m.setFill(0);assert.equal(liquid.visible,false);});
test('equal grinds share flow and finer grind increases particle count while reducing size',()=>{const m=buildCoffeeComparison(),s={...m.defaults,grind:30,time:10};m.update(s);assert.deepEqual(s.comparison,[100,100]);s.grind=80;m.update(s);assert.ok(s.comparison[1]<s.comparison[0]);const all=[];m.group.traverse(o=>{if(o.isInstancedMesh&&o.name==='irregular coffee particles')all.push(o);});assert.ok(all[1].count>all[0].count);assert.ok(all[1].userData.grainRadius<all[0].userData.grainRadius);const before=[...s.comparison];s.channel=1;m.update(s);assert.deepEqual(s.comparison,before);});
test('reel cutaway keeps shaft, drive and roller-connected line consistent',()=>{const m=buildReel();for(const turns of [0,.13,.5,.8]){m.update({turns,rotor:turns*5.2},true);m.group.updateMatrixWorld(true);assert.equal(m.parts.body.visible,false);assert.equal(m.group.getObjectByName('Fixed spool shaft').visible,true);const line=m.group.getObjectByName('Line connected to roller'),p=new T.Vector3().fromBufferAttribute(line.geometry.attributes.position,0),expected=new T.Vector3(1.05,.1,-.85).applyMatrix4(m.parts.rotor.matrixWorld);assert.ok(p.distanceTo(expected)<1e-6);const pin=m.group.getObjectByName('Rotor pinion'),normal=new T.Vector3(0,1,0).transformDirection(pin.matrixWorld);assert.ok(Math.abs(Math.abs(normal.x)-1)<1e-10);assert.equal(m.group.getObjectByName('Main drive gear').rotation.y,-turns*Math.PI*2);}});
test('watch crown lies at three oclock with a stable spindle axis',()=>{const m=buildWatch();for(const turns of [0,.2,.7]){m.update({turns,elapsed:1},true);m.group.updateMatrixWorld(true);assert.ok(m.parts.crown.position.x>2);const spin=m.group.getObjectByName('Crown spindle'),axis=new T.Vector3(0,0,1).transformDirection(spin.matrixWorld);assert.ok(Math.abs(Math.abs(axis.x)-1)<1e-10);assert.equal(m.parts.escapement.visible,true);}});
test('projector optical axis intersects its screen and screen faces the lens',()=>{const m=buildProjector();m.group.updateMatrixWorld(true);const lens=m.parts.lens.getWorldPosition(new T.Vector3()),screen=m.parts.screen.getWorldPosition(new T.Vector3()),direction=screen.clone().sub(lens).normalize();assert.ok(direction.dot(m.parts.lens.getWorldDirection(new T.Vector3()))>.999);assert.ok(direction.clone().negate().dot(m.parts.screen.getWorldDirection(new T.Vector3()))>.999);});
test('keyboard cases remain fixed while caps move',()=>{const m=buildKeyboard(),h=m.group.getObjectByName('Fixed switch housing'),y=h.position.y;m.update({key:'Q',travel:4});assert.equal(h.position.y,y);});
test('bow contact demonstration crosses cycle boundary without jumping',()=>{const m=otherBuilders.bow(),b=m.group.getObjectByName('bow');m.update({cycle:.999});const z=b.position.z;m.update({cycle:1.001});assert.ok(Math.abs(b.position.z-z)<.01);});
test('small spring reserve cannot overshoot when the clock resumes after a long frame',()=>{const p=new Playback();p.reserve=.01;p.start(0);assert.ok(p.read(10)<=.9+1e-10);p.commit(10);assert.equal(p.reserve,0);});
test('last sewing phase describes feed completion rather than continued fabric advance',()=>{const s=cycleAt(.985);assert.equal(s.feed,1);assert.match(STAGES[s.stage][0],/다음 땀/);});

const {materials}=await import('./assets/quality-kit.js');
const {buildViolin}=await import('./assets/quality-instruments.js');
test('bow hair stays on selected arched string during a user-controlled stroke',()=>{
 const m=buildViolin(T,materials),x=.03;
 for(const st of m.strings)for(const travel of [-.3,0,.3]){
  m.bow.position.z=travel;m.update({midi:st.midi,bowing:false},false,0);m.group.updateMatrixWorld(true);
  const t=(x-st.from[0])/(st.to[0]-st.from[0]),y=st.from[1]+t*(st.to[1]-st.from[1]),z=st.from[2]+t*(st.to[2]-st.from[2]),angle=m.bow.rotation.x,original=m.bow.userData.hairCenterlineY-.0014;
  const localZ=(z-travel-original*Math.sin(angle))/Math.cos(angle),p=new T.Vector3(x,original,localZ).applyMatrix4(m.bow.matrixWorld);
  assert.ok(Math.abs(p.y-y)<1e-8);assert.ok(Math.abs(p.z-z)<1e-8);
 }
});
test('only the bowed string vibrates and it returns to rest on release',()=>{
 const m=buildViolin(T,materials),rest=m.strings.map(s=>s.mesh.geometry.attributes.position.array.slice());
 m.update({midi:69,bowing:true},false,1030);
 for(let i=0;i<m.strings.length;i++){const changed=m.strings[i].mesh.geometry.attributes.position.array.some((v,j)=>Math.abs(v-rest[i][j])>1e-6);assert.equal(changed,m.strings[i].midi===69);}
 m.update({midi:69,bowing:false},false,1040);for(let i=0;i<m.strings.length;i++)assert.deepEqual(m.strings[i].mesh.geometry.attributes.position.array,rest[i]);
});

const {buildSewingMachine}=await import('./sewing-machine/sewing-model.js');
const {threadPath}=await import('./sewing-machine/thread-path.js');
const {buildGramophone}=await import('./gramophone/gramophone-model.js');
const {buildMXSwitch}=await import('./assets/models/mx-switch.js');
test('sewing layers touch without overlap and completed stitches remain above fabric',()=>{
 const m=buildSewingMachine(T,{});m.update({...cycleAt(0),travel:3,stitches:[3]});m.group.updateMatrixWorld(true);
 const top=new T.Box3().setFromObject(m.group.getObjectByName('Upper fabric layer')),bottom=new T.Box3().setFromObject(m.group.getObjectByName('Lower fabric layer'));
 assert.ok(top.max.y<1.121);assert.ok(bottom.min.y>=1.049);assert.ok(Math.abs(top.min.y-bottom.max.y)<1e-7);
});
test('needle shank stays inside its guide throughout stroke and take-up releases thread for the hook',()=>{
 const m=buildSewingMachine(T,{});for(let i=0;i<100;i++){const s=cycleAt(i/100);m.update({...s,travel:0,stitches:[]});m.group.updateMatrixWorld(true);const shank=new T.Box3().setFromObject(m.group.getObjectByName('Needle shank'));assert.ok(shank.max.y>=1.95);assert.ok(shank.max.y<3.2);assert.ok(s.takeupY>=2.35);}
 const length=phase=>{const p=threadPath(cycleAt(phase));return Math.hypot(...p[7].map((v,i)=>v-p[6][i]))+Math.hypot(...p[8].map((v,i)=>v-p[7][i]));};assert.ok(length(0)>length(.6));
});
test('gramophone motor gears keep tooth ratio and clear the platter spindle',()=>{
 const m=buildGramophone(T,{});m.update({angle:2,needleLift:1});const a=m.group.getObjectByName('Motor gear 20 teeth'),b=m.group.getObjectByName('Motor pinion 12 teeth');assert.ok(Math.abs(b.rotation.y/a.rotation.y+20/12)<1e-10);assert.ok(Math.hypot(a.position.x,a.position.z)>.396);assert.ok(Math.hypot(b.position.x-a.position.x,b.position.z-a.position.z)>.52);
});
test('MX stem cam passes beside electrical contact buttons',()=>{
 const m=buildMXSwitch(T,materials),cam=m.parts.stem.children.find(o=>o.geometry?.type==='SphereGeometry');let button;m.parts.movingLeaf.traverse(o=>{if(o.geometry?.type==='SphereGeometry')button=o;});
 for(let travel=0;travel<=4;travel+=.1){m.update({travel,explode:0});m.group.updateMatrixWorld(true);assert.ok(cam.getWorldPosition(new T.Vector3()).distanceTo(button.getWorldPosition(new T.Vector3()))>=.117-1e-6);}
});
