import * as T from './vendor/three.module.min.js';

const geometryCache=new Map();
function bevelGeometry(w,h,d,r=.012){
  r=Math.min(r,w/5,h/5,d/3);const key=[w,h,d,r].join();if(geometryCache.has(key))return geometryCache.get(key);
  const a=w/2-r,b=h/2-r,c=Math.min(r,a/2,b/2),s=new T.Shape();
  s.moveTo(-a+c,-b);s.lineTo(a-c,-b);s.quadraticCurveTo(a,-b,a,-b+c);s.lineTo(a,b-c);s.quadraticCurveTo(a,b,a-c,b);s.lineTo(-a+c,b);s.quadraticCurveTo(-a,b,-a,b-c);s.lineTo(-a,-b+c);s.quadraticCurveTo(-a,-b,-a+c,-b);
  const g=new T.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,curveSegments:6,steps:1});g.translate(0,0,-(d-2*r)/2);geometryCache.set(key,g);return g;
}

export function createOfficeProps({scene,mat,canvasTexture,art={}}){
  const plastic=mat('#c7c9c8',{map:art.plastic,roughness:.72,metalness:.06}),steel=mat('#eef0ed',{map:art.steel,roughness:.32,metalness:.85}),dark=mat('#22282b',{roughness:.68}),white=mat('#dbddd8',{roughness:.53});
  function mesh(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function rounded(parent,x,y,z,w,h,d,m=plastic,r=.012){return mesh(parent,bevelGeometry(w,h,d,r),m,x,y,z);}
  function cylinder(parent,x,y,z,r,h,m=steel,segments=24){return mesh(parent,new T.CylinderGeometry(r,r,h,segments),m,x,y,z);}
  function label(parent,text,x,y,z,w,h,color='#b8c4ba',bg='#202a2c',size=45){
    const texture=canvasTexture((c,cw,ch)=>{c.fillStyle=bg;c.fillRect(0,0,cw,ch);c.fillStyle=color;c.font=`500 ${size}px Arial, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,cw/2,ch/2);},512,160);
    return mesh(parent,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture,roughness:.7,emissive:color,emissiveIntensity:.06}),x,y,z);
  }
  function computer(x,z,dx){
    const g=new T.Group();g.position.set(x+dx,1.235,z-.1);scene.add(g);
    rounded(g,0,0,0,1.045,.615,.052,plastic,.014);
    const displayMat=new T.MeshStandardMaterial({map:art.screen,color:'#ffffff',emissive:'#ffffff',emissiveMap:art.screen,emissiveIntensity:.40,roughness:.25});
    if(!art.screen)displayMat.color.set('#3e676d');
    mesh(g,new T.PlaneGeometry(.983,.555),displayMat,0,.008,.029);
    rounded(g,0,-.29,.029,.98,.021,.005,dark,.001);label(g,'NEWSROOM',0,-.29,.033,.13,.012,'#8b9698','#202628',39);
    rounded(g,0,-.32,-.025,.055,.25,.06,steel,.006);rounded(g,0,-.435,.025,.37,.023,.23,plastic,.007);
    const led=cylinder(g,.454,-.288,.034,.0025,.002,mat('#9ac6b4',{emissive:'#9ac6b4',emissiveIntensity:.8}),10);led.rotation.x=Math.PI/2;
    return g;
  }
  function keyboard(x,z){
    const g=new T.Group();g.position.set(x,.791,z+.29);scene.add(g);rounded(g,0,0,0,.79,.023,.255,plastic,.006);
    const keys=new T.InstancedMesh(bevelGeometry(.047,.009,.035,.002),mat('#52595c',{roughness:.8}),52),matrix=new T.Matrix4();
    for(let row=0;row<4;row++)for(let k=0;k<13;k++){matrix.makeTranslation(-.356+k*.059,.017,-.087+row*.053);keys.setMatrixAt(row*13+k,matrix);}keys.castShadow=true;g.add(keys);
    rounded(g,-.025,.021,.098,.26,.009,.025,dark,.002);
    const keyTexture=canvasTexture((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#bcc3c3';c.font='17px monospace';c.textAlign='center';const rows=['1234567890-= ','QWERTYUIOP[] ','ASDFGHJKL;  ','ZXCVBNM,. /  '];for(let j=0;j<4;j++)for(let k=0;k<13;k++)c.fillText(rows[j][k]||'',36+k*73,35+j*75);},1024,320);
    const legend=mesh(g,new T.PlaneGeometry(.78,.231),new T.MeshBasicMaterial({map:keyTexture,transparent:true,depthWrite:false}),0,.023,0);legend.rotation.x=-Math.PI/2;
    const mouse=mesh(g,new T.SphereGeometry(1,28,18),plastic,.64,.034,.012);mouse.scale.set(.059,.025,.086);
    const wheel=cylinder(g,.64,.059,-.014,.008,.016,dark,16);wheel.rotation.z=Math.PI/2;
    return g;
  }
  function chair(x,z){
    const g=new T.Group();g.position.set(x,0,z);scene.add(g);
    const fabric=mat('#414b4c',{roughness:.98}),frame=mat('#263132',{roughness:.6});
    rounded(g,0,.485,0,.56,.085,.53,fabric,.02);
    const back=rounded(g,0,.91,.225,.50,.66,.052,fabric,.016);back.rotation.x=.10;
    for(const side of [-1,1]){
      rounded(g,side*.252,.91,.25,.027,.61,.031,frame,.006);
      rounded(g,side*.324,.685,.028,.066,.039,.37,frame,.009);rounded(g,side*.324,.56,.10,.032,.24,.041,frame,.007);
    }
    rounded(g,0,.66,.26,.11,.29,.055,frame,.009);cylinder(g,0,.285,0,.034,.34,steel);
    const spokes=new T.InstancedMesh(new T.CylinderGeometry(.016,.021,.32,10),frame,5),wheels=new T.InstancedMesh(new T.CylinderGeometry(.044,.044,.032,16),dark,10),dummy=new T.Object3D();
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;dummy.position.set(Math.sin(a)*.16,.095,Math.cos(a)*.16);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(Math.sin(a),-.1,Math.cos(a)).normalize());dummy.scale.set(1,1,1);dummy.updateMatrix();spokes.setMatrixAt(i,dummy.matrix);
      for(let j=0;j<2;j++){dummy.position.set(Math.sin(a)*.31+Math.cos(a)*(j?1:-1)*.024,.045,Math.cos(a)*.31-Math.sin(a)*(j?1:-1)*.024);dummy.rotation.set(0,a,Math.PI/2);dummy.updateMatrix();wheels.setMatrixAt(i*2+j,dummy.matrix);}
    }
    spokes.castShadow=wheels.castShadow=true;g.add(spokes,wheels);return g;
  }
  function copier(x,z){
    const g=new T.Group();g.position.set(x,0,z);scene.add(g);
    rounded(g,0,.55,0,1.16,1.02,.87,white,.025);rounded(g,0,.16,0,1.12,.13,.83,dark,.02);
    rounded(g,0,1.095,0,1.21,.13,.91,plastic,.02);rounded(g,-.05,1.18,-.03,.99,.08,.79,white,.02);
    rounded(g,-.05,1.238,-.06,.81,.048,.61,white,.018);rounded(g,-.05,1.265,-.06,.66,.008,.45,mat('#bbc6c4',{roughness:.3}),.002);
    for(let i=0;i<3;i++){rounded(g,-.02,.33+i*.235,.445,1.05,.006,.008,dark,.001);rounded(g,.13,.42+i*.235,.457,.22,.024,.021,plastic,.006);}
    rounded(g,-.30,.80,.447,.38,.12,.013,dark,.003);for(let i=0;i<3;i++)rounded(g,-.3,.753+i*.007,.469,.29,.004,.11,white,.001);
    const control=new T.Group();control.position.set(.38,1.17,.37);control.rotation.x=-.24;g.add(control);rounded(control,0,0,0,.31,.19,.035,plastic,.01);
    const ui=canvasTexture((c,w,h)=>{c.fillStyle='#e8efea';c.fillRect(0,0,w,h);c.fillStyle='#345b54';c.fillRect(0,0,w,50);c.fillStyle='#fff';c.font='28px sans-serif';c.fillText('인쇄 준비',20,36);c.fillStyle='#65766d';c.font='22px sans-serif';c.fillText('A4 · 대기 문서 3건',20,93);c.fillStyle='#5e9885';c.fillRect(20,120,270,10);c.fillStyle='#69766f';c.fillText('용지함 정상',20,170);},512,230);
    mesh(control,new T.PlaneGeometry(.27,.15),new T.MeshStandardMaterial({map:ui,emissiveMap:ui,emissive:'#ffffff',emissiveIntensity:.25,roughness:.4}),0,0,.021);
    for(const sx of [-.46,.46])for(const sz of [-.32,.32]){const wheel=cylinder(g,sx,.065,sz,.043,.055,dark,16);wheel.rotation.z=Math.PI/2;}
    label(g,'MULTIFUNCTION',-.18,1.02,.444,.32,.035,'#6c7975','#dbddd8',42);return g;
  }
  function callPanel(x,y,z){
    const g=new T.Group();g.position.set(x,y,z);scene.add(g);
    rounded(g,0,0,-.003,.224,.49,.030,dark,.009);rounded(g,0,0,.013,.205,.47,.018,steel,.005);
    rounded(g,0,.143,.025,.144,.088,.009,dark,.003);label(g,'12',0,.144,.031,.105,.061,'#e0b66d','#192328',105);
    const haloMat=new T.MeshStandardMaterial({color:'#7a857b',emissive:'#dfa85e',emissiveIntensity:0,roughness:.35,metalness:.65});
    const ring=mesh(g,new T.TorusGeometry(.052,.003,10,48),haloMat,0,-.036,.034);
    const button=cylinder(g,0,-.036,.034,.047,.009,steel,48);button.rotation.x=Math.PI/2;
    const arrow=new T.Shape();arrow.moveTo(-.017,.008);arrow.lineTo(0,-.013);arrow.lineTo(.017,.008);arrow.closePath();mesh(g,new T.ShapeGeometry(arrow),mat('#313d3c'),0,-.036,.041);
    label(g,'CALL',0,-.137,.026,.070,.022,'#566561','#d3d6cf',65);
    for(const dx of [-.012,.012])for(let j=0;j<3;j++){const dot=mesh(g,new T.SphereGeometry(.0023,8,6),steel,dx,-.18+j*.009,.027);}
    for(const dx of [-.083,.083])for(const dy of [-.209,.209]){const screw=cylinder(g,dx,dy,.026,.003,.0015,mat('#8c9690',{metalness:.9,roughness:.3}),12);screw.rotation.x=Math.PI/2;}
    return {group:g,setCalled(value){haloMat.emissiveIntensity=value?1.5:0;haloMat.color.set(value?'#e8c885':'#7a857b');button.position.z=value?.030:.034;}};
  }
  function cabinPanel(){
    const g=new T.Group();g.position.set(23.885,1.52,-29.45);g.rotation.y=-Math.PI/2;scene.add(g);
    rounded(g,0,0,0,.245,.96,.026,steel,.006);rounded(g,0,.332,.017,.18,.13,.008,dark,.003);label(g,'12 F',0,.332,.023,.14,.07,'#deb66d','#192328',90);
    for(let i=0;i<12;i++){
      const x=(i%3-1)*.066,y=.168-Math.floor(i/3)*.10;
      const button=cylinder(g,x,y,.022,.025,.008,steel,32);button.rotation.x=Math.PI/2;label(g,String(12-i),x,y,.028,.034,.027,i===0?'#e7bc70':'#41514d','#c7ccc5',90);
      if(i===0)mesh(g,new T.TorusGeometry(.027,.002,8,32),new T.MeshStandardMaterial({color:'#e7bc70',emissive:'#d6a14b',emissiveIntensity:.6}),x,y,.028);
    }
    for(let i=0;i<6;i++)rounded(g,0,-.32-i*.012,.016,.12,.003,.002,dark,.0004);
    label(g,'INTERCOM',0,-.425,.017,.12,.02,'#5d6963','#c7ccc5',52);return g;
  }
  return {rounded,computer,keyboard,chair,copier,callPanel,cabinPanel};
}
