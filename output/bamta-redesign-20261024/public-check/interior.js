import * as T from './vendor/three.module.min.js';

// Set dressing stays inside the original floor plan. No route is moved or blocked.
export function dressInterior({scene,box,mesh,mat,canvasTexture,solid,art={}}){
  const ink=mat('#1c302e'),steel=mat('#647c70',{metalness:.4,roughness:.55}),paper=mat('#ddd9bd');
  function cable(points,r=.008,color='#1c2c29'){
    return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),18,r,5,false),mat(color),0,0,0);
  }
  function plant(x,z,size=1){
    const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);scene.add(g);
    const potPoints=[[0,0],[.147,0],[.153,.018],[.185,.36],[.188,.39],[.18,.403],[.165,.40],[.16,.36],[.14,.05],[0,.05]].map(p=>new T.Vector2(...p));
    mesh(new T.LatheGeometry(potPoints,48),mat('#b7b3a5',{roughness:.87,map:art.stone}),0,0,0,g);
    mesh(new T.CylinderGeometry(.163,.163,.012,32),mat('#302a20',{roughness:1}),0,.371,0,g);
    const pebbles=new T.InstancedMesh(new T.IcosahedronGeometry(.009,0),mat('#7c7056',{roughness:1}),40),temp=new T.Object3D();
    for(let i=0;i<40;i++){const a=i*2.399,r=.145*Math.sqrt(i/40);temp.position.set(Math.cos(a)*r,.38,Math.sin(a)*r);temp.scale.set(1+i%3*.2,.7,1);temp.rotation.set(i,i*.4,0);temp.updateMatrix();pebbles.setMatrixAt(i,temp.matrix);}g.add(pebbles);
    const wood=mat('#63533a',{roughness:.94});
    const trunk=mesh(new T.CylinderGeometry(.009,.019,1.07,12),wood,0,.9,0,g);trunk.rotation.z=.045;
    const leafGeometry=new T.PlaneGeometry(.26,.42,8,12);leafGeometry.translate(0,.21,0);
    const position=leafGeometry.attributes.position;
    for(let i=0;i<position.count;i++){const xx=position.getX(i),yy=position.getY(i)/.42;position.setZ(i,.022*Math.sin(yy*Math.PI)+.012*(1-(xx/.13)**2));}leafGeometry.computeVertexNormals();
    const leaves=[],twigs=new T.InstancedMesh(new T.CylinderGeometry(.0025,.004,1,7),wood,32);twigs.castShadow=true;g.add(twigs);
    for(let variant=0;variant<4;variant++){
      const m=new T.MeshStandardMaterial({map:art.leafTextures?.[variant],color:art.leafTextures?'#f0f3e7':'#4f7650',roughness:.54,metalness:0,side:T.DoubleSide,alphaTest:.42});
      const batch=new T.InstancedMesh(leafGeometry,m,8);batch.castShadow=true;batch.receiveShadow=true;g.add(batch);leaves.push(batch);
    }
    for(let i=0;i<32;i++){
      const angle=i*2.399,level=.62+(i%8)*.112,direction=new T.Vector3(Math.cos(angle)*.8,.38+(i%3)*.11,Math.sin(angle)*.8).normalize();
      const length=.07+(i%4)*.012,start=new T.Vector3(.0,level,0),tip=start.clone().addScaledVector(direction,length);
      temp.position.copy(start.clone().add(tip).multiplyScalar(.5));temp.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);temp.scale.set(1,length,1);temp.updateMatrix();twigs.setMatrixAt(i,temp.matrix);
      temp.position.copy(tip);temp.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);temp.rotateY(Math.sin(i)*.55);const scale=.72+(i%5)*.09;temp.scale.set(scale,scale,scale);temp.updateMatrix();leaves[i%4].setMatrixAt(Math.floor(i/4),temp.matrix);
    }
    solid(x,z,.5*size,.5*size);
  }
  plant(-6.85,-4.55,1.2);plant(6.25,8.8,1.1);plant(25.35,-21.4,1.15);
  // Editors' lockers and file spines add scale to the quiet side of the room.
  box(-6.9,.69,8.7,1.6,1.38,.6,steel);solid(-6.9,8.7,1.6,.6);
  for(let i=0;i<4;i++){box(-7.48+i*.39,.72,9.01,.012,1.25,.008,ink);box(-7.29+i*.39,.83,9.025,.025,.18,.024,ink);box(-7.29+i*.39,1.17,9.024,.21,.052,.012,paper);}
  for(let i=0;i<7;i++){
    box(-7.5+i*.18,1.54,8.65,.14,.31+(i%3)*.03,.32,mat(['#8d9d7b','#4b6c65','#a99b72'][i%3]));
    box(-7.5+i*.18,1.53,8.817,.11,.035,.005,paper);
  }
  // Each workstation has trailing cables, a mesh chair back, and a personal item.
  const chairTexture=canvasTexture((c,w,h)=>{c.fillStyle='#283d39';c.fillRect(0,0,w,h);c.fillStyle='#698079';for(let y=0;y<h;y+=6)for(let x=0;x<w;x+=6)c.fillRect(x,y,1,1);},128,128);
  const meshFabric=mat('#b2bba9',{map:chairTexture,roughness:.95});
  const desks=[[0,4.65],[-4.8,4.65],[-4.8,-.25],[0,-.25],[4,-.25],[4,4.65]];
  for(const [x,z]of desks){
    cable([[x-.55,.91,z-.14],[x-.59,.52,z-.27],[x-.1,.12,z-.34],[x+1,.2,z-.26]]);
    cable([[x+.55,.92,z-.14],[x+.5,.48,z-.37],[x+.85,.14,z-.37],[x+1,.28,z-.26]]);
    // Desk calendar, magazine and pen; all typography is generated locally.
    const calendar=canvasTexture((c,w,h)=>{c.fillStyle='#e9e3ca';c.fillRect(0,0,w,h);c.fillStyle='#477366';c.fillRect(0,0,w,25);c.fillStyle='#e9e3ca';c.font='bold 13px monospace';c.fillText('OCTOBER',12,18);c.fillStyle='#6b7c69';c.font='12px monospace';for(let j=0;j<4;j++)for(let i=0;i<7;i++)c.fillText(String(j*7+i+1),12+i*31,47+j*23);},256,160);
    box(x-.87,.86,z+.37,.24,.16,.012,mat('#ffffff',{map:calendar}));
    box(x+.88,.789,z-.38,.32,.012,.28,mat('#a9b993'));box(x+.88,.799,z-.38,.3,.006,.25,paper);
    const pen=mesh(new T.CylinderGeometry(.005,.005,.16,8),ink,x-.65,.787,z+.38);pen.rotation.z=Math.PI/2;
  }
  // Noticeboard: synthetic editorial matter, never photographed private documents.
  const board=canvasTexture((c,w,h)=>{
    c.fillStyle='#6e6b4c';c.fillRect(0,0,w,h);
    const sheets=[[35,40,180,260],[240,55,175,240],[440,35,190,280],[660,70,150,215]];
    for(const [x,y,ww,hh]of sheets){c.fillStyle='#353b2d55';c.fillRect(x+5,y+6,ww,hh);c.fillStyle='#dedcc3';c.fillRect(x,y,ww,hh);c.fillStyle='#284f43';c.fillRect(x+12,y+15,ww-24,27);c.fillStyle='#9ba78c';for(let i=0;i<10;i++)c.fillRect(x+12,y+60+i*14,ww-24-(i%3)*15,3);c.fillStyle='#bb8465';c.beginPath();c.arc(x+ww/2,y+8,4,0,Math.PI*2);c.fill();}
    c.fillStyle='#c4db98';c.font='bold 22px sans-serif';c.fillText('THE LAST EDITION',40,h-25);
  },860,390);
  box(-7.89,1.75,-4.2,.045,1.18,2.4,ink);
  const notice=mesh(new T.PlaneGeometry(2.3,1.08),mat('#ffffff',{map:board}),-7.858,1.75,-4.2);notice.rotation.y=Math.PI/2;
  // Wall details bring the corridor into the same material system as the newsroom.
  for(const z of [-7,-11,-15]){
    box(12.925,1.64,z,.028,.66,.46,ink);box(12.9,1.64,z,.012,.6,.4,mat('#819483'));
    box(12.885,1.7,z,.01,.36,.22,mat('#c0c0a2'));
  }
  box(10.15,.39,-17.25,.22,.62,.19,mat('#964e40'));box(10.15,.74,-17.25,.16,.08,.15,ink);
  cable([[10.17,.74,-17.25],[10.25,.74,-17.18],[10.26,.45,-17.14]],.012);
  // Elevator panel: recessed buttons, a grille, level markings, and warm seams.
  for(let y=.18;y<2.8;y+=.53)box(23.905,y,-30.2,.012,.008,1.1,mat('#4e5143'));
  const lift=new T.PointLight('#e8ba76',3,4);lift.position.set(22.5,.25,-29.5);scene.add(lift);
  box(22.5,.085,-30.82,2.65,.024,.022,mat('#ecd59b',{emissive:'#ecd59b',emissiveIntensity:1}));
}
