import * as THREE from './vendor/three.module.min.js';
import { WORLD } from './world.js';

// Photo-informed facade study: Visit Korea, Chungmuro Printing Alley,
// image 3456367. All textures below are drawn locally; no photo is redistributed.
export function buildArchitecture(scene) {
  let seed=27;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const batches=new Map(),colliders=[];
  const cube=new THREE.BoxGeometry(1,1,1);
  const materials=new Map();
  const mat=(color,options={})=>{const key=JSON.stringify([color,Object.fromEntries(Object.entries(options).map(([k,v])=>[k,v?.isTexture?v.uuid:v]))]);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.83,...options}));return materials.get(key);};
  const concrete=mat('#b5b3a7'), dark=mat('#303b3c'), aluminum=mat('#9ca9a6',{metalness:.7,roughness:.32}), rubber=mat('#242b2b');
  function texture(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
  const asphalt=texture((c,s)=>{c.fillStyle='#535552';c.fillRect(0,0,s,s);for(let i=0;i<47000;i++){const v=60+rand()*70;c.fillStyle=`rgb(${v},${v+2},${v})`;c.fillRect(rand()*s,rand()*s,rand()*1.8+.3,rand()*1.8+.3);}c.strokeStyle='#303733';c.lineWidth=.7;for(let i=0;i<8;i++){c.beginPath();let x=rand()*s,y=rand()*s;c.moveTo(x,y);for(let j=0;j<7;j++){x+=rand()*50-25;y+=rand()*45;c.lineTo(x,y);}c.stroke();}});
  asphalt.repeat.set(9,9);
  const brick=texture((c,s)=>{c.fillStyle='#675d52';c.fillRect(0,0,s,s);for(let row=0;row<25;row++)for(let col=-1;col<9;col++){const x=col*65+(row%2)*32,y=row*21,v=rand()*25;c.fillStyle=`rgb(${113+v},${69+v},${53+v})`;c.fillRect(x+1,y+1,62,18);for(let k=0;k<35;k++){c.fillStyle=rand()>.5?'#ffffff0c':'#00000012';c.fillRect(x+rand()*60,y+rand()*18,3,1);}}});
  const plaster=texture((c,s)=>{c.fillStyle='#b1b0a2';c.fillRect(0,0,s,s);for(let i=0;i<25000;i++){c.fillStyle=rand()>.5?'#00000008':'#ffffff12';c.fillRect(rand()*s,rand()*s,2,2);}for(let i=0;i<20;i++){const x=rand()*s,g=c.createLinearGradient(0,0,0,s);g.addColorStop(0,'#343f3329');g.addColorStop(1,'#343f3300');c.fillStyle=g;c.fillRect(x,0,2+rand()*8,s);}});
  const bricks=mat('#ffffff',{map:brick,bumpMap:brick,bumpScale:.026});
  const stucco=mat('#ffffff',{map:plaster,bumpMap:plaster,bumpScale:.018});
  function b(x,y,z,w,h,d,m,ry=0,rz=0){if(!batches.has(m))batches.set(m,[]);batches.get(m).push({x,y,z,w,h,d,ry,rz});}
  function planeText(text,w,h,{bg='#e2e2ce',fg='#243b43',size=68,sub=''}={}){
    const c=document.createElement('canvas'),vertical=h>w;c.width=vertical?256:1024;c.height=vertical?1024:256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=fg;ctx.textAlign='center';ctx.font=`700 ${size}px sans-serif`;
    if(vertical){const chars=[...text.replace(/\s/g,'')];ctx.font='700 150px sans-serif';chars.forEach((ch,i)=>ctx.fillText(ch,128,330+i*230));}
    else{ctx.fillText(text,512,sub?125:155);if(sub){ctx.font='25px sans-serif';ctx.fillText(sub,512,198);}}
    // Light edge wear is drawn into our own sign artwork.
    for(let i=0;i<120;i++){ctx.fillStyle='#3b493519';ctx.fillRect(rand()*c.width,rand()>.5?rand()*9:c.height-rand()*9,1+rand()*12,2+rand()*7);}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.65,side:THREE.DoubleSide}));
  }
  function textAt(text,x,y,z,w,h,ry,options){const p=planeText(text,w,h,options);p.position.set(x,y,z);p.rotation.y=ry;scene.add(p);return p;}
  b(0,-.12,0,48,.22,48,mat('#ffffff',{map:asphalt,roughness:.96}));
  // Broken yellow edge paint; seam and drainage detail read at eye height.
  const yellow=mat('#c8aa51');for(const x of [-1.88,1.88])for(let z=-17;z<19;z+=.23)if(rand()>.055)b(x,.002,z,.08+rand()*.03,.006,.21,yellow);
  const pavement=mat('#a5a69e');for(const x of [-2.28,2.28])for(let z=-17;z<20;z+=.58){b(x,.075,z,.38,.15,.565,pavement);b(x+(x<0?.2:-.2),.06,z,.045,.12,.565,concrete);}
  const marking=textAt('주 차 금 지',0,.013,13,1.6,.55,0,{bg:'#535552',fg:'#d7d6c9',size:92});marking.rotation.x=-Math.PI/2;
  const glass=mat('#829ea1',{metalness:.35,roughness:.12,transparent:true,opacity:.27,depthWrite:false});
  const windowGlass=mat('#586e75',{metalness:.75,roughness:.19});
  WORLD.buildings.forEach(([x,z,w,h,d],index)=>{
    const left=x<0,face=left?x+w/2:x-w/2,dir=left?1:-1,ry=left?Math.PI/2:-Math.PI/2;
    const m=index===0?bricks:stucco;
    colliders.push({x,z,w,d});
    // Recessed ground floor is assembled around real window depth, not painted on a box.
    b(x,(h+3.2)/2,z,w,h-3.2,d,m);b(x-dir*.9,1.6,z,w-1.8,3.2,d,concrete);
    b(face-dir*.12,.15,z,.65,.3,d,concrete);
    b(face-dir*.07,3.2,z,.36,.22,d,concrete);
    b(x,h+.12,z,w+.18,.24,d+.18,concrete);
    for(let zz=z-d/2+.12;zz<=z+d/2;zz+=2.95){
      b(face,1.6,zz,.18,3.2,.14,aluminum);
      b(face-dir*.12,1.65,zz+1.43,.025,2.8,2.75,glass);
      b(face-dir*.85,1.12,zz+1.3,1.15,.08,2.5,dark);
      b(face-dir*.9,2.08,zz+1.3,1.05,.07,2.5,dark);
      // Diary spines and paper stacks behind the glass, matching photo's display depth.
      for(let k=0;k<10;k++){
        const book=mat(['#d0c8ad','#7e988f','#747c78','#b7a78b','#adbdb6'][Math.floor(rand()*5)]);
        const height=.27+rand()*.18;
        b(face-dir*.63,1.16+height/2,zz+.14+k*.25,.45,height,.13+rand()*.05,book,0,dir*(.05+rand()*.2));
        if(rand()>.2)b(face-dir*.61,2.12+height/2,zz+.14+k*.25,.43,height,.19,book);
      }
    }
    // Shop door, pull handle, kick plate and shallow entrance steps.
    b(face+dir*.03,1.4,z+3,.04,2.6,.07,rubber);
    b(face+dir*.13,1.2,z+3.22,.10,.48,.035,aluminum);
    for(let step=0;step<2;step++)b(face+dir*(.2+step*.13),.06+(1-step)*.05,z+3,.28,.12,1.3,pavement);
    for(let y=4.2;y<h-.7;y+=2.65)for(let zz=z-d/2+1.55;zz<z+d/2;zz+=3.05){
      b(face+dir*.008,y,zz,.025,1.65,2.12,dark);
      b(face+dir*.022,y,zz,.032,1.48,1.94,windowGlass);
      for(const dz of [-1.02,0,1.02])b(face+dir*.08,y,zz+dz,.12,1.64,.05,aluminum);
      for(const dy of [-.8,.1,.8])b(face+dir*.08,y+dy,zz,.12,.045,2.1,aluminum);
      b(face+dir*.15,y-.87,zz,.38,.10,2.28,concrete);
      if(rand()>.35)for(let k=0;k<7;k++)b(face+dir*.04,y+.6-k*.09,zz,.02,.024,1.94,mat('#bbc2b3'));
    }
    b(face+dir*.16,3.1,z,.4,.76,d-.12,aluminum);
    textAt(index===0?'연합커뮤니케이션즈':index===1?'다이어리 · 인쇄':index===2?'인쇄 · 제본 · 출력':'종이와 기록',face+dir*.37,3.13,z,d-.3,.67,ry,{size:75,sub:index===0?'PRINTING · DESIGN · COMMUNICATION':'PAPER / PRINT / BOOK',fg:index===1?'#e9e3d2':'#334d5a',bg:index===1?'#7e3b30':'#e2e2d8'});
    // Canopy has folded sheet depth, a valance and metal support arms.
    const awning=mat(index===0?'#3d5e77':'#596c62');b(face+dir*.5,2.64,z,1.1,.055,d-.2,awning,0,-dir*.12);
    b(face+dir*1.02,2.5,z,.06,.2,d-.2,awning);
    for(let zz=z-d/2+.5;zz<z+d/2;zz+=2)b(face+dir*.45,2.48,zz,.9,.045,.045,aluminum,0,dir*.15);
    // Drainpipe bends, brackets, meter boxes, AC cases and grilles.
    b(face+dir*.21,h/2,z-d/2+.2,.085,h,.085,aluminum);
    for(let y=.5;y<h;y+=1.5)b(face+dir*.16,y,z-d/2+.2,.2,.045,.18,dark);
    b(face+dir*.3,1.8,z-4,.28,.46,.36,mat('#7d8c85'));
    for(const zz of [z-3.1,z+2.8]){
      b(face+dir*.35,4.2,zz,.65,.65,1.05,mat('#cccabc'));
      for(let k=0;k<10;k++)b(face+dir*.69,4.2,zz-.43+k*.093,.022,.48,.025,aluminum);
      b(face+dir*.1,3.7,zz,.08,.7,.045,aluminum);
    }
    // Projecting signage, with backing and visible bracket.
    const signZ=z-3.9;b(face+dir*.55,4.9,signZ,1,.05,.055,dark);
    b(face+dir*.8,4.2,signZ,.52,1.55,.13,concrete);
    textAt(index%2?'제 본':'인 쇄',face+dir*.8,4.2,signZ+.075,.48,1.47,0,{bg:index%2?'#d6b45e':'#e7e6d5',fg:'#384854',size:100});
    // Individually placed service notices and worn shutter on the rear workshop.
    textAt(index===0?'디자인 · 소량 인쇄':'샘플 전시',face+dir*.035,1.88,z+2.25,.65,.24,ry,{size:90,bg:'#ebe8d8',fg:'#555c5b'});
    textAt('용지 · 출력 상담',face+dir*.04,1.58,z+2.25,.62,.13,ry,{size:55,bg:'#d9e0d8',fg:'#414e48'});
    if(index===2){
      const shutter=mat('#8d938c');b(face+dir*.03,1.35,z+3,.05,2.5,2.3,shutter);
      for(let y=.2;y<2.55;y+=.095)b(face+dir*.08,y,z+3,.05,.018,2.3,aluminum);
      textAt('지류 보관',face+dir*.12,1.6,z+3,1,.4,ry,{size:80,bg:'#b8b9a9',fg:'#34434a'});
    }
  });
  // Cable sag, service loops, cross street drops and pole hardware.
  const wireMaterial=new THREE.LineBasicMaterial({color:'#252e30'});
  function cable(points){scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),wireMaterial));}
  for(const z of [-10,7,18]){
    b(-2.06,3.5,z,.15,7,.15,mat('#898c82'));
    b(-2.06,6.65,z,1.05,.07,.07,dark);
    b(-2.05,5.6,z,.32,.52,.34,mat('#c0c3b6'));
    for(let j=0;j<6;j++){
      const pts=[];for(let k=0;k<=20;k++){const t=k/20;pts.push([-2.05+j*.07,6.4-Math.sin(t*Math.PI)*(.3+j*.07),z+t*17]);}cable(pts);
    }
    cable([[-2.06,6.5,z],[0,5.7,z-2],[2.6,6.1,z-3]]);
    const loop=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;loop.push([-2.03+Math.sin(a)*.28,5.7+Math.cos(a)*.28,z+.1]);}cable(loop);
  }
  // A parked handcart and bundled stock: small, readable human-scale anchors.
  const cardboard=mat('#b39362'),paper=mat('#d7d1bd'),cart=mat('#2d8493');
  b(-1.78,.22,12,.6,.08,.95,cart);for(const zz of [11.6,12.4])b(-1.78,.12,zz,.64,.18,.16,rubber);
  b(-1.78,.68,12.4,.58,1,.045,cart);b(-1.78,1.2,12.4,.6,.06,.06,cart);
  for(let i=0;i<3;i++){b(-1.78,.38+i*.2,12,.5,.19,.62,paper);b(-1.78,.48+i*.2,12,.51,.018,.06,cardboard);}
  colliders.push({x:-1.78,z:12,w:.6,d:1});
  // Parked delivery scooter, observed in the reference; no driving system.
  function cylinder(x,y,z,radius,length,m,rotationZ=0){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,16),m);mesh.position.set(x,y,z);mesh.rotation.z=rotationZ;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh;}
  for(const z of [6.4,7.55]){
    cylinder(-1.72,.26,z,.25,.13,rubber,Math.PI/2);
    cylinder(-1.72,.26,z,.15,.145,aluminum,Math.PI/2);
    cylinder(-1.72,.26,z,.05,.16,dark,Math.PI/2);
  }
  b(-1.72,.48,7,.35,.17,.94,dark);b(-1.72,.71,7.2,.35,.14,.55,rubber);
  b(-1.72,.64,6.49,.29,.56,.11,mat('#78867d'),0,.06);
  b(-1.72,.99,6.46,.57,.035,.045,aluminum);b(-1.72,.91,6.35,.2,.16,.12,mat('#e6dbc1',{emissive:'#e6dbc1',emissiveIntensity:.15}));
  b(-1.72,.88,7.69,.68,.64,.68,cardboard);
  for(const x of [-2.06,-1.39])b(x,1.36,7.7,.024,1.35,.024,aluminum);
  b(-1.72,2.03,7.55,.76,.045,1.18,mat('#859087'));
  colliders.push({x:-1.72,z:7.1,w:.72,d:1.8});
  // Paper offcuts, tape, leaves and patched asphalt break perfect repetition.
  const scraps=mat('#bdb8a5'),patch=mat('#424945');
  b(.45,.005,5,.75,.007,1.6,patch,.14);
  for(let i=0;i<38;i++){const x=(rand()>.5?1:-1)*(1.5+rand()*.45),z=rand()*33-15;b(x,.018,z,.025+rand()*.08,.003,.025+rand()*.06,i%3?scraps:yellow,rand()*3);}
  for(const z of [4,-8,16]){
    b(1.8,.011,z,.3,.024,.8,dark);for(let i=0;i<13;i++)b(1.8,.03,z-.37+i*.06,.28,.025,.026,aluminum);
  }
  // Namsan Square: photo-observed pale square grid, broad slab proportions,
  // recessed glazing, rooftop screen and open columned ground floor.
  // Distance/scale are compressed; not a surveyed route from the printing alley.
  const namsanStone=mat('#c8cdc7'),namsanFrame=mat('#e0e1d7'),namsanGlass=mat('#425f6a',{metalness:.7,roughness:.22});
  const nx=0,nz=-47,nw=35,nh=49,nd=16,front=nz+nd/2;
  b(nx,(nh+3.4)/2,nz,nw,nh-3.4,nd,namsanStone);
  b(nx,1.7,nz-.8,nw-1.5,3.4,nd-1.6,namsanGlass);
  // Twenty columns across the facade; 22 upper window rows above the podium.
  for(let row=0;row<22;row++)for(let col=0;col<20;col++){
    const x=-16.05+col*1.69,y=4.7+row*1.98;
    b(x,y,front+.014,.98,1.14,.035,namsanGlass);
    b(x-.58,y,front+.11,.095,1.52,.22,namsanFrame);
    b(x+.58,y,front+.11,.095,1.52,.22,namsanFrame);
    b(x,y-.68,front+.16,1.23,.10,.34,namsanFrame);
    b(x,y+.68,front+.08,1.23,.08,.16,namsanFrame);
    if((row*7+col)%9===0)b(x,y+.16,front+.038,.94,.65,.018,mat('#9ba8a2'));
  }
  for(let row=0;row<22;row++)for(let col=0;col<8;col++){
    const z=nz-6.7+col*1.9,y=4.7+row*1.98;
    for(const side of [-1,1]){b(side*(nw/2+.014),y,z,.035,1.14,1.08,namsanGlass);b(side*(nw/2+.1),y-.68,z,.22,.1,1.38,namsanFrame);}
  }
  for(let x=-16;x<17;x+=3.4)b(x,1.75,front+.18,.54,3.5,.85,namsanFrame);
  b(0,3.4,front+.78,13,.3,2.4,namsanFrame);
  textAt('NAMSAN SQUARE',0,3.4,front+2,8,.24,0,{size:48,bg:'#d1d5cd',fg:'#4a5959'});
  b(0,nh+.46,nz,nw,.92,nd,mat('#a7b2b0'));
  for(let x=-17;x<=17;x+=.7)b(x,nh+.6,front+.05,.045,1.24,.1,namsanFrame);
  b(0,nh+1.12,nz,nw+.12,.08,nd+.12,namsanFrame);
  // Forecourt extends only to the landmark approach, pending actual route footage.
  b(0,-.11,-31,40,.2,19,mat('#858f8d'));
  for(let x=-18;x<=18;x+=1.2)for(let z=-38;z<-23;z+=1.2)b(x,.012,z,1.18,.025,1.18,mat((Math.round(x*10+z*10)%3)?'#a4aaa3':'#b7bbb0'));
  for(const x of [-11,11])for(const z of [-35,-28]){
    b(x,.24,z,2.8,.48,2.8,namsanStone);b(x,.49,z,2.6,.02,2.6,mat('#544f3a'));
    cylinder(x,1.8,z,.12,2.6,mat('#6b6252'));
    const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(1.6,1),mat('#677b4b'));leaves.position.set(x,3.2,z);leaves.scale.set(1,1.25,1);leaves.castShadow=true;scene.add(leaves);
    colliders.push({x,z,w:2.8,d:2.8});
  }
  b(0,.12,-18,4,.24,4,concrete);
  // Shared materials + instancing keep dense facade detail cheap to draw.
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),scale=new THREE.Vector3();
  for(const [m,items] of batches){const mesh=new THREE.InstancedMesh(cube,m,items.length);items.forEach((p,i)=>{pos.set(p.x,p.y,p.z);scale.set(p.w,p.h,p.d);q.setFromEuler(new THREE.Euler(0,p.ry,p.rz));matrix.compose(pos,q,scale);mesh.setMatrixAt(i,matrix);});mesh.castShadow=!m.transparent;mesh.receiveShadow=true;scene.add(mesh);}
  // Keep player inside the photographic study's narrow corridor.
  colliders.push({x:-6,z:0,w:7,d:48},{x:6,z:0,w:7,d:48});
  return {colliders};
}
