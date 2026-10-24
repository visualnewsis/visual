import * as T from './vendor/three.module.min.js';
import {createFictionalHead} from './faces.js?v=20261025-mesh1';

const materials=new Map();
function mat(color,roughness=.8,metalness=0){const key=[color,roughness,metalness].join();if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key);}
const ball=new T.SphereGeometry(1,24,18),box=new T.BoxGeometry(1,1,1);
function mesh(parent,geometry,material,x=0,y=0,z=0,scale=[1,1,1]){const item=new T.Mesh(geometry,material);item.position.set(x,y,z);item.scale.set(...scale);item.castShadow=true;item.receiveShadow=true;parent.add(item);return item;}
const oval=(parent,m,x,y,z,w,h,d)=>mesh(parent,ball,m,x,y,z,[w,h,d]);
const block=(parent,m,x,y,z,w,h,d)=>mesh(parent,box,m,x,y,z,[w,h,d]);
function capsule(parent,m,x,y,z,r,length,width=1,depth=1){return mesh(parent,new T.CapsuleGeometry(r,length,6,16),m,x,y,z,[width,1,depth]);}
function line(parent,points,radius,m){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),18,radius,6,false),m);}
function patch(parent,points,m){
  m.side=T.DoubleSide;const output=[],profile=parent.userData.profile;
  function surface(a,b,c,u,v){const p=a.map((n,i)=>n+(b[i]-n)*u+(c[i]-n)*v),[x,y,z]=p;let radius=.18;
    for(let i=1;i<profile.length;i++)if(y>=profile[i-1][1]&&y<=profile[i][1]){const [r0,y0]=profile[i-1],[r1,y1]=profile[i];radius=r0+(r1-r0)*(y-y0)/(y1-y0||1);break;}
    return [x,y,Math.sqrt(Math.max(.0001,radius*radius-x*x))*.61+.006+(z-.08)*.2];
  }
  const n=14;for(let k=0;k<points.length;k+=3){const [a,b,c]=points.slice(k,k+3);for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){output.push(...surface(a,b,c,i/n,j/n),...surface(a,b,c,(i+1)/n,j/n),...surface(a,b,c,i/n,(j+1)/n));if(i+j<n-1)output.push(...surface(a,b,c,(i+1)/n,j/n),...surface(a,b,c,(i+1)/n,(j+1)/n),...surface(a,b,c,i/n,(j+1)/n));}}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(output,3));geometry.computeVertexNormals();return mesh(parent,geometry,m);
}
export function createPerson({female=false,boss=false,x,z,seated=false,profile='',dialogue='desk',id=''},scene,art={}){
  const group=new T.Group();group.position.set(x,0,z);scene.add(group);const body=new T.Group();group.add(body);
  const skin=mat(female?'#d7b397':'#c8a184'),jacket=mat(boss?'#29313a':female?'#455650':profile==='light'?'#8e8f86':'#59616a',.94);
  const trousers=mat(boss?'#242d37':female?'#353b3c':'#3d4852',.95),shirt=mat('#e6e3d8',.93),black=mat('#1c2123',.6),leather=mat('#242527',.42);
  const shoulder=female?.198:.22;
  const outline=[[0,.86],[.16,.86],[.19,.93],[.169,1.035],[.18,1.17],[shoulder,1.31],[shoulder*.93,1.385],[.09,1.425],[.065,1.455],[0,1.455]];
  body.userData.profile=outline;
  const torso=mesh(body,new T.LatheGeometry(outline.map(p=>new T.Vector2(...p)),32),jacket);torso.scale.z=.61;
  patch(body,[[-.075,1.425,.081],[-.078,1.12,.115],[.078,1.12,.115],[-.075,1.425,.081],[.078,1.12,.115],[.075,1.425,.081]],shirt);
  const lapel=mat(boss?'#3b434c':female?'#5b6b62':'#717a80',.92);
  for(const side of [-1,1]){
    patch(body,[[side*.083,1.43,.092],[side*.17,1.33,.108],[side*.055,1.10,.12]],lapel);
    patch(body,[[side*.075,1.43,.098],[side*.016,1.365,.125],[side*.069,1.335,.126]],shirt);
    for(let k=0;k<2;k++)oval(body,black,side*.065,1.02-k*.06,.115,.006,.006,.003);
  }
  line(body,[[-.155,1.3,.109],[-.14,1.15,.12],[-.14,.96,.105]],.0012,mat('#839087'));
  if(boss){
    const gold=mat('#c6ad72',.85);patch(body,[[-.019,1.36,.13],[.019,1.36,.13],[.023,1.13,.134],[-.019,1.36,.13],[.023,1.13,.134],[0,1.095,.13]],gold);
    oval(body,gold,0,1.372,.13,.024,.023,.009);for(let i=0;i<8;i++)for(const side of [-1,1])oval(body,mat('#967b42'),side*.008,1.14+i*.025,.138,.0015,.0017,.001);
    block(body,shirt,.125,1.30,.112,.042,.014,.006);
  }else{
    line(body,[[-.05,1.43,.105],[-.067,1.27,.128],[-.032,1.12,.134]],.003,mat('#425d65'));
    line(body,[[.05,1.43,.105],[.067,1.27,.128],[.032,1.12,.134]],.003,mat('#425d65'));
    block(body,mat('#d8dfd6'),0,1.077,.139,.065,.087,.005);block(body,mat('#3b796d'),0,1.10,.144,.057,.017,.002);block(body,mat('#8f9e95'),0,1.068,.144,.034,.004,.002);
  }
  capsule(body,skin,0,1.46,0,.054,.11,1,.9);const head=new T.Group();head.position.set(0,1.60,0);body.add(head);
  const eyes=createFictionalHead(head,{female,boss,profile});
  const arms=[],forearms=[],hands=[],legs=[],knees=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*(shoulder+.008),1.345,0);arm.rotation.z=side*.045;body.add(arm);capsule(arm,jacket,0,-.14,0,female?.050:.058,.19,1,.94);
    const elbow=new T.Group();elbow.position.y=-.29;elbow.rotation.x=-.04;arm.add(elbow);capsule(elbow,jacket,0,-.125,0,.043,.19,1,.9);capsule(elbow,shirt,0,-.257,0,.039,.027,1,.9);
    const hand=new T.Group();hand.position.set(0,-.29,.004);elbow.add(hand);oval(hand,skin,0,-.035,.01,.034,.052,.019);
    for(let finger=0;finger<4;finger++){const length=[.037,.046,.043,.032][finger];capsule(hand,skin,(finger-1.5)*.014,-.085,.012,.007,length,1,.85);}
    const thumb=capsule(hand,skin,side*-.033,-.035,.027,.010,.032);thumb.rotation.z=side*-.55;arms.push(arm);forearms.push(elbow);hands.push(hand);
    const leg=new T.Group();leg.position.set(side*.095,.865,0);body.add(leg);capsule(leg,trousers,0,-.19,0,.075,.26,1,.94);
    const knee=new T.Group();knee.position.y=-.40;leg.add(knee);capsule(knee,trousers,0,-.18,.003,.052,.27,1,.94);block(knee,black,0,-.375,.005,.087,.045,.085);
    oval(knee,leather,0,-.417,.055,.063,.040,.128);block(knee,black,0,-.445,.055,.116,.018,.222);legs.push(leg);knees.push(knee);
  }
  if(seated){body.position.y=-.35;body.rotation.x=.045;for(let i=0;i<2;i++){legs[i].rotation.x=-Math.PI/2;knees[i].rotation.x=Math.PI/2;arms[i].rotation.x=-1;forearms[i].rotation.x=-.57;}}
  const shadow=new T.Mesh(new T.CircleGeometry(.17,28),new T.MeshBasicMaterial({color:'#18211c',transparent:true,opacity:.10,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;group.add(shadow);
  return {group,body,head,eyes,arms,forearms,hands,legs,knees,base:{x,z},flinch:0,female,boss,seated,dialogue,id,talkIndex:0,seatedY:seated?-.35:0};
}
