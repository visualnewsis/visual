import {T,materials as M,mesh,box,cyl,ring,rod,sphere,part,tag,label} from './quality-kit.js?v=20261028-watchmechanism2';
import {paintFilmFrame,frameNumber} from './projector-frames.js?v=20261028-release3';
import {projectorHeroClock,PROJECTOR_PITCH as PITCH,PROJECTOR_PERF_PITCH as PERF} from './projector-hero-clock.js?v=20261030-craft-release1';
const TAU=Math.PI*2;
const metal=(color,roughness=.3)=>new T.MeshStandardMaterial({color,metalness:.88,roughness});
function disc(parent,r,h,material,x,y,z){const o=cyl(parent,r,h,material,x,y,z);o.rotation.x=Math.PI/2;return o;}
function reel(parent,x,y,material){
 const root=part(parent,'Machined reel with five relief windows');root.position.set(x,y,.10);
 const shape=new T.Shape();shape.absarc(0,0,1.02,0,TAU,false);
 for(let i=0;i<5;i++){const a=i*TAU/5,hole=new T.Path();hole.absarc(Math.sin(a)*.62,Math.cos(a)*.62,.245,0,TAU,true);shape.holes.push(hole);}
 const geo=new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelThickness:.009,bevelSize:.009,bevelSegments:2,curveSegments:40});
 for(const z of [-.19,.19]){mesh(root,geo,material,0,0,z);ring(root,1.01,.025,material,0,0,z,'z');}
 disc(root,.33,.37,M.black,0,0,.02);disc(root,.15,.47,material,0,0,.04);disc(root,.08,.04,M.brass,0,0,.30);
 for(let i=0;i<14;i++)ring(root,.34+i*.014,.0045,M.darkWood,0,0,.03,'z');
 return root;
}
// A ribbon made of actual central stock, edge rails and cross bars: the edge gaps are perforations,
// not marks painted on a solid strip. All cells use the same four-perforation frame pitch.
function filmRibbon(parent,name){
 const g=new T.BufferGeometry(),n=98,vertices=new Float32Array(n*5*6*3);g.setAttribute('position',new T.BufferAttribute(vertices,3));
 const material=new T.MeshStandardMaterial({color:0x755a32,side:T.DoubleSide,metalness:.15,roughness:.42});
 const o=mesh(parent,g,material);o.name=name;o.frustumCulled=false;o.userData.perforationPitch=PERF;
 const widths=[[-.23,-.216],[-.158,.158],[.216,.23]];
 function update(points,offset=0){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),len=curve.getLength(),count=Math.min(n,Math.max(2,Math.ceil(len/PERF)+1));let v=0;
  const put=(a,b,c)=>{for(const p of [a,b,c]){vertices[v++]=p.x;vertices[v++]=p.y;vertices[v++]=p.z;}};
  function quad(t0,t1,w0,w1){const a=curve.getPointAt(Math.max(0,Math.min(1,t0))),b=curve.getPointAt(Math.max(0,Math.min(1,t1))),ta=curve.getTangentAt(Math.max(0,Math.min(1,t0))),tb=curve.getTangentAt(Math.max(0,Math.min(1,t1))),na=new T.Vector3(-ta.y,ta.x,0).normalize(),nb=new T.Vector3(-tb.y,tb.x,0).normalize();const A=a.clone().addScaledVector(na,w0),B=a.clone().addScaledVector(na,w1),C=b.clone().addScaledVector(nb,w1),D=b.clone().addScaledVector(nb,w0);put(A,B,D);put(B,C,D);}
  for(let i=0;i<count;i++){const shift=((offset%PERF)+PERF)%PERF, a=(i*PERF-PERF+shift)/len,b=((i+1)*PERF-PERF+shift)/len;for(const [lo,hi]of widths)quad(a,b,lo,hi);const c=a+(b-a)*.22;quad(a,c,-.216,-.158);quad(a,c,.158,.216);}
  g.setDrawRange(0,v/3);g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();o.userData.path=points.map(p=>p.slice());o.userData.length=len;o.userData.offset=offset;
 }
 return {object:o,update};
}
export function buildProjector(){
 const group=new T.Group(),body=part(group,'body'),shell=part(body,'Removable graphite cast chassis');
 const enamel=new T.MeshPhysicalMaterial({color:0x243337,metalness:.58,roughness:.32,clearcoat:.32}),silver=metal(0xb7bfba),dark=metal(0x303a3c,.4),brass=metal(0xb09a60);
 // Sculpted plinth, cast base and a rounded lamp house. The exposed transport is in front.
 box(shell,3.65,.20,1.55,dark,0,.07,-.24,.09);for(const x of [-1.35,1.35])box(shell,.45,.16,1.28,M.black,x,-.08,-.24,.07);
 box(shell,2.85,2.12,.82,enamel,-.18,1.27,-.47,.22);box(shell,2.62,.14,.88,silver,-.18,.30,-.44,.05);
 box(shell,1.11,1.38,.45,dark,-.71,1.37,-.98,.14);for(let i=0;i<10;i++)box(shell,.77,.025,.025,M.black,-.71,.86+i*.10,-1.22,.007);
 for(const x of [-1.37,1.04])for(const y of [.52,2.04]){disc(shell,.04,.025,silver,x,y,-.025);box(shell,.04,.008,.006,M.black,x,y,-.009,.002);}
 const badge=label(shell,'GOODEASY',.82,-.67,.57,-.012,'#b9c3bc');badge.name='Engraved maker plate';
 const reels=[];for(const [x,y]of [[-1.31,3.17],[1.31,3.17]]){rod(body,[x*.63,2.19,-.41],[x,y,-.14],.09,silver);disc(body,.17,.16,dark,x,y,-.12);reels.push(reel(group,x,y,silver));}
 const transport=part(group,'Visible four-perforation film transport');const gate=part(transport,'Film gate and pressure rails');gate.position.set(0,1.48,.20);
 for(const x of [-.267,.267])box(gate,.063,.82,.11,silver,x,0,.02,.015);for(const y of [-.325,.325])box(gate,.59,.05,.11,dark,0,y,.02,.012);
 const filmStock=filmRibbon(transport,'Continuous film through two buffer loops and the gate');
 // Stopping gate frame: adjacent frames leave only when the Geneva shaft advances.
 const frames=[],frameMaterials=[];for(let i=-2;i<=2;i++){const c=document.createElement('canvas');c.width=192;c.height=144;const ctx=c.getContext('2d'),texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const mat=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});const o=mesh(transport,new T.PlaneGeometry(.308,PITCH*.88),mat,0,1.48+i*PITCH,.214);o.name='Film image cell '+i;frames.push({object:o,ctx,texture,index:i});frameMaterials.push(mat);}
 const rollers=[];for(const y of [2.21,.75]){const root=part(transport,'Continuously feeding toothed roller');root.position.set(-.02,y,.17);disc(root,.13,.12,dark,0,0,0);for(let i=0;i<16;i++){const a=i*TAU/16;box(root,.026,.032,.10,silver,Math.sin(a)*.14,Math.cos(a)*.14,0,.003);}rollers.push(root);}
 // Four-slot Geneva output on the front face. No claw is combined with this mechanism.
 const mechanismMount=part(transport,'Common transverse Geneva and sprocket shaft');mechanismMount.position.set(.65,.91,.20-PITCH/(Math.PI/2));mechanismMount.rotation.y=Math.PI/2;
 const geneva=part(mechanismMount,'Four slot Geneva intermittent output');const star=new T.Shape(),R=.235,halfSlot=.017,slotRoot=.073,entry=Math.asin(halfSlot/R);
 const point=(r,t)=>[Math.cos(t)*r,Math.sin(t)*r];star.moveTo(...point(R,-entry));
 for(let k=0;k<4;k++){const a=k*Math.PI/2,rotate=(x,y)=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];star.lineTo(...rotate(slotRoot,-halfSlot));star.lineTo(...rotate(slotRoot,halfSlot));star.lineTo(...point(R,a+entry));star.absarc(0,0,R,a+entry,(k+1)*Math.PI/2-entry,false);}star.closePath();
 mesh(geneva,new T.ExtrudeGeometry(star,{depth:.035,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:1}),silver);disc(geneva,.045,.07,brass,0,0,.02);
 const driver=part(mechanismMount,'Geneva continuous pin driver');driver.position.set(.32,0,0);disc(driver,.115,.03,dark,0,0,0);rod(driver,[0,0,.04],[-.32*Math.SQRT1_2,0,.04],.015,silver);const driverPin=disc(driver,.012,.09,brass,-.32*Math.SQRT1_2,0,.06);driverPin.name='Geneva driving pin';
 const sprocket=part(transport,'Four perforations per quarter turn');const sr=PITCH/(Math.PI/2);sprocket.position.set(0,.91,.20-sr);rod(transport,[-.24,.91,.20-sr],[.65,.91,.20-sr],.027,silver);for(const x of [-.192,.192]){const wheel=cyl(sprocket,sr-.018,.04,brass,x,0,0);wheel.rotation.z=Math.PI/2;for(let i=0;i<16;i++){const a=i*TAU/16;box(sprocket,.025,.025,.035,silver,x,Math.sin(a)*sr,Math.cos(a)*sr,.003);}}
 // Projection axis is straight: lamp -> gate -> sector shutter -> condenser/lens -> screen.
 const optics=part(group,'Coaxial illumination and projection');optics.position.set(0,1.48,.23);const lens=part(optics,'lens');
 for(const [z,r]of [[.30,.30],[.48,.29],[.63,.27],[.86,.265]]){disc(lens,r,.11,z===.30?dark:enamel,0,0,z);ring(lens,r,.018,silver,0,0,z+.057,'z');}
 for(let i=0;i<36;i++){const a=i*TAU/36;rod(lens,[Math.cos(a)*.272,Math.sin(a)*.272,.67],[Math.cos(a)*.272,Math.sin(a)*.272,.77],.007,dark);}
 mesh(lens,new T.CircleGeometry(.231,64),new T.MeshPhysicalMaterial({color:0x789d9b,metalness:.2,roughness:.06,transparent:true,opacity:.67,clearcoat:1}),0,0,.922);
 const shutter=part(optics,'Rotating sector shutter synchronized with pull down');shutter.position.set(.48,0,.11);const sector=new T.Shape();sector.moveTo(0,0);sector.absarc(0,0,.86,-Math.PI*.56,Math.PI*.56,false);sector.lineTo(0,0);mesh(shutter,new T.ExtrudeGeometry(sector,{depth:.012,bevelEnabled:false,curveSegments:64}),dark);disc(shutter,.05,.06,brass,0,0,.02);
 const handle=part(group,'handle');handle.position.set(-1.03,.93,.25);disc(handle,.11,.11,silver,0,0,0);rod(handle,[0,0,.08],[.34,-.19,.08],.035,silver);disc(handle,.07,.24,M.black,.34,-.19,.18);
 const screen=part(group,'screen');screen.position.set(0,1.48,4.0);screen.rotation.y=Math.PI;box(screen,2.45,1.88,.055,dark,0,0,0,.03);const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;const ctx=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const projected=mesh(screen,new T.PlaneGeometry(2.30,1.73),new T.MeshBasicMaterial({map:texture,color:0xffffff,side:T.DoubleSide}),0,0,-.038);
 const beamGeometry=new T.BufferGeometry();const beamPoints=[-.23,-.17,.93,.23,-.17,.93,.23,.17,.93,-.23,.17,.93,-1.15,-.865,3.73,1.15,-.865,3.73,1.15,.865,3.73,-1.15,.865,3.73];beamGeometry.setAttribute('position',new T.Float32BufferAttribute(beamPoints,3));beamGeometry.setIndex([0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);const beam=mesh(optics,beamGeometry,new T.MeshBasicMaterial({color:0xffdc9d,transparent:true,opacity:.038,side:T.DoubleSide,depthWrite:false}));beam.name='Gate to screen light frustum';beam.castShadow=false;
 tag(body,'body');tag(handle,'handle','action');tag(reels[0],'reel','action');tag(lens,'lens');tag(screen,'screen');
 let old=-1;function update(s,detail=false){const clock=projectorHeroClock((Number(s.frames)||0)+.35);reels.forEach(r=>r.rotation.z=-clock.reelAngle);handle.rotation.z=-clock.cycle/24*TAU;rollers.forEach(r=>r.rotation.z=-clock.cycle*PITCH/.14);geneva.rotation.z=clock.index*Math.PI/2+clock.beta;driver.rotation.z=-clock.theta;sprocket.rotation.x=clock.sprocketAngle;
  const b=clock.buffer*.18;filmStock.update([[-1.31,2.83,.20],[-.79,2.69,.20],[-.49,2.08-b,.20],[0,2.21,.20],[0,1.48,.20],[0,.75,.20],[.48,.37+b,.20],[.91,1.90,.20],[1.31,2.83,.20]],clock.travel);
  for(const f of frames){f.object.position.y=1.48+(f.index-clock.progress)*PITCH;f.object.visible=f.object.position.y>.82&&f.object.position.y<2.15;if(old!==clock.index){paintFilmFrame(f.ctx,clock.index-f.index,192,144);f.texture.needsUpdate=true;}}
  if(old!==clock.index){paintFilmFrame(ctx,frameNumber(clock.index),512,384);texture.needsUpdate=true;old=clock.index;}
  // Outside the dwell exposure the screen is dark, not a continuously glowing still image.
  projected.material.color.setScalar(clock.exposed?1:.045);beam.visible=clock.exposed;shutter.rotation.z=TAU*(clock.phase-.84)+Math.PI;shell.visible=!detail;shutter.visible=detail;
  group.userData.transport={...clock,mechanism:'four-slot Geneva',format:'educational 35mm / 4-perforation',continuousSupply:true};
 }
 update({frames:0,frame:0});
 return {group,eye:[6,3.5,9],heroFitScale:.98,parts:{body,handle,reel:reels[0],lens,screen,film:filmStock.object,shutter,intermittent:geneva,sprocket},update};
}
