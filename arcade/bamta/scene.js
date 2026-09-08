import * as T from './vendor/three.module.min.js';
import {ROOMS} from './mission.js';

export function buildScene(scene){
  const colliders=[],batches=new Map(),materials=new Map(),unit=new T.BoxGeometry(1,1,1);
  let seed=84;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function mat(color,options={}){const key=JSON.stringify([color,Object.fromEntries(Object.entries(options).map(([k,v])=>[k,v?.uuid||v]))]);if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.7,...options}));return materials.get(key);}
  const cream=mat('#dbd8ca'),black=mat('#222830'),silver=mat('#9a9f9c',{metalness:.8,roughness:.3}),white=mat('#e5e5dc'),wood=mat('#bcb293'),skin=mat('#d6ae95'),bronze=mat('#8d7456',{metalness:.85,roughness:.28});
  const bright=mat('#fff1d3',{emissive:'#ffdda6',emissiveIntensity:2.1});
  const cool=mat('#e7f2ee',{emissive:'#e7f2ee',emissiveIntensity:1.2});
  const glass=mat('#9bbcad',{transparent:true,opacity:.53,metalness:.15,roughness:.2,depthWrite:false});
  function box(x,y,z,w,h,d,m=cream,parent){
    if(parent){const mesh=new T.Mesh(unit,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
    if(!batches.has(m))batches.set(m,[]);batches.get(m).push([x,y,z,w,h,d]);
  }
  function solid(x,z,w,d){colliders.push({x,z,w,d});}
  function mesh(geometry,m,x,y,z,parent=scene){const o=new T.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function cyl(x,y,z,r,h,m,parent=scene){return mesh(new T.CylinderGeometry(r,r,h,16),m,x,y,z,parent);}
  function canvasTexture(draw,w=512,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
  function sign(text,x,y,z,w,h,ry=0,bg='#e0ddcc',fg='#27333b',size=70){
    const texture=canvasTexture((c,cw,ch)=>{c.fillStyle=bg;c.fillRect(0,0,cw,ch);c.fillStyle=fg;c.textAlign='center';c.font=`bold ${size}px sans-serif`;const lines=text.split('\n');lines.forEach((line,i)=>c.fillText(line,cw/2,ch/2+(i-(lines.length-1)/2)*90+24));},1024,256);
    const o=mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture,roughness:.65,side:T.DoubleSide}),x,y,z);o.rotation.y=ry;return o;
  }
  const tile=canvasTexture((c,w)=>{c.fillStyle='#c9cabb';c.fillRect(0,0,w,w);for(let i=0;i<13000;i++){c.fillStyle=random()>.5?'#7c827012':'#ffffff28';c.fillRect(random()*w,random()*w,1+random()*4,1+random()*3);}c.fillStyle='#a9ada1';c.fillRect(0,0,w,2);c.fillRect(0,0,2,w);});tile.wrapS=tile.wrapT=T.RepeatWrapping;
  const carpet=canvasTexture((c,w)=>{c.fillStyle='#7d7773';c.fillRect(0,0,w,w);for(let i=0;i<35000;i++){const v=70+random()*70;c.fillStyle=`rgb(${v+8},${v+4},${v})`;c.fillRect(random()*w,random()*w,1,3);}c.fillStyle='#55504e60';c.fillRect(0,0,w,1);c.fillRect(0,0,1,w);});carpet.wrapS=carpet.wrapT=T.RepeatWrapping;
  const stone=canvasTexture((c,w)=>{c.fillStyle='#b6b1a2';c.fillRect(0,0,w,w);for(let i=0;i<1400;i++){const x=random()*w,y=random()*w;c.strokeStyle=random()>.6?'#ebe8d724':'#6f715414';c.lineWidth=random()*4;c.beginPath();c.moveTo(x,y);c.lineTo(x+random()*70,y+random()*40);c.stroke();}c.fillStyle='#8e8d8150';c.fillRect(0,0,w,2);c.fillRect(0,0,2,w);});stone.wrapS=stone.wrapT=T.RepeatWrapping;
  const floorMats={office:mat('#ffffff',{map:tile,roughness:.27}),hall:mat('#ffffff',{map:carpet,roughness:.97}),lobby:mat('#ffffff',{map:stone,roughness:.3})};
  const cells=new Map();
  for(const r of ROOMS)for(let x=r.x0;x<r.x1;x++)for(let z=r.z0;z<r.z1;z++)cells.set(`${x},${z}`,{x,z,kind:r.id});
  // Every edge of the observed route remains physically enclosed; no invisible gaps.
  for(const {x,z,kind}of cells.values()){
    const office=['office','entry'].includes(kind),lobby=['lobby','lift','restroom'].includes(kind);
    box(x+.5,-.045,z+.5,1,.08,1,office?floorMats.office:lobby?floorMats.lobby:floorMats.hall);
    box(x+.5,3.12,z+.5,1,.06,1,office?mat('#d1d3c9'):mat('#9a9489'));
    if(office){box(x+.5,3.079,z,1,.018,.017,silver);box(x,3.079,z+.5,.017,.018,1,silver);}
    for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]])if(!cells.has(`${x+dx},${z+dz}`)){
      const xx=x+.5+dx*.5,zz=z+.5+dz*.5;
      box(xx,1.55,zz,dx?.12:1,3.1,dz?.12:1,lobby?mat('#bdb6a2',{map:stone}):cream);
      box(xx,.065,zz,dx?.15:1,.13,dz?.15:1,black);
      if(!office)box(xx-dx*.08,2.97,zz-dz*.08,dx?.055:1,.045,dz?.055:1,bright);
    }
  }
  // Ceiling fixtures, grilles and sprinklers from the source video's suspended ceiling.
  for(let x=-6;x<=6;x+=4)for(let z=-4;z<=8;z+=4){
    box(x,3.052,z,1.25,.055,.64,silver);box(x,3.015,z,1.17,.025,.57,cool);
    for(let k=-5;k<=5;k++)box(x+k*.105,2.994,z,.015,.02,.58,white);
    if(x===-2){for(let k=0;k<9;k++)box(x+1.3,3.035,z-.25+k*.056,.55,.012,.025,black);}
  }
  for(const [x,z]of [[11.5,-9],[11.5,-14],[16,-19],[22.5,-23],[22.5,-26]]){const light=new T.PointLight('#ffe5bf',3.8,8,2);light.position.set(x,2.72,z);scene.add(light);cyl(x,3.04,z,.085,.025,bright);}
  const officeLight=new T.PointLight('#effff5',8,20,2);officeLight.position.set(0,2.85,2);scene.add(officeLight);
  // Long frosted mint-glass partition with real frame depth, leaving entrance open.
  for(let z=-1;z<10;z+=2){box(7,1.54,z,.055,3.05,1.97,glass);box(7,1.53,z-1,.075,3.07,.035,silver);for(let y=1.3;y<2.1;y+=.18)box(6.962,y,z,.007,.007,1.96,white);}
  box(7,.04,4.5,.12,.08,11,silver);box(7,3.06,4.5,.12,.08,11,silver);
  // Window wall and softened daylight behind workstations.
  box(-7.91,1.8,2,.03,2.1,14,mat('#c5d8d2',{emissive:'#adc6c1',emissiveIntensity:.35}));
  for(let z=-4;z<10;z+=2){box(-7.85,1.8,z,.08,2.2,.055,silver);for(let k=0;k<18;k++)box(-7.77,2.76-k*.07,z+.8,.02,.018,1.5,white);}
  const screenTex=canvasTexture((c,w,h)=>{c.fillStyle='#122d43';c.fillRect(0,0,w,h);const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#17446d');g.addColorStop(1,'#357e87');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='#e4eef0';c.fillRect(32,35,450,235);c.fillStyle='#1a3545';c.font='bold 22px sans-serif';c.fillText('VISUAL NEWSIS',50,70);c.fillStyle='#ccd6da';for(let i=0;i<7;i++)c.fillRect(50,95+i*20,300-i%3*35,8);c.fillStyle='#ec7c35';c.fillRect(380,100,70,120);c.fillStyle='#101922';c.fillRect(0,h-22,w,22);},512,320);
  const screenMat=new T.MeshStandardMaterial({map:screenTex,emissiveMap:screenTex,emissive:'#ffffff',emissiveIntensity:.4,roughness:.3});
  function chair(x,z,own=false){
    box(x,.49,z,.59,.09,.54,black);box(x,.91,z+.22,.59,.75,.09,mat('#343f47'));cyl(x,.28,z,.055,.42,silver);
    for(const dx of [-.33,.33]){box(x+dx,.68,z,.055,.06,.52,black);box(x+dx,.54,z,.035,.28,.035,black);}
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const o=box(0,.1,0,.38,.035,.055,silver,new T.Group());const g=o.parent;g.position.set(x,.02,z);g.rotation.y=a;scene.add(g);cyl(x+Math.cos(a)*.3,.06,z+Math.sin(a)*.3,.045,.08,black);}
    if(!own)solid(x,z,.66,.7);
  }
  function desk(x,z,own=false){
    box(x,.75,z,2.55,.055,1.15,wood);solid(x,z,2.55,1.15);
    for(const dx of [-1.12,1.12]){box(x+dx,.37,z,.055,.74,.85,silver);box(x+dx,.08,z,.3,.04,.8,silver);}
    box(x,.99,z-.35,2.5,.46,.035,mat('#a0aaa5'));
    for(const dx of [-.56,.56]){box(x+dx,1.24,z-.1,1.01,.61,.055,black);box(x+dx,1.25,z-.065,.94,.53,.008,screenMat);box(x+dx,.91,z-.12,.055,.25,.065,black);box(x+dx,.8,z,.37,.024,.21,black);}
    box(x,.797,z+.29,.79,.018,.25,black);for(let row=0;row<4;row++)for(let k=0;k<13;k++)box(x-.36+k*.058,.808,z+.2+row*.05,.043,.006,.03,mat('#68716e'));
    mesh(new T.SphereGeometry(.065,12,8),black,x+.63,.82,z+.31).scale.set(.8,.35,1.2);
    box(x+.65,.782,z+.3,.27,.009,.3,mat('#53615e'));
    for(let i=0;i<6;i++)box(x-1,.791+i*.006,z+.13,.3,.005,.39,white);
    cyl(x+.97,.88,z+.25,.062,.19,mat('#426778'));cyl(x+.97,.978,z+.25,.052,.006,mat('#262d29'));
    box(x+1.02,.48,z-.24,.25,.5,.43,black);
    chair(x,z+.93,own);
  }
  desk(0,4.65,true);for(const [x,z]of [[-4.8,4.65],[-4.8,-.25],[0,-.25],[4,-.25],[4,4.65]])desk(x,z);
  // Personal desk note: no photographed documents or private screen contents are copied.
  sign('오늘은 정시 퇴근',-.53,1.01,4.89,.33,.1,0,'#e3cc6a','#403729',88);
  // Copier, paper boxes, recycling bin and office clock near the observed exit.
  box(5.75,.58,-3.3,1.15,1.16,.88,black);box(5.75,.92,-3.3,1.19,.5,.92,white);box(5.75,1.22,-3.29,.85,.1,.78,white);
  for(let y=.2;y<.85;y+=.22){box(5.75,y,-2.84,1,.025,.03,silver);box(5.75,y+.09,-2.8,.2,.025,.03,black);}box(6.12,1.22,-2.9,.23,.05,.2,screenMat);solid(5.75,-3.3,1.2,.95);
  for(let i=0;i<3;i++){box(4.63,.16+i*.3,-3.38,.75,.28,.55,mat('#d9d9c4'));sign('A4 COPY',4.63,.18+i*.3,-3.092,.64,.16,0,'#284c75','#faf7dc',85);}solid(4.63,-3.38,.75,.55);
  cyl(6.2,.36,-1.8,.26,.72,mat('#245c82'));solid(6.2,-1.8,.52,.52);
  const clock=mesh(new T.CylinderGeometry(.27,.27,.04,32),mat('#714c35'),5.7,2.5,-5.91);clock.rotation.x=Math.PI/2;
  sign('12\n9     •     3\n6',5.7,2.5,-5.88,.44,.44,0,'#ece8d9','#333c3d',48);
  sign('EXIT  →',7.73,2.57,-4,1.15,.28,-Math.PI/2,'#2d7862','#f4fff1');
  sign('편집국',8.85,1.65,-5.89,1,.28,0,'#e2ded0','#414b4a');
  // Whiteboard easter egg: handwritten school-board layout, rightmost corner.
  const boardTex=canvasTexture((c,w,h)=>{c.fillStyle='#e3e6df';c.fillRect(0,0,w,h);c.fillStyle='#89999a';c.font='28px sans-serif';c.fillText('이번 주',50,65);c.strokeStyle='#aeb8b1';for(let i=0;i<5;i++){c.beginPath();c.moveTo(50,130+i*57);c.lineTo(700,130+i*57);c.stroke();}c.strokeStyle='#364c52';c.lineWidth=3;c.beginPath();c.moveTo(785,45);c.lineTo(785,465);c.stroke();c.fillStyle='#243b43';c.font='35px cursive';['만든사람','안재현','','떠든사람','최승훈','성주현'].forEach((t,i)=>c.fillText(t,820,85+i*59));},1100,520);
  box(1.55,1.78,-5.85,3.9,1.75,.08,silver);box(1.55,1.78,-5.798,3.8,1.65,.009,new T.MeshStandardMaterial({map:boardTex,roughness:.3}));box(1.55,.88,-5.74,3.9,.04,.16,silver);box(2.8,.925,-5.73,.24,.065,.09,black);
  // Dark wood door surrounds, frosted panels and handles through the warm corridor.
  for(const z of [-8,-12,-16]){
    box(10.09,1.3,z,.11,2.6,1.25,mat('#493e36'));box(10.16,1.38,z,.04,2.3,1.04,mat('#abb3a7',{metalness:.2,roughness:.38}));box(10.23,1.2,z+.36,.08,.31,.035,silver);
    sign('회의실',10.22,1.75,z,.6,.17,Math.PI/2,'#adb6ae','#3c4c4b',84);
  }
  sign('RESTROOM  화장실',16.5,2.7,-20.85,2,.3,0,'#383735','#eee3c6',65);
  sign('남  /  여',17.85,1.7,-22.4,.64,.3,-Math.PI/2,'#403c36','#eae6d6',70);
  box(16.5,.81,-24.6,2.6,.12,.65,mat('#d1d1c5'));for(const x of [15.8,17.2]){box(x,.88,-24.55,.55,.07,.4,white);cyl(x,.995,-24.78,.027,.24,silver);}
  box(16.5,1.7,-24.91,2.5,1.1,.025,mat('#90a2a4',{metalness:1,roughness:.08}));
  // Elevator lobby: bronze doors, pale stone piers, black recesses, floor 12.
  const doors=new T.Group();doors.position.set(22.5,0,-28);scene.add(doors);
  const leftDoor=box(-.72,1.35,0,1.44,2.7,.06,bronze,doors),rightDoor=box(.72,1.35,0,1.44,2.7,.06,bronze,doors);
  for(const x of [20.91,24.09])box(x,1.43,-28,.18,2.86,.23,black);
  box(22.5,2.85,-28,3.36,.18,.23,bronze);
  sign('12   ▼',22.5,2.84,-27.86,.7,.14,0,'#151716','#f8aa58',80);
  box(24.84,1.32,-27.19,.13,.48,.055,black);sign('▼',24.84,1.32,-27.15,.1,.13,0,'#1c2629','#eacb7d',120);
  sign('12',25.9,2.15,-25,1.1,.7,-Math.PI/2,'#bdb6a2','#594b3c',170);
  for(const z of [-23.4,-26]){box(20.075,1.4,z,.06,2.8,1.7,bronze);box(20.13,1.4,z,.04,2.62,1.5,mat('#584b3d',{metalness:.8,roughness:.3}));}
  sign('비상구  EXIT',23,2.72,-20.08,1.4,.22,Math.PI,'#356b52','#edfae0',75);
  // Cabin has warm metal panels, handrail and lit control buttons.
  box(22.5,1.5,-30.95,2.9,3,.04,bronze);box(21.07,1.5,-29.5,.04,3,2.9,bronze);box(23.93,1.5,-29.5,.04,3,2.9,bronze);
  box(22.5,.95,-30.8,2.65,.04,.06,silver);box(22.5,2.98,-29.5,1.2,.04,1.4,bright);
  for(let i=0;i<7;i++){box(23.89,1.08+i*.085,-29,.017,.055,.06,white);}
  // Instanced furniture and architectural parts; materials are reused throughout.
  const matrix=new T.Matrix4();for(const [m,items]of batches){const o=new T.InstancedMesh(unit,m,items.length);items.forEach(([x,y,z,w,h,d],i)=>{matrix.makeScale(w,h,d);matrix.setPosition(x,y,z);o.setMatrixAt(i,matrix);});o.receiveShadow=true;o.castShadow=!m.transparent;scene.add(o);}
  function person({female=false,boss=false,x,z}){
    const g=new T.Group();g.position.set(x,0,z);scene.add(g);
    const suit=mat(boss?'#273440':female?'#566173':'#9faaa6');
    const hips=box(0,.83,0,.38,.22,.24,suit,g);
    const torso=mesh(new T.CylinderGeometry(.18,.22,.55,12),suit,0,1.18,0,g);torso.scale.z=.66;
    box(0,1.4,.117,.12,.16,.023,white,g);
    if(boss){box(0,1.15,.153,.075,.35,.02,mat('#d7b552'),g);}
    const head=mesh(new T.SphereGeometry(.158,24,16),skin,0,1.67,0,g);head.scale.set(.9,1.22,.86);
    const hair=mesh(new T.SphereGeometry(.165,20,12,0,Math.PI*2,0,Math.PI*.6),mat('#191e23'),0,1.73,-.018,g);
    if(female){box(0,1.46,-.08,.31,.48,.12,mat('#191e23'),g);for(const x of [-.145,.145])box(x,1.5,.012,.06,.43,.15,mat('#191e23'),g);}
    else{for(let i=0;i<5;i++){const tuft=mesh(new T.SphereGeometry(.067,10,8),mat('#191e23'),-.12+i*.055,1.845+Math.sin(i)*.02,0,g);tuft.scale.set(.85,.65,1);}}
    for(const x of [-.052,.052]){mesh(new T.SphereGeometry(.013,10,8),black,x,1.689,.13,g);}
    mesh(new T.SphereGeometry(.025,10,8),skin,0,1.657,.147,g).scale.set(.6,1,1);
    box(0,1.603,.133,.064,.009,.008,mat('#8e6157'),g);
    if(boss){for(const x of [-.071,.071]){const ring=mesh(new T.TorusGeometry(.058,.006,8,24),black,x,1.699,.145,g);};box(0,1.7,.151,.023,.006,.006,black,g);}
    const arms=[],legs=[];for(const side of [-1,1]){
      const arm=new T.Group();arm.position.set(side*.25,1.4,0);g.add(arm);box(0,-.23,0,.105,.46,.12,suit,arm);mesh(new T.SphereGeometry(.062,12,10),skin,0,-.49,0,arm);arms.push(arm);
      const leg=new T.Group();leg.position.set(side*.105,.82,0);g.add(leg);box(0,-.35,0,.13,.7,.16,mat('#34404a'),leg);box(0,-.74,.06,.16,.09,.3,black,leg);legs.push(leg);
    }
    return {group:g,arms,legs,base:{x,z},flinch:0};
  }
  const woman=person({female:true,x:10.4,z:-4}),coworker=person({x:11.7,z:-12.5}),boss=person({boss:true,x:22.5,z:-26.7});boss.group.visible=false;boss.group.rotation.y=Math.PI;
  return {colliders,doors,leftDoor,rightDoor,woman,coworker,boss,mat,box,person};
}
