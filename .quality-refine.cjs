const fs=require('fs'),path=require('path');
const root=process.argv[2],assets=path.join(root,'goodeasy/assets');
const edit=(name,fn)=>{const p=path.join(assets,name);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));};
fs.mkdirSync(path.join(assets,'models'),{recursive:true});
for(const n of ['guitar.js','violin.js','model-utils.js'])fs.copyFileSync(path.join(root,'goodeasy/design/models-v3/GOODEASY_3D_models_v3',n),path.join(assets,'models',n));
fs.writeFileSync(path.join(assets,'quality-instruments.mjs'),`import {buildGuitar as guitar} from './models/guitar.js';
import {buildViolin as violin} from './models/violin.js';
function prepare(model,eye){model.eye=eye;for(const s of model.strings)s.mesh.material=s.mesh.material.clone();
 model.update=(state,detail,now)=>{const selected=model.strings.find(s=>s.midi===state.midi);if(model.bow&&selected){const x=.03,t=(x-selected.from[0])/(selected.to[0]-selected.from[0]);const y=selected.from[1]+t*(selected.to[1]-selected.from[1]);const original=model.bow.userData.hairCenterlineY-.0014;model.bow.position.y=y-original;}
 if(detail&&selected){selected.mesh.material.emissive.setHex(0x5a3915);}
 };return model;}
export const buildGuitar=(T,M)=>prepare(guitar(T,M),[.6,6,4]);
export const buildViolin=(T,M)=>prepare(violin(T,M),[1.2,7,5]);
`);
edit('quality-kit.mjs',s=>s.replace('const ratio=Math.min(1,camera.aspect),distance=this.radius/(Math.sin(T.MathUtils.degToRad(camera.fov/2))*ratio)*.92;camera.position.copy(this.target).addScaledVector(this.eye,distance);camera.lookAt(this.target);',`const hero=canvas.classList.contains('quality-canvas'),wide=hero&&width>=1000&&document.body.dataset.experiment!=='keyboard';
 camera.clearViewOffset();let distance=this.radius/Math.sin(T.MathUtils.degToRad(camera.fov/2));const bounds=new T.Box3().setFromObject(this.model.group),corners=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new T.Vector3(x,y,z));
 for(let i=0;i<4;i++){camera.position.copy(this.target).addScaledVector(this.eye,distance);camera.lookAt(this.target);camera.updateMatrixWorld();const points=corners.map(p=>p.clone().project(camera)),sx=Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),sy=Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y));distance*=Math.max(sx/(wide?1.08:1.7),sy/(hero?1.45:1.6));}
 camera.position.copy(this.target).addScaledVector(this.eye,distance);camera.lookAt(this.target);if(wide)camera.setViewOffset(width,height,-width*.19,0,width,height);`));
edit('quality-stage.mjs',s=>s.replace('pulse=0,bowing=false','pulse=0,selectedPart=null,bowing=false').replace("if(detailVisible&&record){detailModel.update?.(record,true,now);detailStage.draw();}","if(detailVisible){detailModel.update?.(record||state,true,now);detailStage.draw();}")
 .replace("window.addEventListener('goodeasy:music'",`window.addEventListener('goodeasy:part',e=>{selectedPart=e.detail;focusDetail();wake();});
function focusDetail(){if(!detailModel)return;const names={strings:[],bridge:['bridge','saddle'],body:['body'],crown:['crown'],gears:['gears'],balance:['balance']};const sets={watch:['crown','gears','balance'],camera:['lens','shutter','sensor'],'fishing-reel':['handle','rotor','spool','gears'],projector:['reels','film','shutter','screen'],keyboard:['cap','spring','contact'],'espresso-machine':['filter','water','boiler','cup']};const part=selectedPart||(sets[kind]||[])[step],keys=names[part]||[part],targets=new Set();for(const key of keys){detailModel.parts?.[key]?.traverse(o=>{if(o.isMesh)targets.add(o);});}if(part==='strings')for(const s of detailModel.strings||[])targets.add(s.mesh);detailModel.group.traverse(o=>{if(!o.isMesh||!o.material?.emissive)return;if(!o.userData.focusMaterial){o.material=o.material.clone();o.userData.focusMaterial=true;}o.material.emissive.setHex(targets.has(o)?0x463017:0);});}
window.addEventListener('goodeasy:music'`)
 .replace('step=e.detail.step||0;wake();','step=e.detail.step||0;selectedPart=null;focusDetail();wake();'));
edit('music.js',s=>s.replace("selected=Number(input.value);$('status')","selected=Number(input.value);sendMusic();$('status')").replace('midi:lastRecord?.midi||selected','midi:isGuitar?(lastRecord?.midi||selected):selected'));
edit('lab.js',s=>s.replace("if(kind==='keyboard'){\n",`if(kind==='keyboard'){
 window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.isComposing||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.key.length!==1)return;e.preventDefault();key(e.key===' '?' ':e.key.toUpperCase());});
`));
let css=fs.readFileSync(path.join(assets,'quality.css'),'utf8');
css+=`\n.camera-result{position:absolute;right:4vw;bottom:25px;width:190px;z-index:2;border:1px solid #70807855;background:#121b1c;padding:9px}.camera-result canvas{width:100%;display:block}.camera-result small{font-size:9px;color:#abb9ae;display:block;margin-bottom:6px}.has-3d[data-experiment=camera] .object-caption{bottom:25px;right:auto}.has-3d .stage canvas{touch-action:pan-y}.has-3d #turn-area canvas{touch-action:none}@media(max-width:700px){.camera-result{width:125px;right:23px;bottom:10px}.has-3d[data-experiment=camera] .object-caption{bottom:10px;max-width:120px}.has-3d[data-music=guitar] .intro,.has-3d[data-music=violin] .intro{position:relative}.has-3d .quality-canvas{touch-action:pan-y}}\n`;
fs.writeFileSync(path.join(assets,'quality.css'),css);
