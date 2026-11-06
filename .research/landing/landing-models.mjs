// Reuse each experience's actual geometry. One temporary WebGL context for all previews.
const hosts=[...document.querySelectorAll('[data-model]')];
let kit,machines,instruments,replacements,renderer,scene,camera,pending=Promise.resolve();
async function prepare(){if(renderer)return;
  [kit,machines,instruments,replacements]=await Promise.all([import('./quality-kit.mjs?v=20261024-editorial1'),import('./quality-machines.mjs?v=20261024-editorial1'),import('./quality-instruments.mjs?v=20261024-editorial1'),import('./quality-replacements.mjs?v=20261024-editorial1')]);
  const {T}=kit;renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.65;renderer.setClearColor(0x151b14,0);
  scene=new T.Scene();scene.add(new T.HemisphereLight(0xffedd4,0x6a806c,4));
  for(const [pos,color,power] of [[[4,7,8],0xffe0a6,6],[[-5,4,-3],0xd0e3f2,7],[[0,2,6],0xffffff,3]]){const l=new T.DirectionalLight(color,power);l.position.set(...pos);scene.add(l);}
  camera=new T.PerspectiveCamera(34,1,.01,500);
}
async function render(host){await prepare();const {T,materials}=kit,kind=host.dataset.model;
  const model=kind==='guitar'?instruments.buildGuitar(T,materials):kind==='violin'?instruments.buildViolin(T,materials):kind==='keyboard'?replacements.buildMXStudy(T,materials):kind==='espresso-machine'?replacements.buildEspressoStudy(T,materials):machines.machineBuilders[kind]();
  if(kind==='guitar'||kind==='violin')model.group.rotation.z=-.45;
  model.update?.({turns:2,rotor:1.1,elapsed:37620,reserve:70,aperture:4,shutter:125,frames:0,travel:0,explode:kind==='keyboard'?.2:0,locked:true,brewing:false,volume:0},false,0);
  scene.add(model.group);model.group.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(model.group),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
  const rect=host.getBoundingClientRect(),w=Math.max(200,Math.round(rect.width*1.5)),h=Math.max(180,Math.round(rect.height*1.5));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  const eye=new T.Vector3(...(model.eye||[4,5,7])).normalize(),radius=size.length()/2,distance=radius/Math.sin(T.MathUtils.degToRad(camera.fov/2))*1.05;
  camera.position.copy(center).addScaledVector(eye,distance);camera.lookAt(center);camera.updateMatrixWorld();
  // Fit projected corners so long instruments and upright machines both fill the card.
  for(let pass=0;pass<3;pass++){let extent=0;for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new T.Vector3(x,y,z).project(camera);extent=Math.max(extent,Math.abs(p.x),Math.abs(p.y));}camera.position.copy(center).addScaledVector(eye,camera.position.distanceTo(center)*extent/.91);camera.lookAt(center);camera.updateMatrixWorld();}
  renderer.render(scene,camera);const target=host.querySelector('canvas');target.width=w;target.height=h;target.getContext('2d').drawImage(renderer.domElement,0,0);host.classList.add('rendered');scene.remove(model.group);
  // Geometry can be rebuilt when another model uses a cached primitive; materials remain shared.
  const geoms=new Set();model.group.traverse(o=>{if(o.geometry)geoms.add(o.geometry);});geoms.forEach(g=>g.dispose());
}
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);pending=pending.then(()=>render(entry.target)).catch(()=>{entry.target.dataset.preview='unavailable';});}},{rootMargin:'160px'});hosts.forEach(h=>observer.observe(h));}
