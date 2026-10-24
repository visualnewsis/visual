import * as T from './vendor/three.module.min.js';

// Entirely geometric fictional faces. No portraits, alpha cards or image maps.
const sphere=new T.SphereGeometry(1,32,24);
const g=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
function material(color,roughness=.65,extra={}){return new T.MeshStandardMaterial({color,roughness,...extra});}
function add(parent,geometry,mat,name){const m=new T.Mesh(geometry,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ellipsoid(parent,mat,p,s,name){const m=add(parent,sphere,mat,name);m.position.set(...p);m.scale.set(...s);return m;}
function tube(parent,points,r,mat,name){return add(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,7,false),mat,name);}
function lock(parent,points,width,depth,mat,name){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return surface(parent,36,10,(u,v)=>{const p=curve.getPoint(u),t=curve.getTangent(u),radial=p.clone().normalize(),across=new T.Vector3().crossVectors(t,radial).normalize(),normal=new T.Vector3().crossVectors(across,t).normalize(),taper=Math.pow(Math.sin(Math.PI*(.015+u*.98)),.42),angle=v*Math.PI*2;return p.addScaledVector(across,Math.cos(angle)*width*taper).addScaledVector(normal,Math.sin(angle)*depth*taper).toArray();},mat,name);}
function surface(parent,columns,rows,point,mat,name){const positions=[],indices=[];for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++)positions.push(...point(i/columns,j/rows));for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=j*(columns+1)+i,b=a+columns+1;indices.push(a,a+1,b,b,a+1,b+1);}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return add(parent,geometry,mat,name);}

