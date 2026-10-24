import * as T from './vendor/three.module.min.js';

// Small, articulated editorial characters. All features are geometry, not photos.
const cache=new Map();
function material(color,roughness=.72,metalness=0){const key=[color,roughness,metalness].join();if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));return cache.get(key);}
const sphere=new T.SphereGeometry(1,24,16),cube=new T.BoxGeometry(1,1,1);
function shape(parent,geometry,mat,x,y,z,sx=1,sy=sx,sz=sx){const o=new T.Mesh(geometry,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function oval(parent,mat,x,y,z,sx,sy,sz){return shape(parent,sphere,mat,x,y,z,sx,sy,sz);}
function block(parent,mat,x,y,z,w,h,d){return shape(parent,cube,mat,x,y,z,w,h,d);}
function tube(parent,points,r,mat){return shape(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,r,6,false),mat,0,0,0);}
function capsule(parent,mat,x,y,z,r,length,sx=1,sz=1){return shape(parent,new T.CapsuleGeometry(r,length,6,14),mat,x,y,z,sx,1,sz);}

export function createPerson({female=false,boss=false,x,z},scene){
  const group=new T.Group();group.position.set(x,0,z);scene.add(group);
  const skin=material(boss?'#d9ac8c':'#e4bda0'),skinShadow=material('#b7826c'),hair=material(boss?'#252b30':'#292c2d');
  const cloth=material(boss?'#253b43':female?'#586b66':'#929c86');
  const pants=material(boss?'#25343d':female?'#303d3e':'#4a5557');
  const shirt=material('#e6e4d5'),sole=material('#142226'),leather=material('#283031',.4),eye=material('#27322f');
  const body=new T.Group();group.add(body);
  oval(body,cloth,0,1.13,0,.235,.34,.145);
  oval(body,cloth,0,.9,0,.21,.14,.14);
  block(body,shirt,0,1.305,.143,.17,.23,.019);
  for(const side of [-1,1]){const collar=block(body,shirt,side*.044,1.415,.15,.07,.075,.018);collar.rotation.z=side*.4;}
  // Sewn lapels and a slightly offset placket make the suit read at a distance.
  const lapelGeo=new T.BufferGeometry();lapelGeo.setAttribute('position',new T.Float32BufferAttribute([-.14,1.42,.144,-.03,1.35,.173,-.09,1.11,.154,.14,1.42,.144,.09,1.11,.154,.03,1.35,.173],3));lapelGeo.computeVertexNormals();
  const lapels=new T.Mesh(lapelGeo,new T.MeshStandardMaterial({color:boss?'#3c5155':'#74847a',side:T.DoubleSide,roughness:.8}));body.add(lapels);
  if(boss){
    oval(body,material('#c5ac64'),0,1.33,.161,.026,.037,.015);
    const tie=block(body,material('#b39a55'),0,1.2,.157,.041,.22,.012);tie.rotation.z=-.04;
    block(body,material('#d0bc82',.3,.7),0,1.23,.167,.047,.008,.008);
    block(body,shirt,.137,1.32,.128,.055,.026,.01);
  }else{
    tube(body,[[0,1.44,.15],[-.08,1.28,.17],[-.04,1.12,.17]],.006,material('#1d3538'));
    tube(body,[[0,1.44,.15],[.08,1.28,.17],[.04,1.12,.17]],.006,material('#1d3538'));
    block(body,material('#e2e2cd'),0,1.08,.171,.085,.105,.009);
    block(body,material('#478f7e'),0,1.113,.179,.073,.021,.004);
    block(body,material('#b4bdae'),0,1.074,.179,.054,.006,.004);
  }
  for(const y of [1.08,.99])oval(body,material('#64706a'),.025,y,.143,.011,.011,.007);
  capsule(body,skin,0,1.48,0,.068,.09);
  const head=new T.Group();head.position.set(0,1.68,0);body.add(head);
  oval(head,skin,0,0,0,.151,.195,.14);
  oval(head,skin,0,-.085,.035,.119,.105,.109);
  for(const side of [-1,1]){
    oval(head,skin,side*.148,-.008,0,.031,.053,.027);
    oval(head,skinShadow,side*.165,-.009,.012,.009,.027,.012);
    oval(head,shirt,side*.057,.017,.125,.034,.019,.012);
    oval(head,eye,side*.055,.018,.137,.011,.013,.006);
    oval(head,material('#f4eee2'),side*.053,.023,.142,.0035,.0035,.002);
    const brow=oval(head,hair,side*.06,.063,.126,.041,.009,.008);brow.rotation.z=side*(boss?-.12:.05);
  }
  oval(head,skin,0,-.022,.142,.025,.037,.035);
  oval(head,skinShadow,0,-.043,.163,.015,.006,.004);
  tube(head,[[-.038,-.091,.147],[0,-.095,.155],[.038,-.087,.147]],.0045,material('#885d50'));
  oval(head,hair,0,.12,-.018,.158,.114,.143);
  if(female){
    oval(head,hair,0,-.08,-.082,.164,.23,.094);
    for(const side of [-1,1])oval(head,hair,side*.135,-.049,.022,.036,.176,.07);
    const fringe=oval(head,hair,-.032,.112,.086,.123,.066,.066);fringe.rotation.z=-.22;
    oval(head,material('#c9b579',.3,.7),-.17,-.045,.019,.01,.015,.009);
    oval(head,material('#c9b579',.3,.7),.17,-.045,.019,.01,.015,.009);
  }else{
    for(let i=0;i<7;i++){const tuft=oval(head,hair,-.122+i*.038,.15+Math.sin(i*.5)*.028,.026,.04,.052,.11);tuft.rotation.z=-.22;}
    for(const side of [-1,1])block(head,hair,side*.135,.045,-.005,.025,.105,.035);
  }
  if(boss){
    const glasses=material('#292e27',.25,.5);
    for(const side of [-1,1]){
      const ring=shape(head,new T.TorusGeometry(.046,.005,8,24),glasses,side*.062,.018,.151,1,.83,1);
      tube(head,[[side*.106,.025,.145],[side*.14,.034,.055],[side*.14,.015,-.02]],.004,glasses);
    }
    tube(head,[[-.017,.024,.153],[0,.031,.158],[.017,.024,.153]],.004,glasses);
  }
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.233,1.37,0);arm.rotation.z=side*.055;body.add(arm);
    capsule(arm,cloth,0,-.115,0,.067,.18,1,.92);
    capsule(arm,cloth,0,-.323,.015,.054,.18,1,.95);
    capsule(arm,shirt,0,-.457,.019,.048,.027);
    oval(arm,skin,0,-.518,.026,.046,.067,.034);
    oval(arm,skin,side*-.037,-.5,.052,.022,.036,.021);
    for(let finger=0;finger<3;finger++)oval(arm,skin,-.023+finger*.022,-.563,.033,.011,.028,.019);
    arms.push(arm);
    const leg=new T.Group();leg.position.set(side*.106,.84,0);body.add(leg);
    capsule(leg,pants,0,-.18,0,.086,.24,1,.9);
    capsule(leg,pants,0,-.5,.006,.068,.24,1,.92);
    block(leg,material('#849087'),0,-.71,.01,.11,.014,.12);
    oval(leg,leather,0,-.765,.065,.088,.059,.17);
    block(leg,sole,0,-.797,.064,.17,.024,.29);
    legs.push(leg);
  }
  // A lightweight ground contact gives the character weight without extra lights.
  const shadow=new T.Mesh(new T.CircleGeometry(.27,32),new T.MeshBasicMaterial({color:'#071b18',transparent:true,opacity:.18,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;group.add(shadow);
  return {group,body,head,arms,legs,base:{x,z},flinch:0};
}
