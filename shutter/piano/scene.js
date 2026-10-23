import * as T from './vendor/three.module.min.js';
import {liveAction} from './motion.js';
// Authored procedural study. Contact dimensions remain visual assumptions.
const geometryCache=new Map();
const rounded=(w,h,d,r=.03)=>{const k=[w,h,d,r].join(',');if(geometryCache.has(k))return geometryCache.get(k);const s=new T.Shape(),x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:r/2,bevelThickness:r/2,bevelSegments:2,steps:1,curveSegments:8});g.translate(0,0,-d/2);geometryCache.set(k,g);return g;};
function grain(kind){const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');let seed=91;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};ctx.fillStyle=kind==='wood'?'#b58b5c':'#e0d6ba';ctx.fillRect(0,0,256,256);for(let i=0;i<3000;i++){let x=rand()*256,y=rand()*256;ctx.strokeStyle=kind==='wood'?`rgba(73,37,13,${rand()*.13})`:`rgba(255,254,230,${rand()*.4})`;ctx.lineWidth=kind==='wood'?.3+rand()*.8:.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(kind==='wood'?rand()*2:rand()*4),y+(kind==='wood'?25+rand()*120:rand()*5));ctx.stroke();}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const woodMap=grain('wood'),feltMap=grain('felt');
const material={wood:new T.MeshStandardMaterial({color:0xd8b27f,map:woodMap,roughness:.58}),darkwood:new T.MeshStandardMaterial({color:0x795235,map:woodMap,roughness:.57}),ivory:new T.MeshPhysicalMaterial({color:0xf2e8ce,roughness:.27,clearcoat:.32}),black:new T.MeshPhysicalMaterial({color:0x101519,roughness:.22,clearcoat:.7,metalness:.16}),brass:new T.MeshStandardMaterial({color:0xbc8c45,metalness:.78,roughness:.3}),steel:new T.MeshStandardMaterial({color:0xb8b8ad,metalness:.86,roughness:.29}),felt:new T.MeshStandardMaterial({color:0xf0e6cc,map:feltMap,bumpMap:feltMap,bumpScale:.025,roughness:1}),red:new T.MeshStandardMaterial({color:0x7b1c26,roughness:.9}),floor:new T.MeshStandardMaterial({color:0x101619,roughness:.65})};
function mesh(parent,g,m,x=0,y=0,z=0){const v=new T.Mesh(g,m);v.position.set(x,y,z);parent.add(v);v.castShadow=true;v.receiveShadow=true;return v;}
function block(parent,w,h,d,m,x=0,y=0,z=0,r=.025){return mesh(parent,rounded(w,h,d,r),m,x,y,z);}
function rod(parent,a,b,r,m){const A=new T.Vector3(...a),B=new T.Vector3(...b),dir=B.clone().sub(A);const v=mesh(parent,new T.CylinderGeometry(r,r,dir.length(),10),m);v.position.copy(A.add(B).multiplyScalar(.5));v.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return v;}
function screw(parent,x,y,z){const pin=mesh(parent,new T.CylinderGeometry(.055,.055,.16,12),material.brass,x,y,z);block(parent,.065,.015,.009,material.black,x,y+.085,z,.003);return pin;}
function silhouette(parent,points,depth,mat){const s=new T.Shape();s.moveTo(...points[0]);for(let i=1;i<points.length;i++){const p=points[i];s.lineTo(...p);}s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:3});g.rotateY(Math.PI/2);g.translate(-depth/2,0,0);return mesh(parent,g,mat);}
export function createAction(parent,x=0){
 const root=new T.Group();root.position.x=x;parent.add(root);
 block(root,.36,.14,7.2,material.darkwood,0,-.34,.5);block(root,.4,.13,.38,material.red,0,-.16,0);
 rod(root,[0,-.26,0],[0,.19,0],.025,material.brass);
 const key=new T.Group();root.add(key);block(key,.17,.13,5.6,material.wood,0,0,-.65);block(key,.18,.065,2.4,material.ivory,0,.10,-2.25);
 rod(key,[0,.04,1.25],[0,.53,1.25],.035,material.brass);screw(key,0,.49,1.25);
 const wippen=new T.Group();wippen.position.set(0,.48,2.0);root.add(wippen);
 silhouette(wippen,[[0,0],[.18,.09],[.55,.10],[.9,.25],[1.55,.24],[1.75,.13],[1.72,-.01],[.65,-.08],[.12,-.08]],.16,material.wood);
 // In the side profile, positive silhouette coordinates map to negative Z.
 block(wippen,.19,.07,.3,material.felt,0,-.08,-.76);
 const jack=new T.Group();jack.position.set(0,.12,-1.37);wippen.add(jack);
 block(jack,.09,.75,.11,material.wood,0,.37,0);block(jack,.1,.09,.36,material.wood,0,.02,.13);
 rod(wippen,[-.12,.09,-1.37],[.12,.09,-1.37],.024,material.brass);
 const repetition=block(wippen,.14,.09,1.35,material.wood,0,.57,-.82);repetition.rotation.x=.06;
 rod(wippen,[.11,.15,-.2],[.11,.58,-.7],.012,material.steel);
 const hammer=new T.Group();hammer.position.set(0,1.25,2.45);root.add(hammer);
 rod(hammer,[0,0,0],[0,.28,-3.1],.041,material.wood);
 const head=new T.Group();head.position.set(0,.28,-3.1);hammer.add(head);
 // Smooth teardrop head; cross section built with Bézier curves, then extruded.
 const hs=new T.Shape();hs.moveTo(-.21,-.18);hs.bezierCurveTo(-.30,.1,-.3,.48,-.12,.60);hs.bezierCurveTo(.02,.73,.24,.57,.24,.35);hs.bezierCurveTo(.24,.1,.08,-.12,-.21,-.18);
 const hg=new T.ExtrudeGeometry(hs,{depth:.13,bevelEnabled:true,bevelSize:.025,bevelThickness:.012,bevelSegments:4,curveSegments:18});hg.rotateY(Math.PI/2);hg.translate(-.065,0,0);const feltHead=mesh(head,hg,material.felt);
 mesh(head,new T.SphereGeometry(.12,16,12),material.wood,0,.15,.015).scale.set(.95,1.4,1);
 mesh(head,new T.SphereGeometry(.049,12,8),material.red,-.08,.23,-.035).scale.set(.13,1,1);
 const knuckle=rod(hammer,[-.12,-.12,-.75],[.12,-.12,-.75],.10,material.darkwood);
 rod(root,[-.18,1.25,2.45],[.18,1.25,2.45],.04,material.steel);block(root,.26,.65,.28,material.wood,0,.92,2.45);
 rod(key,[0,.1,.15],[0,.83,-.15],.025,material.brass);const check=block(key,.22,.24,.17,material.red,0,.88,-.15);check.rotation.x=-.2;
 rod(root,[.15,1.45,.76],[.15,1.95,.76],.025,material.brass);block(root,.2,.07,.2,material.felt,0,1.9,.76);
 const strings=new T.Group();root.add(strings);const lines=[];
 for(let i=-1;i<=1;i++){const points=[];for(let j=0;j<=20;j++)points.push(new T.Vector3(i*.075,3.66,-4+j*.5));const g=new T.BufferGeometry().setFromPoints(points);const line=new T.Line(g,new T.LineBasicMaterial({color:i===0?0xe8c37f:0x9c8050}));line.userData.part="strings";strings.add(line);lines.push(line);}
 const damper=new T.Group();damper.position.set(0,3.79,3.8);root.add(damper);block(damper,.31,.16,.68,material.black,0,.04,0);block(damper,.30,.15,.58,material.felt,0,-.10,0);rod(damper,[0,-.15,0],[0,-2.8,0],.023,material.steel);
 screw(root,0,-.18,-2.9);screw(root,0,-.18,3.6);
 const anchors={key:{object:key,point:new T.Vector3(0,.2,-2.7)},wippen:{object:wippen,point:new T.Vector3(0,.2,-.8)},jack:{object:jack,point:new T.Vector3(0,.4,0)},hammer:{object:head,point:new T.Vector3(0,.6,0)},strings:{object:strings,point:new T.Vector3(0,3.66,-.4)},damper:{object:damper,point:new T.Vector3(0,-.16,0)}};
 root.traverse(v=>{if(v.isMesh)v.userData.part='wippen';});key.traverse(v=>{if(v.isMesh)v.userData.part='key';});jack.traverse(v=>{if(v.isMesh)v.userData.part='jack';});hammer.traverse(v=>{if(v.isMesh)v.userData.part='hammer';});damper.traverse(v=>{if(v.isMesh)v.userData.part='damper';});
 return {root,anchors,update(m,explode,time){key.rotation.x=-.055*m.key;wippen.rotation.x=.10*m.key;jack.rotation.x=-.4*m.jack;hammer.rotation.x=.59*m.hammer;damper.position.y=3.79+.32*m.damper+explode*.9;wippen.position.y=.48+explode*.75;hammer.position.y=1.25+explode*1.8;strings.position.y=explode*2.65;key.position.z=-explode*.55;for(const line of lines){const pos=line.geometry.attributes.position;for(let j=0;j<21;j++)pos.setY(j,3.66+Math.sin(j*Math.PI/20)*Math.sin(time*.045+j*.8)*.025*m.vibration);pos.needsUpdate=true;}}};
}
function makeScene(canvas,shadows=false){const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=shadows;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,150);const ambient=new T.HemisphereLight(0xc5deee,0x37291a,2.0);scene.add(ambient);
 const light=new T.DirectionalLight(0xffd8a6,4.0);light.position.set(-4,8,-2);light.castShadow=shadows;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-7;light.shadow.camera.right=7;light.shadow.camera.top=7;light.shadow.camera.bottom=-7;light.shadow.bias=-.001;scene.add(light);const rim=new T.DirectionalLight(0xc2daed,2.4);rim.position.set(5,5,4);scene.add(rim);const fill=new T.DirectionalLight(0xffe7bd,1.0);fill.position.set(0,2,-8);scene.add(fill);
 let w=0,h=0;return {renderer,scene,camera,fit(){const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return false;if(w!==r.width||h!==r.height){w=r.width;h=r.height;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}return true;},draw(){renderer.render(scene,camera);}};
}
export function createPianoScenes(previewCanvas,detailCanvas,onPart){
 const preview=makeScene(previewCanvas),detail=makeScene(detailCanvas,true);const previewRoot=new T.Group();preview.scene.add(previewRoot);previewRoot.scale.x=3.4;
 const actions=[];let slot=-1;for(let midi=60;midi<=84;midi++){const black=[1,3,6,8,10].includes(midi%12);if(!black)slot++;const x=(slot+(black?.5:0)-7)*.44;const a=createAction(previewRoot,x);actions.push({midi,...a});}
 block(previewRoot,7.2,.4,1.0,material.black,0,-.65,-2.8);block(previewRoot,7.3,.25,.3,material.brass,0,2.5,5.7);block(previewRoot,7.3,.4,.3,material.darkwood,0,.4,2.5);block(previewRoot,7.3,.13,7.8,material.darkwood,0,-.6,1);block(previewRoot,7.3,.09,.12,material.red,0,3.62,5.3);
 for(let i=-3;i<=3;i++){rod(previewRoot,[i*1.1,3.5,5.5],[i*1.1,3.5,6.4],.07,material.brass);}
 const detailRoot=new T.Group();detail.scene.add(detailRoot);const selected=createAction(detailRoot,0);const neighbors=[createAction(detailRoot,-.55),createAction(detailRoot,.55)];
 neighbors.forEach(a=>a.root.traverse(v=>{if(v.isMesh){v.material=v.material.clone();v.material.transparent=true;v.material.opacity=.16;v.material.depthWrite=false;v.castShadow=false;}if(v.isLine){v.material=v.material.clone();v.material.transparent=true;v.material.opacity=.18;}}));
 block(detailRoot,1.9,.16,7.3,material.black,0,-.55,.3);
 let yaw=-.65,pitch=.3,distance=12.5,side=false,drag=null;const target=new T.Vector3(0,1.6,.4),ray=new T.Raycaster(),pointer=new T.Vector2();ray.params.Line.threshold=.045;
 const onDown=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch,start:performance.now()};detailCanvas.setPointerCapture(e.pointerId);};detailCanvas.addEventListener('pointerdown',onDown);
 detailCanvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;yaw=drag.yaw+dx*.008;pitch=Math.max(.02,Math.min(.9,drag.pitch+dy*.004));});
 detailCanvas.addEventListener('pointerup',e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8&&performance.now()-drag.start<350){const r=detailCanvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,detail.camera);const hit=ray.intersectObject(selected.root,true).find(i=>i.object.userData.part);if(hit)onPart(hit.object.userData.part);}drag=null;});
 ['pointercancel','lostpointercapture'].forEach(event=>detailCanvas.addEventListener(event,()=>{drag=null;}));
 detailCanvas.addEventListener('wheel',e=>{if(!e.ctrlKey){e.preventDefault();distance=Math.max(7.5,Math.min(20,distance+e.deltaY*.008));}},{passive:false});detailCanvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();yaw+=(e.key==='ArrowLeft'?-.12:.12);}});
 return {preview,detail,view(isSide){side=isSide;yaw=isSide?-Math.PI/2:-.65;pitch=isSide?.03:.3;distance=isSide?12.5:12.5;},reset(){yaw=-.65;pitch=.3;distance=12.5;},draw(snapshot,m,explode,time){
 const p=previewCanvas.getBoundingClientRect();if(p.bottom>0&&p.top<innerHeight&&preview.fit()){const mobile=p.width<700;previewRoot.position.x=mobile?5.24:0;previewRoot.rotation.y=mobile?0:-.035;const visibleMax=mobile?72:84;actions.forEach(a=>{a.root.visible=a.midi<=visibleMax;const s=snapshot.notes.find(n=>n.midi===a.midi);a.update(s?liveAction(s,time,snapshot.pedal):m,0,time);});preview.camera.position.set(mobile?0:1.1,7.2,mobile?-12.8:-13.0);preview.camera.fov=mobile?42:34;preview.camera.updateProjectionMatrix();preview.camera.lookAt(0,1.8,1.0);preview.draw();}
 const d=detailCanvas.getBoundingClientRect();if(d.bottom>0&&d.top<innerHeight&&detail.fit()){selected.update(m,explode,time);neighbors.forEach(a=>a.update({key:0,hammer:0,jack:0,damper:0,vibration:0},explode,time));const t=target.clone();t.y+=explode*.65;detail.camera.position.set(t.x+Math.sin(yaw)*distance, t.y+Math.sin(pitch)*distance,t.z-Math.cos(yaw)*distance);detail.camera.lookAt(t);detail.draw();}
 },anchor(part){const a=selected.anchors[part];if(!a)return null;const v=a.object.localToWorld(a.point.clone()).project(detail.camera);return {x:(v.x+1)/2,y:(1-v.y)/2,visible:v.z<1&&v.x>-1&&v.x<1&&v.y>-1&&v.y<1};},dispose(){preview.renderer.dispose();detail.renderer.dispose();}};
}