export function createFictionalHead(head,{female=false,boss=false,profile=''}={}){
  const mature=boss,variant=profile==='staff'?1:profile==='light'?2:0;
  const tone=new T.Color(female?(variant?'#cda68f':'#d9b59d'):boss?'#c8a18a':'#cea98f');
  const skin=material(tone,.63),warm=material(tone.clone().multiplyScalar(.86),.7),hair=material(boss?'#363432':female?'#282322':'#252b2c',.82),hairFine=material(boss?'#59554f':'#383331',.87);
  const rx=female?.083:boss?.09:.086,ry=female?.122:boss?.128:.125,rz=female?.085:.089;
  const jaw=female?.86:boss?1:.94;
  function width(y){return rx*(y<-.02?T.MathUtils.lerp(jaw,1,T.MathUtils.clamp((y+.115)/.095,0,1)):1);}
  function sculpt(x,y){return .018*g(x,y,0,-.006,.009,.028)+.015*g(x,y,0,-.027,.011,.010)+.004*(g(x,y,-.012,-.028,.006,.007)+g(x,y,.012,-.028,.006,.007))-.008*(g(x,y,-.034,.019,.022,.013)+g(x,y,.034,.019,.022,.013))+.005*(g(x,y,-.044,-.016,.024,.025)+g(x,y,.044,-.016,.024,.025))+.004*g(x,y,0,-.052,.027,.017)+.007*g(x,y,0,-.090,.033,.018);}
  function depth(x,y){return rz*Math.sqrt(Math.max(.001,1-(x/width(y))**2-(y/ry)**2))+sculpt(x,y);}
  // Closed spherical topology, with a continuous nose bridge, tip, cheek and jaw.
  const skull=surface(head,88,64,(u,v)=>{const theta=u*Math.PI*2,phi=v*Math.PI,originalY=Math.cos(phi)*ry,y=originalY<-.09?-.09+(originalY+.09)*.65:originalY,x=Math.sin(phi)*Math.sin(theta)*width(y),front=Math.cos(theta),z=Math.sin(phi)*front*rz;return [x,y,z+Math.max(0,front)**8*sculpt(x,y)];},material('#ffffff',.63,{vertexColors:true,side:T.DoubleSide}),'closed-sculpted-skull');
  const a=skull.geometry.attributes.position,colors=[];for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),flush=(g(x,y,-.043,-.025,.026,.021)+g(x,y,.043,-.025,.026,.021))*.10*Math.max(0,z/rz);const c=tone.clone().lerp(new T.Color('#b97770'),flush);colors.push(c.r,c.g,c.b);}skull.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const eyes=[];const white=material('#e9e4da',.37),iris=material(boss?'#3c3328':'#302c26',.45),pupil=material('#111616',.32),lash=material('#443a32',.85);
  for(const side of [-1,1]){
    const ex=side*.034,ey=boss?.021:.023,ew=female?.0175:.017,eh=female?.0065:.0058;
    const eye=new T.Group();eye.position.set(ex,ey,0);head.add(eye);eyes.push(eye);
    function boundary(q,upper){return (upper?eh:-eh*.70)*Math.pow(Math.max(0,1-q*q),.72)+side*q*.001;}
    surface(eye,22,8,(u,v)=>{const q=u*2-1,x=ex+q*ew,y=ey+T.MathUtils.lerp(boundary(q,false),boundary(q,true),v);return [x-ex,y-ey,depth(x,y)+.0015+.0055*(1-q*q)*Math.sin(v*Math.PI)];},white,'curved-almond-sclera');
    const iz=depth(ex,ey)+.0074;
    ellipsoid(eye,iris,[0,0,iz],[.0059,.0059,.0013],'iris-volume');ellipsoid(eye,pupil,[0,0,iz+.0012],[.0024,.0027,.0007],'pupil-volume');
    ellipsoid(eye,material('#fff7e6',.18),[-.0017,.0019,iz+.0024],[.0009,.0009,.0003],'eye-catchlight');
    for(const upper of [false,true]){const points=Array.from({length:19},(_,i)=>{const q=i/9-1,x=ex+q*ew,y=ey+boundary(q,upper);return [x-ex,y-ey,depth(x,y)+.0025];});tube(eye,points,upper?.0017:.0013,skin,upper?'upper-eyelid':'lower-eyelid');if(upper)tube(eye,points.map(([x,y,z])=>[x,y-.0005,z+.0012]),female?.0007:.0005,lash,'eyelash-rim');}
    const browY=ey+.019;
    surface(head,20,3,(u,v)=>{const q=u*2-1,x=ex+q*(ew+.001),y=browY+Math.sin(u*Math.PI)*.0045+side*q*.0015+(v-.5)*(.0035*Math.sin(u*Math.PI)+.0005);return [x,y,depth(x,y)+.0016];},hair,'sculpted-eyebrow');
    if(mature)tube(head,Array.from({length:12},(_,i)=>{const x=ex+(i/11*2-1)*.015,y=ey-.014;return [x,y,depth(x,y)+.0004];}),.00045,warm,'under-eye-crease');
    // Ears have a shell, concha and raised helix, visible from side and rear.
    const ear=new T.Group();ear.position.set(side*(rx-.002),-.004,-.010);head.add(ear);
    ellipsoid(ear,skin,[side*.003,0,0],[.012,.024,.014],'ear-shell');ellipsoid(ear,warm,[side*.011,.001,.002],[.0028,.013,.008],'ear-concha');
    tube(ear,Array.from({length:27},(_,i)=>{const t=i/26*Math.PI*1.8-.3;return [side*(.009+.002*Math.cos(t)),Math.cos(t)*.020,Math.sin(t)*.011];}),.0022,skin,'ear-helix');ellipsoid(ear,skin,[side*.007,-.018,.002],[.008,.009,.008],'ear-lobe');
  }
  // Tiny dark recesses under the integrated nasal tip, not painted nostrils.
  for(const side of [-1,1]){const x=side*.009,y=-.031;const n=ellipsoid(head,material('#765646',.95),[x,y,depth(x,y)+.0002],[.003,.0014,.0019],'nostril-recess');n.rotation.x=-.35;}
  const lip=material(female?'#ad786e':'#a17c6d',.73),seam=material('#785c53',.93),mouthY=-.055;
  function mouth(q){return mouthY+.0022*q*q;}
  for(const upper of [false,true])surface(head,32,5,(u,v)=>{const q=u*2-1,x=q*.022,full=Math.pow(Math.max(0,1-q*q),.65),border=upper?(.0032+.0012*Math.cos(q*Math.PI*3))*full:-.0045*full,y=mouth(q)+border*v;return [x,y,depth(x,y)+.0008+.0025*Math.sin(v*Math.PI)*full];},lip,upper?'upper-lip-volume':'lower-lip-volume');
  tube(head,Array.from({length:25},(_,i)=>{const q=i/12-1,x=q*.022,y=mouth(q);return [x,y,depth(x,y)+.0015];}),.0006,seam,'closed-mouth-line');
  // Scalp cap wraps all the way around the skull. The hairline has a small part.
  function cap(u,v,extra=0){const t=u*Math.PI*2,cos=Math.cos(t),front=(cos+1)/2,forehead=T.MathUtils.smoothstep(cos,.05,.7);let limit=T.MathUtils.lerp(female?2.35:1.83,female?1.03:boss?1.08:1.02,forehead);limit+=.018*Math.sin(t*2+.6)+forehead*(female?.065*Math.cos(t*3):.10*Math.sin(t*2+.6));const phi=v*limit,ripple=.0004*Math.sin(t*22+phi*7)*Math.sin(phi),inflate=.006+ripple+extra;let y=Math.cos(phi)*(ry+.006),x=Math.sin(phi)*Math.sin(t)*(rx+inflate),z=Math.sin(phi)*Math.cos(t)*(rz+inflate);if(!female){y+=.014*Math.sin(phi)*Math.max(0,cos)*Math.max(0,Math.sin(t+.7));}if(female){const back=Math.max(0,1-front**3);y-=Math.max(0,v-.53)*.18*back;x*=1+v*.04;z-=v*v*.012;}return [x,y,z];}
  surface(head,72,38,(u,v)=>cap(u,v),new T.MeshStandardMaterial({color:hair.color,roughness:.83,side:T.DoubleSide}),'volumetric-hair-cap');
  for(let i=0;i<24;i++){const u=(i+.5)/24;const points=Array.from({length:17},(_,j)=>cap(u+.022*Math.sin(j/16*Math.PI),.10+j/16*.88,.0004));tube(head,points,.0004,i%5===0?hairFine:hair,'hair-sculpt-ridge');}
  for(let i=0;i<9;i++){const start=(i-4)*.025;const points=Array.from({length:15},(_,j)=>{const t=j/14;return cap(start+.12*Math.sin(t*Math.PI*.8),.98-t*.83,.0018);});lock(head,points,female?.0045:.0065,.0025,i%3===0?hairFine:hair,'swept-hair-lock');}
  if(female)for(const side of [-1,1]){lock(head,[[side*.072,.069,.038],[side*.086,.018,.030],[side*.089,-.077,.003],[side*.084,-.174,-.028]],.012,.006,hair,'tapered-temple-lock');}
  if(boss){const frame=material('#5c5147',.44,{metalness:.45});for(const side of [-1,1]){const points=Array.from({length:49},(_,i)=>{const t=i/48*Math.PI*2,x=side*.034+Math.cos(t)*.025,y=.022+Math.sin(t)*.017;return [x,y,depth(x,y)+.012];});tube(head,points,.0012,frame,'glasses-rim');tube(head,[[side*.057,.026,.081],[side*.080,.027,.020],[side*.089,.016,-.017]],.0013,frame,'glasses-temple');}tube(head,[[-.009,.025,.101],[0,.029,.108],[.009,.025,.101]],.0012,frame,'glasses-bridge');}
  head.userData.fictional=true;head.userData.full3D=true;
  return eyes;
}
